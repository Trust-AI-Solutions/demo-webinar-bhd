// Datos FICTICIOS de Minis by Mónica para la demo: productos, choferes y tiendas en
// consignación (cadenas inventadas), con seis semanas de historia: las visitas de los
// choferes (lo que encontraron en exhibición, lo que retiraron y lo que repusieron) y el
// informe de ventas de la cadena. Se generan con una semilla fija y siempre anclados a
// "hoy", así la demo se ve igual cualquier día. Precios, tiendas y personas no son reales.
//
// Situaciones sembradas (para que se vean en el panel y las encuentre el despacho):
// 1. Del Sol Moca no tiene conteo desde hace 6 días (pastilla ámbar).
// 2. Del Sol Baní abrió esta semana y todavía no tiene su primer conteo (pastilla roja).
// 3. Caribe Naco quedó hoy con 1 cheesecake bite de chinola (par 6) y Caribe 27 de Febrero
//    con 2 mantecaditos (par 15): por debajo de la mitad del par (filas ámbar).
// 4. Las 8 tiendas de Hiper Las Palmas no tienen las ventas de hoy: llegan en el reporte
//    PDF de la cadena (public/minis/ejemplos/reporte-ventas-las-palmas.pdf).
// 5. El informe de la cadena trae dos errores en días recientes (Caribe Núñez de Cáceres y
//    Caribe Santiago Centro): la conciliación los marca como diferencia.

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
  { id: 1, nombre: "Ramón Peña", ruta: "Ruta 1 · Distrito Nacional", telefono: "+1 809 555 0141" },
  { id: 2, nombre: "Julio Batista", ruta: "Ruta 2 · Santo Domingo Este y Norte", telefono: "+1 809 555 0162" },
  { id: 3, nombre: "Francisco Almonte", ruta: "Ruta 3 · Santiago y Cibao", telefono: "+1 829 555 0118" },
  { id: 4, nombre: "Danilo Reyes", ruta: "Ruta 4 · Este y Sur", telefono: "+1 849 555 0175" },
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

// Días de historia que se generan (seis semanas: alcanza para el mes y para la previsión).
export const DIAS_HISTORIA = 42;
export const diaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay(); // 0 = domingo

// Última visita de cada tienda: hace cuántos días (0 = hoy) y a qué hora. null = nunca.
// Hasta ese día el chofer pasó de lunes a sábado; después, la tienda quedó sin visita.
// Las rutas 1 y 2 ya pasaron por varias tiendas esta mañana.
const ULTIMA_VISITA = {
  1: [0, "07:12"], 2: [0, "07:48"], 3: [0, "08:25"], 4: [1, "09:10"], 5: [2, "08:40"], 6: [0, "09:02"], 7: [1, "10:15"],
  8: [0, "07:30"], 9: [0, "08:05"], 10: [1, "08:50"], 11: [0, "08:44"], 12: [2, "09:30"], 13: [1, "10:05"], 14: [3, "11:20"],
  15: [1, "07:40"], 16: [1, "08:30"], 17: [2, "09:15"], 18: [2, "10:40"], 19: [6, "11:05"], 20: [3, "12:10"], 21: [1, "13:00"],
  22: [1, "07:55"], 23: [2, "09:35"], 24: [1, "11:10"], 25: [3, "12:30"], 26: null, 27: [2, "14:05"], 28: [1, "15:20"],
};
const ABRIO_HACE = { 26: 4 }; // Del Sol Baní abrió hace 4 días
// Productos que vienen subiendo o bajando (cambio de la venta por día), para la previsión.
const TENDENCIA = { P05: 0.009, P09: 0.007, P10: -0.008, P12: -0.006 };

// Hora de la visita de un día anterior: la de la última, corrida unos minutos.
const horaDe = (hora, desfase) => {
  const [h, m] = hora.split(":").map(Number);
  const t = Math.min(17 * 60, Math.max(7 * 60, h * 60 + m + desfase));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

// Simula cada tienda día por día: por la mañana pasa el chofer (cuenta lo que encuentra,
// retira lo vencido o averiado y repone hasta el nivel par) y durante el día la tienda vende.
// Lo que el chofer cuenta y lo que la cadena reporta cuadran, salvo los errores sembrados.
export function generarDatos(hoy) {
  const r = azar(20261110);
  const ventas = [];
  const visitas = [];
  const inicioMes = `${hoy.slice(0, 8)}01`;
  const stockInicioMes = {}; // tienda -> producto -> unidades al empezar el mes (antes de la visita)

  for (const t of TIENDAS) {
    const ultima = ULTIMA_VISITA[t.id];
    const abrio = ABRIO_HACE[t.id] ?? DIAS_HISTORIA;
    const stock = Object.fromEntries(PRODUCTOS.map((p) => [p.codigo, Math.round(parEn(p, t) * (abrio < DIAS_HISTORIA ? 1 : 0.7))]));
    stockInicioMes[t.id] = {};
    for (let dias = abrio; dias >= 0; dias--) {
      const fecha = sumarDias(hoy, -dias);
      if (fecha === inicioMes || (dias === abrio && fecha > inicioMes)) stockInicioMes[t.id] = { ...stock };
      const visita = ultima && dias >= ultima[0] && (dias === ultima[0] || diaSemana(fecha) !== 0);
      if (visita) {
        const conteos = [];
        for (const p of PRODUCTOS) {
          const par = parEn(p, t);
          if (!p.conteo) { stock[p.codigo] = par; continue; } // lo repone sin contarlo
          const encontrado = stock[p.codigo];
          let descarte = r() < 0.035 ? Math.min(encontrado, 1 + Math.floor(r() * 2)) : 0;
          let quedaban = encontrado - descarte;
          let dejados = Math.max(0, par - quedaban);
          const forzado = dias === 0 && ((t.id === 6 && p.codigo === "P06" && 1) || (t.id === 2 && p.codigo === "P11" && 2));
          if (forzado !== false && forzado !== 0) {
            // No había en el camión: queda lo poco que había. Para que cuadre con la cadena, la
            // tienda vendió ayer lo que faltaba.
            const extra = encontrado - forzado;
            if (extra > 0) {
              const ayer = sumarDias(hoy, -1);
              const v = ventas.find((x) => x.tienda === t.id && x.producto === p.codigo && x.fecha === ayer);
              if (v) v.cantidad += extra; else ventas.push({ fecha: ayer, tienda: t.id, producto: p.codigo, cantidad: extra });
            }
            quedaban = forzado; descarte = 0; dejados = 0;
          }
          stock[p.codigo] = quedaban + dejados;
          conteos.push({ producto: p.codigo, quedaban, dejados, descarte });
        }
        visitas.push({
          id: `V-${t.id}-${dias}`, fecha, hora: dias === ultima[0] ? ultima[1] : horaDe(ultima[1], ((dias * 7) % 25) - 12), tienda: t.id, chofer: t.chofer, conteos,
          notas: dias === 0 && t.id === 6 ? "No había cheesecake de chinola en el camión." : dias === 0 && t.id === 2 ? "Se acabaron los mantecaditos antes de llegar." : "",
          origen: "app",
        });
      }
      // Lo que vende la tienda ese día (el domingo, un poco menos).
      for (const p of PRODUCTOS) {
        if (dias === 0 && ((t.id === 6 && p.codigo === "P06") || (t.id === 2 && p.codigo === "P11"))) continue;
        const media = parEn(p, t) * 0.22 * (diaSemana(fecha) === 0 ? 0.8 : 1) * (1 - (TENDENCIA[p.codigo] ?? 0) * dias);
        const cantidad = Math.min(stock[p.codigo], Math.max(0, Math.round(media * (0.4 + r() * 1.2) - 0.3)));
        if (!cantidad) continue;
        stock[p.codigo] -= cantidad;
        // Las ventas de hoy de Hiper Las Palmas todavía no han llegado (vienen en el PDF).
        if (!(dias === 0 && esDeLasPalmas(t))) ventas.push({ fecha, tienda: t.id, producto: p.codigo, cantidad });
      }
    }
  }

  // Errores del informe de la cadena: unidades de más o de menos en días recientes.
  const habiles = [];
  for (let d = 1; habiles.length < 9; d++) if (diaSemana(sumarDias(hoy, -d)) !== 0) habiles.push(sumarDias(hoy, -d));
  for (const [idTienda, producto, fecha, cambio] of [[1, "P01", habiles[1], +2], [15, "P08", habiles[7], -1]]) {
    const v = ventas.find((x) => x.tienda === idTienda && x.producto === producto && x.fecha === fecha);
    if (v) v.cantidad = Math.max(0, v.cantidad + cambio);
    else if (cambio > 0) ventas.push({ fecha, tienda: idTienda, producto, cantidad: cambio });
  }

  return { hoy, inicioMes, ventas, visitas, stockInicioMes };
}
