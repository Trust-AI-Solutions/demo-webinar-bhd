// Función de Netlify que conecta la demo con Claude. La clave de Anthropic vive solo
// aquí, como variable de entorno ANTHROPIC_API_KEY en Netlify (nunca en el código ni
// en el navegador). El navegador envía la conversación; esta función agrega las
// instrucciones y las herramientas del modo pedido ("panel" o "whatsapp") y devuelve
// la respuesta de Claude. Las herramientas se ejecutan en el navegador sobre los datos
// ficticios, y su resultado vuelve aquí en el siguiente mensaje.

import Anthropic from "@anthropic-ai/sdk";
import { INSTRUCCIONES, HERRAMIENTAS } from "./config.mjs";

const MODELO_POR_DEFECTO = "claude-opus-5-5";
const MAX_MENSAJES = 90;
const MAX_BYTES = 350_000;

const env = (nombre) => globalThis.Netlify?.env.get(nombre) ?? process.env[nombre];
const json = (cuerpo, status = 200) => Response.json(cuerpo, { status });

// Valida lo que llega del navegador. Exportada para las pruebas.
export function validarSolicitud(cuerpo, texto) {
  if (!cuerpo || typeof cuerpo !== "object") return "Solicitud vacía.";
  if (!["panel", "whatsapp"].includes(cuerpo.modo)) return "Modo no válido.";
  const m = cuerpo.mensajes;
  if (!Array.isArray(m) || m.length === 0) return "Faltan los mensajes.";
  if (m.length > MAX_MENSAJES) return "La conversación es demasiado larga. Empieza una nueva.";
  if ((texto?.length ?? 0) > MAX_BYTES) return "La conversación es demasiado larga. Empieza una nueva.";
  if (m[0].role !== "user") return "La conversación debe empezar con el usuario.";
  for (const x of m) {
    if (!["user", "assistant"].includes(x?.role)) return "Rol no válido.";
    if (typeof x.content !== "string" && !Array.isArray(x.content)) return "Contenido no válido.";
  }
  if (typeof cuerpo.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(cuerpo.fecha)) return "Falta la fecha.";
  return null;
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Usa POST." }, 405);

  const claveDemo = env("CLAVE_DEMO");
  if (claveDemo && req.headers.get("x-clave-demo") !== claveDemo) {
    return json({ error: "Clave de la demo incorrecta.", codigo: "clave" }, 401);
  }
  const apiKey = env("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "Falta configurar ANTHROPIC_API_KEY en Netlify." }, 500);

  let texto, cuerpo;
  try { texto = await req.text(); cuerpo = JSON.parse(texto); } catch { return json({ error: "JSON no válido." }, 400); }
  const problema = validarSolicitud(cuerpo, texto);
  if (problema) return json({ error: problema }, 400);

  const cliente = new Anthropic({ apiKey, maxRetries: 2, timeout: 55_000 });
  const hora = typeof cuerpo.hora === "string" ? cuerpo.hora.slice(0, 5) : "";
  try {
    const respuesta = await cliente.beta.messages.create({
      model: env("MODELO_IA") || MODELO_POR_DEFECTO,
      max_tokens: 8000,
      // La parte fija de las instrucciones se guarda en caché; la fecha va aparte.
      system: [
        { type: "text", text: INSTRUCCIONES[cuerpo.modo], cache_control: { type: "ephemeral" } },
        { type: "text", text: `Fecha de hoy: ${cuerpo.fecha}${hora ? `, hora ${hora}` : ""} (hora de República Dominicana).` },
      ],
      tools: HERRAMIENTAS[cuerpo.modo],
      messages: cuerpo.mensajes,
      output_config: { effort: env("ESFUERZO_IA") || "low" },
      // Si el modelo declina una consulta, el servidor la reintenta con el modelo de respaldo recomendado.
      fallbacks: "default",
      betas: ["server-side-fallback-2026-07-01"],
    });
    if (respuesta.stop_reason === "refusal") {
      return json({ stop_reason: "refusal", content: [], aviso: "No puedo ayudar con esa consulta. Prueba con otra pregunta sobre el negocio." });
    }
    return json({ stop_reason: respuesta.stop_reason, content: respuesta.content, uso: respuesta.usage });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "Hay muchas consultas al mismo tiempo. Espera unos segundos y vuelve a intentar." }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "La clave de Anthropic configurada en Netlify no es válida." }, 500);
    if (e instanceof Anthropic.BadRequestError) { console.error(e); return json({ error: "La consulta no se pudo procesar. Empieza una conversación nueva." }, 400); }
    if (e instanceof Anthropic.APIConnectionError) return json({ error: "No hubo conexión con el servicio de IA. Vuelve a intentar." }, 502);
    console.error(e);
    return json({ error: "El servicio de IA no respondió. Vuelve a intentar." }, 502);
  }
};

export const config = {
  path: "/api/ia",
  method: "POST",
  // Freno por visitante para que nadie gaste la clave con consultas en serie.
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
