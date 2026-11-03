// Datos FICTICIOS de Minis by Mónica para la demo: productos, choferes y tiendas en
// consignación (cadenas inventadas), con el historial de visitas y ventas de los últimos
// días. Se generan con una semilla fija y siempre anclados a "hoy", así la demo se ve
// igual cualquier día. Los precios, las tiendas y las personas no son los reales.
//
// Situaciones sembradas (para que se vean en el panel y las encuentre el despacho):
// 1. Del Sol Moca no tiene conteo desde hace 6 días (pastilla ámbar).
// 2. Del Sol Baní abrió esta semana y todavía no tiene su primer conteo (pastilla roja).
// 3. Caribe Naco quedó hoy con 1 cheesecake bite de chinola (par 6) y Caribe 27 de Febrero
//    con 2 mantecaditos (par 15): por debajo de la mitad del par (filas ámbar).
// 4. Las 8 tiendas de Hiper Las Palmas no tienen las ventas de hoy: llegan en el reporte
//    PDF de la cadena (public/minis/ejemplos/reporte-ventas-las-palmas.pdf).

export const PRODUCTOS = [
  // codigo, nombre, precio RD$ (por unidad, a la tienda), nivel par, ¿lo cuenta el chofer?, código en Hiper Las Palmas
  { codigo: "P01", nombre: "Bizcocho de vainilla", precio: 145, par: 10, conteo: true, codigoLP: "LP-40211" },
  { codigo: "P02", nombre: "Bizcocho de chocolate", precio: 145, par: 10, conteo: true, codigoLP: "LP-40212" },
  { codigo: "P03", nombre: "Bizcocho de zanahoria", precio: 155, par: 8, conteo: true, codigoLP: "LP-40213" },
  { codigo: "P04", nombre: "Coco horneado", precio: 125, par: 12, conteo: true, codigoLP: "LP-40220" },
  { codigo: "P05", nombre: "Cheesecake bites de fresa", precio: 195, par: 6, conteo: true, codigoLP: "LP-40231" },
  { codigo: "P06", nombre: "Cheesecake bites de chinola", precio: 195, par: 6, conteo: true, codigoLP: "LP-40232" },
  { codigo: "P07", nombre: "Pan de guineo", precio: 160, par: 8, conteo: true, codigoLP: "LP-40240" },
  { codigo: "P08", nombre: "Galletas de avena", precio: 110, par: 12, conteo: true, codigoLP: "LP-40251" },
  { codigo: "P09", nombre: "Galletas con chispas", precio: 110, par: 12, conteo: true, codigoLP: "LP-40252" },
  { codigo: "P10", nombre: "Florentinas", precio: 135, par: 8, conteo: true, codigoLP: "LP-40260" },
  { codigo: "P11", nombre: "Mantecaditos", precio: 95, par: 15, conteo: true, codigoLP: "LP-40271" },
  { codigo: "P12", nombre: "Polvorones", precio: 95, par: 15, conteo: true, codigoLP: "LP-40272" },
  { codigo: "P13", nombre: "Polvorones de guayaba", precio: 105, par: 10, conteo: false, codigoLP: "LP-40273" },
  { codigo: "P14", nombre: "Galletas de jengibre", precio: 115, par: 8, conteo: false, codigoLP: "LP-40253" },
];

export const CHOFERES = [
  { id: 1, nombre: "Ramón Peña", ruta: "Ruta 1 · Distrito Nacional" },
  { id: 2, nombre: "Julio Batista", ruta: "Ruta 2 · Santo Domingo Este y Norte" },
  { id: 3, nombre: "Francisco Almonte", ruta: "Ruta 3 · Santiago y Cibao" },
  { id: 4, nombre: "Danilo Reyes", ruta: "Ruta 4 · Este y Sur" },
];

// Cadenas ficticias: Supermercados Caribe, Mercado Del Sol e Hiper Las Palmas.
// factor: tiendas grandes llevan más (el par de cada producto se multiplica).
// enReporte: cómo aparece la tienda en el reporte de ventas de su cadena.
export const TIENDAS = [
  { id: 1, nombre: "Caribe Núñez de Cáceres", chofer: 1, factor: 1.25 },
  { id: 2, nombre: "Caribe 27 de Febrero", chofer: 1, factor: 1 },
  { id: 3, nombre: "Del Sol Bella Vista", chofer: 1, factor: 1 },
  { id: 4, nombre: "Del Sol Piantini", chofer: 1, factor: 1.25 },
  { id: 5, nombre: "Las Palmas Luperón", chofer: 1, factor: 1, enReporte: "HLP-03 LUPERON" },
  { id: 6, nombre: "Caribe Naco", chofer: 1, factor: 1 },
  { id: 7, nombre: "Del Sol Arroyo Hondo", chofer: 1, factor: 1 },
  { id: 8, nombre: "Caribe Megacentro", chofer: 2, factor: 1.25 },
  { id: 9, nombre: "Del Sol Venezuela", chofer: 2, factor: 1 },
  { id: 10, nombre: "Las Palmas San Isidro", chofer: 2, factor: 1, enReporte: "HLP-07 SAN ISIDRO" },
  { id: 11, nombre: "Caribe Villa Mella", chofer: 2, factor: 1 },
  { id: 12, nombre: "Del Sol Charles de Gaulle", chofer: 2, factor: 1 },
  { id: 13, nombre: "Las Palmas Los Mina", chofer: 2, factor: 0.75, enReporte: "HLP-08 LOS MINA" },
  { id: 14, nombre: "Caribe Sabana Perdida", chofer: 2, factor: 0.75 },
  { id: 15, nombre: "Caribe Santiago Centro", chofer: 3, factor: 1.25 },
  { id: 16, nombre: "Del Sol Los Jardines", chofer: 3, factor: 1 },
  { id: 17, nombre: "Las Palmas Estrella Sadhalá", chofer: 3, factor: 1, enReporte: "HLP-11 STGO SADHALA" },
  { id: 18, nombre: "Caribe La Vega", chofer: 3, factor: 1 },
  { id: 19, nombre: "Del Sol Moca", chofer: 3, factor: 0.75 },
  { id: 20, nombre: "Caribe San Francisco", chofer: 3, factor: 0.75 },
  { id: 21, nombre: "Las Palmas Puerto Plata", chofer: 3, factor: 1, enReporte: "HLP-14 PUERTO PLATA" },
  { id: 22, nombre: "Caribe La Romana", chofer: 4, factor: 1 },
  { id: 23, nombre: "Del Sol Bávaro", chofer: 4, factor: 1.25 },
  { id: 24, nombre: "Las Palmas Higüey", chofer: 4, factor: 1, enReporte: "HLP-16 HIGUEY" },
  { id: 25, nombre: "Caribe San Pedro", chofer: 4, factor: 1 },
  { id: 26, nombre: "Del Sol Baní", chofer: 4, factor: 0.75 },
  { id: 27, nombre: "Las Palmas San Cristóbal", chofer: 4, factor: 1, enReporte: "HLP-18 SAN CRISTOBAL" },
  { id: 28, nombre: "Las Palmas Boca Chica", chofer: 4, factor: 0.75, enReporte: "HLP-19 BOCA CHICA" },
];

export const CADENA_REPORTE = "Hiper Las Palmas";
export const esDeLasPalmas = (t) => t.nombre.startsWith("Las Palmas");

// Nivel par de un producto en una tienda.
export const parEn = (p, t) => Math.max(2, Math.round(p.par * t.factor));

// Generador pseudoaleatorio con semilla (mulberry32): mismos datos en cada carga.
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

export function sumarDias(iso, n) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + n));
  return f.toISOString().slice(0, 10);
}

// Hace cuántos días fue la última visita de cada tienda (0 = hoy), y a qué hora.
// null = todavía sin conteo. Rutas 1 y 2 ya pasaron por varias tiendas esta mañana.
const ULTIMA_VISITA = {
  1: [0, "07:12"], 2: [0, "07:48"], 3: [0, "08:25"], 4: [1, "09:10"], 5: [2, "08:40"], 6: [0, "09:02"], 7: [1, "10:15"],
  8: [0, "07:30"], 9: [0, "08:05"], 10: [1, "08:50"], 11: [0, "08:44"], 12: [2, "09:30"], 13: [1, "10:05"], 14: [3, "11:20"],
  15: [1, "07:40"], 16: [1, "08:30"], 17: [2, "09:15"], 18: [2, "10:40"], 19: [6, "11:05"], 20: [3, "12:10"], 21: [1, "13:00"],
  22: [1, "07:55"], 23: [2, "09:35"], 24: [1, "11:10"], 25: [3, "12:30"], 26: null, 27: [2, "14:05"], 28: [1, "15:20"],
};

export function generarDatos(hoy) {
  const r = azar(20261110);
  const contados = PRODUCTOS.filter((p) => p.conteo);

  // Ventas por tienda y producto de los últimos 7 días (hoy incluido, salvo Las Palmas,
  // cuyo reporte de hoy todavía no ha llegado).
  const ventas = [];
  for (let dias = 7; dias >= 0; dias--) {
    const fecha = sumarDias(hoy, -dias);
    for (const t of TIENDAS) {
      if (t.id === 26 && dias > 4) continue; // Del Sol Baní abrió hace 4 días
      if (dias === 0 && esDeLasPalmas(t)) continue;
      for (const p of PRODUCTOS) {
        if (dias === 0 && ((t.id === 6 && p.codigo === "P06") || (t.id === 2 && p.codigo === "P11"))) continue; // lo sembrado: ya no quedaba casi nada
        const media = parEn(p, t) * 0.22;
        const cantidad = Math.max(0, Math.round(media * (0.4 + r() * 1.2) - 0.3));
        if (cantidad > 0) ventas.push({ fecha, tienda: t.id, producto: p.codigo, cantidad });
      }
    }
  }

  // Última visita de cada tienda: lo que QUEDABA antes de reponer, y lo que dejó el chofer
  // (repone hasta el par, salvo que falte mercancía en el camión).
  const visitas = [];
  for (const t of TIENDAS) {
    const v = ULTIMA_VISITA[t.id];
    if (!v) continue;
    const [dias, hora] = v;
    const conteos = contados.map((p) => {
      const par = parEn(p, t);
      let quedaban = Math.max(0, Math.round(par * (0.15 + r() * 0.55)));
      let dejados = par - quedaban;
      if (t.id === 6 && p.codigo === "P06") { quedaban = 1; dejados = 0; }  // no había chinola en el camión
      if (t.id === 2 && p.codigo === "P11") { quedaban = 2; dejados = 0; }  // se acabaron los mantecaditos en ruta
      return { producto: p.codigo, quedaban, dejados };
    });
    visitas.push({
      id: `V-${t.id}-${dias}`, fecha: sumarDias(hoy, -dias), hora, tienda: t.id, chofer: t.chofer, conteos,
      notas: t.id === 6 ? "No había cheesecake de chinola en el camión." : t.id === 2 ? "Se acabaron los mantecaditos antes de llegar." : "",
      origen: "app",
    });
  }

  return { hoy, ventas, visitas };
}
