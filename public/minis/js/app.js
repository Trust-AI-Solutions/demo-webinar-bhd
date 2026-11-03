// Minis by Mónica: pestañas, avisos y actualización en vivo. Cada pestaña vive en su
// módulo (panel.js, despacho.js, choferes.js) y se vuelve a pintar cuando cambia el estado
// (una visita que cierra el agente de choferes, ventas importadas, un despacho confirmado).

import { montarCambiador } from "../../comun/cambiador.js";
import { estado, alertasOficina } from "./negocio.js";
import * as Panel from "./panel.js";
import * as Despacho from "./despacho.js";
import * as Choferes from "./choferes.js";

const $ = (s) => document.querySelector(s);
const VISTAS = { panel: Panel, despacho: Despacho, choferes: Choferes };
let actual = "panel";

montarCambiador("minis", { restablecer: () => estado.restablecer() });

let temporizador;
export function aviso(texto) {
  const t = $("#toast");
  t.textContent = texto;
  t.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => t.classList.remove("visible"), 3800);
}

function mostrar(vista, { empujar = true } = {}) {
  if (!VISTAS[vista]) vista = "panel";
  actual = vista;
  for (const b of document.querySelectorAll(".tab")) b.setAttribute("aria-selected", String(b.dataset.vista === vista));
  for (const id of Object.keys(VISTAS)) $(`#vista-${id}`).hidden = id !== vista;
  VISTAS[vista].pintar($(`#vista-${vista}`), { aviso, ir: mostrar });
  if (empujar && location.hash !== `#${vista}`) history.replaceState(null, "", `#${vista}`);
}

function pintarContador() {
  const n = alertasOficina().filter((a) => a.nueva).length;
  const c = $("#contador-avisos");
  c.hidden = n === 0;
  c.textContent = n;
}

for (const b of document.querySelectorAll(".tab")) b.addEventListener("click", () => mostrar(b.dataset.vista));
window.addEventListener("hashchange", () => mostrar(location.hash.slice(1), { empujar: false }));

estado.alCambiar((ev) => {
  pintarContador();
  if (ev?.tipo === "visita") aviso(`✔ Visita cerrada por WhatsApp: ${ev.nombre}. El panel ya está al día.`);
  if (ev?.tipo === "restablecido") aviso("Demo restablecida.");
  // La pestaña del chat no se repinta entera (perdería la conversación): actualiza su lado derecho.
  if (actual === "choferes") Choferes.actualizarRuta?.();
  else VISTAS[actual].pintar($(`#vista-${actual}`), { aviso, ir: mostrar, evento: ev });
  if (ev?.tipo === "restablecido") Choferes.alRestablecer();
});

pintarContador();
mostrar(location.hash.slice(1) || "panel", { empujar: false });
