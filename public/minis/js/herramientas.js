// Lo que hace cada herramienta del agente de choferes, en el navegador, sobre los datos
// ficticios. Las definiciones están en definiciones.js. El agente lector del reporte no
// ejecuta herramientas: entrega su transcripción con proponer_ventas y la pantalla la
// cuadra con el catálogo (mapearReporte).

import * as N from "./negocio.js";

const entero = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : undefined);

// contexto: { chofer } con el chofer que tiene el teléfono en la demo.
export function crearEjecutor(contexto) {
  const CHOFER = {
    buscar_tienda: ({ texto }) => {
      const lista = N.buscarTiendas(texto, { chofer: contexto.chofer });
      return {
        tiendas: lista.map((t) => ({ id: t.id, nombre: t.nombre, ruta: N.chofer(t.chofer).ruta, visitada_hoy: !!N.visitaDeHoy(t.id) })),
        nota: lista.length === 0 ? "No hay ninguna tienda con ese nombre. Pide al chofer el nombre del supermercado y el sector." : lista.length > 1 ? "Hay varias: pregunta cuál es." : undefined,
      };
    },
    ver_productos_de_conteo: ({ tienda_id }) => {
      const t = N.tienda(entero(tienda_id));
      if (!t) return { error: "No existe esa tienda." };
      return { tienda: t.nombre, productos: N.contados().map((p) => ({ codigo: p.codigo, nombre: p.nombre, par: N.parEn(p, t) })) };
    },
    registrar_visita: ({ tienda_id, conteos, notas }) => N.registrarVisita({
      tienda: entero(tienda_id),
      conteos: (Array.isArray(conteos) ? conteos : []).map((c) => ({ producto: c?.codigo, quedaban: c?.quedaban, dejados: c?.dejados })),
      notas,
      chofer: contexto.chofer,
    }),
  };
  return (nombre, entrada) => {
    const f = CHOFER[nombre];
    if (!f) return { error: `Herramienta desconocida: ${nombre}` };
    return f(entrada ?? {});
  };
}

// Nombres de las funciones (la prueba revisa que coincidan con las definiciones).
export const HERRAMIENTAS_CHOFER = ["buscar_tienda", "ver_productos_de_conteo", "registrar_visita"];

// Cuadra la transcripción del reporte con las tiendas y el catálogo. Nada se adivina:
// lo que no coincide queda marcado para que la persona lo revise.
export function mapearReporte(propuesta) {
  const lineas = (propuesta?.lineas ?? []).map((l) => {
    const t = N.tiendaDesdeReporte(l.tienda);
    const p = N.buscarProducto(l.producto, l.codigo_cadena);
    return { original: l, tienda: t, producto: p, unidades: Math.max(0, entero(l.unidades) ?? 0) };
  });
  return {
    cadena: propuesta?.cadena ?? null,
    fecha: propuesta?.fecha_reporte ?? null,
    lineas,
    sinTienda: lineas.filter((l) => !l.tienda).length,
    sinProducto: lineas.filter((l) => !l.producto).length,
    tiendas: new Set(lineas.filter((l) => l.tienda).map((l) => l.tienda.id)).size,
    dudas: Array.isArray(propuesta?.dudas) ? propuesta.dudas : [],
  };
}

// Contexto que acompaña al PDF: las tiendas y productos de la cadena (para que la IA sepa
// qué esperar), sin pedirle que los cambie.
export function contextoReporte() {
  return [
    `Proveedor: Minis by Mónica (postres en consignación).`,
    `Tiendas de ${N.CADENA_REPORTE} con productos de Minis: ${N.TIENDAS.filter(N.esDeLasPalmas).map((t) => `${t.enReporte} (${t.nombre})`).join("; ")}.`,
    `Productos de Minis: ${N.PRODUCTOS.map((p) => `${p.codigoLP} ${p.nombre}`).join("; ")}.`,
  ].join("\n");
}
