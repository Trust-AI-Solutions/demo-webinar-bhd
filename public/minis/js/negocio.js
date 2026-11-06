// Consultas y cambios sobre los datos de Minis (los usan las pantallas y los agentes).
// Lo sembrado viene de datos.js; lo creado durante la demo (visitas, ventas importadas o
// digitadas, rutas del día y alertas) vive en el estado del navegador y se suma encima.
//
// Stock estimado de una tienda = lo que quedaba en la última visita + lo que dejó el
// chofer − lo vendido desde ese día (igual que en el piloto; las visitas son en la mañana).
// Lo que vendió según Minis entre dos visitas = lo que había al irse el chofer − lo que
// encuentra en la visita siguiente; la conciliación lo compara con el informe de la cadena.

import { PRODUCTOS, CHOFERES, TIENDAS, parEn, generarDatos, sumarDias, esDeLasPalmas, CADENA_REPORTE, diaSemana } from "./datos.js";
import { crearEstado } from "../../comun/estado.js";
import { hoyISO } from "../../comun/ia.js";

export { PRODUCTOS, CHOFERES, TIENDAS, parEn, CADENA_REPORTE, diaSemana };

export const estado = crearEstado("minis", () => ({ visitas: [], ventas: [], alertas: [], rutas: null, secuencia: 0 }));

let cache = null;
export function hoy() { return hoyISO(); }
function semilla() {
  const h = hoy();
  if (!cache || cache.hoy !== h) cache = generarDatos(h);
  return cache;
}

// Lo derivado se calcula una vez por cambio de estado (son miles de filas).
let version = 0;
estado.alCambiar(() => { version++; });
const memorias = new Map();
function memo(clave, calcular) {
  const m = memorias.get(clave);
  if (m && m.version === version && m.hoy === hoy()) return m.valor;
  const valor = calcular();
  memorias.set(clave, { version, hoy: hoy(), valor });
  return valor;
}
const leido = () => memo("estado", () => estado.leer());

export const producto = (codigo) => PRODUCTOS.find((p) => p.codigo === codigo);
export const tienda = (id) => TIENDAS.find((t) => t.id === Number(id));
export const chofer = (id) => CHOFERES.find((c) => c.id === Number(id));
export const contados = () => PRODUCTOS.filter((p) => p.conteo);

export function visitas() {
  return memo("visitas", () => [...semilla().visitas, ...leido().visitas].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)));
}
export function ventas() {
  return memo("ventas", () => {
    const extra = leido().ventas;
    // Una venta importada reemplaza la sembrada del mismo día, tienda y producto.
    const clave = (v) => `${v.fecha}|${v.tienda}|${v.producto}`;
    const reemplazadas = new Set(extra.map(clave));
    return [...semilla().ventas.filter((v) => !reemplazadas.has(clave(v))), ...extra];
  });
}
// Índices: visitas por tienda (en orden) y ventas por tienda → fecha → producto.
const visitasPorTienda = () => memo("visitasPorTienda", () => {
  const m = new Map(TIENDAS.map((t) => [t.id, []]));
  for (const v of visitas()) m.get(v.tienda)?.push(v);
  return m;
});
const ventasIndice = () => memo("ventasIndice", () => {
  const m = new Map();
  for (const v of ventas()) {
    const porFecha = m.get(v.tienda) ?? m.set(v.tienda, new Map()).get(v.tienda);
    const dia = porFecha.get(v.fecha) ?? porFecha.set(v.fecha, {}).get(v.fecha);
    dia[v.producto] = (dia[v.producto] ?? 0) + v.cantidad;
  }
  return m;
});
// Ventas de una tienda en una fecha: { P01: 3, … } (vacío si la cadena no reportó).
export const ventaDia = (idTienda, fecha) => ventasIndice().get(Number(idTienda))?.get(fecha) ?? null;
export const fuenteVentas = (fecha) => [...new Set(leido().ventas.filter((v) => v.fecha === fecha).map((v) => v.fuente ?? "informe"))];

export function ultimaVisita(idTienda) {
  return visitasPorTienda().get(Number(idTienda))?.at(-1) ?? null;
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
  for (const [fecha, dia] of ventasIndice().get(t.id) ?? []) if (fecha >= v.fecha) for (const [k, n] of Object.entries(dia)) vendidoDespues[k] = (vendidoDespues[k] ?? 0) + n;
  const vendidoHoy = { ...(ventaDia(t.id, hoy()) ?? {}) };
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
// fuente: "informe" (el PDF de la cadena) o "manual" (digitado cuando el informe no llega).
export function registrarVentas(lineas, fecha = hoy(), fuente = "informe") {
  const limpias = lineas.filter((l) => tienda(l.tienda) && producto(l.producto) && Number.isFinite(Number(l.cantidad)) && Number(l.cantidad) >= 0);
  estado.modificar((e) => {
    const clave = (v) => `${v.fecha}|${v.tienda}|${v.producto}`;
    const nuevas = new Map(limpias.map((l) => [`${fecha}|${l.tienda}|${l.producto}`, { fecha, tienda: Number(l.tienda), producto: l.producto, cantidad: Math.round(Number(l.cantidad)), fuente }]));
    e.ventas = [...e.ventas.filter((v) => !nuevas.has(clave(v))), ...nuevas.values()];
  }, { tipo: "ventas", fecha });
  return { registradas: limpias.length, tiendas: new Set(limpias.map((l) => Number(l.tienda))).size };
}

// Borra lo subido en la demo para una fecha (un informe o una carga manual).
export function borrarVentas(fecha, fuente = "informe") {
  estado.modificar((e) => { e.ventas = e.ventas.filter((v) => !(v.fecha === fecha && (v.fuente ?? "informe") === fuente)); }, { tipo: "ventas", fecha });
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
    if (idChofer && choferDe(t.id) === Number(idChofer)) puntos += 0.5;
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
    if (p && p.conteo && Number.isFinite(n) && n >= 0) recibidos.set(p.codigo, { producto: p.codigo, quedaban: Math.round(n), descarte: 0, dejados: Number.isFinite(Number(c.dejados)) && c.dejados !== null && c.dejados !== "" ? Math.max(0, Math.round(Number(c.dejados))) : null });
  }
  const faltan = contados().filter((p) => !recibidos.has(p.codigo));
  if (faltan.length) {
    return { error: "La visita no se puede cerrar: faltan productos por contar.", faltan: faltan.map((p) => p.nombre) };
  }
  const ahora = new Date();
  const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const visita = { id: "", fecha: hoy(), hora, tienda: t.id, chofer: Number(idChofer) || choferDe(t.id) || t.chofer, conteos: [...recibidos.values()], notas: String(notas ?? "").slice(0, 300), origen };
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
  return [...leido().alertas.slice().reverse().map((a) => ({ ...a, nueva: true })), ...s];
}
// Alertas de las visitas sembradas de hoy: productos que, después de reponer, quedaron por
// debajo de la mitad del par (la misma regla que aplica el agente al cerrar una visita).
function stockAlertas() {
  const lista = [];
  for (const t of TIENDAS) {
    const v = visitaDeHoy(t.id);
    if (!v || v.origen !== "app") continue;
    for (const c of v.conteos) {
      const p = producto(c.producto);
      const par = parEn(p, t);
      const queda = c.quedaban + (c.dejados ?? 0);
      if (queda < par / 2) lista.push({ tienda: t.nombre, producto: p.nombre, mensaje: `${t.nombre} quedó con ${queda} ${p.nombre.toLowerCase()} (par ${par})`, hora: v.hora });
    }
  }
  return lista;
}

// ---------- Rutas del día ----------
// Las rutas no son fijas: la oficina las asigna cada mañana (por defecto, la habitual).
export const rutaHabitual = (idChofer) => TIENDAS.filter((t) => t.chofer === Number(idChofer)).map((t) => t.id);
export function rutas() {
  const guardadas = leido().rutas;
  return Object.fromEntries(CHOFERES.map((c) => [c.id, guardadas?.[c.id] ?? rutaHabitual(c.id)]));
}
export const rutaDe = (idChofer) => (rutas()[Number(idChofer)] ?? []).map(tienda).filter(Boolean);
export function choferDe(idTienda) {
  const r = rutas();
  const c = CHOFERES.find((x) => r[x.id].includes(Number(idTienda)));
  return c ? c.id : null;
}
export function asignarRuta(idChofer, ids) {
  const limpios = [...new Set(ids.map(Number))].filter((id) => tienda(id));
  estado.modificar((e) => {
    const actuales = { ...rutas() };
    // Una tienda está en una sola ruta: si pasa a este chofer, sale de la otra.
    for (const c of CHOFERES) if (c.id !== Number(idChofer)) actuales[c.id] = actuales[c.id].filter((id) => !limpios.includes(id));
    actuales[Number(idChofer)] = limpios;
    e.rutas = actuales;
  }, { tipo: "rutas" });
}

// ---------- Resúmenes para el panel ----------

const sumar = (obj) => Object.values(obj ?? {}).reduce((s, n) => s + n, 0);
const importe = (obj) => Object.entries(obj ?? {}).reduce((s, [k, n]) => s + n * (producto(k)?.precio ?? 0), 0);
export const visitaDelDia = (idTienda, fecha) => visitasPorTienda().get(Number(idTienda))?.find((v) => v.fecha === fecha) ?? null;

// Una fila por tienda para una fecha: lo que hizo el chofer y lo que reportó la cadena.
export function resumenDia(fecha = hoy()) {
  return TIENDAS.map((t) => {
    const v = visitaDelDia(t.id, fecha);
    const venta = ventaDia(t.id, fecha);
    return {
      tienda: t, visita: v,
      despacho: v ? v.conteos.reduce((s, c) => s + (c.dejados ?? 0), 0) : null,
      descarte: v ? v.conteos.reduce((s, c) => s + (c.descarte ?? 0), 0) : 0,
      en_tienda: v ? v.conteos.reduce((s, c) => s + c.quedaban + (c.dejados ?? 0), 0) : null,
      ventas: venta ? sumar(venta) : null,
      importe: venta ? importe(venta) : null,
    };
  });
}

export function resumenMes(fecha = hoy()) {
  const inicio = `${fecha.slice(0, 8)}01`;
  return TIENDAS.map((t) => {
    let despacho = 0, descarte = 0, unidades = 0, plata = 0;
    for (const v of visitasPorTienda().get(t.id)) if (v.fecha >= inicio && v.fecha <= fecha) for (const c of v.conteos) { despacho += c.dejados ?? 0; descarte += c.descarte ?? 0; }
    for (const [f, dia] of ventasIndice().get(t.id) ?? []) if (f >= inicio && f <= fecha) { unidades += sumar(dia); plata += importe(dia); }
    return { tienda: t, despacho, ventas: unidades, descarte, importe: plata };
  });
}

// ---------- Conciliación ----------
// Cada visita abre un tramo que cierra la visita siguiente. En ese tramo, lo vendido según
// Minis = lo que quedó en exhibición al irse el chofer − lo que encontró al volver; se compara
// con lo que reporta la cadena para esos mismos días (del sábado al lunes entra el domingo).
// Solo los productos del checklist: los demás no los cuenta el chofer.
function tramos() {
  return memo("tramos", () => {
    const lista = [];
    for (const t of TIENDAS) {
      const vs = visitasPorTienda().get(t.id);
      vs.forEach((v, i) => {
        const sig = vs[i + 1] ?? null;
        const tramo = { tienda: t.id, desde: v.fecha, hasta: sig?.fecha ?? null, minis: null, informe: {}, pendiente: false };
        const fin = sig ? sig.fecha : sumarDias(hoy(), 1);
        for (let f = v.fecha; f < fin; f = sumarDias(f, 1)) {
          const dia = ventaDia(t.id, f);
          if (!dia && f === hoy()) tramo.pendiente = true;
          for (const p of contados()) tramo.informe[p.codigo] = (tramo.informe[p.codigo] ?? 0) + (dia?.[p.codigo] ?? 0);
        }
        if (sig) {
          tramo.minis = {};
          for (const p of contados()) {
            const a = v.conteos.find((c) => c.producto === p.codigo);
            const b = sig.conteos.find((c) => c.producto === p.codigo);
            if (a && b) tramo.minis[p.codigo] = Math.max(0, a.quedaban + (a.dejados ?? 0) - (b.quedaban + (b.descarte ?? 0)));
          }
        }
        lista.push(tramo);
      });
    }
    return lista;
  });
}

// Rango [desde, hasta] de un período del selector (la semana de facturación es lunes–sábado).
export function rangoPeriodo(periodo, fecha = hoy()) {
  if (periodo === "hoy") return [fecha, fecha];
  if (periodo === "ayer") return [sumarDias(fecha, -1), sumarDias(fecha, -1)];
  if (periodo === "mes") return [sumarDias(fecha, -29), fecha];
  const lunes = sumarDias(fecha, -((diaSemana(fecha) + 6) % 7) - (periodo === "semana-1" ? 7 : 0));
  return [lunes, sumarDias(lunes, 5)];
}

// elegidas: Set de ids de tienda, o null para todas.
export function conciliacion(desde, hasta, { elegidas = null, porDia = true } = {}) {
  const dentro = tramos().filter((x) => x.desde >= desde && x.desde <= hasta && (!elegidas || elegidas.has(x.tienda)));
  const precio = (k) => producto(k).precio;
  if (!porDia) {
    return contados().map((p) => {
      const cerrados = dentro.filter((x) => x.minis);
      const minis = cerrados.reduce((s, x) => s + (x.minis[p.codigo] ?? 0), 0);
      const informe = cerrados.reduce((s, x) => s + (x.informe[p.codigo] ?? 0), 0);
      return { etiqueta: p.nombre, codigo: p.codigo, minis: cerrados.length ? minis : null, informe: cerrados.length ? informe : null, importe: informe * p.precio, estado: "ok" };
    });
  }
  const filas = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) {
    if (diaSemana(f) === 0) continue; // domingo: sin visita, su venta entra en el tramo del sábado
    const delDia = dentro.filter((x) => x.desde === f);
    const cerrados = delDia.filter((x) => x.minis);
    const minis = cerrados.reduce((s, x) => s + sumar(x.minis), 0);
    const informe = cerrados.reduce((s, x) => s + sumar(x.informe), 0);
    const plata = cerrados.reduce((s, x) => s + Object.entries(x.informe).reduce((a, [k, n]) => a + n * precio(k), 0), 0);
    let estadoFila = "ok";
    if (f > hoy()) estadoFila = "futuro";
    else if (!cerrados.length) estadoFila = delDia.some((x) => x.pendiente) ? "pendiente" : delDia.length ? "en-curso" : "sin-visita";
    else if (minis !== informe) estadoFila = "diferencia";
    filas.push({ fecha: f, minis: cerrados.length ? minis : null, informe: cerrados.length ? informe : null, importe: plata, estado: estadoFila, tiendas: cerrados.length, sabado: diaSemana(f) === 6 });
  }
  return filas;
}

// Detalle de un día: producto por producto, y en qué tiendas no cuadra.
export function detalleDia(fecha, { elegidas = null } = {}) {
  const delDia = tramos().filter((x) => x.desde === fecha && x.minis && (!elegidas || elegidas.has(x.tienda)));
  return contados().map((p) => {
    const minis = delDia.reduce((s, x) => s + (x.minis[p.codigo] ?? 0), 0);
    const informe = delDia.reduce((s, x) => s + (x.informe[p.codigo] ?? 0), 0);
    const tiendas = delDia.filter((x) => (x.minis[p.codigo] ?? 0) !== (x.informe[p.codigo] ?? 0)).map((x) => tienda(x.tienda).nombre);
    return { etiqueta: p.nombre, codigo: p.codigo, minis, informe, importe: informe * p.precio, tiendas };
  });
}

// ---------- Previsión de despacho ----------
// Promedio de las últimas semanas completas (lunes a domingo, hasta 4) del informe de la
// cadena, más un margen. Por día: la semana se reparte según el peso real de cada día; la
// venta del domingo la cubre el despacho del sábado.
export function semanasCompletas(fecha = hoy()) {
  const lunesActual = sumarDias(fecha, -((diaSemana(fecha) + 6) % 7));
  return [1, 2, 3, 4].map((n) => sumarDias(lunesActual, -7 * n)).filter((l) => l >= sumarDias(fecha, -semilla().ventas.reduce((m, v) => Math.max(m, Math.round((Date.parse(fecha) - Date.parse(v.fecha)) / 86_400_000)), 0)));
}
export function prevision({ elegidas = null, margen = 0.1, dia = null } = {}) {
  const semanas = semanasCompletas();
  const porSemana = semanas.map((lunes) => {
    const tot = {}; const porDia = [0, 0, 0, 0, 0, 0];
    for (const t of TIENDAS) {
      if (elegidas && !elegidas.has(t.id)) continue;
      for (let i = 0; i < 7; i++) {
        const v = ventaDia(t.id, sumarDias(lunes, i));
        if (!v) continue;
        for (const [k, n] of Object.entries(v)) { tot[k] = (tot[k] ?? 0) + n; porDia[Math.min(i, 5)] += n; }
      }
    }
    return { lunes, tot, porDia };
  });
  const totalDias = [0, 1, 2, 3, 4, 5].map((i) => porSemana.reduce((s, w) => s + w.porDia[i], 0));
  const sumaDias = totalDias.reduce((s, n) => s + n, 0) || 1;
  const peso = dia === null ? 1 : totalDias[dia] / sumaDias;
  const filas = PRODUCTOS.map((p) => {
    const valores = porSemana.map((w) => w.tot[p.codigo] ?? 0);
    const promedio = valores.length ? valores.reduce((s, n) => s + n, 0) / valores.length : 0;
    const ultima = valores[0] ?? 0;
    const tendencia = promedio === 0 ? "igual" : ultima > promedio * 1.05 ? "sube" : ultima < promedio * 0.95 ? "baja" : "igual";
    return { producto: p, promedio: promedio * peso, ultima: ultima * peso, tendencia, sugerido: Math.ceil(promedio * peso * (1 + margen)) };
  });
  return { semanas, filas, pesos: totalDias.map((n) => n / sumaDias) };
}

// ---------- Stock en tienda (consignación) ----------
// Stock al empezar el mes + despachos − ventas − descartes del mes; el ajuste es la
// diferencia que encuentran los choferes al contar (lo que el informe no explica).
export function stockDetalle(idTienda) {
  const t = tienda(idTienda);
  const inicio = semilla().inicioMes;
  const inicial = semilla().stockInicioMes[t.id] ?? {};
  const s = stockTienda(t.id);
  return PRODUCTOS.map((p) => {
    let despachos = 0, descartes = 0, vendidas = 0;
    for (const v of visitasPorTienda().get(t.id)) if (v.fecha >= inicio) { const c = v.conteos.find((x) => x.producto === p.codigo); if (c) { despachos += c.dejados ?? 0; descartes += c.descarte ?? 0; } }
    for (const [f, dia] of ventasIndice().get(t.id) ?? []) if (f >= inicio) vendidas += dia[p.codigo] ?? 0;
    const linea = s?.lineas.find((l) => l.codigo === p.codigo);
    const calculado = (inicial[p.codigo] ?? 0) + despachos - vendidas - descartes;
    const actual = linea?.contado ? linea.stock : null;
    return { producto: p, inicial: inicial[p.codigo] ?? 0, despachos, ventas: vendidas, descartes, ajuste: actual === null ? null : actual - calculado, actual, par: parEn(p, t), contado: !!linea?.contado };
  });
}

export { sumarDias, esDeLasPalmas };
