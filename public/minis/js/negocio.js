// Consultas y cambios sobre los datos de Minis (los usan las pantallas y los agentes).
// Lo sembrado viene de datos.js; lo creado durante la demo (visitas, ventas importadas,
// despachos y alertas) vive en el estado del navegador y se suma encima.
//
// Stock estimado de una tienda = lo que quedaba en la última visita + lo que dejó el
// chofer − lo vendido desde ese día (igual que en el piloto; las visitas son en la mañana).

import { PRODUCTOS, CHOFERES, TIENDAS, parEn, generarDatos, sumarDias, esDeLasPalmas, CADENA_REPORTE } from "./datos.js";
import { crearEstado } from "../../comun/estado.js";
import { hoyISO } from "../../comun/ia.js";

export { PRODUCTOS, CHOFERES, TIENDAS, parEn, CADENA_REPORTE };

export const estado = crearEstado("minis", () => ({ visitas: [], ventas: [], despachos: [], alertas: [], secuencia: 0 }));

let cache = null;
export function hoy() { return hoyISO(); }
function semilla() {
  const h = hoy();
  if (!cache || cache.hoy !== h) cache = generarDatos(h);
  return cache;
}

export const producto = (codigo) => PRODUCTOS.find((p) => p.codigo === codigo);
export const tienda = (id) => TIENDAS.find((t) => t.id === Number(id));
export const chofer = (id) => CHOFERES.find((c) => c.id === Number(id));
export const contados = () => PRODUCTOS.filter((p) => p.conteo);

export function visitas() {
  return [...semilla().visitas, ...estado.leer().visitas].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
}
export function ventas() {
  const extra = estado.leer().ventas;
  // Una venta importada reemplaza la sembrada del mismo día, tienda y producto.
  const clave = (v) => `${v.fecha}|${v.tienda}|${v.producto}`;
  const reemplazadas = new Set(extra.map(clave));
  return [...semilla().ventas.filter((v) => !reemplazadas.has(clave(v))), ...extra];
}

export function ultimaVisita(idTienda) {
  const lista = visitas().filter((v) => v.tienda === Number(idTienda));
  return lista.at(-1) ?? null;
}
export const visitaDeHoy = (idTienda) => { const v = ultimaVisita(idTienda); return v && v.fecha === hoy() ? v : null; };

export function diasEntre(desde, hasta) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000);
}

// Stock estimado por producto en una tienda (null si nunca se ha contado).
export function stockTienda(idTienda) {
  const t = tienda(idTienda);
  const v = ultimaVisita(idTienda);
  if (!t || !v) return null;
  const vendidoDespues = {};
  // Las visitas son por la mañana: lo vendido ese mismo día ya es después de la visita.
  for (const x of ventas()) if (x.tienda === t.id && x.fecha >= v.fecha) vendidoDespues[x.producto] = (vendidoDespues[x.producto] ?? 0) + x.cantidad;
  const vendidoHoy = {};
  for (const x of ventas()) if (x.tienda === t.id && x.fecha === hoy()) vendidoHoy[x.producto] = (vendidoHoy[x.producto] ?? 0) + x.cantidad;
  const lineas = PRODUCTOS.map((p) => {
    const c = v.conteos.find((k) => k.producto === p.codigo);
    const par = parEn(p, t);
    if (!c) return { codigo: p.codigo, producto: p.nombre, contado: false, stock: null, par, vendido_hoy: vendidoHoy[p.codigo] ?? 0, valor: 0 };
    const dejados = c.dejados ?? Math.max(0, par - c.quedaban); // si no lo dijo, se asume que repuso hasta el par
    const stock = Math.max(0, c.quedaban + dejados - (vendidoDespues[p.codigo] ?? 0));
    return { codigo: p.codigo, producto: p.nombre, contado: true, stock, par, bajo: stock < par / 2, vendido_hoy: vendidoHoy[p.codigo] ?? 0, valor: stock * p.precio };
  });
  return {
    visita: v,
    dias: diasEntre(v.fecha, hoy()),
    lineas,
    unidades: lineas.reduce((s, l) => s + (l.stock ?? 0), 0),
    valor: lineas.reduce((s, l) => s + l.valor, 0),
  };
}

export function estadoTienda(idTienda) {
  const s = stockTienda(idTienda);
  if (!s) return { clase: "error", texto: "Sin conteo" };
  if (s.dias === 0) return { clase: "ok", texto: `Visitada hoy ${s.visita.hora}` };
  if (s.dias <= 3) return { clase: "ok", texto: `Conteo de hace ${s.dias} día${s.dias === 1 ? "" : "s"}` };
  return { clase: "warn", texto: `Conteo de hace ${s.dias} días` };
}

export function kpis() {
  let valor = 0, unidades = 0, conConteo = 0;
  for (const t of TIENDAS) {
    const s = stockTienda(t.id);
    if (!s) continue;
    conConteo++;
    valor += s.valor;
    unidades += s.unidades;
  }
  const deHoy = ventas().filter((v) => v.fecha === hoy());
  return {
    consignacion: valor, tiendas_con_conteo: conConteo, tiendas: TIENDAS.length, unidades,
    visitadas_hoy: TIENDAS.filter((t) => visitaDeHoy(t.id)).length,
    ventas_hoy: deHoy.reduce((s, v) => s + v.cantidad * producto(v.producto).precio, 0),
    unidades_vendidas_hoy: deHoy.reduce((s, v) => s + v.cantidad, 0),
  };
}

// ---------- Ventas del día ----------

export function ventasDelDia(fecha = hoy()) {
  const por = {};
  for (const v of ventas()) if (v.fecha === fecha) (por[v.tienda] ??= {})[v.producto] = v.cantidad;
  return por;
}
export function tiendasSinVentas(fecha = hoy()) {
  const con = ventasDelDia(fecha);
  return TIENDAS.filter((t) => !con[t.id]);
}

// lineas: [{ tienda, producto, cantidad }] con ids ya resueltos. Reemplaza lo del día.
export function registrarVentas(lineas, fecha = hoy()) {
  const limpias = lineas.filter((l) => tienda(l.tienda) && producto(l.producto) && Number.isFinite(Number(l.cantidad)) && Number(l.cantidad) >= 0);
  estado.modificar((e) => {
    const clave = (v) => `${v.fecha}|${v.tienda}|${v.producto}`;
    const nuevas = new Map(limpias.map((l) => [`${fecha}|${l.tienda}|${l.producto}`, { fecha, tienda: Number(l.tienda), producto: l.producto, cantidad: Math.round(Number(l.cantidad)) }]));
    e.ventas = [...e.ventas.filter((v) => !nuevas.has(clave(v))), ...nuevas.values()];
  }, { tipo: "ventas" });
  return { registradas: limpias.length, tiendas: new Set(limpias.map((l) => Number(l.tienda))).size };
}

// ---------- Coincidencias de nombres (sin tildes, mayúsculas ni signos) ----------

export const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const PALABRAS_VACIAS = new Set(["el", "la", "los", "las", "de", "del", "super", "supermercado", "supermercados", "mercado", "hiper", "tienda", "sucursal", "en", "y"]);
const palabras = (s) => normalizar(s).split(" ").filter((w) => w && !PALABRAS_VACIAS.has(w));

// Busca tiendas por nombre aproximado ("el Caribe de la Núñez" → Caribe Núñez de Cáceres).
export function buscarTiendas(texto, { chofer: idChofer } = {}) {
  const buscadas = palabras(texto);
  const cadena = /palmas/.test(normalizar(texto)) ? "Las Palmas" : /sol/.test(normalizar(texto)) ? "Del Sol" : /caribe/.test(normalizar(texto)) ? "Caribe" : null;
  const puntuadas = TIENDAS.map((t) => {
    const propias = palabras(t.nombre);
    let puntos = 0;
    for (const w of buscadas) if (propias.some((p) => p === w || (w.length >= 3 && p.startsWith(w)) || (p.length >= 4 && w.startsWith(p)))) puntos += 2;
    if (cadena && t.nombre.startsWith(cadena)) puntos += 1;
    if (idChofer && t.chofer === Number(idChofer)) puntos += 0.5;
    return { t, puntos };
  }).filter((x) => x.puntos >= 2).sort((a, b) => b.puntos - a.puntos);
  // Solo las de mejor coincidencia: si hay empate, el agente pregunta cuál es.
  const mejor = puntuadas[0]?.puntos ?? 0;
  return puntuadas.filter((x) => x.puntos >= mejor - 0.5).slice(0, 5).map(({ t }) => t);
}

// Producto por nombre aproximado o por código de la cadena ("LP-40232", "MINIS CHEESEC CHINOLA").
export function buscarProducto(texto, codigoCadena) {
  if (codigoCadena) {
    const c = PRODUCTOS.find((p) => normalizar(p.codigoLP) === normalizar(codigoCadena) || p.codigo === String(codigoCadena).toUpperCase());
    if (c) return c;
  }
  const n = normalizar(texto).replace(/\bminis\b/g, "").replace(/\bbizc\b/g, "bizcocho").replace(/\bcheesec\b|\bchsk\b/g, "cheesecake").replace(/\bgall\b/g, "galletas").trim();
  const exacto = PRODUCTOS.find((p) => normalizar(p.nombre) === n);
  if (exacto) return exacto;
  const ws = n.split(" ").filter((w) => w.length > 2);
  const candidatos = PRODUCTOS.map((p) => ({ p, puntos: ws.filter((w) => normalizar(p.nombre).split(" ").some((x) => x.startsWith(w) || w.startsWith(x))).length }))
    .filter((x) => x.puntos > 0).sort((a, b) => b.puntos - a.puntos);
  if (!candidatos.length) return null;
  if (candidatos[1] && candidatos[1].puntos === candidatos[0].puntos) return null; // empate: no se adivina
  return candidatos[0].p;
}

export function tiendaDesdeReporte(texto) {
  const n = normalizar(texto);
  const porCodigo = TIENDAS.find((t) => t.enReporte && (normalizar(t.enReporte) === n || n.includes(normalizar(t.enReporte.split(" ")[0]))));
  if (porCodigo) return porCodigo;
  const lista = buscarTiendas(/palmas/.test(n) ? texto : `Las Palmas ${texto}`);
  return lista[0] ?? null;
}

// ---------- Visitas (las registra el agente de choferes) ----------

// conteos: [{ producto: "P01", quedaban: 3, dejados?: 7 }]. Regla de oro: todos los productos del conteo.
export function registrarVisita({ tienda: idTienda, conteos, notas = "", chofer: idChofer, origen = "whatsapp" }) {
  const t = tienda(idTienda);
  if (!t) return { error: "No existe esa tienda. Búscala primero con buscar_tienda." };
  const recibidos = new Map();
  for (const c of conteos ?? []) {
    const p = producto(String(c.producto ?? "").toUpperCase());
    const n = Number(c.quedaban);
    if (p && p.conteo && Number.isFinite(n) && n >= 0) recibidos.set(p.codigo, { producto: p.codigo, quedaban: Math.round(n), dejados: Number.isFinite(Number(c.dejados)) && c.dejados !== null && c.dejados !== "" ? Math.max(0, Math.round(Number(c.dejados))) : null });
  }
  const faltan = contados().filter((p) => !recibidos.has(p.codigo));
  if (faltan.length) {
    return { error: "La visita no se puede cerrar: faltan productos por contar.", faltan: faltan.map((p) => p.nombre) };
  }
  const ahora = new Date();
  const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const visita = { id: "", fecha: hoy(), hora, tienda: t.id, chofer: Number(idChofer) || t.chofer, conteos: [...recibidos.values()], notas: String(notas ?? "").slice(0, 300), origen };
  // Alerta a la oficina si, después de reponer, un producto quedó por debajo de la mitad del par.
  const alertas = visita.conteos
    .map((c) => { const p = producto(c.producto); const par = parEn(p, t); return { p, par, queda: c.quedaban + (c.dejados ?? Math.max(0, par - c.quedaban)) }; })
    .filter(({ queda, par }) => queda < par / 2)
    .map(({ p, par, queda }) => ({ tienda: t.nombre, producto: p.nombre, mensaje: `${t.nombre} quedó con ${queda} ${p.nombre.toLowerCase()} (par ${par})` }));
  estado.modificar((e) => {
    e.secuencia += 1;
    visita.id = `V-demo-${e.secuencia}`;
    e.visitas.push(visita);
    for (const a of alertas) e.alertas.push({ ...a, fecha: visita.fecha, hora });
  }, { tipo: "visita", tienda: t.id, nombre: t.nombre });
  return { guardada: true, tienda: t.nombre, hora, productos_contados: visita.conteos.length, alertas: alertas.map((a) => a.mensaje) };
}

export function alertasOficina() {
  const s = stockAlertas();
  return [...estado.leer().alertas.slice().reverse().map((a) => ({ ...a, nueva: true })), ...s];
}
// Alertas que salen del stock sembrado (productos por debajo de la mitad del par en visitas de hoy).
function stockAlertas() {
  const lista = [];
  for (const t of TIENDAS) {
    const v = visitaDeHoy(t.id);
    if (!v || v.origen !== "app") continue;
    const s = stockTienda(t.id);
    for (const l of s.lineas) if (l.contado && l.bajo) lista.push({ tienda: t.nombre, producto: l.producto, mensaje: `${t.nombre} quedó con ${l.stock} ${l.producto.toLowerCase()} (par ${l.par})`, hora: v.hora });
  }
  return lista;
}

// ---------- Despacho (para mañana) ----------

// Sugerido por tienda y producto: si la tienda tiene conteo, par − stock; si no, repetir lo vendido hoy.
export function calcularDespacho(fecha = hoy()) {
  const vendidas = ventasDelDia(fecha);
  return CHOFERES.map((c) => ({
    chofer: c,
    tiendas: TIENDAS.filter((t) => t.chofer === c.id).map((t) => {
      const s = stockTienda(t.id);
      const celdas = PRODUCTOS.map((p) => {
        const linea = s?.lineas.find((l) => l.codigo === p.codigo);
        if (linea?.contado) return { codigo: p.codigo, cantidad: Math.max(0, linea.par - linea.stock), porPar: true };
        return { codigo: p.codigo, cantidad: vendidas[t.id]?.[p.codigo] ?? 0, porPar: false };
      });
      return { tienda: t, celdas, sinVentas: !vendidas[t.id] };
    }),
  }));
}

export function confirmarDespacho(grilla, fechaVentas = hoy()) {
  const entrega = sumarDias(fechaVentas, 1);
  const lineas = [];
  for (const r of grilla) for (const t of r.tiendas) for (const c of t.celdas) if (c.cantidad > 0) lineas.push({ tienda: t.tienda.id, producto: c.codigo, cantidad: c.cantidad });
  const despacho = { entrega, ventasDe: fechaVentas, generado: new Date().toISOString(), lineas };
  estado.modificar((e) => { e.despachos = [...e.despachos.filter((d) => d.entrega !== entrega), despacho]; }, { tipo: "despacho" });
  return despacho;
}
export const despachos = () => estado.leer().despachos.slice().sort((a, b) => b.entrega.localeCompare(a.entrega));

export { sumarDias, esDeLasPalmas };
