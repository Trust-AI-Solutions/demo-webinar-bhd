// Choferes por WhatsApp: a la izquierda, el teléfono del chofer hablando con el asistente
// de reparto (agente "minis-chofer"); a la derecha, su ruta de hoy y los avisos para la
// oficina, que se actualizan en el momento en que el agente cierra una visita.

import * as N from "./negocio.js";
import { Conversacion } from "../../comun/ia.js";
import { crearEjecutor } from "./herramientas.js";
import { ETIQUETAS } from "./definiciones.js";
import { escapar, textoEnriquecido } from "../../comun/formato.js";

const contexto = { chofer: 1 };
const conversacion = new Conversacion("minis-chofer", { ejecutar: crearEjecutor(contexto), etiquetas: ETIQUETAS });
let caja = null;
let montada = false;

const horaActual = () => new Date().toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
const $ = (s) => caja.querySelector(s);

// Mensajes sugeridos para el chofer elegido, con la primera tienda pendiente de su ruta.
function sugerencias() {
  const pendiente = N.TIENDAS.find((t) => t.chofer === contexto.chofer && !N.visitaDeHoy(t.id)) ?? N.TIENDAS.find((t) => t.chofer === contexto.chofer);
  const lugar = pendiente.nombre.replace(/^Caribe /, "al Caribe de ").replace(/^Del Sol /, "al Del Sol de ").replace(/^Las Palmas /, "a Las Palmas de ");
  return [
    `Buenas, llegué ${lugar}`,
    "Quedaban: vainilla 3, chocolate 2, zanahoria 1, coco 4, fresa 2, chinola no queda, guineo 3, avena 5, chispas 4, florentinas 2",
    "Lo demás está bien",
    "Mantecaditos 6 y polvorones 1",
    "Sí, ciérralo",
    "Dejé 5 de chinola, era lo que tenía en el camión",
    "La nevera del exhibidor está fallando",
  ];
}

function agregar(clase, html) {
  const el = document.createElement("div");
  el.className = `wa-msj ${clase}`;
  el.innerHTML = `${html}<span class="hora">${horaActual()}</span>`;
  $("#chat").appendChild(el);
  $("#chat").scrollTop = $("#chat").scrollHeight;
}
function paso(texto, clase = "") {
  const el = document.createElement("div");
  el.className = `wa-paso ${clase}`;
  el.textContent = texto;
  $("#chat").insertBefore(el, $("#chat .wa-escribiendo"));
  $("#chat").scrollTop = $("#chat").scrollHeight;
}

function reiniciar() {
  conversacion.reiniciar();
  const c = N.chofer(contexto.chofer);
  $("#chat").innerHTML = `<div class="wa-aviso">Demostración con datos ficticios. Usted escribe como el chofer; responde un asistente de IA.</div>`;
  agregar("bot", textoEnriquecido(`¡Buenas, ${c.nombre.split(" ")[0]}! 🚚 Soy el asistente de reparto de *Minis by Mónica*. Cuando llegues a una tienda, dime cuál es y te voy pidiendo el conteo.`));
  $("#sugerencias").innerHTML = sugerencias().map((s) => `<button type="button" title="${escapar(s)}">${escapar(s)}</button>`).join("");
}

async function enviar(texto) {
  texto = texto.trim();
  if (!texto || conversacion.ocupada) return;
  $("#mensaje").value = "";
  agregar("yo", textoEnriquecido(texto));
  const escribiendo = document.createElement("div");
  escribiendo.className = "wa-escribiendo";
  escribiendo.innerHTML = "<i></i><i></i><i></i>";
  $("#chat").appendChild(escribiendo);
  $("#chat").scrollTop = $("#chat").scrollHeight;
  $("#estado-linea").textContent = "escribiendo…";
  $("#enviar").disabled = true;
  try {
    const r = await conversacion.preguntar(texto, ({ nombre, etiqueta, salida }) => {
      if (nombre === "registrar_visita" && salida?.guardada) paso(`✔ Visita guardada en el panel · ${salida.tienda}`, "guardado");
      else if (nombre === "registrar_visita" && salida?.faltan) paso(`El panel no deja cerrar: faltan ${salida.faltan.length} productos`);
      else paso(`${etiqueta}…`);
    });
    escribiendo.remove();
    const partes = r.texto.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    for (const p of partes.length > 4 ? [partes.join("\n\n")] : partes) agregar(r.aviso ? "error" : "bot", textoEnriquecido(p));
  } catch (e) {
    escribiendo.remove();
    agregar("error", escapar(e.message));
  } finally {
    $("#estado-linea").textContent = "en línea";
    $("#enviar").disabled = false;
    $("#mensaje").focus();
  }
}

// Al restablecer la demo: conversación nueva (si el teléfono ya se mostró).
export function alRestablecer() {
  if (caja && montada) { reiniciar(); actualizarRuta(); }
}

export function actualizarRuta() {
  if (!caja || !montada) return;
  const c = N.chofer(contexto.chofer);
  const tiendas = N.TIENDAS.filter((t) => t.chofer === c.id);
  const hechas = tiendas.filter((t) => N.visitaDeHoy(t.id)).length;
  $("#ruta").innerHTML = `
    <div class="cabeza"><h3>Ruta de hoy · ${escapar(c.nombre)}</h3><span class="pill ${hechas === tiendas.length ? "pill-ok" : "pill-warn"}">${hechas} de ${tiendas.length} tiendas visitadas</span></div>
    <table class="tabla ruta-tiendas"><thead><tr><th>Tienda</th><th>Estado</th><th class="num">Unidades</th></tr></thead><tbody>
    ${tiendas.map((t) => {
      const v = N.visitaDeHoy(t.id);
      const s = N.stockTienda(t.id);
      return `<tr class="${v?.origen === "whatsapp" ? "fila-nueva" : ""}"><td>${escapar(t.nombre)}</td>
        <td>${v ? `<span class="pill pill-ok">✔ Visitada ${escapar(v.hora)}</span>${v.origen === "whatsapp" ? ' <span class="pill pill-linea">por WhatsApp</span>' : ""}` : '<span class="pill">Pendiente</span>'}</td>
        <td class="num">${s ? s.unidades : "—"}</td></tr>`;
    }).join("")}</tbody></table>`;
  const avisos = N.alertasOficina();
  $("#avisos").innerHTML = `<h3>🔔 Avisos para la oficina</h3>${avisos.length ? `<ul class="avisos">${avisos.map((a) => `<li class="${a.nueva ? "nueva" : ""}">⚠️ <span>${escapar(a.mensaje)}</span><span class="hora">${escapar(a.hora ?? "")}</span></li>`).join("")}</ul>` : '<p class="ayuda">Sin avisos.</p>'}`;
}

export function pintar(contenedor) {
  caja = contenedor;
  if (montada && caja.querySelector("#chat")) return actualizarRuta();
  caja.innerHTML = `
    <div class="en-vivo">
      <div class="telefono">
        <div class="wa">
          <div class="wa-cabecera">
            <div class="foto" aria-hidden="true">M</div>
            <div><b>Reparto Minis</b><small id="estado-linea">en línea</small></div>
            <div class="espacio"></div>
            <button type="button" id="reiniciar" title="Empezar una conversación nueva">Nueva conversación</button>
          </div>
          <div class="wa-chat" id="chat" aria-live="polite"></div>
          <div class="wa-sugerencias" id="sugerencias"></div>
          <form class="wa-entrada" id="formulario">
            <textarea id="mensaje" rows="1" placeholder="Escribe un mensaje" aria-label="Mensaje del chofer"></textarea>
            <button type="submit" id="enviar" aria-label="Enviar"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2l12.6 1.8-12.6 1.8z"/></svg></button>
          </form>
        </div>
      </div>
      <div>
        <div class="card selector-chofer">
          <label for="chofer"><b>El teléfono es de:</b></label>
          <select id="chofer">${N.CHOFERES.map((c) => `<option value="${c.id}"${c.id === contexto.chofer ? " selected" : ""}>${escapar(c.nombre)} · ${escapar(c.ruta)}</option>`).join("")}</select>
          <p class="ayuda" style="flex-basis:100%">El chofer reporta por WhatsApp lo que quedaba en cada exhibidor. El asistente no cierra la visita hasta tener todos los productos, y el panel se actualiza al instante.</p>
        </div>
        <div class="card" id="ruta"></div>
        <div class="card" id="avisos"></div>
      </div>
    </div>`;
  montada = true;
  $("#formulario").addEventListener("submit", (e) => { e.preventDefault(); enviar($("#mensaje").value); });
  $("#mensaje").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar($("#mensaje").value); } });
  $("#sugerencias").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) enviar(b.textContent); });
  $("#reiniciar").addEventListener("click", reiniciar);
  $("#chofer").addEventListener("change", (e) => { contexto.chofer = Number(e.target.value); reiniciar(); actualizarRuta(); });
  reiniciar();
  actualizarRuta();
}
