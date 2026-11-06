// Pruebas de Minis by Mónica: datos sembrados, reglas del agente de choferes (la regla de
// oro), conciliación, previsión, stock y rutas del panel, lectura del reporte de la cadena y
// que las herramientas coincidan con sus definiciones.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as N from "../public/minis/js/negocio.js";
import { DEFINICIONES } from "../public/minis/js/definiciones.js";
import { crearEjecutor, mapearReporte, HERRAMIENTAS_CHOFER } from "../public/minis/js/herramientas.js";
import { leerPegado } from "../public/minis/js/respaldo.js";
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

test("conciliación: lo que cuentan los choferes cuadra con la cadena, salvo los dos errores sembrados", () => {
  const filas = N.conciliacion(N.sumarDias(N.hoy(), -30), N.hoy());
  assert.ok(filas.every((r) => N.diaSemana(r.fecha) !== 0), "sin domingos: su venta entra en el tramo del sábado");
  const diferencias = filas.filter((r) => r.estado === "diferencia");
  assert.equal(diferencias.length, 2);
  const detalle = diferencias.flatMap((r) => N.detalleDia(r.fecha).filter((x) => x.tiendas.length).map((x) => [x.tiendas.join(), x.codigo, x.minis - x.informe]));
  assert.deepEqual(detalle.sort(), [["Caribe Núñez de Cáceres", "P01", -2], ["Caribe Santiago Centro", "P08", 1]]);
  assert.equal(filas.at(-1).estado, "en-curso", "las visitas de hoy se concilian con la próxima");
  const porProducto = N.conciliacion(...N.rangoPeriodo("semana-1"), { porDia: false });
  assert.equal(porProducto.length, 12, "solo los productos del checklist");
});

test("el stock en tienda cuadra con los movimientos del mes", () => {
  const naco = N.stockDetalle(6).find((f) => f.producto.codigo === "P06");
  assert.equal(naco.actual, 1);
  assert.equal(naco.ajuste, 0);
  assert.equal(naco.inicial + naco.despachos - naco.ventas - naco.descartes, 1);
  assert.equal(N.stockDetalle(26).every((f) => f.actual === null), true, "Del Sol Baní sin conteo");
});

test("previsión: promedio de semanas completas, margen y reparto por día", () => {
  const semana = N.prevision({ margen: 0.1 });
  assert.equal(semana.semanas.length, 4);
  assert.equal(semana.filas.length, 14);
  for (const f of semana.filas) assert.equal(f.sugerido, Math.ceil(f.promedio * 1.1));
  assert.ok(semana.filas.some((f) => f.tendencia === "sube") && semana.filas.some((f) => f.tendencia === "baja"));
  assert.ok(Math.abs(semana.pesos.reduce((s, n) => s + n, 0) - 1) < 1e-9);
  const sabado = N.prevision({ margen: 0, dia: 5 }).filas[0];
  assert.ok(sabado.promedio > semana.filas[0].promedio / 6, "el sábado cubre también el domingo");
});

test("rutas del día: una tienda está en una sola ruta y el agente la usa", () => {
  assert.equal(N.rutaDe(1).length, 7);
  N.asignarRuta(2, [...N.rutaHabitual(2), 4]);
  assert.equal(N.choferDe(4), 2);
  assert.ok(!N.rutaDe(1).some((t) => t.id === 4), "salió de la ruta de Ramón");
  assert.equal(crearEjecutor({ chofer: 2 })("buscar_tienda", { texto: "Del Sol Piantini" }).tiendas[0].id, 4);
});

test("carga manual: queda con su fuente y se puede borrar", () => {
  N.registrarVentas([{ tienda: 5, producto: "P01", cantidad: 4 }], N.hoy(), "manual");
  assert.equal(N.ventaDia(5, N.hoy()).P01, 4);
  assert.equal(N.estado.leer().ventas[0].fuente, "manual");
  N.borrarVentas(N.hoy(), "manual");
  assert.equal(N.ventaDia(5, N.hoy()), null);
});

test("reporte de la cadena: cuadra por código y no adivina lo que no está", () => {
  const m = mapearReporte({
    cadena: "HIPER LAS PALMAS, S.R.L.", fecha_reporte: "03/11/2026",
    tiendas: [
      { tienda: "HLP-03 · LUPERON", ventas: ["LP-40253 | MINIS GALL. JENGIBRE 8 UN | 2"] },
      { tienda: "HLP-19 · BOCA CHICA", ventas: ["- | MINIS CHEESEC BITES CHINOLA 4 UN | 4"] },
      { tienda: "HLP-08 · LOS MINA", ventas: ["LP-40290 | MINIS BROWNIE 2 UN | 3", "algo ilegible"] },
    ],
    dudas: [],
  });
  assert.equal(m.lineas[0].tienda.nombre, "Las Palmas Luperón");
  assert.equal(m.lineas[0].producto.codigo, "P14");
  assert.equal(m.lineas[1].tienda.nombre, "Las Palmas Boca Chica");
  assert.equal(m.lineas[1].producto.codigo, "P06");
  assert.equal(m.lineas[1].unidades, 4);
  assert.equal(m.lineas[1].original.codigo_cadena, null);
  assert.equal(m.lineas[2].producto, null, "el brownie no es de Minis");
  assert.equal(m.lineas[2].original.codigo_cadena, "LP-40290");
  assert.equal(m.lineas[3].producto, null, "lo que no tiene la forma esperada queda para revisar");
  assert.equal(m.lineas[3].unidades, 0);
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
