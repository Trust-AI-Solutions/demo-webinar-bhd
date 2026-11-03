// Panel del negocio: pantallas, gráficos y asistente de IA.

import * as N from "./negocio.js";
import { modificarEstado, alCambiar, leerEstado } from "./estado.js";
import { Conversacion } from "./ia.js";
import { ICONOS } from "./iconos.js";
import { ESTADOS } from "./pedidos.js";
import { botonesPedidos, conectarBotones, configurarPedidos, abrirImportar } from "./pedidos-ui.js";
import { rd, num, porcentaje, fechaCorta, nombreMes, escapar, textoEnriquecido } from "./formato.js";

const $ = (s, r = document) => r.querySelector(s);
const incrustado = new URLSearchParams(location.search).has("incrustado");
const graficos = [];
let vistaActual = "inicio";
let ultimoPedidoNuevo = null;

const pintarIconos = (raiz = document) => raiz.querySelectorAll("[data-icono]").forEach((el) => { el.innerHTML = ICONOS[el.dataset.icono] ?? ""; });
const dec = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 1 });
const sinParentesis = (t) => t.replace(/ \(.*\)$/, "");

// ---------- piezas ----------

// Una cifra es un pastel de capas: el valor en el glaseado y el nombre en el bizcocho; la comparación va en una flecha con su detalle al pasar el cursor.
function cifra(nombre, valor, extra = "", { alerta = false, cereza = false } = {}) {
  return `<div class="cifra${cereza ? " cereza" : ""}"><div class="cifra-nombre">${nombre}</div><div class="cifra-valor${alerta ? " alerta" : ""}"><span>${valor}</span>${extra}</div></div>`;
}
function delta(actual, previo, contra) {
  if (!previo) return "";
  const cambio = Math.round(((actual - previo) / previo) * 1000) / 10;
  return `<span class="delta ${cambio >= 0 ? "sube" : "baja"}" title="${cambio >= 0 ? "+" : ""}${cambio} % ${contra}">${ICONOS[cambio >= 0 ? "sube" : "baja"]}${Math.abs(cambio)} %</span>`;
}
const tarjeta = (titulo, cuerpo, { periodo, accion = "", id = "" } = {}) =>
  `<section class="tarjeta"${id ? ` id="${id}"` : ""}><div class="cabecera"><h2>${titulo}${periodo ? ` <span class="periodo">· ${periodo}</span>` : ""}</h2>${accion}</div>${cuerpo}</section>`;
const tabla = (cabeceras, filas) =>
  `<div class="tabla-envoltura"><table><thead><tr>${cabeceras.map((c, i) => `<th class="${i ? "n" : ""}">${c}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((v, i) => `<td class="${i ? "n" : ""}">${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const GRAVEDAD = { alta: "Urgente", media: "Atender", baja: "Revisar" };
const listaAlertas = (lista, { detalle = true } = {}) => lista.length
  ? `<ul class="alertas">${lista.map((a) => `<li class="${a.gravedad}"><span class="punto" role="img" aria-label="${GRAVEDAD[a.gravedad]}"></span><div class="texto"><b>${escapar(a.titulo)}</b>${detalle ? `<span>${escapar(a.detalle)}</span>` : ""}</div></li>`).join("")}</ul>`
  : `<p class="vacio">No hay alertas.</p>`;

// ---------- gráficos ----------

function destruirGraficos() { while (graficos.length) graficos.pop().destroy(); }
function opcionesBase({ horizontal = false } = {}) {
  const ejeValor = { grid: { color: "#e6edf7" }, border: { display: false }, ticks: { color: "#7a5a51", font: { size: 13 }, maxTicksLimit: horizontal ? 5 : 6, callback: (v) => `RD$${num(v / 1000)}k` } };
  const ejeCat = { grid: { display: false }, border: { color: "#c5d3e6" }, ticks: { color: "#7a5a51", font: { size: 13 }, autoSkip: true, maxRotation: 0 } };
  return {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 }, indexAxis: horizontal ? "y" : "x",
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#3a1f19", padding: 10, cornerRadius: 6, callbacks: { label: (c) => ` ${c.dataset.label}: ${rd(c.parsed[horizontal ? "x" : "y"])}` } } },
    scales: horizontal ? { x: ejeValor, y: ejeCat } : { x: ejeCat, y: ejeValor },
  };
}
function grafico(id, config) {
  const lienzo = document.getElementById(id);
  if (!lienzo || !window.Chart) return;
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  graficos.push(new Chart(lienzo, config));
}
const barras = (label, datos) => ({ label, data: datos, backgroundColor: "#2f5fd0", borderRadius: 6, borderSkipped: "start", maxBarThickness: 24 });
const linea = (label, datos, color) => ({ label, data: datos, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .3 });

// ---------- pantallas ----------

const VISTAS = {
  inicio: { titulo: "Inicio", pintar: pintarInicio },
  ventas: { titulo: "Ventas", pintar: pintarVentas },
  inventario: { titulo: "Insumos y menú", pintar: pintarInventario },
  cobros: { titulo: "Clientes y cobros", pintar: pintarCobros },
  pedidos: { titulo: "Pedidos", pintar: pintarPedidos },
  alertas: { titulo: "Alertas", pintar: pintarAlertas },
};

function mostrar(vista) {
  if (!VISTAS[vista]) vista = "inicio";
  vistaActual = vista;
  document.querySelectorAll("#nav [data-vista]").forEach((b) => {
    b.classList.toggle("activo", b.dataset.vista === vista);
    if (b.dataset.vista === vista) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  $("#titulo").textContent = VISTAS[vista].titulo;
  document.body.dataset.vista = vista;
  destruirGraficos();
  VISTAS[vista].pintar($("#vista"));
  pintarIconos($("#vista"));
  if (location.hash !== `#${vista}`) history.replaceState(null, "", `${location.search}#${vista}`);
  actualizarContadores();
}

function pintarInicio(raiz) {
  const d = N.datos();
  const i = N.indicadoresInicio();
  const mes = `${d.hoy.slice(0, 8)}01`;
  raiz.innerHTML = `
    <div class="cifras">
      ${cifra("Ventas de hoy", rd(i.hoyV.ventas_sin_itbis), "", { cereza: true })}
      ${cifra(`Ventas de ${nombreMes(d.hoy)}`, rd(i.mes.ventas_sin_itbis), delta(i.mes.ventas_sin_itbis, i.mesAnt.ventas_sin_itbis, "frente al mismo corte del mes pasado"))}
      ${cifra("Margen bruto", porcentaje(i.mes.margen_pct))}
      ${cifra("Por cobrar", rd(i.cxc.total_por_cobrar))}
      ${cifra("Insumos bajo el mínimo", i.bajoMinimo)}
      ${cifra("Pedidos abiertos", i.abiertos)}
    </div>
    <div class="fila">
      ${tarjeta("Ventas por día", `<div class="grafico"><canvas id="g-dias"></canvas></div>`, { periodo: "30 días" })}
      ${tarjeta("Ventas por semana", `<div class="grafico"><canvas id="g-sucursales"></canvas></div>`, { periodo: "12 semanas", accion: `<div class="leyenda"><span><i class="serie-1"></i>Gazcue</span><span><i class="serie-2"></i>Los Prados</span></div>` })}
    </div>
    <div class="fila tres">
      ${tarjeta("Alertas", `<div id="inicio-alertas">${listaAlertas(N.alertas().slice(0, 5), { detalle: false })}</div>`, { accion: `<button class="boton secundario pequeno" data-ir="alertas">Ver todas</button>` })}
      ${tarjeta("Pedidos recientes", `<div id="inicio-pedidos"></div>`, { accion: `<button class="boton secundario pequeno" data-ir="pedidos">Ver pedidos</button>` })}
    </div>
    <div class="fila">
      ${tarjeta("Ventas por categoría", `<div class="grafico alto"><canvas id="g-categorias"></canvas></div>`, { periodo: "este mes" })}
      ${tarjeta("Más vendidos", `<div id="inicio-productos"></div>`, { periodo: "este mes" })}
    </div>`;

  const dias = N.resumenVentas({ desde: N.sumarDias(d.hoy, -29), hasta: d.hoy, agruparPor: "dia" }).grupos;
  grafico("g-dias", { type: "bar", data: { labels: dias.map((g) => fechaCorta(g.grupo)), datasets: [barras("Ventas", dias.map((g) => g.ventas))] }, options: opcionesBase() });

  // Solo semanas completas (de lunes a domingo), para no mostrar caídas falsas.
  const [a, m, dd] = d.hoy.split("-").map(Number);
  const lunes = N.sumarDias(d.hoy, -((new Date(a, m - 1, dd).getDay() + 6) % 7));
  const semanas = { desde: N.sumarDias(lunes, -84), hasta: N.sumarDias(lunes, -1), agruparPor: "semana" };
  const sg = N.resumenVentas({ ...semanas, sucursal: "Gazcue" }).grupos;
  const sp = N.resumenVentas({ ...semanas, sucursal: "Los Prados" }).grupos;
  grafico("g-sucursales", { type: "line", data: { labels: sg.map((g) => fechaCorta(g.grupo)), datasets: [linea("Gazcue", sg.map((g) => g.ventas), "#6b46c1"), linea("Los Prados", sp.map((g) => g.ventas), "#b5560f")] }, options: opcionesBase() });

  const cats = N.resumenVentas({ desde: mes, agruparPor: "categoria" }).grupos;
  grafico("g-categorias", { type: "bar", data: { labels: cats.map((g) => g.grupo), datasets: [barras("Ventas", cats.map((g) => g.ventas))] }, options: opcionesBase({ horizontal: true }) });

  const prods = N.resumenVentas({ desde: mes, agruparPor: "producto", limite: 8 }).grupos;
  $("#inicio-productos").innerHTML = tabla(["Producto", "Unidades", "Ventas"], prods.map((p) => [escapar(p.grupo.replace(/^\S+\s/, "")), num(p.unidades), rd(p.ventas)]));
  const pedidos = N.todosLosPedidos().slice(0, 6);
  $("#inicio-pedidos").innerHTML = tabla(["Cliente", "Estado", "Total"], pedidos.map((p) => [escapar(p.cliente), escapar(p.estado), rd(p.total)]));
}

let filtroVentas = { dias: 30, sucursal: "" };
function pintarVentas(raiz) {
  const d = N.datos();
  const desde = N.sumarDias(d.hoy, -(filtroVentas.dias - 1));
  const suc = filtroVentas.sucursal || undefined;
  const r = N.resumenVentas({ desde, sucursal: suc });
  const previo = N.resumenVentas({ desde: N.sumarDias(desde, -filtroVentas.dias), hasta: N.sumarDias(desde, -1), sucursal: suc });
  const agrupar = filtroVentas.dias <= 30 ? "dia" : "semana";
  const contra = "frente al periodo anterior";
  raiz.innerHTML = `
    <div class="filtros">
      <div class="segmentos" id="seg-dias">${[7, 30, 90, 180].map((n) => `<button data-dias="${n}" class="${n === filtroVentas.dias ? "activo" : ""}">${n === 180 ? "6 meses" : `${n} días`}</button>`).join("")}</div>
      <select id="sel-sucursal" aria-label="Sucursal"><option value="">Las dos sucursales</option>${N.SUCURSALES.map((s) => `<option ${s.nombre === filtroVentas.sucursal ? "selected" : ""}>${s.nombre}</option>`).join("")}</select>
    </div>
    <div class="cifras">
      ${cifra("Ventas", rd(r.ventas_sin_itbis), delta(r.ventas_sin_itbis, previo.ventas_sin_itbis, contra))}
      ${cifra("Margen bruto", porcentaje(r.margen_pct))}
      ${cifra("Facturas", num(r.facturas), delta(r.facturas, previo.facturas, contra))}
      ${cifra("Ticket promedio", rd(r.ticket_promedio), delta(r.ticket_promedio, previo.ticket_promedio, contra))}
    </div>
    ${tarjeta(agrupar === "dia" ? "Ventas por día" : "Ventas por semana", `<div class="grafico"><canvas id="g-ventas"></canvas></div>`)}
    <div class="fila">
      ${tarjeta("Por categoría", `<div id="t-cat"></div>`)}
      ${tarjeta("Por vendedor", `<div id="t-ven"></div>`)}
    </div>
    ${tarjeta("Más vendidos", `<div id="t-prod"></div>`)}
    <section class="tarjeta" id="consignacion"></section>`;

  const serie = N.resumenVentas({ desde, sucursal: suc, agruparPor: agrupar }).grupos;
  grafico("g-ventas", { type: "bar", data: { labels: serie.map((g) => fechaCorta(g.grupo)), datasets: [barras("Ventas", serie.map((g) => g.ventas))] }, options: opcionesBase() });
  const cat = N.resumenVentas({ desde, sucursal: suc, agruparPor: "categoria" }).grupos;
  $("#t-cat").innerHTML = tabla(["Categoría", "Ventas", "Margen", "Peso"], cat.map((g) => [escapar(g.grupo), rd(g.ventas), porcentaje(g.margen_pct), porcentaje(g.participacion_pct)]));
  const ven = N.resumenVentas({ desde, sucursal: suc, agruparPor: "vendedor" }).grupos;
  $("#t-ven").innerHTML = tabla(["Vendedor", "Ventas", "Facturas", "Margen"], ven.map((g) => [escapar(g.grupo), rd(g.ventas), num(g.facturas), porcentaje(g.margen_pct)]));
  const prod = N.resumenVentas({ desde, sucursal: suc, agruparPor: "producto", limite: 10 }).grupos;
  $("#t-prod").innerHTML = tabla(["Producto", "Unidades", "Ventas", "Margen"], prod.map((g) => [escapar(g.grupo.replace(/^\S+\s/, "")), num(g.unidades), rd(g.ventas), porcentaje(g.margen_pct)]));
  pintarConsignacion($("#consignacion"));

  raiz.querySelectorAll("#seg-dias button").forEach((b) => b.addEventListener("click", () => { filtroVentas.dias = Number(b.dataset.dias); mostrar("ventas"); }));
  $("#sel-sucursal").addEventListener("change", (e) => { filtroVentas.sucursal = e.target.value; mostrar("ventas"); });
}

// Consignación: lo entregado a la cadena contra lo que su reporte dice que se vendió.
// Sin reporte, lo vendido queda "Pendiente", nunca cero.
function pintarConsignacion(caja) {
  const c = N.consignacion();
  const hay = c.total_vendido !== null;
  const pendiente = '<span class="insignia">Pendiente</span>';
  caja.innerHTML = `<div class="cabecera"><h2>Consignación en La Canasta <span class="periodo">· 7 días</span></h2><button class="boton secundario pequeno" id="importar-reporte" type="button">Importar reporte</button></div>
    ${hay ? `<div class="cifras">${cifra("Entregado", num(c.total_entregado))}${cifra("Vendido", num(c.total_vendido))}${cifra("En las tiendas", num(c.total_entregado - c.total_vendido))}${cifra("A liquidar", rd(c.total_a_liquidar))}</div>` : ""}
    ${tabla(["Tienda", "Entregado", "Vendido", "En tienda", "A liquidar", ""], c.tiendas.map((t) => {
      const raros = t.productos.filter((x) => x.revisar);
      const estado = !hay ? "" : raros.length
        ? raros.map((x) => `<span class="insignia alta" title="${escapar(x.revisar)}">${escapar(sinParentesis(x.producto))}: ${x.vendido} de ${x.entregado}</span>`).join(" ")
        : '<span class="insignia ok">Cuadra</span>';
      return [escapar(t.tienda), num(t.entregado), hay ? num(t.vendido) : pendiente, hay ? num(t.entregado - t.vendido) : "—", hay ? rd(t.a_liquidar) : "—", estado];
    }))}`;
  $("#importar-reporte", caja).addEventListener("click", abrirImportar);
}

let filtroInv = { texto: "", categoria: "", bajo: false };
function pintarInventario(raiz) {
  raiz.innerHTML = `
    <div class="filtros">
      <input type="search" id="inv-texto" placeholder="Buscar insumo" value="${escapar(filtroInv.texto)}" aria-label="Buscar insumo">
      <select id="inv-cat" aria-label="Categoría"><option value="">Todas las categorías</option>${N.CATEGORIAS_INSUMOS.map((c) => `<option ${c === filtroInv.categoria ? "selected" : ""}>${c}</option>`).join("")}</select>
      <label class="interruptor"><input type="checkbox" id="inv-bajo" ${filtroInv.bajo ? "checked" : ""}> Bajo el mínimo</label>
    </div>
    ${tarjeta("Insumos", `<div class="tabla-envoltura sin-recorte" id="t-inv"></div>`)}
    ${tarjeta("Menú", `<div id="t-menu"></div>`)}`;
  // Días que alcanza el insumo; en rojo si es 2 o menos, en ámbar si está bajo el mínimo (3 días).
  const dias = (x, suc) => {
    const n = x.dias_que_alcanza[suc];
    const titulo = `Quedan ${dec(x.existencia[suc])} (${x.unidad}); se usan ${dec(x.uso_diario[suc])} por día`;
    const clase = n <= 2 ? "alta" : n < 3 ? "media" : "";
    return clase ? `<span class="insignia ${clase}" title="${escapar(titulo)}">${dec(n)}</span>` : `<span title="${escapar(titulo)}">${dec(n)}</span>`;
  };
  const dibujar = () => {
    const r = N.consultarInsumos({ texto: filtroInv.texto || undefined, categoria: filtroInv.categoria || undefined, soloBajoMinimo: filtroInv.bajo, limite: 400 });
    $("#t-inv").innerHTML = r.encontrados
      ? `<table class="tabla-fija"><thead><tr><th>Insumo</th><th class="n">Días en Gazcue</th><th class="n">Días en Los Prados</th><th class="n">Costo</th></tr></thead><tbody>${r.insumos.map((x) => `<tr><td>${escapar(x.nombre)}</td><td class="n">${dias(x, "Gazcue")}</td><td class="n">${dias(x, "Los Prados")}</td><td class="n">${rd(x.costo)}</td></tr>`).join("")}</tbody></table>`
      : `<p class="vacio">Ningún insumo coincide.</p>`;
  };
  dibujar();
  const menu = N.buscarProductos({ limite: 400, orden: "mas_vendidos" });
  $("#t-menu").innerHTML = tabla(["Producto", "Precio", "Margen", "Vendidas en 30 días"], menu.productos.map((p) => [
    `${escapar(p.nombre)}${p.por_encargo ? ' <span class="insignia">Encargo</span>' : ""}`, rd(p.precio_sin_itbis), porcentaje(p.margen_pct),
    p.unidades_vendidas_30_dias ? num(p.unidades_vendidas_30_dias) : '<span class="insignia media">Sin ventas</span>',
  ]));
  $("#inv-texto").addEventListener("input", (e) => { filtroInv.texto = e.target.value; dibujar(); });
  $("#inv-cat").addEventListener("change", (e) => { filtroInv.categoria = e.target.value; dibujar(); });
  $("#inv-bajo").addEventListener("change", (e) => { filtroInv.bajo = e.target.checked; dibujar(); });
}

function pintarCobros(raiz) {
  const c = N.cuentasPorCobrar({ limite: 200 });
  const t = c.tramos_por_dias_de_atraso;
  const situacion = (x) => (x.sobre_limite ? '<span class="insignia alta">Sobre el límite</span>'
    : x.dias_mayor_atraso > 30 ? '<span class="insignia media">Atrasado</span>'
    : x.dias_mayor_atraso > 0 ? '<span class="insignia">Vencido</span>' : '<span class="insignia ok">Al día</span>');
  raiz.innerHTML = `
    <div class="cifras">
      ${cifra("Por cobrar", rd(c.total_por_cobrar))}
      ${cifra("Al día", rd(t.al_dia))}
      ${cifra("Vencido 1 a 30 días", rd(t["1_30"]))}
      ${cifra("Vencido 31 a 60 días", rd(t["31_60"]))}
      ${cifra("Vencido más de 60 días", rd(t.mas_60), "", { alerta: t.mas_60 > 0 })}
    </div>
    ${tarjeta("Clientes con saldo", tabla(["Cliente", "Saldo", "Vencido", "Atraso", "Límite", ""], c.clientes.map((x) => [
      escapar(x.cliente), rd(x.saldo), rd(x.vencido), x.dias_mayor_atraso ? `${x.dias_mayor_atraso} días` : "—", rd(x.limite_credito), situacion(x),
    ])))}`;
}

function pintarPedidos(raiz) {
  const d = N.datos();
  const pedidos = N.todosLosPedidos();
  const atenciones = leerEstado().atenciones.filter((a) => !a.atendida);
  const canal = (c) => `<span class="insignia${c === "WhatsApp" ? " whatsapp" : ""}">${escapar(c)}</span>`;
  raiz.innerHTML = `${botonesPedidos()}
    ${atenciones.length ? tarjeta("Esperan a una persona", `<ul class="alertas">${atenciones.map((a) => `<li class="media"><span class="punto"></span><div class="texto"><b>${escapar(a.nombre || "Cliente de WhatsApp")} · ${a.hora}</b><span>${escapar(a.motivo)}</span></div><button class="boton secundario pequeno" data-atender="${a.id}">Atendido</button></li>`).join("")}</ul>`) : ""}
    <div class="tablero">${ESTADOS.map((e) => {
      // "Entregado hoy": los de hoy y los que se entregaron durante la demo.
      const lista = pedidos.filter((p) => p.estado === e && (e !== "entregado" || p.fecha === d.hoy || p.cambioEnLaDemo));
      return `<div class="columna" data-estado="${e}"><h3><span>${e[0].toUpperCase() + e.slice(1)}${e === "entregado" ? " hoy" : ""}</span><span>${lista.length}</span></h3>${lista.length ? "" : `<p class="vacio">Sin pedidos</p>`}${lista.map((p) => `
        <article class="pedido ${p.id === ultimoPedidoNuevo ? "nuevo-llegado" : ""}" data-id="${p.id}">
          <div class="cabeza"><b>${p.id}</b>${canal(p.canal)}</div>
          <div class="cliente">${escapar(p.cliente)}</div>
          <div class="articulos">${p.items.map((i) => `${num(i.cantidad)} × ${escapar(i.nombre)}`).join("<br>")}</div>
          ${p.para_cuando ? `<div class="nota">Para ${escapar(p.para_cuando)}</div>` : ""}
          ${p.nota ? `<div class="nota">${escapar(p.nota)}</div>` : ""}
          ${p.novedad ? `<div class="nota novedad">${escapar(p.novedad)}</div>` : ""}
          <div class="pie"><span class="total">${rd(p.total)}</span>${e !== "entregado" ? `<button class="boton secundario pequeno" data-avanzar="${p.id}">Avanzar</button>` : ""}</div>
        </article>`).join("")}</div>`;
    }).join("")}</div>`;
  conectarBotones(raiz);
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
  raiz.innerHTML = tarjeta("Alertas activas", `<div id="todas-alertas">${listaAlertas(N.alertas())}</div>`);
}

function actualizarContadores() {
  const nuevos = N.todosLosPedidos().filter((p) => p.estado === "nuevo").length;
  const urgentes = N.alertas().filter((a) => a.gravedad === "alta").length;
  const cp = $("#contador-pedidos"), ca = $("#contador-alertas");
  cp.textContent = nuevos; cp.classList.toggle("oculto", !nuevos);
  ca.textContent = urgentes; ca.classList.toggle("oculto", !urgentes);
}

// Chispitas: al llegar un pedido por WhatsApp saltan granitos de colores desde el pedido nuevo
// (o desde "Pedidos" en el menú si se está en otra pantalla).
const COLORES_CHISPITAS = ["#2f5fd0", "#0f766e", "#8a4300", "#22652a", "#7b4fc9", "#e08a00"];
function chispitas(id) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const origen = (id && document.querySelector(`.pedido[data-id="${id}"]`)) || document.querySelector('#nav [data-vista="pedidos"]');
  const caja = origen?.getBoundingClientRect() ?? { left: innerWidth - 300, top: innerHeight - 80, width: 200, height: 40 };
  const capa = document.createElement("div");
  capa.className = "chispitas";
  capa.setAttribute("aria-hidden", "true");
  const x = caja.left + caja.width / 2, y = caja.top + Math.min(caja.height, 60) / 2;
  for (let i = 0; i < 60; i++) {
    const angulo = Math.random() * Math.PI * 2, fuerza = 80 + Math.random() * 220;
    const g = document.createElement("i");
    g.style.cssText = `--x:${x + (Math.random() - .5) * caja.width * .6}px;--y:${y}px;--dx:${Math.cos(angulo) * fuerza}px;--dy:${Math.sin(angulo) * fuerza}px;--r:${Math.round(Math.random() * 720 - 360)}deg;--c:${COLORES_CHISPITAS[i % COLORES_CHISPITAS.length]};animation-delay:${Math.random() * 120}ms`;
    capa.appendChild(g);
  }
  document.body.appendChild(capa);
  setTimeout(() => capa.remove(), 1600);
}

function aviso(texto) {
  const el = document.createElement("div");
  const p = document.createElement("p");
  p.textContent = texto;
  el.appendChild(p);
  $("#avisos").appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

// ---------- asistente ----------

const SUGERENCIAS = [
  "¿Cómo van las ventas de este mes comparadas con el mes pasado?",
  "¿Qué insumos tengo que comprar esta semana?",
  "¿Quiénes me deben más de 30 días?",
  "¿Por qué bajó el margen de los bizcochos?",
  "¿Cómo le va a la sucursal de Los Prados?",
  "¿Qué encargos de bizcocho tengo pendientes?",
];
const conversacion = new Conversacion("panel");

function abrirAsistente(abrir = true) {
  $("#asistente").classList.toggle("abierto", abrir);
  if (abrir) setTimeout(() => $("#pregunta").focus(), 250);
}

function reiniciarChat() {
  conversacion.reiniciar();
  $("#chat").innerHTML = "";
  $("#sugerencias").innerHTML = SUGERENCIAS.map((s) => `<button type="button">${escapar(s)}</button>`).join("");
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
      if (!vistos.size) pasos.innerHTML = "";
      vistos.add(paso.etiqueta);
      pasos.querySelectorAll(".actual").forEach((s) => s.classList.remove("actual"));
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
  const ir = (vista) => { if (location.hash === `#${vista}`) mostrar(vista); else location.hash = vista; };
  document.querySelectorAll("#nav [data-vista]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.vista)));
  $("#vista").addEventListener("click", (e) => { const b = e.target.closest("[data-ir]"); if (b) ir(b.dataset.ir); });
  window.addEventListener("hashchange", () => { const v = location.hash.slice(1) || "inicio"; if (v !== vistaActual) mostrar(v); });
  $("#abrir-asistente").addEventListener("click", () => abrirAsistente(!$("#asistente").classList.contains("abierto")));
  $("#asistente-cerrar").addEventListener("click", () => abrirAsistente(false));
  $("#asistente-ampliar").addEventListener("click", () => $("#asistente").classList.toggle("amplio"));
  $("#asistente-nuevo").addEventListener("click", reiniciarChat);
  $("#sugerencias").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) enviarPregunta(b.textContent); });
  $("#formulario").addEventListener("submit", (e) => { e.preventDefault(); enviarPregunta($("#pregunta").value); });
  $("#pregunta").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarPregunta($("#pregunta").value); } });
  reiniciarChat();
  configurarPedidos({ aviso });

  alCambiar((evento) => {
    if (evento.tipo === "pedido") {
      const p = leerEstado().pedidos[0];
      ultimoPedidoNuevo = p?.id ?? null;
      const como = { manual: "Pedido registrado", documento: "Pedido creado desde el documento" }[p?.origen] ?? "Nuevo pedido por WhatsApp";
      if (p) aviso(`${como}: ${p.id} de ${p.cliente}, ${rd(p.total)}`);
      if (p?.origen === "asistente") requestAnimationFrame(() => chispitas(p.id));
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
