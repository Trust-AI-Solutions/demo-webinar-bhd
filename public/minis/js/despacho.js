// Despacho: 1) cargar las ventas del día (el reporte PDF de la cadena, leído con IA y
// aprobado por una persona, o pegado desde Excel), 2) calcular y confirmar el despacho de
// mañana por ruta, 3) imprimir las hojas de reparto (una por chofer) y la de producción.

import * as N from "./negocio.js";
import { mapearReporte, contextoReporte } from "./herramientas.js";
import { leerDocumento, prepararArchivo, archivoDeEjemplo } from "../../comun/ia.js";
import { rd, num, escapar, fechaLarga } from "../../comun/formato.js";

const EJEMPLO_PDF = "ejemplos/reporte-ventas-las-palmas.pdf";
let modo = "reporte";          // "reporte" | "pegar"
let borrador = null;          // lectura del reporte pendiente de aprobar
let leyendo = false;
let error = "";
let grilla = null;            // despacho calculado (editable)
let confirmado = null;        // último despacho confirmado en esta pestaña
let ctx = {};

export function pintar(caja, opciones = {}) {
  ctx = opciones;
  const hoy = N.hoy();
  const sin = N.tiendasSinVentas(hoy);
  const total = N.TIENDAS.length;
  if (!grilla || opciones.evento?.tipo === "ventas" || opciones.evento?.tipo === "restablecido") grilla = N.calcularDespacho(hoy);
  if (opciones.evento?.tipo === "restablecido") { borrador = null; confirmado = null; }

  caja.innerHTML = `
    <div class="card">
      <div class="fila-fecha">
        <b>Ventas del día:</b> <span>${escapar(fechaLarga(hoy))}</span>
        <span class="pill ${sin.length ? "pill-warn" : "pill-ok"}" id="pill-ventas">${total - sin.length} de ${total} tiendas con ventas registradas</span>
      </div>
      ${sin.length ? `<details><summary>Faltan ${sin.length} tiendas</summary><p class="ayuda">${sin.map((t) => escapar(t.nombre)).join(" · ")}</p></details>` : ""}
      <p class="ayuda">El despacho que se confirma hoy se entrega mañana, ${escapar(fechaLarga(N.sumarDias(hoy, 1)))}.</p>
    </div>

    <div class="card">
      <h3>Paso 1 · Cargar ventas del día</h3>
      <div class="tabs-mini" role="tablist">
        <button class="tab-mini" role="tab" data-modo="reporte" aria-selected="${modo === "reporte"}">📄 Reporte de la cadena (PDF)</button>
        <button class="tab-mini" role="tab" data-modo="pegar" aria-selected="${modo === "pegar"}">📋 Pegar desde Excel</button>
      </div>
      ${modo === "reporte" ? pasoReporte() : pasoPegar()}
    </div>

    <div class="card">
      <div class="cabeza"><h3>Paso 2 · Calcular y confirmar despacho</h3>
        <span class="ayuda"><span class="pill" style="background:var(--azul-fondo);color:var(--azul)">azul</span> = calculado por nivel par (la tienda tiene conteo) · blanco = repite lo vendido</span></div>
      ${tablaDespacho()}
      <button class="btn btn-primario" id="confirmar">💾 Confirmar despacho del ${escapar(fechaLarga(N.sumarDias(hoy, 1)))}</button>
    </div>

    ${confirmado ? `<div class="card" id="hojas">
      <div class="cabeza"><h3>Paso 3 · Hojas de reparto y de producción</h3><button class="btn btn-primario" id="imprimir">🖨️ Imprimir hojas</button></div>
      <p class="ayuda">Despacho guardado: ${num(confirmado.lineas.reduce((s, l) => s + l.cantidad, 0))} unidades para ${new Set(confirmado.lineas.map((l) => l.tienda)).size} tiendas. Vista previa:</p>
      <div class="vista-previa">${hojasHTML(confirmado)}</div>
    </div>` : ""}`;

  caja.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => { modo = b.dataset.modo; error = ""; pintar(caja, ctx); }));
  conectarReporte(caja);
  conectarPegar(caja);
  caja.querySelectorAll("[data-celda]").forEach((inp) => inp.addEventListener("change", () => {
    const [ri, ti, ci] = inp.dataset.celda.split("-").map(Number);
    grilla[ri].tiendas[ti].celdas[ci].cantidad = Math.max(0, Math.round(Number(inp.value) || 0));
    pintarTotales(caja);
  }));
  caja.querySelector("#confirmar").addEventListener("click", () => {
    confirmado = N.confirmarDespacho(grilla, hoy);
    ctx.aviso?.("Despacho confirmado. Las hojas de reparto están listas para imprimir.");
    pintar(caja, ctx);
    caja.querySelector("#hojas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  caja.querySelector("#imprimir")?.addEventListener("click", () => {
    document.getElementById("area-impresion").innerHTML = hojasHTML(confirmado);
    window.print();
  });
}

// ---------- Reporte PDF leído con IA ----------

function pasoReporte() {
  if (borrador) return revisionBorrador();
  return `
    <p class="ayuda" style="margin-top:0">Cada mañana ${escapar(N.CADENA_REPORTE)} manda por correo el reporte de ventas de sus tiendas. La IA lo lee y usted revisa antes de guardar.</p>
    <div class="zona-archivo" id="zona">
      📄 Arrastre aquí el reporte en PDF o una foto, o <label>elija un archivo<input type="file" id="archivo" accept="application/pdf,image/jpeg,image/png,image/webp" hidden></label>
      <div style="margin-top:10px"><button class="btn" id="usar-ejemplo">Usar el reporte de ejemplo de ${escapar(N.CADENA_REPORTE)}</button>
      <a class="btn" href="${EJEMPLO_PDF}" target="_blank" rel="noopener">Ver el PDF</a></div>
    </div>
    ${leyendo ? '<div class="leyendo">Leyendo el reporte <i></i><i></i><i></i></div>' : ""}
    ${error ? `<p class="error">${escapar(error)}</p>` : ""}`;
}

function revisionBorrador() {
  const b = borrador;
  const filas = b.lineas.map((l, i) => `<tr class="${!l.tienda || !l.producto ? "fila-alerta" : ""}">
    <td class="celda-suave">${escapar(l.original.tienda)}</td>
    <td>${l.tienda ? escapar(l.tienda.nombre) : '<span class="pill pill-error">No se encontró</span>'}</td>
    <td class="celda-suave">${escapar(l.original.producto)}${l.original.codigo_cadena ? ` · ${escapar(l.original.codigo_cadena)}` : ""}</td>
    <td>${l.producto ? escapar(l.producto.nombre) : `<select data-linea="${i}" aria-label="Producto de Minis"><option value="">Elegir producto…</option>${N.PRODUCTOS.map((p) => `<option value="${p.codigo}">${escapar(p.nombre)}</option>`).join("")}</select>`}</td>
    <td class="num">${num(l.unidades)}</td>
  </tr>`).join("");
  const pendientes = b.lineas.filter((l) => !l.tienda || !l.producto).length;
  const unidades = b.lineas.reduce((s, l) => s + l.unidades, 0);
  return `<div class="card borrador" id="borrador">
    <p class="titulo-borrador"><span class="pill pill-ia">IA</span> BORRADOR — nada se guarda hasta que usted confirme</p>
    <div class="resumen-borrador">
      <span>Cadena: <b>${escapar(b.cadena ?? "—")}</b></span>
      <span>Fecha en el reporte: <b>${escapar(b.fecha ?? "—")}</b></span>
      <span><b>${b.lineas.length}</b> líneas · <b>${b.tiendas}</b> tiendas · <b>${num(unidades)}</b> unidades</span>
    </div>
    ${b.dudas.length ? `<div class="aviso"><b>Para revisar:</b> ${b.dudas.map(escapar).join(" · ")}</div>` : ""}
    ${pendientes ? `<div class="aviso">${pendientes} línea${pendientes === 1 ? "" : "s"} sin cuadrar con el catálogo: elija el producto o se dejarán fuera.</div>` : ""}
    <div class="scroll-x" style="max-height:420px;overflow-y:auto;margin-top:8px"><table class="tabla">
      <thead><tr><th>Tienda en el reporte</th><th>Tienda</th><th>Producto en el reporte</th><th>Producto</th><th class="num">Unidades</th></tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
    <p class="ayuda">Las ventas se cargan como ventas de hoy.</p>
    <button class="btn btn-primario" id="registrar-reporte">Registrar ventas de ${b.tiendas} tiendas</button>
    <button class="btn" id="descartar">Descartar borrador</button>
  </div>`;
}

async function leer(caja, obtenerArchivo) {
  if (leyendo) return;
  leyendo = true; error = "";
  pintar(caja, ctx);
  try {
    const archivo = await obtenerArchivo();
    const propuesta = await leerDocumento("minis-reporte", { archivo, contexto: contextoReporte(), herramienta: "proponer_ventas" });
    borrador = mapearReporte(propuesta);
  } catch (e) {
    error = e.message;
  } finally {
    leyendo = false;
    pintar(caja, ctx);
  }
}

function conectarReporte(caja) {
  caja.querySelector("#usar-ejemplo")?.addEventListener("click", () => leer(caja, () => archivoDeEjemplo(EJEMPLO_PDF)));
  const entrada = caja.querySelector("#archivo");
  entrada?.addEventListener("change", () => { const f = entrada.files[0]; if (f) leer(caja, () => prepararArchivo(f)); });
  const zona = caja.querySelector("#zona");
  if (zona) {
    zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("encima"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("encima"));
    zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("encima"); const f = e.dataTransfer.files[0]; if (f) leer(caja, () => prepararArchivo(f)); });
  }
  caja.querySelectorAll("[data-linea]").forEach((sel) => sel.addEventListener("change", () => {
    const l = borrador.lineas[Number(sel.dataset.linea)];
    l.producto = N.producto(sel.value) ?? null;
    borrador.sinProducto = borrador.lineas.filter((x) => !x.producto).length;
  }));
  caja.querySelector("#descartar")?.addEventListener("click", () => { borrador = null; pintar(caja, ctx); });
  caja.querySelector("#registrar-reporte")?.addEventListener("click", () => {
    const lineas = borrador.lineas.filter((l) => l.tienda && l.producto).map((l) => ({ tienda: l.tienda.id, producto: l.producto.codigo, cantidad: l.unidades }));
    borrador = null; // antes de guardar: el cambio de estado repinta la pestaña
    const r = N.registrarVentas(lineas);
    ctx.aviso?.(`✔ Se registraron ventas de ${r.tiendas} tiendas (${r.registradas} líneas). El despacho ya las incluye.`);
  });
}

// ---------- Pegar desde Excel ----------

function pasoPegar() {
  return `
    <p class="ayuda" style="margin-top:0">Copie la tabla de Excel (tiendas en filas, productos en columnas; o una fila por tienda, producto y cantidad) y péguela aquí. Los nombres se reconocen aunque no tengan tildes.</p>
    <textarea id="pegado" rows="8" placeholder="Tienda&#9;Bizcocho de vainilla&#9;Coco horneado&#9;…"></textarea>
    <button class="btn" id="ejemplo-pegar">Usar un ejemplo</button>
    <button class="btn btn-primario" id="cargar-pegado">Cargar ventas</button>
    ${error ? `<p class="error">${escapar(error)}</p>` : ""}`;
}

function conectarPegar(caja) {
  caja.querySelector("#ejemplo-pegar")?.addEventListener("click", () => {
    const tiendas = N.TIENDAS.filter(N.esDeLasPalmas);
    const productos = N.PRODUCTOS;
    let semilla = 7;
    const azar = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
    const filas = [["Tienda", ...productos.map((p) => p.nombre)].join("\t"), ...tiendas.map((t) => [t.nombre.normalize("NFD").replace(/[̀-ͯ]/g, ""), ...productos.map((p) => Math.round(N.parEn(p, t) * 0.25 * (0.4 + azar())))].join("\t"))];
    caja.querySelector("#pegado").value = filas.join("\n");
  });
  caja.querySelector("#cargar-pegado")?.addEventListener("click", () => {
    const { lineas, problemas } = leerPegado(caja.querySelector("#pegado").value);
    if (!lineas.length) { error = problemas[0] ?? "No se encontraron ventas en lo pegado."; return pintar(caja, ctx); }
    error = "";
    const r = N.registrarVentas(lineas);
    ctx.aviso?.(`✔ Se registraron ventas de ${r.tiendas} tiendas (${r.registradas} celdas leídas)${problemas.length ? ` · ${problemas.length} sin reconocer` : ""}.`);
  });
}

// Acepta una matriz (tiendas × productos) o formato largo (tienda, producto, cantidad).
export function leerPegado(texto) {
  const filas = texto.split(/\r?\n/).map((f) => f.split(/\t|;|,(?=\S)/).map((c) => c.trim())).filter((f) => f.some(Boolean));
  const lineas = [];
  const problemas = [];
  if (!filas.length) return { lineas, problemas: ["No hay nada pegado."] };
  const encabezado = filas[0];
  const esMatriz = encabezado.length >= 3 && encabezado.slice(1).filter((c) => N.buscarProducto(c)).length >= 2;
  if (esMatriz) {
    const productos = encabezado.slice(1).map((c) => N.buscarProducto(c));
    for (const f of filas.slice(1)) {
      const t = N.buscarTiendas(f[0])[0];
      if (!t) { problemas.push(`Tienda no reconocida: ${f[0]}`); continue; }
      f.slice(1).forEach((v, i) => { if (productos[i] && v !== "" && Number.isFinite(Number(v))) lineas.push({ tienda: t.id, producto: productos[i].codigo, cantidad: Number(v) }); });
    }
  } else {
    for (const f of filas) {
      if (f.length < 3 || !Number.isFinite(Number(f[2]))) continue;
      const t = N.buscarTiendas(f[0])[0];
      const p = N.buscarProducto(f[1]);
      if (!t || !p) { problemas.push(`No reconocido: ${f.slice(0, 2).join(" / ")}`); continue; }
      lineas.push({ tienda: t.id, producto: p.codigo, cantidad: Number(f[2]) });
    }
  }
  return { lineas, problemas };
}

// ---------- Tabla del despacho ----------

function tablaDespacho() {
  const cab = `<tr><th>Tienda</th>${N.PRODUCTOS.map((p) => `<th class="vert" title="${escapar(p.nombre)}"><span>${escapar(p.nombre)}</span></th>`).join("")}<th class="num">Total</th></tr>`;
  const cuerpo = grilla.map((r, ri) => `
    <tr class="fila-chofer"><td colspan="${N.PRODUCTOS.length + 2}">🚚 ${escapar(r.chofer.ruta)} · ${escapar(r.chofer.nombre)}</td></tr>
    ${r.tiendas.map((t, ti) => `<tr>
      <td style="white-space:nowrap">${escapar(t.tienda.nombre)}${t.sinVentas ? ' <span class="pill pill-warn" title="Sin ventas registradas hoy">sin ventas</span>' : ""}</td>
      ${t.celdas.map((c, ci) => `<td class="centro"><input data-celda="${ri}-${ti}-${ci}" class="${c.porPar ? "por-par" : ""}" type="number" min="0" inputmode="numeric" value="${c.cantidad}" aria-label="${escapar(t.tienda.nombre)}: ${escapar(N.producto(c.codigo).nombre)}"></td>`).join("")}
      <td class="num" data-total-tienda="${ri}-${ti}"><b>${num(t.celdas.reduce((s, c) => s + c.cantidad, 0))}</b></td>
    </tr>`).join("")}`).join("");
  const pie = `<tr><td>Producción total</td>${N.PRODUCTOS.map((p, ci) => `<td class="centro" data-total-producto="${ci}">${num(totalProducto(ci))}</td>`).join("")}<td class="num" id="total-general">${num(totalGeneral())}</td></tr>`;
  return `<div class="scroll-x"><table class="tabla tabla-despacho" id="tabla-despacho"><thead>${cab}</thead><tbody>${cuerpo}</tbody><tfoot>${pie}</tfoot></table></div>`;
}
const totalProducto = (ci) => grilla.reduce((s, r) => s + r.tiendas.reduce((a, t) => a + t.celdas[ci].cantidad, 0), 0);
const totalGeneral = () => N.PRODUCTOS.reduce((s, _, ci) => s + totalProducto(ci), 0);
function pintarTotales(caja) {
  grilla.forEach((r, ri) => r.tiendas.forEach((t, ti) => { caja.querySelector(`[data-total-tienda="${ri}-${ti}"]`).innerHTML = `<b>${num(t.celdas.reduce((s, c) => s + c.cantidad, 0))}</b>`; }));
  N.PRODUCTOS.forEach((_, ci) => { caja.querySelector(`[data-total-producto="${ci}"]`).textContent = num(totalProducto(ci)); });
  caja.querySelector("#total-general").textContent = num(totalGeneral());
}

// ---------- Hojas para imprimir ----------

function hojasHTML(d) {
  const por = {};
  for (const l of d.lineas) (por[l.tienda] ??= {})[l.producto] = l.cantidad;
  const conMovimiento = N.PRODUCTOS.filter((p) => d.lineas.some((l) => l.producto === p.codigo));
  const reparto = N.CHOFERES.map((c) => {
    const tiendas = N.TIENDAS.filter((t) => t.chofer === c.id && por[t.id]);
    if (!tiendas.length) return "";
    return `<div class="hoja">
      <h2>Hoja de reparto · ${escapar(c.ruta)}</h2>
      <p class="ayuda">Chofer: ${escapar(c.nombre)} · Entrega: ${escapar(fechaLarga(d.entrega))} · Minis by Mónica</p>
      <table class="tabla"><thead><tr><th>Tienda</th>${conMovimiento.map((p) => `<th class="centro">${escapar(p.nombre)}</th>`).join("")}<th class="num">Total</th><th class="firma">Recibido ✍</th></tr></thead>
      <tbody>${tiendas.map((t) => `<tr><td>${escapar(t.nombre)}</td>${conMovimiento.map((p) => `<td class="centro">${por[t.id][p.codigo] ?? ""}</td>`).join("")}<td class="num"><b>${num(Object.values(por[t.id]).reduce((s, n) => s + n, 0))}</b></td><td></td></tr>`).join("")}</tbody></table>
    </div>`;
  }).join("");
  const produccion = `<div class="hoja">
    <h2>Hoja de producción</h2>
    <p class="ayuda">Para entregar el ${escapar(fechaLarga(d.entrega))} · ventas de ${escapar(fechaLarga(d.ventasDe))}</p>
    <table class="tabla"><thead><tr><th>Código</th><th>Producto</th><th class="num">Unidades a producir</th><th class="num">Valor</th></tr></thead>
    <tbody>${conMovimiento.map((p) => { const u = d.lineas.filter((l) => l.producto === p.codigo).reduce((s, l) => s + l.cantidad, 0); return `<tr><td>${p.codigo}</td><td>${escapar(p.nombre)}</td><td class="num"><b>${num(u)}</b></td><td class="num">${rd(u * p.precio)}</td></tr>`; }).join("")}</tbody></table>
  </div>`;
  return reparto + produccion;
}
