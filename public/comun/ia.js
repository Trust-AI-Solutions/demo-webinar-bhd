// Conversación con Claude a través de la función /api/ia, para cualquier agente de las
// tres soluciones. El historial solo crece: cada respuesta de Claude se guarda tal cual
// y los resultados de las herramientas se agregan en un único mensaje por turno.
// Las herramientas se ejecutan en el navegador sobre los datos ficticios: cada agente
// pasa su función `ejecutar(nombre, entrada)` y su lista de etiquetas.

import { pedirClave } from "./clave.js";

const MAX_PASOS = 8;
const CLAVE_ACCESO = "demo-ia-pymes-clave";
const MAX_INTENTOS_CLAVE = 3;

function leerClave() { try { return localStorage.getItem(CLAVE_ACCESO) ?? ""; } catch { return ""; } }
function guardarClave(v) { try { localStorage.setItem(CLAVE_ACCESO, v); } catch { /* ignorar */ } }

// Fecha local de hoy en AAAA-MM-DD (los datos ficticios están anclados a hoy).
export function hoyISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function llamarServidor(modo, mensajes, intento = 0) {
  const ahora = new Date();
  const r = await fetch("/api/ia", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-clave-demo": leerClave() },
    body: JSON.stringify({ modo, mensajes, fecha: hoyISO(ahora), hora: ahora.toTimeString().slice(0, 5) }),
  });
  let cuerpo = {};
  try { cuerpo = await r.json(); } catch { /* respuesta vacía */ }
  if (r.status === 401 && cuerpo.codigo === "clave") {
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
  // modo: el agente en el servidor (por ejemplo "rodelo-copiloto").
  // ejecutar(nombre, entrada) -> resultado (objeto); etiquetas: { nombre: "Revisando..." }.
  constructor(modo, { ejecutar, etiquetas = {} }) {
    this.modo = modo;
    this.ejecutar = ejecutar;
    this.etiquetas = etiquetas;
    this.mensajes = [];
    this.ocupada = false;
  }

  reiniciar() { this.mensajes = []; }

  // alPaso({ nombre, etiqueta, entrada, salida }) avisa a la pantalla de cada herramienta usada.
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
            let salida;
            try { salida = await this.ejecutar(u.name, u.input ?? {}); } catch (e) { salida = { error: e.message }; }
            alPaso({ nombre: u.name, etiqueta: this.etiquetas[u.name] ?? "Consultando", entrada: u.input, salida });
            resultados.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(salida ?? {}), ...(salida?.error ? { is_error: true } : {}) });
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

// Lee un PDF, una foto o un texto pegado en una sola consulta (agentes "lectores").
// archivo: { tipo: "document" | "image", media_type, datos (base64), nombre } o null.
// texto: el mensaje pegado (si no hay archivo). contexto: catálogo, tiendas, etc. en texto.
// herramienta: el nombre de la herramienta con la que el agente entrega el resultado.
// Devuelve la entrada de esa herramienta; nada se aplica hasta que una persona lo apruebe.
export async function leerDocumento(modo, { archivo = null, texto = "", contexto = "", herramienta }) {
  const partes = [];
  if (archivo) partes.push({ type: archivo.tipo, source: { type: "base64", media_type: archivo.media_type, data: archivo.datos } });
  const encabezado = archivo ? `Archivo recibido: ${archivo.nombre}` : `Mensaje recibido:\n"""\n${texto}\n"""`;
  partes.push({ type: "text", text: `${encabezado}\n\n${contexto}\n\nEntrega el resultado con ${herramienta}.` });
  const r = await llamarServidor(modo, [{ role: "user", content: partes }]);
  if (r.stop_reason === "refusal") throw new Error(r.aviso || "No se pudo leer este documento.");
  if (r.stop_reason === "max_tokens") throw new Error("El documento es demasiado largo para leerlo de una vez. Pruebe con menos páginas.");
  const uso = r.content?.find((b) => b.type === "tool_use" && b.name === herramienta);
  if (!uso) throw new Error("No se pudo leer el documento. Pruebe de nuevo o con una foto más nítida.");
  return uso.input;
}

// Convierte un File (PDF o foto) al formato de leerDocumento. Las fotos se reducen a
// 1600 px para que viajen livianas; los PDF pasan tal cual (hasta 4 MB).
export async function prepararArchivo(file) {
  if (file.type === "application/pdf") {
    if (file.size > 4 * 1024 * 1024) throw new Error("El PDF pesa más de 4 MB.");
    return { tipo: "document", media_type: "application/pdf", datos: await aBase64(file), nombre: file.name };
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Solo se aceptan PDF o fotos (JPG, PNG o WebP).");
  const img = await createImageBitmap(file);
  const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(img.width * escala);
  lienzo.height = Math.round(img.height * escala);
  lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
  const blob = await new Promise((r) => lienzo.toBlob(r, "image/jpeg", 0.86));
  return { tipo: "image", media_type: "image/jpeg", datos: await aBase64(blob), nombre: file.name };
}

async function aBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario);
}

// Para los ejemplos de la demo: descarga un archivo de public/ y lo prepara igual que uno subido.
export async function archivoDeEjemplo(ruta, nombre) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error("No se encontró el ejemplo.");
  const blob = await r.blob();
  return prepararArchivo(new File([blob], nombre ?? ruta.split("/").pop(), { type: blob.type }));
}
