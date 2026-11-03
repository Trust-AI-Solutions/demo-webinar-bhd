// Pruebas del servidor para Render (servidor.mjs), sin gastar la clave.

import { test } from "node:test";
import assert from "node:assert/strict";
import { crearServidor } from "../servidor.mjs";

async function conServidor(fn) {
  const servidor = crearServidor();
  await new Promise((ok) => servidor.listen(0, ok));
  const base = `http://localhost:${servidor.address().port}`;
  try { await fn(base); } finally { servidor.close(); }
}

test("entrega el sitio, la salud y los ejemplos; no sale de public/", async () => {
  await conServidor(async (base) => {
    const inicio = await fetch(`${base}/`);
    assert.equal(inicio.status, 200);
    assert.match(inicio.headers.get("content-type"), /text\/html/);
    assert.equal(inicio.headers.get("x-robots-tag"), "noindex");
    assert.match(await inicio.text(), /Panadería El Trigal/);
    assert.equal((await fetch(`${base}/salud`)).status, 200);
    assert.equal((await fetch(`${base}/ejemplos/reporte-ventas-la-canasta.pdf`)).headers.get("content-type"), "application/pdf");
    assert.equal((await fetch(`${base}/no-existe.html`)).status, 404);
    assert.equal((await fetch(`${base}/..%2Fpackage.json`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e/servidor.mjs`)).status, 404);
  });
});

test("/api/ia usa la misma función que Netlify y frena a quien abusa", async () => {
  const clave = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.CLAVE_DEMO;
  try {
    await conServidor(async (base) => {
      const r = await fetch(`${base}/api/ia`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      assert.equal(r.status, 500);
      assert.match((await r.json()).error, /ANTHROPIC_API_KEY/);
      assert.equal((await fetch(`${base}/api/ia`)).status, 405);
      let ultimo;
      for (let i = 0; i < 41; i++) ultimo = await fetch(`${base}/api/ia`, { method: "POST", body: "{}", headers: { "x-forwarded-for": "203.0.113.9" } });
      assert.equal(ultimo.status, 429);
    });
  } finally {
    if (clave) process.env.ANTHROPIC_API_KEY = clave;
  }
});
