// Delidom · datos FICTICIOS de la demo: catálogo, clientes, rutas y pedidos.
// La empresa es real (jugos naturales y pulpas de fruta); los clientes, códigos de
// barras, direcciones, teléfonos y pedidos son inventados. Los pedidos se generan con
// una semilla fija y anclados a la fecha de hoy, así la pizarra nunca abre vacía.
// Sin DOM: lo usan las pruebas y el generador de ejemplos (ejemplos/delidom.mjs).

import { sabor, presentacion, familia, unidadesPorBulto } from "./mapeo.js";

export const RUTAS = [
  { id: "1", nombre: "Ruta 1", zona: "Herrera y Sto. Dgo. Oeste" },
  { id: "2", nombre: "Ruta 2", zona: "Los Alcarrizos y Pedro Brand" },
  { id: "3", nombre: "Ruta 3", zona: "Distrito Nacional" },
  { id: "4", nombre: "Ruta 4", zona: "Supermercados" },
  { id: "5", nombre: "Ruta 5", zona: "Haina y San Cristóbal" },
];
export const nombreRuta = (id) => (id ? `Ruta ${id}` : "Sin ruta");

// Código de barras ficticio de 13 dígitos con su dígito verificador.
function ean13(n) {
  const base = `7469990${String(n).padStart(5, "0")}`;
  const suma = [...base].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return base + ((10 - (suma % 10)) % 10);
}

// [código, descripción del catálogo, nombre para la pantalla, categoría]
// La línea de supermercados (12 y 16 oz, fardos de 20) usa el código de barras como código.
const FILAS = [
  ["CHL-128", "JUGO CHINOLA / GL", "Jugo de chinola", "JUGOS 128oz"],
  ["LIM-128", "JUGO LIMON / GL", "Jugo de limón", "JUGOS 128oz"],
  ["NAR-128", "JUGO NARANJA / GL", "Jugo de naranja", "JUGOS 128oz"],
  ["PIN-128", "JUGO PIÑA / GL", "Jugo de piña", "JUGOS 128oz"],
  ["TAM-128", "JUGO TAMARINDO / GL", "Jugo de tamarindo", "JUGOS 128oz"],
  ["GUA-128", "JUGO GUANABANA / GL", "Jugo de guanábana", "JUGOS 128oz"],
  ["CER-128", "JUGO CEREZA / GL", "Jugo de cereza", "JUGOS 128oz"],
  ["MAN-128", "JUGO MANGO / GL", "Jugo de mango", "JUGOS 128oz"],
  ["FRE-128", "JUGO FRESA / GL", "Jugo de fresa", "JUGOS 128oz"],
  ["PIT-128", "JUGO PITAHAYA / GL", "Jugo de pitahaya", "JUGOS 128oz"],
  ["ACH-128", "JUGO AVENA CHINOLA / GL", "Jugo de avena con chinola", "JUGOS 128oz"],
  ["CHL-32", "JUGO CHINOLA 32oz - 12 UND", "Jugo de chinola 32 oz", "JUGOS OZ"],
  ["NAR-32", "JUGO NARANJA 32oz - 12 UND", "Jugo de naranja 32 oz", "JUGOS OZ"],
  ["LIM-32", "JUGO LIMON 32oz - 12 UND", "Jugo de limón 32 oz", "JUGOS OZ"],
  ["PIN-32", "JUGO PIÑA 32oz - 12 UND", "Jugo de piña 32 oz", "JUGOS OZ"],
  [1, "JUGO CHINOLA 12oz - 20 UND", "Jugo de chinola 12 oz", "JUGOS OZ"],
  [2, "JUGO LIMON 12oz - 20 UND", "Jugo de limón 12 oz", "JUGOS OZ"],
  [3, "JUGO NARANJA 12oz - 20 UND", "Jugo de naranja 12 oz", "JUGOS OZ"],
  [4, "JUGO PITAHAYA GUANABANA 12oz - 20 UND", "Jugo de pitahaya y guanábana 12 oz", "JUGOS OZ"],
  [5, "JUGO FRESA 12oz - 20 UND", "Jugo de fresa 12 oz", "JUGOS OZ"],
  [6, "JUGO TAMARINDO 12oz - 20 UND", "Jugo de tamarindo 12 oz", "JUGOS OZ"],
  [7, "JUGO CEREZA 12oz - 20 UND", "Jugo de cereza 12 oz", "JUGOS OZ"],
  [8, "JUGO CHINOLA 16oz - 20 UND", "Jugo de chinola 16 oz", "JUGOS OZ"],
  [9, "JUGO NARANJA 16oz - 20 UND", "Jugo de naranja 16 oz", "JUGOS OZ"],
  [10, "JUGO LIMON 16oz - 20 UND", "Jugo de limón 16 oz", "JUGOS OZ"],
  [11, "JUGO PIÑA 16oz - 20 UND", "Jugo de piña 16 oz", "JUGOS OZ"],
  ["PMA-LB", "PULPA DE MANGO / LB", "Pulpa de mango", "PULPAS"],
  ["PMT-LB", "PULPA DE MANGO EN TROCITOS / LB", "Pulpa de mango en trocitos", "PULPAS"],
  ["PFR-LB", "PULPA DE FRESA / LB", "Pulpa de fresa", "PULPAS"],
  ["PCH-LB", "PULPA DE CHINOLA / LB", "Pulpa de chinola", "PULPAS"],
  ["PPI-LB", "PULPA DE PITAHAYA / LB", "Pulpa de pitahaya", "PULPAS"],
  ["PGU-LB", "PULPA DE GUANABANA / LB", "Pulpa de guanábana", "PULPAS"],
  ["PCH-128", "PULPA DE CHINOLA / GL", "Pulpa de chinola", "PULPAS"],
  ["PTA-128", "PULPA DE TAMARINDO / GL", "Pulpa de tamarindo", "PULPAS"],
];

export const PRODUCTOS = FILAS.map(([codigo, descripcion, nombre, categoria], i) => {
  const ean = typeof codigo === "number" ? ean13(codigo) : null;
  const pres = presentacion(descripcion);
  const fam = familia(descripcion);
  return {
    id: i + 1,
    codigo: ean ?? codigo,
    ean,
    descripcion,
    nombre,
    categoria,
    presentacion: pres,
    familia: fam,
    sabor: sabor(descripcion),
    por_bulto: unidadesPorBulto(descripcion), // unidades por fardo (12 o 20)
    // Cómo se cuenta en el pedido: galones, fardos o fundas de 5 lb.
    unidad: pres === "GL" ? "GL" : pres === "LB" ? "FDO" : "FDO",
  };
});
export const productoPorId = new Map(PRODUCTOS.map((p) => [p.id, p]));
export const productoPorCodigo = (c) => PRODUCTOS.find((p) => p.codigo === c);

export const CLIENTES = [
  [1, "Supermercado La Cadena", "Av. Independencia #204, Sto. Dgo. Oeste", "809-555-0134", "4", "supermercado"],
  [2, "Supermercado El Ahorro", "Aut. Duarte Km 13, plaza local 4", "809-555-0102", "4", "supermercado"],
  [3, "Supermercados Plaza Verde", "Av. 27 de Febrero #880, Distrito Nacional", "809-555-0161", "4", "supermercado"],
  [4, "Cafetería Doña Mati", "C/ Duarte #12, Los Alcarrizos", "809-555-0188", "2", "cafetería"],
  [5, "Repostería Dulce Hogar", "C/ Primera #45, Herrera", "809-555-0121", "1", "repostería"],
  [6, "Catering Fiesta Real", "Av. Luperón #310, Sto. Dgo. Oeste", "809-555-0177", "3", "catering"],
  [7, "Comedor Institucional Sol", "Zona Industrial de Herrera, nave 3", "809-555-0145", "1", "comedor"],
  [8, "Hotel Vista Caribe", "Av. George Washington #500", "809-555-0119", "3", "hotel"],
  [9, "Colegio San Rafael", "C/ Respaldo 4 #7, Las Caobas", "809-555-0153", "1", "institucional"],
  [10, "Banquetes Del Este", "Av. Venezuela #77, Sto. Dgo. Este", "809-555-0166", "3", "catering"],
  [11, "Cafetería El Buen Sabor", "Av. Núñez de Cáceres #18", "809-555-0129", "3", "cafetería"],
  [12, "Heladería Coco Frío", "C/ Mella #9, Haina", "809-555-0192", "5", "heladería"],
  [13, "Juguería Tropical", "Av. Nicolás de Ovando #233", "809-555-0138", "3", "cafetería"],
  [14, "Restaurante Sabor Criollo", "Av. Isabel Aguiar #55, Herrera", "809-555-0110", "1", "restaurante"],
  [15, "Colmado La Fe", "C/ 8 #14, Los Alcarrizos", "809-555-0171", "2", "colmado"],
  [16, "Cafetería Universitaria", "Av. Alma Máter, Distrito Nacional", "809-555-0157", "3", "cafetería"],
  [17, "Panadería Pan de Oro", "C/ Sánchez #40, Haina", "809-555-0183", "5", "repostería"],
  [18, "Comedor Doña Chela", "Aut. Duarte Km 22, Pedro Brand", "809-555-0114", "2", "comedor"],
  [19, "Repostería Azúcar y Canela", "Av. Sabana Larga #19", "809-555-0149", "3", "repostería"],
  [20, "Colmado Hermanos Peña", "C/ 10 #3, Los Alcarrizos", "809-555-0126", "2", "colmado"],
  [21, "Cafetería La Esquina", "Prol. 27 de Febrero #301", "809-555-0175", "1", "cafetería"],
  [22, "Catering Mesa Llena", "C/ Padre Ayala #61, San Cristóbal", "809-555-0141", "5", "catering"],
  [23, "Batidos y Más", "Av. Lope de Vega #60", "809-555-0168", "3", "cafetería"],
  [24, "Comedor Industrial Haina", "Puerto de Haina, portón 2", "809-555-0133", "5", "comedor"],
  [25, "Fritura Doña Ana", "C/ Respaldo Las Palmas, Herrera", "809-555-0195", null, "colmado"],
].map(([id, nombre, direccion, telefono, ruta, tipo]) => ({ id, nombre, direccion, telefono, ruta, tipo }));
export const clientePorId = new Map(CLIENTES.map((c) => [c.id, c]));

// Alias ya aprendidos: los códigos internos de Supermercado La Cadena para los productos
// de Delidom (así vienen en sus órdenes de compra).
export const ALIAS_BASE = [
  ["LC-30211", "JUGO CHINOLA 12oz - 20 UND"],
  ["LC-30212", "JUGO LIMON 12oz - 20 UND"],
  ["LC-30213", "JUGO NARANJA 12oz - 20 UND"],
  ["LC-30214", "JUGO PITAHAYA GUANABANA 12oz - 20 UND"],
  ["LC-30455", "JUGO FRESA 12oz - 20 UND"],
  ["LC-30460", "JUGO CHINOLA 16oz - 20 UND"],
  ["LC-30461", "JUGO NARANJA 16oz - 20 UND"],
].map(([codigo_externo, desc]) => ({ producto_id: PRODUCTOS.find((p) => p.descripcion === desc).id, cliente_id: 1, codigo_externo, ean: null, descripcion_normalizada: null }));

// ---------- etiquetas para la pantalla ----------

// Cómo se escribe la cantidad: "4 gal", "35 fdo", "2 fundas".
export function cantidadCorta(cantidad, producto, unidad) {
  const u = unidad ?? producto?.unidad ?? "UN";
  const n = Number(cantidad);
  if (u === "GL") return `${n} gal`;
  if (u === "LB") return `${n} lb`;
  if (u === "CAJA") return `${n} ${n === 1 ? "caja" : "cajas"}`;
  if (u === "FDO") return producto?.presentacion === "LB" ? `${n} ${n === 1 ? "funda" : "fundas"}` : `${n} fdo`;
  return `${n} und`;
}

// Solo la unidad, para poner al lado de un campo de cantidad: "gal", "fdo", "fundas".
export function unidadCorta(producto, unidad) {
  const u = unidad ?? producto?.unidad ?? "UN";
  if (u === "GL") return "gal";
  if (u === "LB") return "lb";
  if (u === "CAJA") return "cajas";
  if (u === "FDO") return producto?.presentacion === "LB" ? "fundas" : "fdo";
  return "und";
}

// "4 gal chinola", "35 fdo chinola 12oz", "2 fundas pulpa fresa".
export function lineaCorta(item) {
  const p = productoPorId.get(item.producto_id);
  if (!p) return `${item.cantidad} ${item.descripcion ?? ""}`.trim();
  const tam = p.presentacion && /oz$/.test(p.presentacion) ? ` ${p.presentacion}` : "";
  const base = p.familia === "pulpa" ? `pulpa ${p.nombre.replace(/^Pulpa de /, "").toLowerCase()}` : p.nombre.replace(/^Jugo de /, "").replace(/ \d+ oz$/, "").toLowerCase();
  return `${cantidadCorta(item.cantidad, p, item.unidad)} ${base}${tam}`;
}
export const resumenPedido = (p) => p.items.map(lineaCorta).join(" · ") || "—";
export const bultosPedido = (p) => p.items.reduce((s, i) => s + Number(i.cantidad || 0), 0);

// "Recibido 7:42 a. m." a partir de minutos desde la medianoche.
export function horaTexto(min) {
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

// ---------- pedidos ----------

const it = (codigo, cantidad) => {
  const p = productoPorCodigo(codigo) ?? PRODUCTOS.find((x) => x.descripcion === codigo);
  return { producto_id: p.id, cantidad, unidad: p.unidad, unidades_por_bulto: p.por_bulto };
};
const ean = (n) => ean13(n);

// Pedidos de hoy: [cliente, hora (min), estado, canal, origen, items, nota, n.º del cliente, hora preparación, hora despacho]
const HOY = [
  [4, 6 * 60 + 55, "despachado", "WhatsApp", "texto_ia", [it("CHL-128", 3)], "", null, 7 * 60 + 5, 7 * 60 + 30],
  [7, 6 * 60 + 40, "despachado", "Llamada", "manual", [it("NAR-128", 8)], "", null, 7 * 60, 8 * 60 + 15],
  [24, 6 * 60 + 20, "despachado", "Llamada", "manual", [it("LIM-128", 10), it("CHL-128", 6)], "", null, 6 * 60 + 35, 7 * 60 + 50],
  [3, 5 * 60 + 58, "despachado", "Correo", "pdf_ia", [it(ean(1), 24), it(ean(3), 18), it(ean(8), 12)], "Recibir por el andén 2", "PV-55102", 6 * 60 + 30, 8 * 60 + 40],
  [1, 8 * 60 + 5, "preparacion", "Correo", "pdf_ia", [it(ean(1), 35), it(ean(2), 31), it(ean(4), 7), it(ean(9), 12)], "OC #4471", "OC-4471", 8 * 60 + 25, null],
  [6, 8 * 60 + 47, "preparacion", "Llamada", "manual", [it("PIN-128", 6), it("PMA-LB", 3)], "Evento del sábado", null, 9 * 60 + 5, null],
  [14, 7 * 60 + 58, "preparacion", "WhatsApp", "texto_ia", [it("TAM-128", 4), it("CHL-128", 4), it("PGU-LB", 2)], "", null, 8 * 60 + 40, null],
  [4, 7 * 60 + 42, "pendiente", "WhatsApp", "texto_ia", [it("CHL-128", 4), it("LIM-128", 2)], "Entregar antes de las 9:00 a. m.", null, null, null],
  [5, 8 * 60 + 20, "pendiente", "WhatsApp", "texto_ia", [it("PFR-LB", 2), it("PMT-LB", 1)], "", null, null, null],
  [2, 9 * 60 + 10, "pendiente", "Correo", "pdf_ia", [it(ean(2), 20), it(ean(3), 10), it(ean(11), 8)], "", "EA-0918", null, null],
  [11, 9 * 60 + 25, "pendiente", "WhatsApp", "texto_ia", [it("CHL-32", 2), it("NAR-32", 2)], "", null, null, null],
  [12, 9 * 60 + 38, "pendiente", "Llamada", "manual", [it("PCH-LB", 4), it("PFR-LB", 4), it("PMA-LB", 6)], "Tocar en el portón azul", null, null, null],
  [16, 9 * 60 + 52, "pendiente", "En persona", "manual", [it("NAR-128", 5), it("ACH-128", 2)], "", null, null, null],
  [25, 10 * 60 + 4, "pendiente", "WhatsApp", "texto_ia", [it("TAM-128", 2), it("CHL-128", 2)], "Cliente nuevo: confirmar dirección", null, null, null],
];

// Generador pseudoaleatorio con semilla fija (mulberry32).
function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sumarDias(iso, n) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d + n);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
export { sumarDias };

// Pedidos de hoy y de los últimos 35 días (historial), anclados a `hoy` (AAAA-MM-DD).
export function generarPedidos(hoy) {
  const manana = sumarDias(hoy, 1);
  let numero = 1000;
  const hoyPedidos = HOY.map(([cliente_id, min, estado, canal, origen, items, nota, numero_externo, prep, desp]) => {
    const c = clientePorId.get(cliente_id);
    return {
      id: `D-${++numero}`, cliente_id, cliente: c.nombre, ruta: c.ruta, estado, canal, origen, items, nota,
      numero_externo, fecha: hoy, fecha_entrega: estado === "pendiente" && origen === "pdf_ia" ? manana : hoy,
      recibido: min, preparacion: prep, despacho: desp,
    };
  }).sort((a, b) => a.recibido - b.recibido);

  const r = azar(20260805);
  const historial = [];
  const comunes = PRODUCTOS.filter((p) => p.categoria !== "JUGOS OZ");
  const oz = PRODUCTOS.filter((p) => p.categoria === "JUGOS OZ" && p.ean);
  for (let dias = 35; dias >= 1; dias--) {
    const fecha = sumarDias(hoy, -dias);
    const [a, m, d] = fecha.split("-").map(Number);
    if (new Date(a, m - 1, d).getDay() === 0) continue; // domingo no se despacha
    const cuantos = 4 + Math.floor(r() * 5);
    for (let k = 0; k < cuantos; k++) {
      const c = CLIENTES[Math.floor(r() * (CLIENTES.length - 1))];
      const deSuper = c.tipo === "supermercado";
      const lista = deSuper ? oz : comunes;
      const n = deSuper ? 2 + Math.floor(r() * 4) : 1 + Math.floor(r() * 3);
      const elegidos = new Set();
      while (elegidos.size < n) elegidos.add(lista[Math.floor(r() * lista.length)]);
      const items = [...elegidos].map((p) => ({
        producto_id: p.id, unidad: p.unidad, unidades_por_bulto: p.por_bulto,
        cantidad: deSuper ? 5 * (1 + Math.floor(r() * 8)) : p.unidad === "GL" ? 2 + Math.floor(r() * 12) : 1 + Math.floor(r() * 6),
      }));
      const min = 6 * 60 + Math.floor(r() * 240);
      const canal = deSuper ? "Correo" : ["WhatsApp", "WhatsApp", "Llamada", "En persona"][Math.floor(r() * 4)];
      historial.push({
        id: `D-${++numero}`, cliente_id: c.id, cliente: c.nombre, ruta: c.ruta, items, nota: "",
        estado: r() < 0.03 ? "anulado" : "despachado", canal, origen: deSuper ? "pdf_ia" : canal === "WhatsApp" ? "texto_ia" : "manual",
        numero_externo: null, fecha, fecha_entrega: fecha, recibido: min, preparacion: min + 20, despacho: min + 90,
      });
    }
  }
  // Los de hoy van después en la numeración, como en la vida real.
  hoyPedidos.forEach((p) => { p.id = `D-${++numero}`; });
  return { hoy: hoyPedidos, historial, siguiente: numero };
}

// ---------- ciclo de vida del pedido ----------

export const ESTADOS = {
  pendiente: { nombre: "Pendiente", accion: "Iniciar preparación", siguiente: "preparacion", anterior: null },
  preparacion: { nombre: "Preparando", accion: "Marcar despachado ✓", siguiente: "despachado", anterior: "pendiente" },
  despachado: { nombre: "Despachado", accion: null, siguiente: null, anterior: "preparacion" },
  anulado: { nombre: "Anulado", accion: null, siguiente: null, anterior: null },
};
export const siguienteEstado = (estado) => ESTADOS[estado]?.siguiente ?? null;
export const estadoAnterior = (estado) => ESTADOS[estado]?.anterior ?? null;
