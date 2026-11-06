// Minis by Mónica: la barra lateral del panel, las cifras de arriba y la actualización en
// vivo. Cada sección vive en su módulo y se vuelve a pintar cuando cambia el estado (una
// visita que cierra el agente de choferes, ventas importadas, una ruta asignada).

import { montarCambiador } from "../../comun/cambiador.js";
import { estado, alertasOficina } from "./negocio.js";
import { aviso } from "./util.js";
import * as Hoy from "./hoy.js";
import * as Analisis from "./analisis.js";
import * as Gestion from "./gestion.js";
import * as Respaldo from "./respaldo.js";
import * as Choferes from "./choferes.js";

const $ = (s) => document.querySelector(s);
const SECCIONES = {
  hoy: Hoy.pintarHoy,
  mes: Hoy.pintarMes,
  semana: Analisis.pintarConciliacion,
  prevision: Analisis.pintarPrevision,
  stock: Analisis.pintarStock,
  choferes: Gestion.pintarChoferes,
  productos: Gestion.pintarProductos,
  tiendas: Gestion.pintarTiendas,
  datos: Respaldo.pintar,
  whatsapp: Choferes.pintar,
};
let actual = "hoy";

montarCambiador("minis", { restablecer: () => estado.restablecer() });

function mostrar(seccion, { empujar = true } = {}) {
  if (!SECCIONES[seccion]) seccion = "hoy";
  actual = seccion;
  for (const b of document.querySelectorAll("nav.secciones button")) {
    b.classList.toggle("activa", b.dataset.seccion === seccion);
    b.setAttribute("aria-current", b.dataset.seccion === seccion ? "page" : "false");
  }
  for (const id of Object.keys(SECCIONES)) $(`#sec-${id}`).classList.toggle("visible", id === seccion);
  Hoy.pintarKPIs($("#kpis"));
  SECCIONES[seccion]($(`#sec-${seccion}`));
  if (empujar && location.hash !== `#${seccion}`) history.replaceState(null, "", `#${seccion}`);
}

function pintarContador() {
  const n = alertasOficina().filter((a) => a.nueva).length;
  const c = $("#contador-avisos");
  c.hidden = n === 0;
  c.textContent = n;
}

for (const b of document.querySelectorAll("nav.secciones button")) b.addEventListener("click", () => { mostrar(b.dataset.seccion); window.scrollTo({ top: 0 }); });
window.addEventListener("hashchange", () => mostrar(location.hash.slice(1), { empujar: false }));

estado.alCambiar((ev) => {
  pintarContador();
  if (ev?.tipo === "visita") aviso(`✔ Visita cerrada por WhatsApp: ${ev.nombre}. El panel ya está al día.`);
  if (ev?.tipo === "restablecido") aviso("Demo restablecida.");
  Hoy.pintarKPIs($("#kpis"));
  // La sección del chat no se repinta entera (perdería la conversación): solo su lado derecho.
  if (actual === "whatsapp") Choferes.actualizarRuta?.();
  else SECCIONES[actual]($(`#sec-${actual}`));
  if (ev?.tipo === "restablecido") Choferes.alRestablecer();
});

pintarContador();
mostrar(location.hash.slice(1) || "hoy", { empujar: false });
