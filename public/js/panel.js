// Panel del negocio: pantallas, gráficos y asistente de IA.

import * as N from "./negocio.js";
import { modificarEstado, alCambiar, leerEstado } from "./estado.js";
import { Conversacion } from "./ia.js";
import { ICONOS } from "./iconos.js";
import { rd, num, porcentaje, fechaCorta, fechaLarga, nombreMes, escapar, textoEnriquecido } from "./formato.js";

const $ = (s, r = document) => r.querySelector(s);
const incrustado = new URLSearchParams(location.search).has("incrustado");
const graficos = [];
let vistaActual = "inicio";

function pintarIconos(raiz = document) {
  raiz.querySelectorAll("[data-icono]").forEach((el) => { el.innerHTML = ICONOS[el.dataset.icono] ?? ""; });
}

function variacion(actual, previo, sufijo = "") {
  if (!previo) return `<span class="nota">Sin dato para comparar</span>`;
  const cambio = ((actual - previo) / previo) * 100;
  const clase = cambio >= 0 ? "sube" : "baja";
  return `<span class="nota"><span class="${clase}">${cambio >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(cambio * 10) / 10)} %</span> ${sufijo}</span>`;
}

function destruirGraficos() { while (graficos.length) graficos.pop().destroy(); }

function opcionesBase({ dinero = true, horizontal = false } = {}) {
  const ejeValor = { grid: { color: "#eef1ee" }, border: { display: false }, ticks: { color: "#7a877f", font: { size: 11 }, maxTicksLimit: horizontal ? 5 : 7, maxRotation: 0, callback: (v) => (dinero ? `RD$${num(v / 1000)}k` : num(v)) } };
  const ejeCat = { grid: { display: false }, border: { color: "#e1e7e2" }, ticks: { color: "#7a877f", font: { size: 11 }, autoSkip: true, maxRotation: 0 } };
  return {
    responsive: true, maintainAspectRatio: false, animation: { duration: 350 },
    indexAxis: horizontal ? "y" : "x",
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#17221d", padding: 10, cornerRadius: 8, callbacks: { label: (c) => ` ${c.dataset.label}: ${dinero ? rd(c.parsed[horizontal ? "x" : "y"]) : num(c.parsed[horizontal ? "x" : "y"])}` } },
    },
    scales: horizontal ? { x: ejeValor, y: ejeCat } : { x: ejeCat, y: ejeValor },
  };
}

function grafico(id, config) {
  const lienzo = document.getElementById(id);
  if (!lienzo || !window.Chart) return;
  graficos.push(new Chart(lienzo, config));
}

const barras = (label, datos, color = "#1f5f4a") => ({ label, data: datos, backgroundColor: color, borderRadius: 4, borderSkipped: "start", maxBarThickness: 26 });
const linea = (label, datos, color) => ({ label, data: datos, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: .3 });

// ---------- pantallas ----------

const VISTAS = {
  inicio: { titulo: "Inicio", pintar: pintarInicio },
  ventas: { titulo: "Ventas", pintar: pintarVentas },
  inventario: { titulo: "Inventario", pintar: pintarInventario },
  cobros: { titulo: "Clientes y cobros", pintar: pintarCobros },
  pedidos: { titulo: "Pedidos", pintar: pintarPedidos },
  alertas: { titulo: "Alertas", pintar: pintarAlertas },
};

function mostrar(vista) {
  if (!VISTAS[vista]) vista = "inicio";
  vistaActual = vista;
  document.querySelectorAll("#nav [data-vista]").forEach((b) => b.classList.toggle("activo", b.dataset.vista === vista));
  $("#titulo").textContent = VISTAS[vista].titulo;
  destruirGraficos();
  $("#vista").innerHTML = "";
  VISTAS[vista].pintar($("#vista"));
  pintarIconos($("#vista"));
  if (location.hash !== `#${vista}`) history.replaceState(null, "", `${location.search}#${vista}`);
  actualizarContadores();
}

function pintarInicio(raiz) {
  const d = N.datos();
  const i = N.indicadoresInicio();
  raiz.innerHTML = `
    <div class="indicadores">
      <div class="indicador"><span class="nombre">Ventas de hoy (hasta ahora)</span><span class="valor">${rd(i.hoyV.ventas_sin_itbis)}</span><span class="nota">${i.hoyV.facturas} facturas · el mismo día de la semana pasada cerró en ${rd(i.mismoDiaSemanaPasada.ventas_sin_itbis)}</span></div>
      <div class="indicador"><span class="nombre">Ventas de ${nombreMes(d.hoy)}</span><span class="valor">${rd(i.mes.ventas_sin_itbis)}</span>${variacion(i.mes.ventas_sin_itbis, i.mesAnt.ventas_sin_itbis, "vs. el mismo corte del mes pasado")}</div>
      <div class="indicador"><span class="nombre">Margen bruto del mes</span><span class="valor">${porcentaje(i.mes.margen_pct)}</span><span class="nota">${rd(i.mes.margen_bruto)} de ganancia bruta</span></div>
      <div class="indicador"><span class="nombre">Por cobrar</span><span class="valor">${rd(i.cxc.total_por_cobrar)}</span><span class="nota"><span class="baja">${rd(i.cxc.total_vencido)}</span> vencido</span></div>
      <div class="indicador"><span class="nombre">Productos bajo el mínimo</span><span class="valor">${i.bajoMinimo}</span><span class="nota">en al menos una sucursal</span></div>
      <div class="indicador"><span class="nombre">Pedidos abiertos</span><span class="valor">${i.abiertos}</span><span class="nota">${N.todosLosPedidos().filter((p) => p.canal === "WhatsApp" && p.fecha === d.hoy).length} por WhatsApp hoy</span></div>
    </div>
    <div class="fila">
      <div class="tarjeta"><h2>Ventas por día</h2><p class="sub">Últimos 30 días, sin ITBIS</p><div class="grafico"><canvas id="g-dias"></canvas></div></div>
      <div class="tarjeta"><h2>Ventas por semana y sucursal</h2><p class="sub">Últimas 12 semanas completas, sin ITBIS</p>
        <div class="leyenda"><span><i style="background:var(--serie-1)"></i>Herrera</span><span><i style="background:var(--serie-2)"></i>Villa Mella</span></div>
        <div class="grafico"><canvas id="g-sucursales"></canvas></div></div>
    </div>
    <div class="fila tres">
      <div class="tarjeta"><div class="cabecera"><div><h2>Alertas</h2><p class="sub">Lo que conviene atender hoy</p></div><button class="boton secundario pequeno" data-ir="alertas">Ver todas</button></div><ul class="lista-alertas" id="inicio-alertas"></ul></div>
      <div class="tarjeta"><div class="cabecera"><div><h2>Pedidos recientes</h2><p class="sub">Todos los canales</p></div><button class="boton secundario pequeno" data-ir="pedidos">Ver pedidos</button></div><div id="inicio-pedidos"></div></div>
    </div>
    <div class="fila">
      <div class="tarjeta"><h2>Ventas por categoría</h2><p class="sub">Mes en curso, sin ITBIS</p><div class="grafico alto"><canvas id="g-categorias"></canvas></div></div>
      <div class="tarjeta"><h2>Productos más vendidos</h2><p class="sub">Mes en curso, por monto</p><div class="tabla-envoltura" id="inicio-productos"></div></div>
    </div>`;

  const dias = N.resumenVentas({ desde: N.sumarDias(d.hoy, -29), hasta: d.hoy, agruparPor: "dia" }).grupos;
  grafico("g-dias", { type: "bar", data: { labels: dias.map((g) => fechaCorta(g.grupo)), datasets: [barras("Ventas", dias.map((g) => g.ventas))] }, options: opcionesBase() });

  // Solo semanas completas (de lunes a domingo), para no mostrar caídas falsas.
  const [a, m, dd] = d.hoy.split("-").map(Number);
  const lunes = N.sumarDias(d.hoy, -((new Date(a, m - 1, dd).getDay() + 6) % 7));
  const semanas = { desde: N.sumarDias(lunes, -84), hasta: N.sumarDias(lunes, -1), agruparPor: "semana" };
  const sh = N.resumenVentas({ ...semanas, sucursal: "Herrera" }).grupos;
  const sv = N.resumenVentas({ ...semanas, sucursal: "Villa Mella" }).grupos;
  grafico("g-sucursales", { type: "line", data: { labels: sh.map((g) => `Sem. ${fechaCorta(g.grupo)}`), datasets: [linea("Herrera", sh.map((g) => g.ventas), "#2a78d6"), linea("Villa Mella", sv.map((g) => g.ventas), "#eb6834")] }, options: opcionesBase() });

  const cats = N.resumenVentas({ desde: `${d.hoy.slice(0, 8)}01`, agruparPor: "categoria" }).grupos;
  grafico("g-categorias", { type: "bar", data: { labels: cats.map((g) => g.grupo), datasets: [barras("Ventas", cats.map((g) => g.ventas))] }, options: opcionesBase({ horizontal: true }) });

  const prods = N.resumenVentas({ desde: `${d.hoy.slice(0, 8)}01`, agruparPor: "producto", limite: 8 }).grupos;
  $("#inicio-productos").innerHTML = `<table><thead><tr><th>Producto</th><th class="n">Unidades</th><th class="n">Ventas</th></tr></thead><tbody>${prods.map((p) => `<tr><td>${escapar(p.grupo.replace(/^\S+\s/, ""))}</td><td class="n">${num(p.unidades)}</td><td class="n">${rd(p.ventas)}</td></tr>`).join("")}</tbody></table>`;

  pintarListaAlertas($("#inicio-alertas"), N.alertas().slice(0, 5));
  const pedidos = N.todosLosPedidos().slice(0, 6);
  $("#inicio-pedidos").innerHTML = `<table><tbody>${pedidos.map((p) => `<tr><td><b>${p.id}</b> ${insigniaCanal(p.canal)}<span class="detalle">${escapar(p.cliente)} · ${p.fecha === d.hoy ? "hoy" : fechaCorta(p.fecha)} ${p.hora}</span></td><td class="n">${rd(p.total)}<span class="detalle">${escapar(p.estado)}</span></td></tr>`).join("")}</tbody></table>`;
}

function insigniaCanal(canal) {
  return canal === "WhatsApp" ? `<span class="insignia whatsapp">WhatsApp</span>` : `<span class="insignia">${escapar(canal)}</span>`;
}

function pintarListaAlertas(ul, lista) {
  if (!lista.length) { ul.innerHTML = `<li><span>No hay alertas activas.</span></li>`; return; }
  const nombre = { alta: "Urgente", media: "Atender", baja: "Revisar" };
  ul.innerHTML = lista.map((a) => `<li><span class="insignia ${a.gravedad}">${nombre[a.gravedad]}</span><div><b>${escapar(a.titulo)}</b><span>${escapar(a.detalle)}</span></div></li>`).join("");
}

let filtroVentas = { dias: 30, sucursal: "" };
function pintarVentas(raiz) {
  const d = N.datos();
  const desde = N.sumarDias(d.hoy, -(filtroVentas.dias - 1));
  const suc = filtroVentas.sucursal || undefined;
  const r = N.resumenVentas({ desde, sucursal: suc });
  const previo = N.resumenVentas({ desde: N.sumarDias(desde, -filtroVentas.dias), hasta: N.sumarDias(desde, -1), sucursal: suc });
  const agrupar = filtroVentas.dias <= 30 ? "dia" : "semana";
  raiz.innerHTML = `
    <div class="filtros">
      <div class="segmentos" id="seg-dias">${[7, 30, 90, 180].map((n) => `<button data-dias="${n}" class="${n === filtroVentas.dias ? "activo" : ""}">${n === 180 ? "6 meses" : `${n} días`}</button>`).join("")}</div>
      <select id="sel-sucursal" aria-label="Sucursal"><option value="">Todas las sucursales</option>${N.SUCURSALES.map((s) => `<option ${s.nombre === filtroVentas.sucursal ? "selected" : ""}>${s.nombre}</option>`).join("")}</select>
    </div>
    <div class="indicadores">
      <div class="indicador"><span class="nombre">Ventas sin ITBIS</span><span class="valor">${rd(r.ventas_sin_itbis)}</span>${variacion(r.ventas_sin_itbis, previo.ventas_sin_itbis, "vs. periodo anterior")}</div>
      <div class="indicador"><span class="nombre">Margen bruto</span><span class="valor">${porcentaje(r.margen_pct)}</span><span class="nota">${rd(r.margen_bruto)}</span></div>
      <div class="indicador"><span class="nombre">Facturas</span><span class="valor">${num(r.facturas)}</span>${variacion(r.facturas, previo.facturas, "vs. periodo anterior")}</div>
      <div class="indicador"><span class="nombre">Ticket promedio</span><span class="valor">${rd(r.ticket_promedio)}</span>${variacion(r.ticket_promedio, previo.ticket_promedio, "vs. periodo anterior")}</div>
    </div>
    <div class="tarjeta"><h2>Ventas por ${agrupar === "dia" ? "día" : "semana"}</h2><p class="sub">${fechaCorta(desde)} al ${fechaCorta(d.hoy)}${suc ? ` · ${suc}` : ""}</p><div class="grafico"><canvas id="g-ventas"></canvas></div></div>
    <div class="fila">
      <div class="tarjeta"><h2>Por categoría</h2><p class="sub">Ventas, margen y participación</p><div class="tabla-envoltura" id="t-cat"></div></div>
      <div class="tarjeta"><h2>Por vendedor</h2><p class="sub">Ventas, facturas y margen</p><div class="tabla-envoltura" id="t-ven"></div></div>
    </div>
    <div class="tarjeta"><h2>Productos más vendidos</h2><p class="sub">Por monto vendido en el periodo</p><div class="tabla-envoltura" id="t-prod"></div></div>`;

  const serie = N.resumenVentas({ desde, sucursal: suc, agruparPor: agrupar }).grupos;
  grafico("g-ventas", { type: "bar", data: { labels: serie.map((g) => (agrupar === "dia" ? fechaCorta(g.grupo) : `Sem. ${fechaCorta(g.grupo)}`)), datasets: [barras("Ventas", serie.map((g) => g.ventas))] }, options: opcionesBase() });

  const cat = N.resumenVentas({ desde, sucursal: suc, agruparPor: "categoria" }).grupos;
  $("#t-cat").innerHTML = tabla(["Categoría", "Ventas", "Margen", "Part."], cat.map((g) => [escapar(g.grupo), rd(g.ventas), porcentaje(g.margen_pct), porcentaje(g.participacion_pct)]));
  const ven = N.resumenVentas({ desde, sucursal: suc, agruparPor: "vendedor" }).grupos;
  $("#t-ven").innerHTML = tabla(["Vendedor", "Ventas", "Facturas", "Margen"], ven.map((g) => [escapar(g.grupo), rd(g.ventas), num(g.facturas), porcentaje(g.margen_pct)]));
  const prod = N.resumenVentas({ desde, sucursal: suc, agruparPor: "producto", limite: 10 }).grupos;
  $("#t-prod").innerHTML = tabla(["Producto", "Unidades", "Ventas", "Margen"], prod.map((g) => [escapar(g.grupo.replace(/^\S+\s/, "")), num(g.unidades), rd(g.ventas), porcentaje(g.margen_pct)]));

  raiz.querySelectorAll("#seg-dias button").forEach((b) => b.addEventListener("click", () => { filtroVentas.dias = Number(b.dataset.dias); mostrar("ventas"); }));
  $("#sel-sucursal").addEventListener("change", (e) => { filtroVentas.sucursal = e.target.value; mostrar("ventas"); });
}

function tabla(cabeceras, filas) {
  return `<table><thead><tr>${cabeceras.map((c, i) => `<th class="${i ? "n" : ""}">${c}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((v, i) => `<td class="${i ? "n" : ""}">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

let filtroInv = { texto: "", categoria: "", bajo: false };
function pintarInventario(raiz) {
  raiz.innerHTML = `
    <div class="filtros">
      <input type="search" id="inv-texto" placeholder="Buscar producto…" value="${escapar(filtroInv.texto)}" aria-label="Buscar producto">
      <select id="inv-cat" aria-label="Categoría"><option value="">Todas las categorías</option>${N.CATEGORIAS.map((c) => `<option ${c === filtroInv.categoria ? "selected" : ""}>${c}</option>`).join("")}</select>
      <label class="interruptor"><input type="checkbox" id="inv-bajo" ${filtroInv.bajo ? "checked" : ""}> Solo bajo el mínimo</label>
    </div>
    <div class="tarjeta"><div class="tabla-envoltura" id="t-inv"></div></div>`;
  const dibujar = () => {
    const r = N.buscarProductos({ texto: filtroInv.texto || undefined, categoria: filtroInv.categoria || undefined, soloBajoMinimo: filtroInv.bajo, limite: 400 });
    $("#t-inv").innerHTML = `<p class="sub">${r.encontrados} productos</p><table><thead><tr><th>Producto</th><th class="n">Herrera</th><th class="n">Villa Mella</th><th class="n">Vendidas 30 días</th><th class="n">Días de inventario</th><th class="n">Precio</th><th class="n">Margen</th></tr></thead><tbody>${r.productos.map((p) => {
      const bajoH = p.stock.Herrera < p.minimo_herrera, bajoV = p.stock["Villa Mella"] < p.minimo_villa_mella;
      const dias = p.dias_de_inventario;
      return `<tr><td>${escapar(p.nombre)}<span class="detalle">${p.codigo} · ${escapar(p.categoria)}</span></td>
        <td class="n">${num(p.stock.Herrera)} ${bajoH ? '<span class="insignia alta">bajo</span>' : ""}</td>
        <td class="n">${num(p.stock["Villa Mella"])} ${bajoV ? '<span class="insignia alta">bajo</span>' : ""}</td>
        <td class="n">${num(p.unidades_vendidas_30_dias)}</td>
        <td class="n">${dias === null ? '<span class="insignia baja">sin ventas</span>' : dias <= 5 ? `<span class="insignia alta">${dias}</span>` : num(dias)}</td>
        <td class="n">${rd(p.precio_sin_itbis)}</td><td class="n">${porcentaje(p.margen_pct)}</td></tr>`;
    }).join("")}</tbody></table>`;
  };
  dibujar();
  $("#inv-texto").addEventListener("input", (e) => { filtroInv.texto = e.target.value; dibujar(); });
  $("#inv-cat").addEventListener("change", (e) => { filtroInv.categoria = e.target.value; dibujar(); });
  $("#inv-bajo").addEventListener("change", (e) => { filtroInv.bajo = e.target.checked; dibujar(); });
}

function pintarCobros(raiz) {
  const c = N.cuentasPorCobrar({ limite: 200 });
  const t = c.tramos_por_dias_de_atraso;
  raiz.innerHTML = `
    <div class="indicadores">
      <div class="indicador"><span class="nombre">Total por cobrar</span><span class="valor">${rd(c.total_por_cobrar)}</span><span class="nota">${c.clientes_con_saldo} clientes con saldo</span></div>
      <div class="indicador"><span class="nombre">Al día</span><span class="valor">${rd(t.al_dia)}</span><span class="nota">aún no vence</span></div>
      <div class="indicador"><span class="nombre">Vencido 1 a 30 días</span><span class="valor">${rd(t["1_30"])}</span></div>
      <div class="indicador"><span class="nombre">Vencido 31 a 60 días</span><span class="valor">${rd(t["31_60"])}</span></div>
      <div class="indicador"><span class="nombre">Vencido más de 60 días</span><span class="valor baja">${rd(t.mas_60)}</span></div>
    </div>
    <div class="tarjeta"><h2>Clientes con saldo</h2><p class="sub">Ordenados por monto vencido</p><div class="tabla-envoltura">
      <table><thead><tr><th>Cliente</th><th class="n">Saldo</th><th class="n">Vencido</th><th class="n">Atraso mayor</th><th class="n">Límite de crédito</th><th>Situación</th></tr></thead><tbody>
      ${c.clientes.map((x) => `<tr><td>${escapar(x.cliente)}<span class="detalle">${escapar(x.tipo)} · ${x.telefono} · ${x.sucursal}</span></td><td class="n">${rd(x.saldo)}</td><td class="n">${rd(x.vencido)}</td><td class="n">${x.dias_mayor_atraso ? `${x.dias_mayor_atraso} días` : "—"}</td><td class="n">${rd(x.limite_credito)}</td>
        <td>${x.sobre_limite ? '<span class="insignia alta">Sobre el límite</span>' : x.dias_mayor_atraso > 30 ? '<span class="insignia media">Atrasado</span>' : x.dias_mayor_atraso > 0 ? '<span class="insignia baja">Vencido reciente</span>' : '<span class="insignia ok">Al día</span>'}</td></tr>`).join("")}
      </tbody></table></div></div>`;
}

const ESTADOS = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];
let ultimoPedidoNuevo = null;
function pintarPedidos(raiz) {
  const d = N.datos();
  const pedidos = N.todosLosPedidos();
  const atenciones = leerEstado().atenciones.filter((a) => !a.atendida);
  raiz.innerHTML = `
    ${atenciones.length ? `<div class="tarjeta"><h2>Clientes de WhatsApp que esperan a una persona</h2><p class="sub">El asistente los pasó al equipo</p><ul class="lista-alertas">${atenciones.map((a) => `<li><span class="insignia whatsapp">WhatsApp</span><div style="flex:1"><b>${escapar(a.nombre || "Cliente sin nombre")} · ${a.hora}</b><span>${escapar(a.motivo)}</span></div><button class="boton secundario pequeno" data-atender="${a.id}">Marcar atendido</button></li>`).join("")}</ul></div>` : ""}
    <div class="tablero">${ESTADOS.map((e) => {
      const lista = pedidos.filter((p) => p.estado === e && (e !== "entregado" || p.fecha === d.hoy));
      return `<div class="columna"><h3><span>${e[0].toUpperCase() + e.slice(1)}${e === "entregado" ? " hoy" : ""}</span><span>${lista.length}</span></h3>${lista.map((p) => `
        <div class="pedido ${p.id === ultimoPedidoNuevo ? "nuevo-llegado" : ""}">
          <div class="arriba"><b>${p.id}</b>${insigniaCanal(p.canal)}</div>
          <div>${escapar(p.cliente)}<span class="detalle" style="display:block;color:var(--tinta-3);font-size:12px">${p.fecha === d.hoy ? "Hoy" : fechaCorta(p.fecha)} ${p.hora} · ${escapar(p.entrega)}${p.direccion ? ` · ${escapar(p.direccion)}` : ""}</span></div>
          <div class="articulos">${p.items.map((i) => `${num(i.cantidad)} × ${escapar(i.nombre)}`).join("<br>")}</div>
          <div class="arriba"><span class="total">${rd(p.total)}</span>${e !== "entregado" ? `<button class="boton secundario pequeno" data-avanzar="${p.id}">Avanzar</button>` : ""}</div>
        </div>`).join("")}</div>`;
    }).join("")}</div>`;
  raiz.querySelectorAll("[data-avanzar]").forEach((b) => b.addEventListener("click", () => {
    const p = pedidos.find((x) => x.id === b.dataset.avanzar);
    const siguiente = ESTADOS[Math.min(ESTADOS.length - 1, ESTADOS.indexOf(p.estado) + 1)];
    modificarEstado((s) => { s.cambiosEstado[p.id] = siguiente; }, { tipo: "estado" });
  }));
  raiz.querySelectorAll("[data-atender]").forEach((b) => b.addEventListener("click", () => {
    modificarEstado((s) => { const a = s.atenciones.find((x) => x.id === b.dataset.atender); if (a) a.atendida = true; }, { tipo: "estado" });
  }));
}

function pintarAlertas(raiz) {
  const lista = N.alertas();
  raiz.innerHTML = `<div class="tarjeta"><h2>Alertas activas</h2><p class="sub">Se calculan solas con los datos del negocio</p><ul class="lista-alertas" id="todas-alertas"></ul></div>`;
  pintarListaAlertas($("#todas-alertas"), lista);
}

function actualizarContadores() {
  const abiertos = N.todosLosPedidos().filter((p) => p.estado === "nuevo").length;
  const urgentes = N.alertas().filter((a) => a.gravedad === "alta").length;
  const cp = $("#contador-pedidos"), ca = $("#contador-alertas");
  cp.textContent = abiertos; cp.classList.toggle("oculto", !abiertos);
  ca.textContent = urgentes; ca.classList.toggle("oculto", !urgentes);
}

function aviso(texto) {
  const el = document.createElement("div");
  el.textContent = texto;
  $("#avisos").appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

// ---------- asistente ----------

const SUGERENCIAS = [
  "¿Cómo van las ventas de este mes comparadas con el mes pasado?",
  "¿Qué productos tengo que reponer esta semana?",
  "¿Quiénes me deben más de 30 días?",
  "¿Por qué bajó el margen de las pinturas?",
  "¿Cómo le va a la sucursal de Villa Mella?",
  "¿Entraron pedidos por WhatsApp hoy?",
];
const conversacion = new Conversacion("panel");

function abrirAsistente(abrir = true) {
  $("#asistente").classList.toggle("abierto", abrir);
  if (abrir) setTimeout(() => $("#pregunta").focus(), 250);
}

function reiniciarChat() {
  conversacion.reiniciar();
  $("#chat").innerHTML = `<div class="bienvenida">Pregunte lo que quiera saber del negocio, en sus palabras. Las respuestas salen de las mismas cifras que ve en el panel.</div>`;
  $("#sugerencias").innerHTML = SUGERENCIAS.map((s) => `<button class="chip" type="button">${escapar(s)}</button>`).join("");
  $("#sugerencias").classList.remove("oculto");
}

async function enviarPregunta(texto) {
  texto = texto.trim();
  if (!texto || conversacion.ocupada) return;
  $("#sugerencias").classList.add("oculto");
  const chat = $("#chat");
  chat.insertAdjacentHTML("beforeend", `<div class="burbuja usuario">${escapar(texto)}</div>`);
  const pasos = document.createElement("div");
  pasos.className = "pasos";
  pasos.innerHTML = `<span class="actual">Pensando…</span>`;
  chat.appendChild(pasos);
  chat.scrollTop = chat.scrollHeight;
  $("#pregunta").value = "";
  $("#enviar").disabled = true;
  const vistos = new Set();
  try {
    const r = await conversacion.preguntar(texto, (paso) => {
      if (vistos.has(paso.etiqueta)) return;
      vistos.add(paso.etiqueta);
      pasos.querySelectorAll(".actual").forEach((s) => s.classList.remove("actual"));
      pasos.querySelector("span:first-child")?.textContent === "Pensando…" && pasos.firstElementChild.remove();
      pasos.insertAdjacentHTML("beforeend", `<span class="actual">${escapar(paso.etiqueta)}…</span>`);
      chat.scrollTop = chat.scrollHeight;
    });
    pasos.querySelectorAll(".actual").forEach((s) => s.classList.remove("actual"));
    if (!vistos.size) pasos.remove();
    chat.insertAdjacentHTML("beforeend", `<div class="burbuja ${r.aviso ? "error" : "ia"}">${textoEnriquecido(r.texto)}</div>`);
  } catch (e) {
    pasos.remove();
    chat.insertAdjacentHTML("beforeend", `<div class="burbuja error">${escapar(e.message)}</div>`);
  } finally {
    $("#enviar").disabled = false;
    chat.scrollTop = chat.scrollHeight;
  }
}

// ---------- arranque ----------

function iniciar() {
  pintarIconos();
  $("#fecha").textContent = fechaLarga(N.hoy()).replace(/^./, (c) => c.toUpperCase());
  document.querySelectorAll("#nav [data-vista]").forEach((b) => b.addEventListener("click", () => mostrar(b.dataset.vista)));
  $("#vista").addEventListener("click", (e) => { const b = e.target.closest("[data-ir]"); if (b) mostrar(b.dataset.ir); });
  $("#abrir-asistente").addEventListener("click", () => abrirAsistente(!$("#asistente").classList.contains("abierto")));
  $("#asistente-cerrar").addEventListener("click", () => abrirAsistente(false));
  $("#asistente-ampliar").addEventListener("click", () => $("#asistente").classList.toggle("amplio"));
  $("#asistente-nuevo").addEventListener("click", reiniciarChat);
  $("#sugerencias").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) enviarPregunta(b.textContent); });
  $("#formulario").addEventListener("submit", (e) => { e.preventDefault(); enviarPregunta($("#pregunta").value); });
  $("#pregunta").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarPregunta($("#pregunta").value); } });
  reiniciarChat();

  alCambiar((evento) => {
    if (evento.tipo === "pedido") {
      const p = N.todosLosPedidos().find((x) => x.origen === "asistente");
      ultimoPedidoNuevo = p?.id ?? null;
      if (p) aviso(`Nuevo pedido por WhatsApp: ${p.id} de ${p.cliente}, ${rd(p.total)}`);
    }
    if (evento.tipo === "atencion") aviso("Un cliente de WhatsApp pide hablar con una persona");
    if (evento.tipo === "restablecido") ultimoPedidoNuevo = null;
    // El chat no se repinta: solo la pantalla activa.
    mostrar(vistaActual);
  });

  if (incrustado) document.body.classList.add("incrustado");
  mostrar(location.hash.slice(1) || "inicio");
  if (new URLSearchParams(location.search).has("asistente")) abrirAsistente(true);
}

iniciar();
