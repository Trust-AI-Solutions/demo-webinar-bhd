// Pruebas de la función de Netlify sin gastar la clave: se reemplaza fetch para
// capturar la solicitud que el SDK enviaría a Anthropic.

import { test } from "node:test";
import assert from "node:assert/strict";
import funcion, { validarSolicitud } from "../netlify/functions/ia/ia.mjs";
import { MODOS } from "../netlify/functions/ia/modos.mjs";

// Un agente de conversación y un agente lector cualesquiera del registro.
const CHAT = Object.keys(MODOS).find((m) => !MODOS[m].documento);
const LECTOR = Object.keys(MODOS).find((m) => MODOS[m].documento);

const solicitud = (cuerpo, cabeceras = {}) => new Request("http://localhost/api/ia", { method: "POST", headers: { "content-type": "application/json", ...cabeceras }, body: JSON.stringify(cuerpo) });
const valido = { modo: CHAT ?? LECTOR, fecha: "2026-11-10", hora: "10:15", mensajes: [{ role: "user", content: "¿Cómo van las ventas?" }] };

test("validación de la solicitud", () => {
  assert.equal(validarSolicitud(valido, JSON.stringify(valido)), null);
  assert.ok(validarSolicitud({ ...valido, modo: "otro" }));
  assert.ok(validarSolicitud({ ...valido, mensajes: [] }));
  assert.ok(validarSolicitud({ ...valido, mensajes: [{ role: "system", content: "x" }] }));
  assert.ok(validarSolicitud({ ...valido, fecha: "mañana" }));
  assert.ok(validarSolicitud({ ...valido, mensajes: Array(91).fill({ role: "user", content: "x" }) }));
});

test("sin clave configurada responde un error claro", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const r = await funcion(solicitud(valido), {});
  assert.equal(r.status, 500);
  assert.match((await r.json()).error, /ANTHROPIC_API_KEY/);
});

test("la clave de la demo se exige cuando está configurada", async () => {
  process.env.CLAVE_DEMO = "pinos";
  process.env.ANTHROPIC_API_KEY = "clave-de-prueba";
  const r = await funcion(solicitud(valido), {});
  assert.equal(r.status, 401);
  delete process.env.CLAVE_DEMO;
});

test("arma la solicitud a Claude con instrucciones, herramientas y respaldo", async () => {
  process.env.ANTHROPIC_API_KEY = "clave-de-prueba";
  const original = globalThis.fetch;
  let capturada;
  globalThis.fetch = async (url, init) => {
    capturada = { url: String(url), headers: new Headers(init.headers), cuerpo: JSON.parse(init.body) };
    return Response.json({ id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "text", text: "Hola" }], usage: { input_tokens: 1, output_tokens: 1 } });
  };
  try {
    const r = await funcion(solicitud(valido), {});
    assert.equal(r.status, 200);
    const cuerpo = await r.json();
    assert.equal(cuerpo.content[0].text, "Hola");
  } finally {
    globalThis.fetch = original;
  }
  assert.match(capturada.url, /\/v1\/messages\?beta=true$/);
  assert.equal(capturada.headers.get("x-api-key"), "clave-de-prueba");
  assert.match(capturada.headers.get("anthropic-beta"), /server-side-fallback-2026-07-01/);
  const c = capturada.cuerpo;
  assert.equal(c.model, "claude-opus-5-5");
  assert.equal(c.fallbacks, "default");
  assert.equal(c.output_config.effort, "low");
  assert.equal(c.thinking, undefined);
  assert.deepEqual(c.tools.map((t) => t.name), MODOS[valido.modo].herramientas.map((t) => t.name));
  assert.ok(c.tools.every((t) => Object.keys(t).join() === "name,description,input_schema"), "a Claude solo van name, description e input_schema");
  assert.equal(c.system[0].text, MODOS[valido.modo].instrucciones);
  assert.match(c.system[0].text, /ficticios/, "cada agente lleva las reglas de la demo");
  assert.match(c.system[1].text, /2026-11-10/);
});

test("agente lector: un PDF, una foto o un texto pegado, con esfuerzo medio", { skip: !LECTOR }, async () => {
  const pdf = { type: "document", source: { type: "base64", media_type: "application/pdf", data: "JVBERi0x" } };
  const doc = { ...valido, modo: LECTOR, mensajes: [{ role: "user", content: [pdf, { type: "text", text: "CATÁLOGO…" }] }] };
  assert.equal(validarSolicitud(doc, JSON.stringify(doc)), null);
  assert.ok(validarSolicitud({ ...doc, mensajes: [{ role: "user", content: [pdf, pdf] }] }), "dos archivos");
  assert.ok(validarSolicitud({ ...doc, mensajes: [{ role: "user", content: [{ type: "image", source: { type: "url", url: "https://x" } }] }] }), "imagen por URL");
  if (CHAT) assert.ok(validarSolicitud({ ...valido, modo: CHAT, mensajes: [{ role: "user", content: [pdf] }] }), "archivos fuera de un agente lector");
  assert.ok(validarSolicitud(doc, "x".repeat(5_600_000)), "demasiado grande");
  assert.equal(validarSolicitud(doc, "x".repeat(2_000_000)), null);
  const pegado = { ...doc, mensajes: [{ role: "user", content: [{ type: "text", text: "Mensaje recibido: 4 galones de chinola" }] }] };
  assert.equal(validarSolicitud(pegado, JSON.stringify(pegado)), null, "texto pegado sin archivo");

  process.env.ANTHROPIC_API_KEY = "clave-de-prueba";
  const original = globalThis.fetch;
  let capturada;
  globalThis.fetch = async (url, init) => {
    capturada = JSON.parse(init.body);
    return Response.json({ id: "msg_2", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: MODOS[LECTOR].herramientas[0].name, input: {} }], usage: { input_tokens: 1, output_tokens: 1 } });
  };
  try {
    const r = await funcion(solicitud(doc), {});
    assert.equal(r.status, 200);
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(capturada.output_config.effort, "medium");
  assert.deepEqual(capturada.tools.map((t) => t.name), MODOS[LECTOR].herramientas.map((t) => t.name));
  assert.equal(capturada.system[0].text, MODOS[LECTOR].instrucciones);
  assert.equal(capturada.messages[0].content[0].type, "document");
});

test("cada agente tiene instrucciones y herramientas completas", () => {
  assert.ok(Object.keys(MODOS).length > 0);
  for (const [nombre, m] of Object.entries(MODOS)) {
    assert.match(nombre, /^(minis|rodelo|delidom)-/, nombre);
    assert.ok(m.instrucciones.length > 200, nombre);
    assert.ok(m.herramientas.length > 0, nombre);
    for (const h of m.herramientas) assert.ok(h.name && h.description && h.input_schema?.type === "object", `${nombre}: ${h.name}`);
  }
});
