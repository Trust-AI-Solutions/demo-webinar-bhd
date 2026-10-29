// Asistente de WhatsApp de la ferretería (vista de cliente).

import { Conversacion } from "./ia.js";
import { ICONOS } from "./iconos.js";
import { escapar, textoEnriquecido } from "./formato.js";
import { alCambiar } from "./estado.js";

const $ = (s) => document.querySelector(s);
const conversacion = new Conversacion("whatsapp");
const SALUDO = "¡Hola! 👋 Gracias por escribir a *Ferretería Los Pinos*. Soy el asistente virtual: le ayudo con precios, disponibilidad, cotizaciones y pedidos. ¿Qué necesita hoy?";
const SUGERENCIAS = [
  "¿Tienen cemento gris? ¿A cómo está?",
  "Cotízame 20 varillas de 3/8 y 10 sacos de cemento",
  "¿Hacen envío a Villa Mella?",
  "Quiero hacer un pedido",
  "¿Me pueden hacer un descuento?",
  "¿A qué hora abren el domingo?",
];

const horaActual = () => new Date().toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });

function agregar(clase, html) {
  const el = document.createElement("div");
  el.className = `wa-msj ${clase}`;
  el.innerHTML = `${html}<span class="hora">${horaActual()}</span>`;
  $("#chat").appendChild(el);
  $("#chat").scrollTop = $("#chat").scrollHeight;
}

function reiniciar() {
  conversacion.reiniciar();
  $("#chat").innerHTML = `<div class="wa-aviso">Demostración con una empresa y datos ficticios. Las respuestas las da un asistente de IA.</div>`;
  agregar("tienda", textoEnriquecido(SALUDO));
  $("#sugerencias").innerHTML = SUGERENCIAS.map((s) => `<button type="button">${escapar(s)}</button>`).join("");
}

async function enviar(texto) {
  texto = texto.trim();
  if (!texto || conversacion.ocupada) return;
  $("#mensaje").value = "";
  ajustarAltura();
  agregar("cliente", textoEnriquecido(texto));
  const escribiendo = document.createElement("div");
  escribiendo.className = "wa-escribiendo";
  escribiendo.innerHTML = "<i></i><i></i><i></i>";
  $("#chat").appendChild(escribiendo);
  $("#chat").scrollTop = $("#chat").scrollHeight;
  $("#estado-linea").textContent = "escribiendo…";
  $("#enviar").disabled = true;
  try {
    const r = await conversacion.preguntar(texto);
    escribiendo.remove();
    // Un párrafo largo se ve mejor en varios mensajes, como en WhatsApp real.
    const partes = r.texto.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const grupos = partes.length > 4 ? [partes.join("\n\n")] : partes;
    for (const p of grupos) agregar(r.aviso ? "error" : "tienda", textoEnriquecido(p));
  } catch (e) {
    escribiendo.remove();
    agregar("error", escapar(e.message));
  } finally {
    $("#estado-linea").textContent = "en línea";
    $("#enviar").disabled = false;
    $("#mensaje").focus();
  }
}

function ajustarAltura() {
  const t = $("#mensaje");
  t.style.height = "auto";
  t.style.height = `${Math.min(120, t.scrollHeight)}px`;
}

document.querySelectorAll("[data-icono]").forEach((el) => { el.innerHTML = ICONOS[el.dataset.icono] ?? ""; });
if (new URLSearchParams(location.search).has("incrustado")) $("#pagina").classList.add("incrustado");
$("#formulario").addEventListener("submit", (e) => { e.preventDefault(); enviar($("#mensaje").value); });
$("#mensaje").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar($("#mensaje").value); } });
$("#mensaje").addEventListener("input", ajustarAltura);
$("#sugerencias").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) enviar(b.textContent); });
$("#reiniciar").addEventListener("click", reiniciar);
alCambiar((ev) => { if (ev.tipo === "restablecido") reiniciar(); });
reiniciar();
