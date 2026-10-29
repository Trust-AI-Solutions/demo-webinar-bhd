// Pruebas de los datos ficticios y de las herramientas (sin IA ni navegador).
// Uso: npm run pruebas

import { test } from "node:test";
import assert from "node:assert/strict";
import * as N from "../public/js/negocio.js";
import { ejecutarHerramienta } from "../public/js/herramientas.js";
import { restablecerDemo } from "../public/js/estado.js";

test("los datos cubren 6 meses hasta hoy y son estables", () => {
  const d = N.datos();
  assert.equal(d.hoy, N.hoy());
  assert.equal(d.productos.length, 145);
  assert.equal(d.clientes.length, 120);
  assert.ok(d.facturas.length > 2000, `facturas: ${d.facturas.length}`);
  assert.equal(d.facturas.at(-1).fecha <= d.hoy, true);
  assert.equal(d.facturas[0].fecha, N.sumarDias(d.hoy, -181));
  assert.equal(new Set(d.productos.map((p) => p.codigo)).size, 145, "códigos únicos");
});

test("las alertas encuentran las cinco situaciones sembradas", () => {
  const a = N.alertas();
  const titulos = a.map((x) => x.titulo).join(" | ");
  assert.match(titulos, /Cemento gris tipo Portland 42.5 kg se agota en Herrera/);
  assert.match(titulos, /Constructora Ozama/);
  assert.match(titulos, /Ventas de Villa Mella bajaron/);
  assert.match(titulos, /margen de Pinturas bajó/);
  assert.match(titulos, /Calentador de agua eléctrico 30 galones: sin ventas en 90 días/);
  assert.doesNotMatch(titulos, /Ventas de Herrera bajaron/);
});

test("Constructora Ozama pasó su límite y tiene más de 60 días de atraso", () => {
  const c = N.cuentasPorCobrar({ cliente: "Ozama" }).clientes[0];
  assert.ok(c.sobre_limite);
  assert.ok(c.dias_mayor_atraso > 60, `atraso ${c.dias_mayor_atraso}`);
});

test("resumen de ventas: totales coinciden con los grupos", async () => {
  const r = await ejecutarHerramienta("panel", "resumen_ventas", { desde: N.sumarDias(N.hoy(), -29), agrupar_por: "sucursal" });
  const suma = r.grupos.reduce((a, g) => a + g.ventas, 0);
  assert.ok(Math.abs(suma - r.ventas_sin_itbis) < 1);
  assert.ok(r.margen_pct > 15 && r.margen_pct < 40, `margen ${r.margen_pct}`);
  const malo = await ejecutarHerramienta("panel", "resumen_ventas", { sucursal: "Bávaro" });
  assert.ok(malo.error);
});

test("búsqueda del catálogo del asistente: encuentra y no muestra costos", async () => {
  const cemento = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "cemento gris" });
  assert.equal(cemento.productos[0].codigo, "CEM-001");
  assert.equal(cemento.productos[0].costo, undefined);
  const varilla = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "varillas de 3/8" });
  assert.equal(varilla.productos[0].codigo, "ACE-001");
  const pintura = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "pintura blanca exterior galón" });
  assert.ok(pintura.productos.some((p) => p.codigo === "PIN-003"), JSON.stringify(pintura.productos.map((p) => p.nombre)));
  const nada = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "televisor" });
  assert.equal(nada.encontrados, 0);
});

test("cotización, pedido y aviso del asistente llegan al panel", async () => {
  restablecerDemo();
  const cot = await ejecutarHerramienta("whatsapp", "crear_cotizacion", { items: [{ codigo: "ACE-001", cantidad: 20 }, { codigo: "CEM-001", cantidad: 10 }], tipo_entrega: "envío" });
  assert.equal(cot.subtotal, 20 * 335 + 10 * 640);
  assert.equal(cot.itbis, Math.round(cot.subtotal * 0.18 * 100) / 100);
  assert.equal(cot.envio, 500);

  const incompleto = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "CEM-001", cantidad: 2 }], nombre_cliente: "Ana", tipo_entrega: "retiro en tienda", forma_pago: "efectivo" });
  assert.match(incompleto.error, /teléfono/);
  const codigoMalo = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "XXX-1", cantidad: 2 }], nombre_cliente: "Ana", telefono: "809-555-0000", tipo_entrega: "retiro en tienda", forma_pago: "efectivo" });
  assert.ok(codigoMalo.error);

  const ok = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "CEM-001", cantidad: 30 }], nombre_cliente: "Ana Prueba", telefono: "809-555-0000", tipo_entrega: "envío", direccion: "Calle Falsa 1, Villa Mella", forma_pago: "transferencia" });
  assert.match(ok.pedido, /^P-\d+$/);
  assert.equal(ok.envio, 0, "envío gratis desde RD$15,000");
  const pedidos = await ejecutarHerramienta("panel", "ver_pedidos", { canal: "WhatsApp" });
  assert.equal(pedidos.pedidos[0].id, ok.pedido);

  await ejecutarHerramienta("whatsapp", "pasar_a_persona", { motivo: "Pide descuento por volumen", nombre_cliente: "Ana Prueba" });
  assert.ok(N.alertas().some((a) => a.tipo === "whatsapp" && /Ana Prueba/.test(a.titulo)));
  restablecerDemo();
  assert.ok(!N.alertas().some((a) => a.tipo === "whatsapp"));
});

test("una herramienta desconocida o con datos raros no rompe nada", async () => {
  assert.ok((await ejecutarHerramienta("panel", "borrar_todo", {})).error);
  assert.ok((await ejecutarHerramienta("whatsapp", "crear_cotizacion", { items: "nada" })).error);
  const inv = await ejecutarHerramienta("panel", "consultar_inventario", { solo_bajo_minimo: true, sucursal: "Herrera", limite: 50 });
  assert.ok(inv.productos.some((p) => p.codigo === "CEM-001"));
});
