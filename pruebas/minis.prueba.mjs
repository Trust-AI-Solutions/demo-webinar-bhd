// Pruebas de Minis by Mónica: datos sembrados, reglas del agente de choferes (la regla de
// oro), lectura del reporte de la cadena y que las herramientas coincidan con sus definiciones.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as N from "../public/minis/js/negocio.js";
import { DEFINICIONES } from "../public/minis/js/definiciones.js";
import { crearEjecutor, mapearReporte, HERRAMIENTAS_CHOFER } from "../public/minis/js/herramientas.js";
import { leerPegado } from "../public/minis/js/despacho.js";
import { AGENTES } from "../netlify/functions/ia/minis.mjs";

beforeEach(() => N.estado.restablecer());

test("datos: 28 tiendas en 4 rutas, 14 productos y ninguna cadena real", () => {
  assert.equal(N.TIENDAS.length, 28);
  assert.equal(N.CHOFERES.length, 4);
  for (const c of N.CHOFERES) assert.equal(N.TIENDAS.filter((t) => t.chofer === c.id).length, 7);
  assert.equal(N.PRODUCTOS.length, 14);
  const reales = /bravo|nacional|jumbo|sirena|plaza lama|\bole\b|aprezio/i;
  assert.ok(N.TIENDAS.every((t) => !reales.test(t.nombre)), "solo cadenas ficticias");
});

test("situaciones sembradas", () => {
  assert.equal(N.estadoTienda(26).texto, "Sin conteo");               // Del Sol Baní
  assert.equal(N.estadoTienda(19).clase, "warn");                     // Del Sol Moca, 6 días
  const naco = N.stockTienda(6).lineas.find((l) => l.codigo === "P06");
  assert.equal(naco.stock, 1);
  assert.ok(naco.bajo);
  assert.ok(N.stockTienda(2).lineas.find((l) => l.codigo === "P11").bajo);
  assert.deepEqual(N.tiendasSinVentas().map((t) => t.id), N.TIENDAS.filter(N.esDeLasPalmas).map((t) => t.id));
  assert.equal(N.alertasOficina().length, 2);
});

test("buscar tienda con nombre aproximado", () => {
  const ejecutar = crearEjecutor({ chofer: 1 });
  assert.equal(ejecutar("buscar_tienda", { texto: "el Caribe de la Núñez" }).tiendas[0].nombre, "Caribe Núñez de Cáceres");
  assert.equal(ejecutar("buscar_tienda", { texto: "Del Sol de Moca" }).tiendas[0].nombre, "Del Sol Moca");
  assert.equal(ejecutar("buscar_tienda", { texto: "Farmacia Carol" }).tiendas.length, 0);
  assert.ok(ejecutar("buscar_tienda", { texto: "caribe" }).tiendas.length > 1, "ambigua: varias");
});

test("regla de oro: no se cierra la visita sin todos los productos", () => {
  const ejecutar = crearEjecutor({ chofer: 1 });
  const lista = ejecutar("ver_productos_de_conteo", { tienda_id: 4 }).productos;
  assert.equal(lista.length, 12);
  const incompleto = ejecutar("registrar_visita", { tienda_id: 4, conteos: lista.slice(0, 10).map((p) => ({ codigo: p.codigo, quedaban: 2 })) });
  assert.match(incompleto.error, /faltan/);
  assert.deepEqual(incompleto.faltan, ["Mantecaditos", "Polvorones"]);
  assert.equal(N.visitaDeHoy(4), null, "no se guardó nada");

  const antes = N.kpis().visitadas_hoy;
  const completo = ejecutar("registrar_visita", { tienda_id: 4, conteos: lista.map((p) => ({ codigo: p.codigo, quedaban: p.codigo === "P06" ? 0 : 3, dejados: p.codigo === "P06" ? 1 : null })), notas: "Nevera fallando" });
  assert.equal(completo.guardada, true);
  assert.equal(N.kpis().visitadas_hoy, antes + 1);
  assert.equal(N.estadoTienda(4).clase, "ok");
  assert.equal(completo.alertas.length, 1, "chinola quedó con 1 de par 8");
  assert.match(completo.alertas[0], /Del Sol Piantini quedó con 1 cheesecake bites de chinola/);
});

test("el despacho usa el par donde hay conteo y repite ventas donde no", () => {
  const grilla = N.calcularDespacho();
  const fila = (id) => grilla.flatMap((r) => r.tiendas).find((t) => t.tienda.id === id);
  const naco = fila(6).celdas.find((c) => c.codigo === "P06");
  assert.equal(naco.porPar, true);
  assert.equal(naco.cantidad, 5); // par 6 − stock 1
  const sinConteo = fila(26).celdas.every((c) => !c.porPar);
  assert.ok(sinConteo, "Del Sol Baní repite lo vendido");
  const d = N.confirmarDespacho(grilla);
  assert.equal(d.entrega, N.sumarDias(N.hoy(), 1));
  assert.ok(d.lineas.length > 100);
});

test("reporte de la cadena: cuadra por código y no adivina lo que no está", () => {
  const m = mapearReporte({
    cadena: "HIPER LAS PALMAS, S.R.L.", fecha_reporte: "03/11/2026",
    lineas: [
      { tienda: "HLP-03 · LUPERON", producto: "MINIS GALL. JENGIBRE 8 UN", codigo_cadena: "LP-40253", unidades: 2 },
      { tienda: "HLP-19 · BOCA CHICA", producto: "MINIS CHEESEC BITES CHINOLA 4 UN", codigo_cadena: null, unidades: 4 },
      { tienda: "HLP-08 · LOS MINA", producto: "MINIS BROWNIE 2 UN", codigo_cadena: "LP-40290", unidades: 3 },
    ],
    dudas: [],
  });
  assert.equal(m.lineas[0].tienda.nombre, "Las Palmas Luperón");
  assert.equal(m.lineas[0].producto.codigo, "P14");
  assert.equal(m.lineas[1].tienda.nombre, "Las Palmas Boca Chica");
  assert.equal(m.lineas[1].producto.codigo, "P06");
  assert.equal(m.lineas[2].producto, null, "el brownie no es de Minis");
  assert.equal(m.tiendas, 3);
  const r = N.registrarVentas(m.lineas.filter((l) => l.tienda && l.producto).map((l) => ({ tienda: l.tienda.id, producto: l.producto.codigo, cantidad: l.unidades })));
  assert.equal(r.tiendas, 2);
  assert.equal(N.tiendasSinVentas().length, 6);
});

test("pegar desde Excel en matriz o en formato largo", () => {
  const matriz = "Tienda\tBizcocho de vainilla\tCoco horneado\nLas Palmas Higuey\t3\t2\nLas Palmas Boca Chica\t1\t0";
  assert.equal(leerPegado(matriz).lineas.length, 4);
  const largo = "Las Palmas Luperon;Polvorones;5\nTienda X;Coco horneado;2";
  const r = leerPegado(largo);
  assert.equal(r.lineas.length, 1);
  assert.equal(r.problemas.length, 1);
});

test("cada herramienta definida tiene su función, y los agentes están completos", () => {
  assert.deepEqual(DEFINICIONES["minis-chofer"].map((d) => d.name), HERRAMIENTAS_CHOFER);
  for (const d of [...DEFINICIONES["minis-chofer"], ...DEFINICIONES["minis-reporte"]]) {
    assert.ok(d.etiqueta && d.description && d.input_schema?.type === "object", d.name);
  }
  assert.equal(AGENTES["minis-chofer"].documento, false);
  assert.equal(AGENTES["minis-reporte"].documento, true);
  for (const a of Object.values(AGENTES)) {
    assert.ok(a.instrucciones.length > 200);
    assert.doesNotMatch(a.instrucciones, /\d{4}-\d{2}-\d{2}/, "sin fechas en las instrucciones (caché)");
    assert.doesNotMatch(a.instrucciones, /dulce|mini lovers/i);
  }
});
