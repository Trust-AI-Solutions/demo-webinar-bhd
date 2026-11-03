// Grupo Rodelo: las seis situaciones sembradas, el motor de alertas y las herramientas del
// copiloto. Se prueba con las fechas de la demo (ensayo y webinar) y con hoy.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as N from "../public/rodelo/js/negocio.js";
import { DEFINICIONES } from "../public/rodelo/js/definiciones.js";
import { crearEjecutar } from "../public/rodelo/js/herramientas.js";
import { GERENCIAS, generarReporte } from "../public/rodelo/js/reportes.js";
import { AGENTES } from "../netlify/functions/ia/rodelo.mjs";
import { MODOS } from "../netlify/functions/ia/modos.mjs";

const FECHAS = ["2026-11-05", "2026-11-10"];
const tipos = (al, tipo) => al.filter((a) => a.tipo === tipo).map((a) => a.entidad_referida).sort();

for (const hoy of FECHAS) {
  test(`situaciones sembradas (${hoy})`, () => {
    const d = N.datos(hoy);
    // A1: exactamente dos clientes con caída significativa, CL-0005 y CL-0012.
    const caidas = N.clientesCaida(d).filter((c) => c.variacion_pct <= -50);
    assert.deepEqual(caidas.map((c) => c.codigo).sort(), ["CL-0005", "CL-0012"]);
    // A2: Pedro Castillo, muy por debajo de la meta y el último del ranking.
    const v = N.vendedoresDesempeno(d);
    assert.equal(v[0].vendedor, "Pedro Castillo");
    assert.ok(v[0].cumplimiento_pct < 45 && v[1].cumplimiento_pct >= 60, `${v[0].cumplimiento_pct} / ${v[1].cumplimiento_pct}`);
    // A3: los dos lotes con más de 90 días.
    assert.deepEqual(N.inventario90(d).map((x) => x.codigo).sort(), ["PR-0019", "PR-0022"]);
    // A6: los morosos encabezan las cuentas por cobrar.
    assert.deepEqual(N.cobrosPorCliente(d).slice(0, 2).map((c) => c.codigo).sort(), ["CL-0007", "CL-0025"]);
  });

  test(`motor de alertas (${hoy})`, () => {
    const d = N.datos(hoy);
    const al = N.motorAlertas(d);
    const pedidosA4 = d.errores_despacho.map((e) => `pedido:${e.pedido_id}`).sort();
    // R1: los tres pedidos de 10 oz sembrados (puede aparecer uno más "orgánico", que también es atípico de verdad).
    const r1 = tipos(al, "presentacion_atipica");
    assert.ok(pedidosA4.every((p) => r1.includes(p)) && r1.length <= 4, r1.join());
    assert.equal(tipos(al, "desviacion_produccion").length, 2, "R2: los dos días de producción baja");
    assert.deepEqual(tipos(al, "desviacion_produccion"), d.diasMalos.map((f) => `produccion:${f}`).sort());
    assert.deepEqual(tipos(al, "retraso_pago"), ["cliente:25", "cliente:7"], "R3: los dos morosos");
    assert.deepEqual(tipos(al, "caida_compras"), ["cliente:12", "cliente:5"], "R4: los dos clientes en caída");
    assert.ok(al.every((a) => ["alta", "media", "baja"].includes(a.severidad) && a.descripcion && a.fecha_hora));
    assert.equal(al[0].severidad, "alta", "las alertas altas van primero");
  });
}

test("hoy también hay datos y alertas", () => {
  const d = N.datos(new Date().toISOString().slice(0, 10));
  assert.ok(d.facturas.length > 1000);
  assert.ok(N.motorAlertas(d).length >= 6);
});

test("cada día genera lo mismo (semilla fija)", () => {
  const a = N.datos("2026-11-10");
  const resumen = JSON.stringify(N.utilidadMensual(a));
  N.datos("2026-11-11");
  assert.equal(JSON.stringify(N.utilidadMensual(N.datos("2026-11-10"))), resumen);
});

test("comparación de meses por tramos equivalentes", () => {
  const m = N.ventasMesEquivalente(N.datos("2026-11-10"));
  assert.equal(m.mes_actual.desde, "2026-11-01");
  assert.equal(m.mes_actual.hasta, "2026-11-10");
  assert.equal(m.mes_anterior_mismo_tramo.desde, "2026-10-01");
  assert.equal(m.mes_anterior_mismo_tramo.hasta, "2026-10-10");
});

test("herramientas del copiloto: definiciones, ejecución y agente del servidor", () => {
  const defs = DEFINICIONES["rodelo-copiloto"];
  assert.deepEqual(defs.map((x) => x.name), ["consultar_bloque"]);
  assert.ok(defs.every((x) => x.etiqueta && x.description && x.input_schema));
  const ejecutar = crearEjecutar(() => N.datos("2026-11-10"));
  for (const bloque of defs[0].input_schema.properties.bloque.enum) {
    const r = ejecutar("consultar_bloque", { bloque });
    assert.ok(!r.error, `${bloque}: ${r.error}`);
    assert.ok(r.filas !== undefined, bloque);
  }
  assert.ok(ejecutar("consultar_bloque", { bloque: "inventado" }).error);
  assert.ok(ejecutar("otra", {}).error);
  const pedro = ejecutar("consultar_bloque", { bloque: "vendedores_desempeno", vendedor: "pedro" });
  assert.deepEqual(pedro.filas.map((x) => x.vendedor), ["Pedro Castillo"]);
  assert.ok(AGENTES["rodelo-copiloto"].instrucciones.includes("**Recomendación:**"));
  assert.deepEqual(MODOS["rodelo-copiloto"].herramientas.map((t) => Object.keys(t).join()), ["name,description,input_schema"]);
  assert.equal(MODOS["rodelo-copiloto"].documento, false);
});

test("nada en pantalla ni en las instrucciones nombra los sistemas del cliente", async () => {
  const { readFile } = await import("node:fs/promises");
  const textos = [AGENTES["rodelo-copiloto"].instrucciones, JSON.stringify(DEFINICIONES),
    await readFile(new URL("../public/rodelo/index.html", import.meta.url), "utf8"),
    await readFile(new URL("../public/rodelo/js/app.js", import.meta.url), "utf8"),
    await readFile(new URL("../public/rodelo/js/reportes.js", import.meta.url), "utf8")];
  for (const t of textos) assert.doesNotMatch(t, /\bSAP\b|Mobile Business|\bDrive\b|espejo de datos|gruporodelo/i);
});

test("reportes matinales de las cinco gerencias", () => {
  const d = N.datos("2026-11-10");
  const al = N.alertasConEstado(d);
  for (const g of GERENCIAS) {
    const r = generarReporte(g.clave, d, al);
    assert.match(r, /Titular del día/);
    assert.match(r, /Recomendación del día/);
  }
  assert.match(generarReporte("comercial", d, al), /Pedro Castillo/);
  assert.match(generarReporte("inventario", d, al), /PR-0019/);
});
