// Conversación con Claude a través de la función /api/ia. El historial solo crece:
// cada respuesta de Claude se guarda tal cual (sin editarla) y los resultados de las
// herramientas se agregan en un único mensaje por turno.

import { ejecutarHerramienta, etiquetaHerramienta } from "./herramientas.js";
import { hoy } from "./negocio.js";
import { pedirClave } from "./clave.js";

const MAX_PASOS = 8;
const CLAVE_ACCESO = "demo-los-pinos-clave";

function leerClave() { try { return localStorage.getItem(CLAVE_ACCESO) ?? ""; } catch { return ""; } }
function guardarClave(v) { try { localStorage.setItem(CLAVE_ACCESO, v); } catch { /* ignorar */ } }

const MAX_INTENTOS_CLAVE = 3;

async function llamarServidor(modo, mensajes, intento = 0) {
  const ahora = new Date();
  const r = await fetch("/api/ia", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-clave-demo": leerClave() },
    body: JSON.stringify({ modo, mensajes, fecha: hoy(), hora: ahora.toTimeString().slice(0, 5) }),
  });
  let cuerpo = {};
  try { cuerpo = await r.json(); } catch { /* respuesta vacía */ }
  if (r.status === 401 && cuerpo.codigo === "clave") {
    // Si ya había una clave guardada (o se acaba de escribir) y no sirvió, se avisa.
    const habiaClave = intento > 0 || leerClave() !== "";
    if (intento < MAX_INTENTOS_CLAVE) {
      const clave = await pedirClave(habiaClave ? "La clave no es correcta. Inténtelo de nuevo." : "");
      if (clave) { guardarClave(clave); return llamarServidor(modo, mensajes, intento + 1); }
    }
    throw new Error("Se necesita la clave de la demo para usar el asistente.");
  }
  if (!r.ok) throw new Error(cuerpo.error || (r.status === 429 ? "Demasiadas consultas seguidas. Espera un momento." : `Error del servidor (${r.status}).`));
  return cuerpo;
}

export class Conversacion {
  constructor(modo) {
    this.modo = modo;
    this.mensajes = [];
    this.ocupada = false;
  }

  reiniciar() { this.mensajes = []; }

  // alPaso({ tipo: "herramienta", nombre, etiqueta }) avisa a la pantalla qué se está consultando.
  async preguntar(texto, alPaso = () => {}) {
    if (this.ocupada) throw new Error("Espera a que termine la respuesta anterior.");
    this.ocupada = true;
    const respaldo = this.mensajes.length;
    this.mensajes.push({ role: "user", content: texto });
    try {
      for (let paso = 0; paso < MAX_PASOS; paso++) {
        const r = await llamarServidor(this.modo, this.mensajes);
        if (r.stop_reason === "refusal") {
          this.mensajes.length = respaldo; // se descarta el turno declinado
          return { texto: r.aviso, aviso: true };
        }
        this.mensajes.push({ role: "assistant", content: r.content });
        const usos = r.content.filter((b) => b.type === "tool_use");
        if (r.stop_reason === "tool_use" && usos.length) {
          const resultados = [];
          for (const u of usos) {
            alPaso({ tipo: "herramienta", nombre: u.name, etiqueta: etiquetaHerramienta(u.name) });
            const salida = await ejecutarHerramienta(this.modo, u.name, u.input);
            resultados.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(salida), ...(salida?.error ? { is_error: true } : {}) });
          }
          this.mensajes.push({ role: "user", content: resultados });
          continue;
        }
        if (r.stop_reason === "pause_turn") continue;
        const textoFinal = r.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        return { texto: textoFinal || "Listo." };
      }
      return { texto: "La consulta tomó demasiados pasos. Prueba con una pregunta más concreta.", aviso: true };
    } catch (e) {
      this.mensajes.length = respaldo; // el historial vuelve a como estaba
      throw e;
    } finally {
      this.ocupada = false;
    }
  }
}
