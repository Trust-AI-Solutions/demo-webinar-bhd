// Pruebas de Delidom: el calce de líneas con el catálogo (mismas reglas que la solución
// real), el cliente, las fechas ambiguas, el agente lector y el ciclo de vida del pedido.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as D from "../public/delidom/js/datos.js";
import { mapearItem, mapearCliente, interpretarFecha } from "../public/delidom/js/mapeo.js";
import { DEFINICIONES, ETIQUETAS } from "../public/delidom/js/definiciones.js";
import { AGENTES } from "../netlify/functions/ia/delidom.mjs";
import * as P from "../public/delidom/js/pedidos.js";

const cat = { productos: D.PRODUCTOS, alias: D.ALIAS_BASE };
const calzar = (item, cliente = null) => mapearItem({ cantidad: 1, codigo_externo: null, ean: null, unidad: null, unidades_por_bulto: null, ...item }, cat, cliente);
const desc = (r) => r.producto_descripcion;

test("el catálogo ficticio tiene códigos de barras válidos y sin repetir", () => {
  const eans = D.PRODUCTOS.filter((p) => p.ean).map((p) => p.ean);
  assert.equal(new Set(eans).size, eans.length);
  for (const e of eans) {
    assert.match(e, /^\d{13}$/);
    const suma = [...e.slice(0, 12)].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
    assert.equal(Number(e[12]), (10 - (suma % 10)) % 10, `dígito verificador de ${e}`);
  }
  assert.ok(D.PRODUCTOS.length >= 30 && D.CLIENTES.length >= 25);
});

test("1. código de barras: calza exacto y multiplica los fardos", () => {
  const ean = D.PRODUCTOS.find((p) => p.descripcion === "JUGO CHINOLA 12oz - 20 UND").ean;
  const r = calzar({ descripcion: "JUGO CHINOLA 12 OZ (DELIDOM)", ean, cantidad: 35, unidad: "FDO", unidades_por_bulto: 20 });
  assert.equal(desc(r), "JUGO CHINOLA 12oz - 20 UND");
  assert.equal(r.metodo, "ean");
  assert.equal(r.cantidad_unidades, 700);
});

test("2. código del cliente: el alias aprendido gana aunque el código de barras sea nuevo", () => {
  const r = calzar({ descripcion: "JUGO FRESA 12 OZ (DELIDOM)", codigo_externo: "LC-30455", ean: "7469990099013", unidad: "FDO" }, 1);
  assert.equal(desc(r), "JUGO FRESA 12oz - 20 UND");
  assert.equal(r.metodo, "codigo_cliente");
});

test("3. alias de texto confirmado por una persona", () => {
  const alias = [...D.ALIAS_BASE, { producto_id: 3, cliente_id: 6, codigo_externo: null, ean: null, descripcion_normalizada: "JUGOS DE NARANJA" }];
  const r = mapearItem({ descripcion: "jugos de naranja", cantidad: 2 }, { productos: D.PRODUCTOS, alias }, 6);
  assert.equal(desc(r), "JUGO NARANJA / GL");
  assert.equal(r.metodo, "alias_texto");
  // El alias es de ese cliente: otro cliente no lo hereda.
  assert.equal(mapearItem({ descripcion: "jugos de naranja", cantidad: 2 }, { productos: D.PRODUCTOS, alias }, 4).producto_id, null);
});

test("4 y 5. catálogo exacto y sabor + tamaño", () => {
  assert.equal(calzar({ descripcion: "JUGO TAMARINDO / GL" }).metodo, "catalogo");
  const r = calzar({ descripcion: "JUGO CEREZA 12 OZ (DELIDOM)", unidad: "FDO" });
  assert.equal(desc(r), "JUGO CEREZA 12oz - 20 UND");
  assert.equal(r.metodo, "sabor_presentacion");
  assert.equal(r.supuesto, false);
});

test("si el mensaje no dice jugo o pulpa y los dos existen, se asume jugo y se marca", () => {
  const r = calzar({ descripcion: "galones de tamarindo", cantidad: 3, unidad: "GL" });
  assert.equal(desc(r), "JUGO TAMARINDO / GL");
  assert.equal(r.supuesto, true);
  assert.match(r.motivo, /se asumió JUGO/);
  // Sin competencia (no hay pulpa de limón en galón), no hay nada que suponer.
  const limon = calzar({ descripcion: "galones de limón", cantidad: 2, unidad: "GL" });
  assert.equal(desc(limon), "JUGO LIMON / GL");
  assert.equal(limon.supuesto, false);
});

test("con empate no adivina: deja candidatos para elegir", () => {
  const naranja = calzar({ descripcion: "jugos de naranja", cantidad: 2 });
  assert.equal(naranja.producto_id, null);
  assert.equal(naranja.candidatos.length, 4);
  const chinola = calzar({ descripcion: "pulpa de chinola" });
  assert.deepEqual(chinola.candidatos.map((c) => c.descripcion).sort(), ["PULPA DE CHINOLA / GL", "PULPA DE CHINOLA / LB"]);
  const mango = calzar({ descripcion: "JUGO MANGO 12 OZ (DELIDOM)", unidad: "FDO" });
  assert.equal(mango.producto_id, null);
  assert.match(mango.motivo, /no está en el catálogo/);
});

test("las fundas de pulpa se cuentan como fundas", () => {
  const r = calzar({ descripcion: "fundas de pulpa de fresa", cantidad: 3, unidad: "FDO" });
  assert.equal(desc(r), "PULPA DE FRESA / LB");
  assert.equal(D.lineaCorta({ producto_id: r.producto_id, cantidad: 3, unidad: "FDO" }), "3 fundas pulpa fresa");
});

test("el cliente se reconoce por su nombre parcial o el membrete", () => {
  assert.equal(mapearCliente("Doña Mati", D.CLIENTES).cliente_id, 4);
  assert.equal(mapearCliente("SUPERMERCADOS LA CADENA, SRL", D.CLIENTES).cliente_id, 1);
  assert.equal(mapearCliente("DELIDOM", D.CLIENTES).cliente_id, null);
  const varios = mapearCliente("Cafetería", D.CLIENTES);
  assert.equal(varios.cliente_id, null);
  assert.ok(varios.candidatos.length > 1);
});

test("una fecha ambigua no se elige sola", () => {
  assert.deepEqual(interpretarFecha("12/11/2026"), { iso: null, opciones: ["2026-11-12", "2026-12-11"] });
  assert.equal(interpretarFecha("19/11/2026").iso, "2026-11-19");
  assert.equal(interpretarFecha("2026-11-12").iso, "2026-11-12");
  assert.equal(interpretarFecha(null).iso, null);
});

test("el agente lector solo transcribe, con una herramienta que coincide con sus definiciones", () => {
  const a = AGENTES["delidom-lector"];
  assert.equal(a.documento, true);
  assert.deepEqual(a.definiciones.map((d) => d.name), ["entregar_pedido"]);
  assert.equal(a.definiciones, DEFINICIONES["delidom-lector"]);
  assert.ok(ETIQUETAS.entregar_pedido);
  const esquema = a.definiciones[0].input_schema;
  for (const campo of ["cliente", "numero_externo", "fecha_entrega", "contacto", "entregar_en", "condicion_pago", "nota", "items"]) assert.ok(esquema.required.includes(campo), campo);
  assert.deepEqual(esquema.properties.items.items.required, ["descripcion", "codigo_externo", "ean", "cantidad", "unidad", "unidades_por_bulto"]);
  assert.match(a.instrucciones, /TRANSCRIBIR/);
  assert.match(a.instrucciones, /NO multipliques/);
  assert.match(a.instrucciones, /AMBIGÜEDAD/);
});

test("los pedidos de hoy salen anclados a la fecha y con estados mezclados", () => {
  const g = D.generarPedidos("2026-11-10");
  assert.ok(g.hoy.every((p) => p.fecha === "2026-11-10"));
  for (const e of ["pendiente", "preparacion", "despachado"]) assert.ok(g.hoy.some((p) => p.estado === e), e);
  assert.ok(g.hoy.some((p) => !p.ruta), "hay un pedido sin ruta");
  assert.ok(g.historial.length > 100 && g.historial.every((p) => p.fecha < "2026-11-10"));
  assert.deepEqual(D.generarPedidos("2026-11-10"), g, "misma semilla, mismos datos");
  assert.equal(D.resumenPedido(g.hoy.find((p) => p.cliente === "Cafetería Doña Mati" && p.estado === "pendiente")), "4 gal chinola · 2 gal limón");
});

test("ciclo de vida: pendiente → preparación → despachado, y se puede deshacer", () => {
  P.restablecer();
  const nuevo = P.crearPedido({ cliente_id: 4, items: [{ producto_id: 1, cantidad: 4, unidad: "GL", unidades_por_bulto: null }], canal: "WhatsApp", origen: "texto_ia", nota: "", fecha_entrega: P.hoy() });
  assert.equal(P.pedido(nuevo.id).estado, "pendiente");
  assert.equal(P.avanzar(nuevo.id), "pendiente");
  assert.equal(P.pedido(nuevo.id).estado, "preparacion");
  assert.equal(P.avanzar(nuevo.id), "preparacion");
  assert.equal(P.pedido(nuevo.id).estado, "despachado");
  assert.equal(P.avanzar(nuevo.id), null, "un despachado no avanza más");
  P.fijarEstado(nuevo.id, "preparacion");
  assert.equal(P.pedido(nuevo.id).estado, "preparacion");
  assert.equal(P.pedido(nuevo.id).despacho, null);
  assert.ok(P.historial().some((p) => p.id === nuevo.id));
  P.restablecer();
  assert.equal(P.pedido(nuevo.id), undefined);
});
