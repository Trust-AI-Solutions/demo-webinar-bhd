// Utilidades de las pantallas del panel: formato dominicano de números (miles con punto,
// decimales con coma, como lo pidieron en el piloto), fechas, exportar tablas, el selector
// de varias tiendas y el aviso flotante.

import * as N from "./negocio.js";
import { escapar } from "../../comun/formato.js";

export { escapar };
export const ent = (n) => (n === null || n === undefined ? "—" : Math.round(n).toLocaleString("de-DE"));
export const rd = (n) => (n ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (iso, opciones) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-DO", opciones);
export const fechaCorta = (iso) => fecha(iso, { weekday: "short", day: "2-digit", month: "short" });
export const fechaMedia = (iso) => fecha(iso, { weekday: "long", day: "numeric", month: "long" });
export const fechaLarga = (iso) => fecha(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const rangoTexto = (desde, hasta) => (desde === hasta ? fechaMedia(desde) : `${fechaCorta(desde)} → ${fechaCorta(hasta)}`);
export const iniciales = (nombre) => nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// ---------- Aviso flotante ----------
let temporizador;
export function aviso(texto) {
  const t = document.getElementById("minisToast");
  t.innerHTML = `<span>${escapar(texto)}</span>`;
  t.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => t.classList.remove("visible"), 4200);
}

// ---------- Exportar una tabla (CSV que abre Excel) ----------
export function exportarTabla(tabla, nombre) {
  const filas = [...tabla.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => `"${c.innerText.replace(/\s+/g, " ").trim().replace(/"/g, '""')}"`).join(";"));
  descargar(`${nombre}_${N.hoy()}.csv`, "﻿" + filas.join("\r\n"), "text/csv;charset=utf-8");
}
export function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Botones con data-exportar="idTabla" data-nombre="archivo" dentro de una caja.
export function conectarExportes(caja) {
  caja.querySelectorAll("[data-exportar]").forEach((b) => b.addEventListener("click", () => {
    const tabla = caja.querySelector(`#${b.dataset.exportar}`);
    if (tabla) { exportarTabla(tabla, b.dataset.nombre); aviso("Tabla descargada para abrir en Excel."); }
  }));
}

// ---------- Selector de varias tiendas ----------
// Elegir un grupo (por ejemplo, las 7 de una ruta), no solo una o todas. La selección se
// recuerda por selector aunque la pantalla se vuelva a pintar. null = todas.
const selecciones = new Map();
export const elegidas = (id) => selecciones.get(id) ?? null;

export function selectorTiendas(id) {
  const sel = elegidas(id);
  const n = sel ? sel.size : N.TIENDAS.length;
  const rotulo = n === N.TIENDAS.length ? "🏬 Todas las tiendas" : n === 1 ? `🏬 ${N.tienda([...sel][0]).nombre}` : n === 0 ? "🏬 Ninguna tienda" : `🏬 ${n} tiendas elegidas`;
  return `<div class="multi-tiendas" data-selector="${id}">
    <button type="button">${escapar(rotulo)} ▾</button>
    <div class="panel-tiendas">
      <div class="acciones-tiendas">
        <button type="button" data-acc="todas">Todas</button>
        <button type="button" data-acc="ninguna">Ninguna</button>
        ${N.CHOFERES.map((c) => `<button type="button" data-acc="ruta-${c.id}" title="${escapar(c.nombre)}">Ruta ${c.id}</button>`).join("")}
      </div>
      ${N.TIENDAS.map((t) => `<label><input type="checkbox" value="${t.id}" ${!sel || sel.has(t.id) ? "checked" : ""}> ${escapar(t.nombre)}</label>`).join("")}
    </div>
  </div>`;
}

let cierreGlobal = false;
export function conectarSelectores(caja, alCambiar) {
  if (!cierreGlobal) {
    document.addEventListener("click", () => document.querySelectorAll(".multi-tiendas.abierto").forEach((m) => m.classList.remove("abierto")));
    cierreGlobal = true;
  }
  caja.querySelectorAll("[data-selector]").forEach((cont) => {
    const id = cont.dataset.selector;
    const cajas = [...cont.querySelectorAll("input[type=checkbox]")];
    const guardar = () => {
      const marcadas = cajas.filter((c) => c.checked).map((c) => Number(c.value));
      selecciones.set(id, marcadas.length === cajas.length ? null : new Set(marcadas));
      const abierto = true;
      alCambiar();
      if (abierto) caja.querySelector(`[data-selector="${id}"]`)?.classList.add("abierto");
    };
    cont.querySelector(":scope > button").addEventListener("click", (e) => { e.stopPropagation(); cont.classList.toggle("abierto"); });
    cont.querySelector(".panel-tiendas").addEventListener("click", (e) => e.stopPropagation());
    cajas.forEach((c) => c.addEventListener("change", guardar));
    cont.querySelectorAll("[data-acc]").forEach((b) => b.addEventListener("click", () => {
      const acc = b.dataset.acc;
      const ruta = acc.startsWith("ruta-") ? new Set(N.rutaDe(acc.slice(5)).map((t) => t.id)) : null;
      cajas.forEach((c) => { c.checked = ruta ? ruta.has(Number(c.value)) : acc === "todas"; });
      guardar();
    }));
  });
}
