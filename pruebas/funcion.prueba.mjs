// Pruebas de la función de Netlify sin gastar la clave: se reemplaza fetch para
// capturar la solicitud que el SDK enviaría a Anthropic.

import { test } from "node:test";
import assert from "node:assert/strict";
import funcion, { validarSolicitud } from "../netlify/functions/ia/ia.mjs";

const solicitud = (cuerpo, cabeceras = {}) => new Request("http://localhost/api/ia", { method: "POST", headers: { "content-type": "application/json", ...cabeceras }, body: JSON.stringify(cuerpo) });
const valido = { modo: "panel", fecha: "2026-11-10", hora: "10:15", mensajes: [{ role: "user", content: "¿Cómo van las ventas?" }] };

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
    const r = await funcion(solicitud({ ...valido, modo: "whatsapp" }), {});
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
  assert.deepEqual(c.tools.map((t) => t.name), ["buscar_productos", "crear_cotizacion", "registrar_pedido", "pasar_a_persona"]);
  assert.match(c.system[0].text, /asistente de WhatsApp/);
  assert.match(c.system[1].text, /2026-11-10/);
});
