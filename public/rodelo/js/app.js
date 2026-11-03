// Grupo Rodelo · Rodelo Copilot (réplica con datos ficticios): navegación, pantallas y chat.
// Todo el texto que viene de los datos o de la IA se escapa antes de insertarse.

import { montarCambiador } from "../../comun/cambiador.js";
import { Conversacion, hoyISO } from "../../comun/ia.js";
import { escapar as esc } from "../../comun/formato.js";
import * as N from "./negocio.js";
import { sumarDias } from "./datos.js";
import { ETIQUETAS, BLOQUES } from "./definiciones.js";
import { estado, alertasActuales, crearEjecutar } from "./herramientas.js";
import { GERENCIAS, generarReporte } from "./reportes.js";

montarCambiador("rodelo", { restablecer: () => { estado.restablecer(); reiniciarChat(); } });

const $ = (id) => document.getElementById(id);
const rd = (n) => `RD$ ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const datos = () => N.datos(hoyISO());
const fechaLarga = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });

function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2600); }
function abrirModal(titulo, html) { $("modalTitle").textContent = titulo; $("modalBody").innerHTML = html; $("modalBackdrop").classList.add("show"); $("closeModal").focus(); }
function cerrarModal() { $("modalBackdrop").classList.remove("show"); }
$("closeModal").onclick = cerrarModal; $("modalCloseBtn").onclick = cerrarModal;
$("modalBackdrop").addEventListener("click", (e) => { if (e.target === $("modalBackdrop")) cerrarModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

// Markdown mínimo y seguro (como el del panel real): negritas, cursivas, listas y tablas.
export function md(texto) {
  const lineas = esc(texto || "").split("\n");
  const salida = [];
  let tabla = [], lista = [];
  const enLinea = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[\s(])_(\S(?:.*?\S)?)_(?=[\s.,;:!?)]|$)/g, "$1<i>$2</i>");
  const vaciarTabla = () => {
    if (!tabla.length) return;
    const filas = tabla.filter((f) => !/^\|[\s:|-]+\|$/.test(f.replace(/\s/g, "")));
    salida.push(`<table>${filas.map((f, i) => `<tr>${f.replace(/^\||\|$/g, "").split("|").map((c) => `<${i ? "td" : "th"}>${enLinea(c.trim())}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</table>`);
    tabla = [];
  };
  const vaciarLista = () => { if (lista.length) { salida.push(`<ul>${lista.map((x) => `<li>${enLinea(x)}</li>`).join("")}</ul>`); lista = []; } };
  for (const l of lineas) {
    if (/^\s*\|.*\|\s*$/.test(l)) { vaciarLista(); tabla.push(l.trim()); continue; }
    vaciarTabla();
    const item = l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (item) { lista.push(item[1]); continue; }
    vaciarLista();
    if (/^\s*#{1,4}\s/.test(l)) salida.push(`<p><b>${enLinea(l.replace(/^\s*#{1,4}\s/, ""))}</b></p>`);
    else if (l.trim()) salida.push(`<p>${enLinea(l)}</p>`);
  }
  vaciarTabla(); vaciarLista();
  return salida.join("");
}

// ---------- navegación ----------
const VISTAS = {
  inicio: ["Resumen ejecutivo", "Rodelo Copilot · Fuentes del negocio, actualizadas cada mañana"],
  chat: ["Chat Ejecutivo", "Consultas en lenguaje natural sobre el negocio"],
  reportes: ["Reportes matinales", "Resumen automático por gerencia a las 6:00 a. m."],
  alertas: ["Centro de alertas", "Incongruencias detectadas automáticamente"],
  indicadores: ["Indicadores", "Tendencias y comparativos"],
};
let vistaActual = "inicio";

function cambiarVista(nombre, { actualizarHash = true } = {}) {
  if (!VISTAS[nombre]) nombre = "inicio";
  if (nombre !== vistaActual) document.querySelector(".content").scrollTop = 0; // cada vista abre arriba
  vistaActual = nombre;
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === nombre));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${nombre}`));
  $("pageTitle").textContent = VISTAS[nombre][0];
  $("pageSubtitle").textContent = VISTAS[nombre][1];
  if (actualizarHash && location.hash !== `#${nombre}`) history.replaceState(null, "", `#${nombre}`);
  pintar(nombre);
  if (nombre === "chat") $("chatInput").focus({ preventScroll: true });
}
document.querySelectorAll(".nav button").forEach((b) => (b.onclick = () => cambiarVista(b.dataset.view)));
document.querySelectorAll("[data-view-link]").forEach((b) => (b.onclick = () => cambiarVista(b.dataset.viewLink)));
window.addEventListener("hashchange", () => cambiarVista(location.hash.slice(1), { actualizarHash: false }));
$("refreshBtn").onclick = () => { pintar(vistaActual); toast("Datos actualizados."); };
$("exportarPdf").onclick = () => window.print();

function pintar(nombre) {
  actualizarInsignia();
  if (nombre === "inicio") pintarInicio();
  if (nombre === "alertas") pintarAlertas();
  if (nombre === "indicadores") pintarIndicador(tabActual);
  if (nombre === "reportes") pintarReportes();
}

function actualizarInsignia() {
  const n = alertasActuales(datos()).filter((a) => a.estado !== "resuelta").length;
  const b = $("navAlertBadge");
  b.hidden = n === 0;
  b.textContent = n;
}

// ---------- inicio ----------
const COLOR_SEV = { alta: "#dc3d3d", media: "#d97706", baja: "#2077b8" };
const PREGUNTA_POR_TIPO = {
  presentacion_atipica: "¿Qué pedidos tienen una presentación atípica y qué recomienda hacer?",
  desviacion_produccion: "¿Cómo va la producción contra el plan en los últimos 30 días?",
  retraso_pago: "¿Qué clientes tienen facturas vencidas y por cuánto?",
  caida_compras: "¿Qué clientes bajaron sus compras?",
};

function pintarInicio() {
  const d = datos();
  const hora = new Date().getHours();
  $("saludo").textContent = `${hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches"} 👋`;
  $("saludoSub").textContent = `Resumen ejecutivo · ${fechaLarga(d.hoy)} · Fuentes del negocio`;
  const dias = N.ventasDiarias(d, 40);
  const ultimo = dias[0];
  let previo = null;
  if (ultimo) {
    const objetivo = new Date(sumarDias(ultimo.fecha, -28));
    previo = dias.slice(1).reduce((m, f) => (!m || Math.abs(new Date(f.fecha) - objetivo) < Math.abs(new Date(m.fecha) - objetivo) ? f : m), null);
  }
  const delta = ultimo && previo ? ((ultimo.ventas - previo.ventas) / previo.ventas) * 100 : null;
  const activas = alertasActuales(d).filter((a) => a.estado !== "resuelta");
  const atrasadas = N.ordenesAtrasadas(d).length;
  const errores = d.errores_despacho.filter((e) => e.fecha >= sumarDias(d.hoy, -30)).length;
  $("kpiGrid").innerHTML = [
    `<div class="card kpi"><div class="label">Ventas (último día: ${esc(ultimo?.fecha ?? "—")})</div><div class="value">${ultimo ? rd(ultimo.ventas) : "—"}</div><div class="delta ${delta >= 0 ? "up" : "down"}">${delta == null ? "Sin comparativo" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs. ${esc(previo.fecha)}`}</div></div>`,
    `<div class="card kpi"><div class="label">Pedidos atrasados</div><div class="value">${atrasadas}</div><div class="delta ${atrasadas ? "down" : "up"}">${atrasadas ? "Requieren gestión" : "Al día"}</div></div>`,
    `<div class="card kpi"><div class="label">Errores de despacho (30 días)</div><div class="value">${errores}</div><div class="delta neutral">Detectados antes de facturar</div></div>`,
    `<div class="card kpi"><div class="label">Alertas activas</div><div class="value">${activas.length}</div><div class="delta ${activas.length ? "neutral" : "up"}">${activas.length ? "Requieren atención" : "Sin pendientes"}</div></div>`,
  ].join("");

  if (ultimo && previo) {
    const max = Math.max(ultimo.ventas, previo.ventas);
    $("ventasBars").innerHTML = `
      <div class="growth ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% ${delta >= 0 ? "↗" : "↘"}</div>
      <div class="barwrap"><div class="bar gray" style="height:${(previo.ventas / max) * 78}%"><span>${rd(previo.ventas)}</span></div><div class="barlabel">${esc(previo.fecha)} (~4 sem. antes)</div></div>
      <div class="barwrap"><div class="bar blue" style="height:${(ultimo.ventas / max) * 78}%"><span>${rd(ultimo.ventas)}</span></div><div class="barlabel">${esc(ultimo.fecha)} (último día)</div></div>`;
  } else $("ventasBars").innerHTML = '<div class="empty-note">Sin datos suficientes para el comparativo.</div>';

  $("riskList").innerHTML = activas.length
    ? activas.slice(0, 3).map((a) => `<div class="risk"><span class="risk-dot" style="background:${COLOR_SEV[a.severidad]}"></span><div><strong>${esc(N.infoTipo(a.tipo).titulo)}</strong><small>${esc(a.descripcion)}</small></div><span class="sev ${a.severidad}">${a.severidad}</span></div>`).join("")
    : '<div class="empty-note">No hay alertas activas en este momento. El motor revisa los datos cada hora.</div>';

  const top = activas[0];
  $("recomendacion").innerHTML = top ? `<strong>${esc(N.infoTipo(top.tipo).titulo)}:</strong> ${esc(N.infoTipo(top.tipo).accion)}` : "Sin alertas activas: buen momento para revisar tendencias en la pestaña Indicadores.";
  $("verAnalisis").onclick = () => { cambiarVista("chat"); preguntar(top ? PREGUNTA_POR_TIPO[top.tipo] ?? "¿Cuáles son los riesgos prioritarios de hoy?" : "¿Cómo va el negocio este mes?"); };

  $("ventasTabla").innerHTML = dias.slice(0, 8).map((f) => `<tr><td>${esc(f.fecha)}</td><td>${rd(f.ventas)}</td><td>${rd(f.utilidad)}</td><td>${f.facturas}</td></tr>`).join("") || '<tr><td colspan="4">Sin datos</td></tr>';

  const porTipo = {};
  activas.forEach((a) => (porTipo[a.tipo] = (porTipo[a.tipo] ?? 0) + 1));
  $("alertasMini").innerHTML = Object.keys(porTipo).length
    ? Object.entries(porTipo).map(([t, n]) => `<div class="alert-mini"><span>${N.infoTipo(t).icono}</span><span>${esc(N.infoTipo(t).titulo)}</span><span class="alert-count">${n}</span></div>`).join("")
    : '<div class="empty-note">Sin alertas activas.</div>';
}

// ---------- chat ----------
const SUGERENCIAS = [
  "¿Cuál fue la utilidad del mes?",
  "¿Qué clientes bajaron sus compras?",
  "¿Qué inventario tiene más de 90 días?",
  "¿Qué vendedor tiene bajo desempeño?",
  "¿Qué órdenes están atrasadas?",
  "Compare la utilidad de este mes con el mes anterior",
  "¿Cómo va la producción de la semana?",
  "¿Qué clientes tienen facturas vencidas?",
];
$("sugerencias").innerHTML = SUGERENCIAS.map((s) => `<button class="suggestion" type="button">${esc(s)}</button>`).join("");
$("sugerencias").querySelectorAll(".suggestion").forEach((b) => (b.onclick = () => preguntar(b.textContent)));

const conversacion = new Conversacion("rodelo-copiloto", { ejecutar: crearEjecutar(datos), etiquetas: ETIQUETAS });

function pinta(rol, html, clase = "") {
  const div = document.createElement("div");
  div.className = `msg ${rol} ${clase}`.trim();
  div.innerHTML = html;
  $("messages").appendChild(div);
  $("messages").scrollTop = $("messages").scrollHeight;
  return div;
}
function bienvenida() {
  $("messages").innerHTML = "";
  pinta("bot", `${md("Buen día. Soy el **Rodelo Copilot**, su asistente ejecutivo de análisis.\nPuedo consultarle utilidad, clientes, inventario, vendedores, órdenes y producción. ¿Qué desea revisar hoy?")}<div class="meta">Rodelo Copilot · datos del negocio</div>`);
}
function reiniciarChat() { conversacion.reiniciar(); bienvenida(); }
$("clearChat").onclick = reiniciarChat;
bienvenida();

async function preguntar(texto) {
  const q = String(texto ?? "").trim();
  if (!q) return;
  if (conversacion.ocupada) { toast("Espere a que termine la respuesta anterior."); return; }
  $("chatInput").value = "";
  pinta("user", esc(q));
  const pasos = document.createElement("div");
  pasos.className = "pasos";
  pasos.innerHTML = '<div class="paso actual">Consultando los datos del negocio…</div>';
  $("messages").appendChild(pasos);
  $("messages").scrollTop = $("messages").scrollHeight;
  const vistos = new Set();
  $("sendChat").disabled = true;
  try {
    const r = await conversacion.preguntar(q, ({ entrada }) => {
      const etiqueta = BLOQUES[entrada?.bloque] ?? "Datos del negocio";
      if (vistos.has(etiqueta)) return;
      vistos.add(etiqueta);
      pasos.innerHTML = [...vistos].map((e) => `<div class="paso">${esc(e)}</div>`).join("") + '<div class="paso actual">Redactando la respuesta…</div>';
      $("messages").scrollTop = $("messages").scrollHeight;
    });
    pasos.innerHTML = vistos.size ? [...vistos].map((e) => `<div class="paso">${esc(e)}</div>`).join("") : "";
    if (!vistos.size) pasos.remove();
    pinta("bot", `${md(r.texto)}<div class="meta">Rodelo Copilot · datos del negocio</div>`, r.aviso ? "error" : "");
  } catch (e) {
    pasos.remove();
    pinta("bot", esc(e.message || "No se pudo completar la consulta."), "error");
  } finally {
    $("sendChat").disabled = false;
  }
}
$("chatForm").addEventListener("submit", (e) => { e.preventDefault(); preguntar($("chatInput").value); });

// ---------- reportes ----------
function pintarReportes() {
  const d = datos();
  $("reportGrid").innerHTML = GERENCIAS.map((g) => `<div class="card report-card"><div class="iconbox">${g.icono}</div><h3>${esc(g.nombre)}</h3><p>${esc(g.desc)}</p><div class="actions"><button class="btn primary" type="button" data-reporte="${g.clave}">Ver último (${esc(d.hoy)})</button></div></div>`).join("");
  $("reportesHistorial").innerHTML = `<table class="table"><thead><tr><th>Fecha</th><th>Gerencia</th><th>Destinatario</th><th>Canal</th><th></th></tr></thead><tbody>${GERENCIAS.map((g) => `<tr><td>${esc(d.hoy)} 06:00</td><td>${esc(g.nombre)}</td><td>${esc(g.clave === "general" ? "Dirección General" : `Gerencia ${g.nombre}`)}</td><td>correo</td><td><button class="btn" type="button" data-reporte="${g.clave}">Ver</button></td></tr>`).join("")}</tbody></table>`;
  document.querySelectorAll("[data-reporte]").forEach((b) => (b.onclick = () => {
    const g = GERENCIAS.find((x) => x.clave === b.dataset.reporte);
    abrirModal(`Reporte matinal · ${g.nombre} · ${d.hoy}`, md(generarReporte(g.clave, d, alertasActuales(d))));
  }));
}

// ---------- alertas ----------
let alertaSeleccionada = null;
const filtrosAlertas = ["severityFilter", "statusFilter", "alertSearch"];
filtrosAlertas.forEach((id) => $(id).addEventListener("input", pintarAlertas));

function alertasFiltradas() {
  const sev = $("severityFilter").value, est = $("statusFilter").value, q = $("alertSearch").value.toLowerCase();
  return alertasActuales(datos()).filter((a) => (sev === "all" || a.severidad === sev) && (est === "all" || a.estado === est) && `${a.tipo} ${N.infoTipo(a.tipo).titulo} ${a.descripcion} ${a.entidad_referida} ${a.area}`.toLowerCase().includes(q));
}

function pintarAlertas() {
  const lista = alertasFiltradas();
  $("alertsTable").innerHTML = lista.length
    ? lista.map((a) => {
      const t = N.infoTipo(a.tipo);
      return `<div class="alert-row ${alertaSeleccionada === a.id ? "selected" : ""}" data-id="${a.id}" tabindex="0" role="button"><div class="aicon ${t.color}">${t.icono}</div><div><strong>${esc(t.titulo)}</strong><small class="desc">${esc(a.descripcion)}</small><small>${esc(a.entidad_referida)} · ${esc(a.fecha_hora)}</small></div><div class="hide-sm"><strong>${esc(a.area)}</strong><small>Área</small></div><div><span class="sev ${a.severidad}">${a.severidad}</span></div><div><strong class="status ${a.estado}">${a.estado}</strong></div></div>`;
    }).join("")
    : '<div class="empty-note">No hay alertas que coincidan con los filtros.</div>';
  document.querySelectorAll(".alert-row").forEach((r) => {
    r.onclick = () => seleccionarAlerta(Number(r.dataset.id));
    r.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleccionarAlerta(Number(r.dataset.id)); } };
  });
  if (alertaSeleccionada) pintarDetalle();
}

function seleccionarAlerta(id) { alertaSeleccionada = id; pintarAlertas(); }

function pintarDetalle() {
  const a = alertasActuales(datos()).find((x) => x.id === alertaSeleccionada);
  const dt = $("alertDetail");
  if (!a) { dt.classList.add("empty"); dt.textContent = "Seleccione una alerta para ver el detalle y la acción recomendada."; return; }
  const t = N.infoTipo(a.tipo);
  dt.classList.remove("empty");
  dt.innerHTML = `<h3>${esc(t.titulo)}</h3><div class="detail-meta">${esc(a.entidad_referida)} · ${esc(a.fecha_hora)}</div>
    <div class="detail-section"><label>Severidad y estado</label><p><span class="sev ${a.severidad}">${a.severidad}</span> &nbsp; <strong class="status ${a.estado}">${a.estado}</strong></p></div>
    <div class="detail-section"><label>Detalle detectado</label><p>${esc(a.descripcion)}</p></div>
    <div class="detail-section"><label>Acción recomendada</label><p>${esc(t.accion)}</p></div>
    <div class="detail-section"><label>Alcance</label><p>El Copilot registra y muestra la alerta; la resolución operativa la hace el área responsable, fuera del Copilot.</p></div>
    <div class="detail-actions"><button class="btn" id="marcarVista" type="button"${a.estado !== "nueva" ? " disabled" : ""}>Marcar como vista</button><button class="btn success" id="marcarResuelta" type="button"${a.estado === "resuelta" ? " disabled" : ""}>✓ Resolver</button></div>`;
  $("marcarVista").onclick = () => cambiarEstadoAlerta(a, "vista");
  $("marcarResuelta").onclick = () => cambiarEstadoAlerta(a, "resuelta");
}

function cambiarEstadoAlerta(a, nuevo) {
  estado.modificar((e) => { e.alertas[N.claveAlerta(a)] = nuevo; }, { tipo: "alerta" });
  toast(nuevo === "resuelta" ? "Alerta marcada como resuelta." : "Alerta marcada como vista.");
}
estado.alCambiar(() => pintar(vistaActual));

// ---------- indicadores ----------
let tabActual = "ventas";
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => {
  tabActual = b.dataset.tab;
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
  pintarIndicador(tabActual);
}));

function graficoLinea(vals, rotulos, formato, umbral = null) {
  if (!vals.length) return '<div class="empty-note">Sin datos.</div>';
  const min = Math.min(...vals, umbral ?? Infinity), max = Math.max(...vals), rango = max - min || 1;
  const px = (i) => (vals.length > 1 ? 4 + (i / (vals.length - 1)) * 92 : 50);
  const py = (v) => 88 - ((v - min) / rango) * 68;
  const pts = vals.map((v, i) => `${px(i)},${py(v)}`).join(" ");
  const mostrarValor = vals.length <= 8;
  const puntos = vals.map((v, i) => `<div class="punto" style="left:${px(i)}%;top:${py(v)}%" title="${esc(rotulos[i])}: ${esc(formato(v))}"></div>${mostrarValor ? `<div class="valor" style="left:${px(i)}%;top:${py(v)}%">${esc(formato(v))}</div>` : ""}`).join("");
  const paso = Math.ceil(rotulos.length / 10);
  const ejes = rotulos.map((l, i) => (i % paso ? "" : `<div class="rotulo" style="left:${px(i)}%">${esc(l)}</div>`)).join("");
  const linea = umbral != null ? `<line x1="0" x2="100" y1="${py(umbral)}" y2="${py(umbral)}" stroke="#c77708" stroke-width="1.2" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/>` : "";
  return `<div class="linechart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6f9fff" stop-opacity=".35"/><stop offset="100%" stop-color="#6f9fff" stop-opacity="0"/></linearGradient></defs><polygon points="${px(0)},100 ${pts} ${px(vals.length - 1)},100" fill="url(#area)"/>${linea}<polyline points="${pts}" fill="none" stroke="#1769e0" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>${puntos}${ejes}</div>`;
}
const resumen = (items) => `<div class="section-title">Lectura ejecutiva</div>${items.map(([a, b]) => `<div class="summary-item"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join("")}`;

function pintarIndicador(tab) {
  const d = datos();
  const chart = $("indicatorChart"), sum = $("indicatorSummary"), tit = $("indicatorTitle");
  if (tab === "ventas") {
    const meses = N.utilidadMensual(d).slice().reverse();
    const completos = meses.filter((m) => !m.parcial), parcial = meses.find((m) => m.parcial);
    tit.textContent = "Ingresos mensuales (RD$)";
    chart.innerHTML = graficoLinea(meses.map((m) => m.ingresos), meses.map((m) => m.mes + (m.parcial ? " (parcial)" : "")), (v) => `${Math.round(v / 1000).toLocaleString("en-US")}k`);
    const ult = completos.at(-1), ant = completos.at(-2);
    sum.innerHTML = resumen([
      [`Último mes completo (${ult?.mes ?? "—"})`, ult ? `${rd(ult.ingresos)} · utilidad ${rd(ult.utilidad)}` : "—"],
      ["Mes anterior", ant ? `${rd(ant.ingresos)} · utilidad ${rd(ant.utilidad)}` : "—"],
      ["Variación (meses completos)", ult && ant ? `${(((ult.ingresos - ant.ingresos) / ant.ingresos) * 100).toFixed(1)}%` : "—"],
      ["Mes en curso (parcial)", parcial ? `${rd(parcial.ingresos)} · utilidad ${rd(parcial.utilidad)}` : "—"],
    ]);
  }
  if (tab === "inventario") {
    const inv = N.inventarioPorProducto(d), viejos = inv.filter((i) => i.dias_antiguedad > 90);
    tit.textContent = "Inventario por antigüedad (días)";
    chart.innerHTML = `<table class="table"><thead><tr><th>Producto</th><th>Presentación</th><th>Cantidad</th><th>Días</th><th>Costo</th></tr></thead><tbody>${inv.slice(0, 12).map((i) => `<tr style="${i.dias_antiguedad > 90 ? "background:#fff5f5" : ""}"><td>${esc(i.nombre)}</td><td>${esc(i.presentacion)}</td><td>${i.cantidad}</td><td><b>${i.dias_antiguedad}</b></td><td>${rd(i.costo_inmovilizado)}</td></tr>`).join("")}</tbody></table>`;
    sum.innerHTML = resumen([
      ["Productos con +90 días", String(viejos.length)],
      ["Costo inmovilizado (+90 días)", rd(viejos.reduce((s, i) => s + i.costo_inmovilizado, 0))],
      ["Mayor antigüedad", inv[0] ? `${inv[0].nombre} ${inv[0].presentacion} · ${inv[0].dias_antiguedad} días` : "—"],
      ["Acción sugerida", "Evaluar promoción o redistribución de los lotes antiguos"],
    ]);
  }
  if (tab === "produccion") {
    const dias = N.produccionDias(d, 30);
    tit.textContent = "Cumplimiento de producción vs. plan (%)";
    chart.innerHTML = graficoLinea(dias.map((x) => x.cumplimiento_pct), dias.map((x) => x.fecha.slice(5)), (v) => `${v}%`, 70);
    const bajo = dias.filter((x) => x.cumplimiento_pct < 70);
    const prom = dias.length ? Math.round(dias.reduce((s, x) => s + x.cumplimiento_pct, 0) / dias.length) : "—";
    sum.innerHTML = resumen([
      ["Cumplimiento promedio (30 días)", `${prom}%`],
      ["Días bajo el umbral (70%)", bajo.length ? bajo.map((x) => `${x.fecha} (${x.cumplimiento_pct}%)`).join(" · ") : "Ninguno"],
      ["Último día", dias.length ? `${dias.at(-1).fecha} · ${dias.at(-1).cumplimiento_pct}%` : "—"],
      ["Acción sugerida", "Investigar la causa de los días con desviación"],
    ]);
  }
  if (tab === "comercial") {
    const v = N.vendedoresDesempeno(d);
    const caidas = N.clientesCaida(d).filter((c) => c.variacion_pct <= -50);
    tit.textContent = "Cumplimiento de meta por vendedor (promedio 3 meses)";
    chart.innerHTML = `<table class="table"><thead><tr><th>Vendedor</th><th>Ruta</th><th>Venta prom./mes</th><th>Meta</th><th>Cumplimiento</th></tr></thead><tbody>${v.map((x) => `<tr style="${x.cumplimiento_pct < 50 ? "background:#fff5f5" : ""}"><td>${esc(x.vendedor)}</td><td>${esc(x.ruta)}</td><td>${rd(x.venta_prom_mensual)}</td><td>${rd(x.meta_mensual)}</td><td><b>${x.cumplimiento_pct}%</b></td></tr>`).join("")}</tbody></table>`;
    sum.innerHTML = resumen([
      ["Menor cumplimiento", v[0] ? `${v[0].vendedor} (${v[0].ruta}) · ${v[0].cumplimiento_pct}%` : "—"],
      ["Clientes con caída de más del 50%", caidas.length ? caidas.map((c) => `${c.nombre} (${c.variacion_pct}%)`).join(" · ") : "Ninguno"],
      ["Vendedores", String(v.length)],
      ["Acción sugerida", "Acompañar en ruta al vendedor con menor cumplimiento y visitar a los clientes en caída"],
    ]);
  }
}

// ---------- arranque ----------
cambiarVista(location.hash.slice(1) || "inicio", { actualizarHash: false });
