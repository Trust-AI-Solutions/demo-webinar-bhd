// Pruebas de los datos ficticios y de las herramientas (sin IA ni navegador).
// Uso: npm run pruebas

import { test } from "node:test";
import assert from "node:assert/strict";
import * as N from "../public/js/negocio.js";
import { ejecutarHerramienta } from "../public/js/herramientas.js";
import { restablecerDemo } from "../public/js/estado.js";
import { guardarReporteVentas } from "../public/js/pedidos.js";

test("los datos cubren 6 meses hasta hoy y son estables", () => {
  const d = N.datos();
  assert.equal(d.hoy, N.hoy());
  assert.equal(d.productos.length, 63);
  assert.equal(d.insumos.length, 28);
  assert.equal(d.clientes.length, 120);
  assert.ok(d.facturas.length > 8000, `facturas: ${d.facturas.length}`);
  assert.equal(d.facturas.at(-1).fecha <= d.hoy, true);
  assert.equal(d.facturas[0].fecha, N.sumarDias(d.hoy, -181));
  assert.equal(new Set(d.productos.map((p) => p.codigo)).size, 63, "códigos únicos");
  assert.equal(new Set(d.insumos.map((p) => p.codigo)).size, 28, "códigos de insumos únicos");
});

test("las alertas encuentran las cinco situaciones sembradas", () => {
  const a = N.alertas();
  const titulos = a.map((x) => x.titulo).join(" | ");
  assert.match(titulos, /Mantequilla sin sal se acaba en Gazcue/);
  assert.match(titulos, /Hotel Brisas de Gazcue/);
  assert.match(titulos, /Ventas de Los Prados bajaron/);
  assert.match(titulos, /margen de Bizcochos y tortas bajó/);
  assert.match(titulos, /Pan de centeno con semillas: sin ventas en 90 días/);
  assert.doesNotMatch(titulos, /Ventas de Gazcue bajaron/);
});

test("el hotel pasó su límite y tiene más de 60 días de atraso", () => {
  const c = N.cuentasPorCobrar({ cliente: "Hotel Brisas" }).clientes[0];
  assert.ok(c.sobre_limite);
  assert.ok(c.dias_mayor_atraso > 60, `atraso ${c.dias_mayor_atraso}`);
});

test("resumen de ventas: totales coinciden con los grupos", async () => {
  const r = await ejecutarHerramienta("panel", "resumen_ventas", { desde: N.sumarDias(N.hoy(), -29), agrupar_por: "sucursal" });
  const suma = r.grupos.reduce((a, g) => a + g.ventas, 0);
  assert.ok(Math.abs(suma - r.ventas_sin_itbis) < 1);
  assert.ok(r.margen_pct > 35 && r.margen_pct < 60, `margen ${r.margen_pct}`);
  const malo = await ejecutarHerramienta("panel", "resumen_ventas", { sucursal: "Bávaro" });
  assert.ok(malo.error);
});

test("búsqueda en el menú del asistente: encuentra y no muestra costos", async () => {
  const bizcocho = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "bizcocho de 3 libras" });
  assert.equal(bizcocho.productos[0].codigo, "BIZ-003");
  assert.equal(bizcocho.productos[0].costo, undefined);
  assert.match(bizcocho.productos[0].disponibilidad, /encargo/);
  const pan = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "pan de agua" });
  assert.equal(pan.productos[0].codigo, "PAN-001");
  const pastelito = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "pastelitos de pollo" });
  assert.ok(pastelito.productos.some((p) => p.codigo === "SAL-001"), JSON.stringify(pastelito.productos.map((p) => p.nombre)));
  const nada = await ejecutarHerramienta("whatsapp", "buscar_productos", { texto: "televisor" });
  assert.equal(nada.encontrados, 0);
});

test("cotización, pedido, encargo y aviso del asistente llegan al panel", async () => {
  restablecerDemo();
  const cot = await ejecutarHerramienta("whatsapp", "crear_cotizacion", { items: [{ codigo: "SAL-001", cantidad: 50 }, { codigo: "SAL-004", cantidad: 50 }], tipo_entrega: "envío" });
  assert.equal(cot.subtotal, 50 * 55 + 50 * 50);
  assert.equal(cot.itbis, Math.round(cot.subtotal * 0.18 * 100) / 100);
  assert.equal(cot.envio, 0, "entrega gratis desde RD$3,000");

  const incompleto = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "PAN-001", cantidad: 20 }], nombre_cliente: "Ana", tipo_entrega: "retiro en tienda", forma_pago: "efectivo" });
  assert.match(incompleto.error, /teléfono/);
  const codigoMalo = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "XXX-1", cantidad: 2 }], nombre_cliente: "Ana", telefono: "809-555-0000", tipo_entrega: "retiro en tienda", forma_pago: "efectivo" });
  assert.ok(codigoMalo.error);
  const sinFecha = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "BIZ-003", cantidad: 1 }], nombre_cliente: "Ana Prueba", telefono: "809-555-0000", tipo_entrega: "retiro en tienda", forma_pago: "transferencia" });
  assert.match(sinFecha.error, /fecha/);

  const ok = await ejecutarHerramienta("whatsapp", "registrar_pedido", { items: [{ codigo: "BIZ-003", cantidad: 1 }], nombre_cliente: "Ana Prueba", telefono: "809-555-0000", tipo_entrega: "retiro en tienda", forma_pago: "transferencia", para_cuando: "sábado 3:00 p. m.", nota: "Feliz cumpleaños, Ana" });
  assert.match(ok.pedido, /^P-\d+$/);
  assert.equal(ok.total_a_pagar, 2183);
  assert.equal(ok.adelanto_para_reservar, 1091.5);
  const pedidos = await ejecutarHerramienta("panel", "ver_pedidos", { solo_encargos: true });
  assert.equal(pedidos.pedidos[0].id, ok.pedido);
  assert.equal(pedidos.pedidos[0].para_cuando, "sábado 3:00 p. m.");

  await ejecutarHerramienta("whatsapp", "pasar_a_persona", { motivo: "Pide un bizcocho con foto impresa", nombre_cliente: "Ana Prueba" });
  assert.ok(N.alertas().some((a) => a.tipo === "whatsapp" && /Ana Prueba/.test(a.titulo)));
  restablecerDemo();
  assert.ok(!N.alertas().some((a) => a.tipo === "whatsapp"));
});

test("insumos: la mantequilla de Gazcue está bajo el mínimo y se ordena primero", async () => {
  const r = await ejecutarHerramienta("panel", "consultar_insumos", { solo_bajo_minimo: true, sucursal: "Gazcue" });
  assert.equal(r.insumos[0].nombre, "Mantequilla sin sal (caja 36 lb)");
  assert.ok(r.insumos[0].dias_que_alcanza.Gazcue < 2);
  const menu = await ejecutarHerramienta("panel", "consultar_menu", { sin_ventas_en_dias: 90 });
  assert.deepEqual(menu.productos.map((p) => p.codigo).sort(), ["BIZ-011", "PAN-015"]);
});

test("una herramienta desconocida o con datos raros no rompe nada", async () => {
  assert.ok((await ejecutarHerramienta("panel", "borrar_todo", {})).error);
  assert.ok((await ejecutarHerramienta("whatsapp", "crear_cotizacion", { items: "nada" })).error);
  assert.ok((await ejecutarHerramienta("panel", "consultar_insumos", { sucursal: "Herrera" })).error);
});

test("consignación: sin reporte queda pendiente; con reporte cuadra y avisa lo raro", () => {
  restablecerDemo();
  const antes = N.consignacion();
  assert.equal(antes.total_vendido, null);
  assert.equal(antes.total_entregado, 414, "92 unidades por tienda típica × 4.5 tiendas");
  const g = guardarReporteVentas({ periodo: "7 días", lineas: [
    { tienda: "LC-02 NACO", codigo: "PAN-007", unidades: 32 },
    { tienda: "La Canasta Gazcue", codigo: "GAL-001", unidades: 19 },
    { tienda: "Tienda Inexistente", codigo: "GAL-001", unidades: 5 },
  ] });
  assert.equal(g.guardadas, 2);
  const c = N.consignacion({ tienda: "Naco" });
  assert.equal(c.tiendas[0].productos.find((x) => x.codigo === "PAN-007").revisar, "Reportan 32 vendidos y se entregaron 30");
  assert.ok(N.alertas().some((a) => a.tipo === "consignacion" && /Naco/.test(a.titulo)));
  assert.equal(N.consignacion().total_a_liquidar, 32 * 116 + 19 * 120);
  restablecerDemo();
});
