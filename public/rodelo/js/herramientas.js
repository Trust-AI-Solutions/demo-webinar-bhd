// Lo que hace cada herramienta del copiloto, en el navegador, sobre los datos ficticios.
// Las definiciones (nombre, etiqueta, descripción y parámetros) están en definiciones.js.

import * as N from "./negocio.js";
import { BLOQUES as NOMBRES } from "./definiciones.js";
import { crearEstado } from "../../comun/estado.js";

// Lo que cambia en la demo: el seguimiento de las alertas (vista o resuelta).
export const estado = crearEstado("rodelo", () => ({ alertas: {} }));

const texto = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export const alertasActuales = (d) => N.alertasConEstado(d, estado.leer().alertas);

export function crearEjecutar(obtenerDatos) {
  const EJECUTAR = {
    consultar_bloque(e) {
      const bloque = texto(e.bloque);
      if (!bloque || !Object.hasOwn(NOMBRES, bloque)) return { error: `Bloque desconocido. Use uno de: ${Object.keys(NOMBRES).join(", ")}.` };
      const d = obtenerDatos();
      if (bloque === "alertas_activas") {
        return { bloque, filas: alertasActuales(d).filter((a) => a.estado !== "resuelta").map(({ tipo, severidad, area, descripcion, entidad_referida, estado: est, fecha_hora }) => ({ tipo, titulo: N.infoTipo(tipo).titulo, severidad, area, descripcion, entidad_referida, estado: est, fecha_hora })) };
      }
      const filas = N.BLOQUES[bloque](d, { cliente: texto(e.cliente), vendedor: texto(e.vendedor), producto: texto(e.producto) });
      return { bloque, fecha_de_corte: d.hoy, filas };
    },
  };
  return (nombre, entrada) => {
    if (!Object.hasOwn(EJECUTAR, nombre)) return { error: `Herramienta desconocida: ${nombre}` };
    return EJECUTAR[nombre](entrada ?? {});
  };
}

export const HERRAMIENTAS_DISPONIBLES = ["consultar_bloque"];
