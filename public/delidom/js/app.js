// Delidom · Central de Pedidos (demo con datos ficticios): pizarra de hoy por ruta,
// nuevo pedido, lector de mensajes y órdenes de compra con IA, e historial.

import { montarCambiador } from "../../comun/cambiador.js";
import { leerDocumento, prepararArchivo, archivoDeEjemplo } from "../../comun/ia.js";
import { escapar } from "../../comun/formato.js";
import * as D from "./datos.js";
import * as P from "./pedidos.js";
import { mapearItem, mapearCliente, interpretarFecha, METODOS, normalizar } from "./mapeo.js";
import { armarTicket } from "./ticket.js";

montarCambiador("delidom", {
  restablecer: () => {
    P.restablecer();
    filtros = { buscar: "", ruta: "", estado: "" };
    $("#wa-txt").value = "";
    pintarTodo();
  },
});

const $ = (s, raiz = document) => raiz.querySelector(s);
const $$ = (s, raiz = document) => [...raiz.querySelectorAll(s)];

// ---------- fechas ----------

const fechaEnPalabras = (iso, conAnio = true) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? "")) return "";
  const t = new Date(`${iso}T12:00:00`).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}) });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
const cuando = (iso) => (iso === P.hoy() ? "hoy" : iso === D.sumarDias(P.hoy(), 1) ? "mañana" : fechaCorta(iso));

function escribirFechaCabecera() {
  const d = new Date();
  const dia = d.toLocaleDateString("es-DO", { weekday: "long" });
  const resto = d.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  const hora = d.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit", hour12: true });
  $("#hoy-fecha").textContent = `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${resto} · ${hora}`;
}
escribirFechaCabecera();
setInterval(escribirFechaCabecera, 60_000);

// ---------- aviso flotante (con deshacer) ----------

let temporizador = null;
function avisar(texto, accion) {
  const t = $("#toast");
  t.innerHTML = `<span>${escapar(texto)}</span>${accion ? `<button type="button">${escapar(accion.texto)}</button>` : ""}`;
  if (accion) t.querySelector("button").addEventListener("click", () => { accion.fn(); t.classList.remove("visible"); });
  t.classList.add("visible");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => t.classList.remove("visible"), accion ? 6000 : 3500);
}

// ---------- pestañas ----------

const PANTALLAS = ["hoy", "nuevo", "pegar", "hist"];
function ir(nombre) {
  if (!PANTALLAS.includes(nombre)) nombre = "hoy";
  for (const n of PANTALLAS) $(`#p-${n}`).classList.toggle("act", n === nombre);
  $$(".tabs [data-ir]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.ir === nombre)));
  if (location.hash !== `#${nombre}`) history.replaceState(null, "", `#${nombre}`);
  if (nombre === "hist") pintarHistorial();
  window.scrollTo({ top: 0 });
}
$$(".tabs [data-ir]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.ir)));

// Modo pizarra: la pantalla grande de despacho, para leer a distancia.
const botonPizarra = $("#modo-pizarra");
function modoPizarra(activar) {
  document.body.classList.toggle("modo-pizarra", activar);
  botonPizarra.setAttribute("aria-pressed", String(activar));
  if (activar) ir("hoy");
}
botonPizarra.addEventListener("click", () => modoPizarra(!document.body.classList.contains("modo-pizarra")));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("modo-pizarra") && !document.querySelector("dialog[open]")) modoPizarra(false);
});

// ---------- pedidos de hoy ----------

let filtros = { buscar: "", ruta: "", estado: "" };
let resaltar = null;

const ICONOS = {
  total: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
  pendiente: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  preparacion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  despachado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>',
};

const coincide = (p) => {
  const q = normalizar(filtros.buscar);
  if (q && !normalizar(`${p.cliente} ${D.resumenPedido(p)}`).includes(q)) return false;
  if (filtros.ruta === "sin" ? p.ruta : filtros.ruta && p.ruta !== filtros.ruta) return false;
  if (filtros.estado && filtros.estado !== "despachado" && p.estado !== filtros.estado) return false;
  return true;
};

function tarjeta(p) {
  const est = D.ESTADOS[p.estado];
  const entrega = p.fecha_entrega && p.fecha_entrega !== P.hoy() ? `<span class="chip entrega">Entrega ${escapar(cuando(p.fecha_entrega))}</span>` : "";
  const ia = p.origen === "texto_ia" || p.origen === "pdf_ia" ? `<span class="chip ia" title="Leído con IA y confirmado por una persona">✨ ${p.origen === "pdf_ia" ? "Orden leída con IA" : "Mensaje leído con IA"}</span>` : "";
  return `
  <article class="pedido ${p.estado}" data-id="${escapar(p.id)}">
    <div class="cuerpo">
      <div>
        <div class="l1"><span class="cli">${escapar(p.cliente)}</span><span class="estado ${p.estado}">${est.nombre}</span><span class="hora">Recibido ${D.horaTexto(p.recibido)}</span></div>
        <div class="items">${escapar(D.resumenPedido(p))}</div>
        ${p.nota ? `<div class="nota">✎ ${escapar(p.nota)}</div>` : ""}
      </div>
      <div class="meta"><span class="chip ruta">${escapar(D.nombreRuta(p.ruta))}</span><span class="chip">${escapar(p.canal)}</span>${p.numero_externo ? `<span class="chip">OC ${escapar(p.numero_externo)}</span>` : ""}${entrega}${ia}</div>
    </div>
    <div class="pedido-acciones">
      <button type="button" class="accion ${p.estado}" data-accion="avanzar">${est.accion}</button>
      <div class="acciones-sec">
        <button type="button" class="btn-chico" data-accion="ticket">🖨 Imprimir ticket</button>
        ${p.estado === "preparacion" ? '<button type="button" class="btn-chico" data-accion="volver" title="Volver a pendiente">↶</button>' : ""}
      </div>
    </div>
  </article>`;
}

function pintarHoy() {
  const todos = P.pedidosDeHoy().filter((p) => p.estado !== "anulado");
  const cuenta = (e) => todos.filter((p) => p.estado === e).length;
  const activos = todos.filter((p) => p.estado === "pendiente" || p.estado === "preparacion");
  $("#cont-hoy").textContent = activos.length;

  const kpis = [["total", "", todos.length, "Pedidos de hoy"], ["pendiente", "pen", cuenta("pendiente"), "Pendientes"], ["preparacion", "pre", cuenta("preparacion"), "En preparación"], ["despachado", "des", cuenta("despachado"), "Despachados"]];
  $("#kpis").innerHTML = kpis.map(([clave, cls, n, l]) => `<button type="button" class="kpi ${cls}" data-kpi="${clave === "total" ? "" : clave}" aria-pressed="${filtros.estado === clave || (clave === "total" && !filtros.estado)}"><span class="n">${n}</span><span class="l">${l}</span><span class="ico" aria-hidden="true">${ICONOS[clave]}</span></button>`).join("");

  // Fichas: cuántos pedidos faltan por despachar en cada ruta.
  const porRuta = new Map();
  for (const p of activos) porRuta.set(p.ruta ?? "sin", (porRuta.get(p.ruta ?? "sin") ?? 0) + 1);
  const fichas = [`<button type="button" class="ficha-ruta" data-ruta="" aria-pressed="${!filtros.ruta}">Todas las rutas <b>${activos.length}</b></button>`];
  for (const r of D.RUTAS) if (porRuta.has(r.id)) fichas.push(`<button type="button" class="ficha-ruta" data-ruta="${r.id}" aria-pressed="${filtros.ruta === r.id}" title="${escapar(r.zona)}">${escapar(r.nombre)} <b>${porRuta.get(r.id)}</b></button>`);
  if (porRuta.has("sin")) fichas.push(`<button type="button" class="ficha-ruta alerta" data-ruta="sin" aria-pressed="${filtros.ruta === "sin"}">⚠ Sin ruta <b>${porRuta.get("sin")}</b></button>`);
  $("#fichas-rutas").innerHTML = fichas.join("");

  const total = todos.length || 1;
  $("#seg-pen").style.width = `${(cuenta("pendiente") / total) * 100}%`;
  $("#seg-pre").style.width = `${(cuenta("preparacion") / total) * 100}%`;
  $("#seg-des").style.width = `${(cuenta("despachado") / total) * 100}%`;
  $("#ev-total").textContent = `${todos.length} pedidos · ${Math.round((cuenta("despachado") / total) * 100)} % despachado`;
  $("#ev-leyenda").innerHTML = `<span><i class="punto pen"></i>Pendientes ${cuenta("pendiente")}</span><span><i class="punto pre"></i>En preparación ${cuenta("preparacion")}</span><span><i class="punto des"></i>Despachados ${cuenta("despachado")}</span>`;

  $("#f-ruta").value = filtros.ruta;
  $("#f-estado").value = filtros.estado === "despachado" ? "" : filtros.estado;

  // La pizarra agrupada por ruta: «¿qué va en cada camión?»
  const visibles = activos.filter(coincide);
  const grupos = [...D.RUTAS.map((r) => r.id), null].map((id) => ({ id, pedidos: visibles.filter((p) => (p.ruta ?? null) === id) })).filter((g) => g.pedidos.length);
  $("#pizarra").innerHTML = grupos.length
    ? grupos.map((g) => {
      const r = D.RUTAS.find((x) => x.id === g.id);
      const n = `${g.pedidos.length} ${g.pedidos.length === 1 ? "pedido" : "pedidos"}`;
      return `<section class="grupo-ruta${g.id ? "" : " sin-ruta"}"><h3>${g.id ? `🚚 ${escapar(r.nombre)} <small>${escapar(r.zona)} · ${n}</small>` : `⚠ Sin ruta <small>asignar antes de despachar · ${n}</small>`}</h3><div class="pedidos">${g.pedidos.map(tarjeta).join("")}</div></section>`;
    }).join("")
    : `<div class="vacio">${activos.length ? "No hay pedidos con esos filtros." : "Todo despachado por hoy. 🎉"}</div>`;

  const despachados = todos.filter((p) => p.estado === "despachado").sort((a, b) => (b.despacho ?? 0) - (a.despacho ?? 0));
  $("#n-des").textContent = despachados.length;
  $("#des-total").textContent = despachados.length ? `· ${despachados.reduce((s, p) => s + D.bultosPedido(p), 0)} bultos` : "";
  $("#lista-des").innerHTML = despachados.map((p) => `<div class="des-item"><span class="check">✓</span><span><b>${escapar(p.cliente)}</b> · ${escapar(D.resumenPedido(p))}</span><span class="hora-d">${escapar(D.nombreRuta(p.ruta))} · ${p.despacho ? D.horaTexto(p.despacho) : ""}</span></div>`).join("") || '<div class="des-item">Todavía no sale ningún camión.</div>';
  if (filtros.estado === "despachado") $("#despachados").open = true;

  if (resaltar) {
    const el = document.querySelector(`.pedido[data-id="${CSS.escape(resaltar)}"]`);
    resaltar = null;
    if (el) { el.classList.add("recien"); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }
}

$("#f-ruta").innerHTML = `<option value="">Todas las rutas</option>${D.RUTAS.map((r) => `<option value="${r.id}">${escapar(r.nombre)} · ${escapar(r.zona)}</option>`).join("")}<option value="sin">Sin ruta</option>`;
$("#f-buscar").addEventListener("input", (e) => { filtros.buscar = e.target.value; pintarHoy(); });
$("#f-ruta").addEventListener("change", (e) => { filtros.ruta = e.target.value; pintarHoy(); });
$("#f-estado").addEventListener("change", (e) => { filtros.estado = e.target.value; pintarHoy(); });
$("#f-limpiar").addEventListener("click", () => { filtros = { buscar: "", ruta: "", estado: "" }; $("#f-buscar").value = ""; pintarHoy(); });
$("#kpis").addEventListener("click", (e) => {
  const b = e.target.closest("[data-kpi]");
  if (!b) return;
  filtros.estado = filtros.estado === b.dataset.kpi ? "" : b.dataset.kpi;
  pintarHoy();
  if (filtros.estado === "despachado") $("#despachados").scrollIntoView({ block: "start", behavior: "smooth" });
});
$("#fichas-rutas").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ruta]");
  if (b) { filtros.ruta = b.dataset.ruta; pintarHoy(); }
});
$("#pizarra").addEventListener("click", (e) => {
  const b = e.target.closest("[data-accion]");
  if (!b) return;
  const id = b.closest("[data-id]").dataset.id;
  const p = P.pedido(id);
  if (b.dataset.accion === "ticket") return abrirTicket(p);
  if (b.dataset.accion === "volver") { P.fijarEstado(id, "pendiente"); avisar(`${p.cliente} volvió a pendiente`); return; }
  const anterior = P.avanzar(id);
  const ahora = P.pedido(id);
  avisar(`${p.cliente} → ${ahora.estado === "despachado" ? "despachado ✓" : "en preparación"}`, { texto: "↶ Deshacer", fn: () => P.fijarEstado(id, anterior) });
});

// ---------- ticket ----------

const ventanaTicket = $("#ventana-ticket");
function abrirTicket(p) {
  $("#ticket-marco").srcdoc = armarTicket(p);
  ventanaTicket.showModal();
}
ventanaTicket.querySelector("[data-cerrar]").addEventListener("click", () => ventanaTicket.close());
ventanaTicket.addEventListener("click", (e) => { if (e.target === ventanaTicket) ventanaTicket.close(); });
$("#ticket-imprimir").addEventListener("click", () => $("#ticket-marco").contentWindow?.print());

// ---------- nuevo pedido ----------

let cantidades = {};
const opcionRuta = (sel) => `${D.RUTAS.map((r) => `<option value="${r.id}"${sel === r.id ? " selected" : ""}>${escapar(r.nombre)} · ${escapar(r.zona)}</option>`).join("")}`;

function opcionesClientes(seleccionado) {
  const lista = [...P.clientes()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return `<option value="">— Seleccionar cliente —</option>${lista.map((c) => `<option value="${c.id}"${c.id === seleccionado ? " selected" : ""}>${escapar(c.nombre)} — ${escapar(c.direccion.split(",").at(-1).trim())}</option>`).join("")}`;
}

function pintarNuevo() {
  const actual = Number($("#sel-cli").value) || null;
  $("#sel-cli").innerHTML = `${opcionesClientes(actual)}<option value="nuevo">➕ Agregar cliente nuevo…</option>`;
  $("#nc-ruta").innerHTML = opcionRuta("1");
  pintarProductos();
}

function pintarProductos() {
  const q = normalizar($("#buscar-prod").value);
  const lista = D.PRODUCTOS.filter((p) => !q || normalizar(`${p.nombre} ${p.descripcion} ${p.categoria}`).includes(q));
  let cat = null;
  const html = [];
  for (const p of lista) {
    if (p.categoria !== cat) { cat = p.categoria; html.push(`<div class="cat">${escapar(cat)}</div>`); }
    const n = cantidades[p.id] ?? 0;
    const unidad = p.presentacion === "GL" ? "galón" : p.presentacion === "LB" ? "funda 5 lb" : `fardo de ${p.por_bulto}`;
    html.push(`<div class="prod${n ? " con" : ""}"><span class="nm">${escapar(p.nombre)} <small>· ${unidad}</small></span><div class="qty"><button type="button" data-prod="${p.id}" data-d="-1" aria-label="Quitar uno de ${escapar(p.nombre)}">−</button><span>${n}</span><button type="button" data-prod="${p.id}" data-d="1" aria-label="Agregar uno de ${escapar(p.nombre)}">+</button></div></div>`);
  }
  $("#prods-form").innerHTML = html.join("") || '<div class="vacio">No hay productos con ese nombre.</div>';
}

$("#buscar-prod").addEventListener("input", pintarProductos);
$("#prods-form").addEventListener("click", (e) => {
  const b = e.target.closest("[data-prod]");
  if (!b) return;
  const id = Number(b.dataset.prod);
  cantidades[id] = Math.max(0, (cantidades[id] ?? 0) + Number(b.dataset.d));
  if (!cantidades[id]) delete cantidades[id];
  pintarProductos();
});
$("#sel-cli").addEventListener("change", (e) => {
  const v = e.target.value;
  $("#nuevo-cli").hidden = v !== "nuevo";
  const c = P.cliente(Number(v));
  $("#auto-cli").hidden = !c;
  if (c) $("#auto-cli").innerHTML = `📍 ${escapar(c.direccion)} · 📞 ${escapar(c.telefono)} · 🚚 ${escapar(D.nombreRuta(c.ruta))}`;
});
function ecoFecha(campo, eco, aviso) {
  eco.textContent = fechaEnPalabras(campo.value);
  if (aviso) aviso.hidden = !(campo.value && campo.value < P.hoy());
}
$("#in-fecha").addEventListener("input", () => ecoFecha($("#in-fecha"), $("#eco-fecha"), $("#aviso-fecha")));

function reiniciarNuevo() {
  cantidades = {};
  $("#form-nuevo").reset();
  $("#in-fecha").value = D.sumarDias(P.hoy(), 1);
  ecoFecha($("#in-fecha"), $("#eco-fecha"), $("#aviso-fecha"));
  $("#nuevo-cli").hidden = true;
  $("#auto-cli").hidden = true;
  $("#err-nuevo").hidden = true;
  pintarNuevo();
}

$("#form-nuevo").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#err-nuevo");
  const v = $("#sel-cli").value;
  let clienteId = Number(v) || null;
  const items = Object.entries(cantidades).map(([id, cantidad]) => {
    const p = D.productoPorId.get(Number(id));
    return { producto_id: p.id, cantidad, unidad: p.unidad, unidades_por_bulto: p.por_bulto };
  });
  const faltas = [];
  if (v === "nuevo" && !$("#nc-nombre").value.trim()) faltas.push("el nombre del cliente nuevo");
  if (!v) faltas.push("el cliente");
  if (!items.length) faltas.push("al menos un producto");
  if (!$("#in-fecha").value) faltas.push("la fecha de entrega");
  if (faltas.length) { err.textContent = `Falta ${faltas.join(", ")}.`; err.hidden = false; return; }
  if ($("#in-fecha").value < P.hoy() && !confirm(`La fecha de entrega (${fechaEnPalabras($("#in-fecha").value)}) ya pasó. ¿Guardar igual?`)) return;
  if (v === "nuevo") {
    clienteId = P.agregarCliente({ nombre: $("#nc-nombre").value.trim(), direccion: $("#nc-dir").value.trim() || "Sin dirección", telefono: $("#nc-tel").value.trim() || "—", ruta: $("#nc-ruta").value }).id;
  }
  const p = P.crearPedido({ cliente_id: clienteId, items, canal: $("#sel-canal").value, origen: "manual", nota: $("#in-nota").value.trim(), fecha_entrega: $("#in-fecha").value });
  resaltar = p.id;
  reiniciarNuevo();
  ir("hoy");
  pintarHoy();
  avisar(`✓ Pedido guardado — visible para todo el equipo en «Pedidos»`);
});

// ---------- pegar mensaje o subir el PDF / la foto ----------

const EJEMPLOS_TEXTO = [
  { nombre: "Doña Mati (WhatsApp)", texto: "Hola mi amor buen día 🙏 me manda para mañana 4 galones de chinola y 2 de limón porfa, antes de las 9 que abro la cafetería. Gracias!! — Doña Mati" },
  { nombre: "Catering Fiesta Real", texto: "Buenas tardes, de parte de Catering Fiesta Real. Para el sábado necesitamos 6 galones de piña, 3 galones de tamarindo, 2 jugos de naranja y 3 fundas de pulpa de mango. Lo recibe Ramón en la cocina. Gracias" },
  { nombre: "Heladería Coco Frío", texto: "Saludos! Heladería Coco Frío. Mándeme el jueves 5 fundas de pulpa de fresa, 4 fundas de pulpa de guanábana y 1 pulpa de chinola. Toque en el portón azul 👍" },
];
const EJEMPLOS_ARCHIVO = [
  { nombre: "📄 Orden de compra · Supermercado La Cadena", ruta: "ejemplos/orden-compra-la-cadena.pdf" },
  { nombre: "📷 Foto de un pedido escrito a mano", ruta: "ejemplos/pedido-escrito-a-mano.jpg" },
];
$("#ejemplos-texto").innerHTML = `<span style="font-size:12.5px;color:var(--gris);align-self:center">¿Sin mensaje a mano? Use un ejemplo:</span>${EJEMPLOS_TEXTO.map((x, i) => `<button type="button" class="ejemplo" data-ej="${i}">${escapar(x.nombre)}</button>`).join("")}`;
$("#ejemplos-archivo").innerHTML = EJEMPLOS_ARCHIVO.map((x, i) => `<button type="button" class="ejemplo archivo" data-ejarch="${i}">${escapar(x.nombre)}</button>`).join("");
$("#ejemplos-texto").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ej]");
  if (b) { $("#wa-txt").value = EJEMPLOS_TEXTO[b.dataset.ej].texto; $("#wa-txt").focus(); }
});
$("#ejemplos-archivo").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ejarch]");
  if (!b) return;
  const ej = EJEMPLOS_ARCHIVO[b.dataset.ejarch];
  try {
    const archivo = await archivoDeEjemplo(ej.ruta);
    window.open(ej.ruta, "_blank", "noopener"); // se ve el documento original al lado
    leer({ archivo });
  } catch (error) { mostrarError(error.message); }
});

$("#leer-texto").addEventListener("click", () => {
  const texto = $("#wa-txt").value.trim();
  if (!texto) { mostrarError("Pegue primero el mensaje del cliente, o use uno de los ejemplos."); return; }
  leer({ texto });
});
$("#buscar-archivo").addEventListener("click", () => $("#archivo").click());
$("#archivo").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (f) subirArchivo(f);
});
const suelta = $("#suelta");
["dragenter", "dragover"].forEach((ev) => suelta.addEventListener(ev, (e) => { e.preventDefault(); suelta.classList.add("encima"); }));
["dragleave", "drop"].forEach((ev) => suelta.addEventListener(ev, () => suelta.classList.remove("encima")));
suelta.addEventListener("drop", (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) subirArchivo(f); });

async function subirArchivo(f) {
  try {
    if (/\.(heic|heif)$/i.test(f.name)) throw new Error("Las fotos HEIC del iPhone no se pueden leer: envíela como JPG o en PDF.");
    leer({ archivo: await prepararArchivo(f) });
  } catch (error) { mostrarError(error.message); }
}

function mostrarError(texto) {
  const caja = $("#ia-error");
  caja.textContent = texto;
  caja.hidden = !texto;
}

const CONTEXTO = "Proveedor: Delidom SRL (jugos y pulpas). Transcribe el pedido del cliente con entregar_pedido.";

async function leer({ archivo = null, texto = "" }) {
  mostrarError("");
  $("#ia-vacio").hidden = true;
  $("#ia-res").hidden = true;
  $("#ia-pensando").hidden = false;
  $("#suelta-nombre").hidden = !archivo;
  if (archivo) $("#suelta-nombre").textContent = `📎 ${archivo.nombre}`;
  $$("#leer-texto, #buscar-archivo, [data-ejarch]").forEach((b) => { b.disabled = true; });
  try {
    const salida = await leerDocumento("delidom-lector", { archivo, texto, contexto: CONTEXTO, herramienta: "entregar_pedido" });
    P.guardarBorrador(construirBorrador(salida, { archivo, texto }));
    pintarBorrador();
  } catch (error) {
    mostrarError(error.message || "No se pudo leer. Vuelva a intentar.");
    if (!P.leerBorrador()) $("#ia-vacio").hidden = false;
    else pintarBorrador();
  } finally {
    $("#ia-pensando").hidden = true;
    $$("#leer-texto, #buscar-archivo, [data-ejarch]").forEach((b) => { b.disabled = false; });
  }
}

// La salida de la IA (solo transcripción) pasa por el calce del panel.
export function construirBorrador(salida, { archivo = null } = {}) {
  const cli = mapearCliente(salida.cliente, P.clientes());
  const fecha = interpretarFecha(salida.fecha_entrega);
  const cat = P.catalogo();
  return {
    origen: archivo ? "pdf_ia" : "texto_ia",
    canal: archivo ? (archivo.tipo === "image" ? "WhatsApp" : "Correo") : "WhatsApp",
    fuente: archivo ? archivo.nombre : "mensaje pegado",
    cliente_leido: salida.cliente ?? null,
    cliente_id: cli.cliente_id, cliente_motivo: cli.motivo, cliente_candidatos: cli.candidatos.map((c) => c.id),
    ruta: cli.cliente_id ? P.cliente(cli.cliente_id).ruta : null,
    fecha_leida: salida.fecha_entrega ?? null, fecha_iso: fecha.iso, fecha_opciones: fecha.opciones, fecha_dicha: salida.fecha_dicha ?? null,
    numero_externo: salida.numero_externo ?? null, contacto: salida.contacto ?? null, entregar_en: salida.entregar_en ?? null,
    condicion_pago: salida.condicion_pago ?? null, nota: salida.nota ?? "",
    lineas: (salida.items ?? []).map((it) => {
      const m = mapearItem(it, cat, cli.cliente_id);
      return {
        item: { descripcion: it.descripcion, codigo_externo: it.codigo_externo ?? null, ean: it.ean ?? null },
        producto_id: m.producto_id, metodo: m.metodo, supuesto: m.supuesto, motivo: m.motivo,
        candidatos: m.candidatos.map((c) => c.id), cantidad: it.cantidad, unidad: m.unidad,
        unidades_por_bulto: m.unidades_por_bulto ?? null, a_mano: false,
      };
    }),
  };
}

function opcionesProducto(linea) {
  const sugeridos = linea.candidatos.map((id) => D.productoPorId.get(id)).filter(Boolean);
  const grupos = new Map();
  for (const p of D.PRODUCTOS) { if (!grupos.has(p.categoria)) grupos.set(p.categoria, []); grupos.get(p.categoria).push(p); }
  const op = (p) => `<option value="${p.id}"${p.id === linea.producto_id ? " selected" : ""}>${escapar(p.nombre)}${p.presentacion === "GL" ? " · galón" : p.presentacion === "LB" ? " · funda" : ""}</option>`;
  return `<option value="">— Elegir producto —</option>${sugeridos.length ? `<optgroup label="Sugeridos">${sugeridos.map(op).join("")}</optgroup>` : ""}${[...grupos].map(([cat, ps]) => `<optgroup label="${escapar(cat)}">${ps.map(op).join("")}</optgroup>`).join("")}`;
}

function faltantes(b) {
  const f = [];
  if (!b.cliente_id) f.push("Elegir el cliente");
  if (!b.fecha_iso) f.push(b.fecha_opciones.length ? `Confirmar la fecha de entrega («${b.fecha_leida}» se puede leer de dos formas)` : "Poner la fecha de entrega");
  const sinProducto = b.lineas.filter((l) => !l.producto_id).length;
  if (sinProducto) f.push(`Elegir el producto en ${sinProducto} ${sinProducto === 1 ? "línea" : "líneas"}`);
  if (b.lineas.some((l) => !(Number(l.cantidad) > 0))) f.push("Revisar las cantidades");
  if (!b.lineas.length) f.push("El pedido no tiene líneas");
  return f;
}

function pintarBorrador() {
  const b = P.leerBorrador();
  const caja = $("#ia-res");
  if (!b) { caja.hidden = true; $("#ia-vacio").hidden = false; return; }
  $("#ia-vacio").hidden = true;
  caja.hidden = false;
  const candidatosCli = b.cliente_candidatos.map((id) => P.cliente(id)).filter(Boolean);
  const lista = [...P.clientes()].sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));
  const opCli = (c) => `<option value="${c.id}"${c.id === b.cliente_id ? " selected" : ""}>${escapar(c.nombre)}</option>`;
  const fila = (etq, html) => `<tr><td>${etq}</td><td>${html}</td></tr>`;
  const texto = (v) => (v ? escapar(v) : '<span style="color:var(--gris)">—</span>');

  const fechaHtml = `
    <input type="date" data-campo="fecha" value="${escapar(b.fecha_iso ?? "")}">
    <div class="fecha-eco">${escapar(fechaEnPalabras(b.fecha_iso ?? ""))}</div>
    ${b.fecha_opciones.length && !b.fecha_iso ? `<div class="aviso-ambar">La orden dice «${escapar(b.fecha_leida)}», que se puede leer de dos formas. ¿Cuál es?<div class="ambigua">${b.fecha_opciones.map((iso) => `<button type="button" data-fecha="${iso}">${escapar(fechaEnPalabras(iso, false))}</button>`).join("")}</div></div>` : ""}
    ${b.fecha_dicha ? `<div class="ia-motivo">El cliente escribió «${escapar(b.fecha_dicha)}»: ${b.fecha_iso ? "confirme que la fecha es correcta" : "elija la fecha"}.</div>` : ""}
    ${!b.fecha_iso && !b.fecha_opciones.length && !b.fecha_dicha ? '<div class="ia-motivo">⚠ El pedido no dice la fecha de entrega.</div>' : ""}`;

  const lineas = b.lineas.map((l, i) => {
    const p = D.productoPorId.get(l.producto_id);
    const clase = !l.producto_id ? "falta" : l.supuesto && !l.a_mano ? "rev" : "";
    const codigos = [l.item.ean ? `EAN ${escapar(l.item.ean)}` : "", l.item.codigo_externo ? `Código del cliente ${escapar(l.item.codigo_externo)}` : ""].filter(Boolean).join(" · ");
    const bulto = l.unidad === "FDO" && (l.unidades_por_bulto ?? p?.por_bulto) && p?.presentacion !== "LB" ? (l.unidades_por_bulto ?? p.por_bulto) : null;
    const nota = !l.producto_id
      ? `<div class="bed-nota falta">✗ ${escapar(l.motivo ?? "elija el producto")}</div>`
      : l.a_mano ? '<div class="bed-nota ok">✓ Elegido por usted: se aprenderá para la próxima vez</div>'
        : l.supuesto ? `<div class="bed-nota rev">⚠ Supuesto: ${escapar(l.motivo)}. Confirme o cambie el producto.</div>`
          : `<div class="bed-nota ok">✓ Calzó por ${escapar(METODOS[l.metodo] ?? "el catálogo")}</div>`;
    return `<div class="linea-ia ${clase}" data-linea="${i}">
      <div class="bed-orig">${l.item.descripcion ? `En el pedido: <q>${escapar(l.item.descripcion)}</q>` : "Línea agregada a mano"}</div>
      ${codigos ? `<div class="bed-codigos">${codigos}</div>` : ""}
      <div class="bed-linea">
        <select data-campo="producto" aria-label="Producto de Delidom">${opcionesProducto(l)}</select>
        <input class="bed-cant" type="number" min="0" step="1" data-campo="cantidad" value="${escapar(l.cantidad ?? "")}" aria-label="Cantidad">
        <span class="bed-unidad">${escapar(D.unidadCorta(p, l.unidad))}</span>
        <button type="button" class="bed-quitar" data-quitar aria-label="Quitar la línea">✕</button>
      </div>
      ${bulto ? `<div class="bed-equiv">${escapar(l.cantidad)} FDO × ${bulto} UN = ${Math.round(Number(l.cantidad) * bulto)} unidades</div>` : ""}
      ${nota}
    </div>`;
  }).join("");

  const f = faltantes(b);
  const porRevisar = b.lineas.filter((l) => !l.producto_id || (l.supuesto && !l.a_mano)).length;
  caja.innerHTML = `
    <div class="ia-cab"><span class="chip-ia">IA</span> BORRADOR — nada se guarda hasta que usted confirme <span style="margin-left:auto;font-weight:600;color:var(--gris)">${escapar(b.fuente)}</span></div>
    <table class="ia-tabla">
      ${fila("Cliente", `<select data-campo="cliente"><option value="">— Elegir cliente —</option>${candidatosCli.length ? `<optgroup label="Parecidos">${candidatosCli.map(opCli).join("")}</optgroup>` : ""}<optgroup label="Todos los clientes">${lista.map(opCli).join("")}</optgroup></select>${b.cliente_leido ? `<div class="bed-codigos">La IA leyó: «${escapar(b.cliente_leido)}»</div>` : ""}${b.cliente_motivo && !b.cliente_id ? `<div class="ia-motivo">${escapar(b.cliente_motivo)}</div>` : ""}`)}
      ${fila("Ruta", `<select data-campo="ruta">${opcionRuta(b.ruta)}<option value=""${b.ruta ? "" : " selected"}>Sin ruta</option></select>`)}
      ${fila("Fecha de entrega", fechaHtml)}
      ${b.numero_externo ? fila("N.º de orden", texto(b.numero_externo)) : ""}
      ${b.contacto ? fila("Contacto", texto(b.contacto)) : ""}
      ${b.entregar_en ? fila("Entregar en", texto(b.entregar_en)) : ""}
      ${b.condicion_pago ? fila("Condición de pago", texto(b.condicion_pago)) : ""}
      ${fila("Nota para despacho", `<input type="text" data-campo="nota" value="${escapar(b.nota ?? "")}" placeholder="Sin nota">`)}
    </table>
    <div class="lineas-tit"><b>Productos</b><span>${b.lineas.length} ${b.lineas.length === 1 ? "línea" : "líneas"}${porRevisar ? ` · ${porRevisar} por revisar` : " · todas calzaron"}</span></div>
    ${lineas}
    <button type="button" class="bed-mas" data-agregar>+ Agregar línea</button>
    ${f.length ? `<div class="ia-falta">Antes de crear el pedido:<ul>${f.map((x) => `<li>${escapar(x)}</li>`).join("")}</ul></div>` : ""}
    <button class="btn-ppal" type="button" data-confirmar ${f.length ? "disabled" : ""}>Confirmar y crear el pedido</button>
    <button class="btn-sec" type="button" data-descartar>Descartar borrador</button>`;
}

function cambiarBorrador(fn) {
  const b = P.leerBorrador();
  if (!b) return;
  fn(b);
  P.guardarBorrador(b);
  pintarBorrador();
}

$("#ia-res").addEventListener("change", (e) => {
  const campo = e.target.dataset.campo;
  if (!campo) return;
  const i = e.target.closest("[data-linea]")?.dataset.linea;
  cambiarBorrador((b) => {
    if (campo === "cliente") {
      b.cliente_id = Number(e.target.value) || null;
      b.ruta = b.cliente_id ? P.cliente(b.cliente_id).ruta : b.ruta;
    } else if (campo === "ruta") b.ruta = e.target.value || null;
    else if (campo === "fecha") { b.fecha_iso = e.target.value || null; if (b.fecha_iso) b.fecha_opciones = []; }
    else if (campo === "nota") b.nota = e.target.value;
    else if (campo === "producto") {
      const l = b.lineas[i];
      l.producto_id = Number(e.target.value) || null;
      l.a_mano = !!l.producto_id;
      const p = D.productoPorId.get(l.producto_id);
      if (p) { l.unidad = p.unidad; l.unidades_por_bulto = l.unidades_por_bulto ?? p.por_bulto; }
    } else if (campo === "cantidad") b.lineas[i].cantidad = Number(e.target.value);
  });
});

$("#ia-res").addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-fecha]")) cambiarBorrador((b) => { b.fecha_iso = t.closest("[data-fecha]").dataset.fecha; b.fecha_opciones = []; });
  else if (t.closest("[data-quitar]")) cambiarBorrador((b) => { b.lineas.splice(Number(t.closest("[data-linea]").dataset.linea), 1); });
  else if (t.closest("[data-agregar]")) cambiarBorrador((b) => { b.lineas.push({ item: { descripcion: "", codigo_externo: null, ean: null }, producto_id: null, metodo: null, supuesto: false, motivo: "elija el producto", candidatos: [], cantidad: 1, unidad: "GL", unidades_por_bulto: null, a_mano: false }); });
  else if (t.closest("[data-descartar]")) { P.guardarBorrador(null); pintarBorrador(); }
  else if (t.closest("[data-confirmar]")) confirmarBorrador();
});

function confirmarBorrador() {
  const b = P.leerBorrador();
  if (!b || faltantes(b).length) return;
  const items = b.lineas.map((l) => ({ producto_id: l.producto_id, cantidad: Number(l.cantidad), unidad: l.unidad, unidades_por_bulto: l.unidades_por_bulto }));
  const notas = [b.nota, b.entregar_en ? `Entregar en: ${b.entregar_en}` : ""].filter(Boolean).join(" · ");
  const p = P.crearPedido({ cliente_id: b.cliente_id, ruta: b.ruta, items, canal: b.canal, origen: b.origen, nota: notas, fecha_entrega: b.fecha_iso, numero_externo: b.numero_externo });
  // Lo que una persona eligió a mano se aprende: la próxima vez calza solo.
  const aprendidos = b.lineas.filter((l) => l.a_mano && l.producto_id && (l.item.codigo_externo || l.item.descripcion)).map((l) => ({
    producto_id: l.producto_id, cliente_id: b.cliente_id,
    codigo_externo: l.item.codigo_externo || null, ean: null,
    descripcion_normalizada: l.item.codigo_externo ? null : normalizar(l.item.descripcion),
  }));
  P.aprender(aprendidos);
  P.guardarBorrador(null);
  $("#wa-txt").value = "";
  $("#suelta-nombre").hidden = true;
  resaltar = p.id;
  ir("hoy");
  pintarTodo();
  avisar(`✓ Pedido de ${p.cliente} agregado a «Pedidos»${aprendidos.length ? ` · ${aprendidos.length} ${aprendidos.length === 1 ? "línea aprendida" : "líneas aprendidas"} para la próxima vez` : ""}`);
}

// ---------- historial ----------

let rango = "7dias";
function fijarRango(r) {
  rango = r;
  const hoy = P.hoy();
  const [desde, hasta] = r === "hoy" ? [hoy, hoy] : r === "ayer" ? [D.sumarDias(hoy, -1), D.sumarDias(hoy, -1)] : r === "mes" ? [`${hoy.slice(0, 8)}01`, hoy] : [D.sumarDias(hoy, -6), hoy];
  $("#h-desde").value = desde;
  $("#h-hasta").value = hasta;
  $$("#hist-rapidos [data-rango]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rango === r)));
}
$("#hist-rapidos").addEventListener("click", (e) => { const b = e.target.closest("[data-rango]"); if (b) { fijarRango(b.dataset.rango); pintarHistorial(); } });
["h-cliente", "h-desde", "h-hasta"].forEach((id) => $(`#${id}`).addEventListener("change", () => {
  if (id !== "h-cliente") $$("#hist-rapidos [data-rango]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  pintarHistorial();
}));

function filasHistorial() {
  const desde = $("#h-desde").value, hasta = $("#h-hasta").value, cli = Number($("#h-cliente").value) || null;
  return P.historial()
    .filter((p) => (!desde || p.fecha >= desde) && (!hasta || p.fecha <= hasta) && (!cli || p.cliente_id === cli))
    .sort((a, b) => (b.fecha + String(b.recibido).padStart(4, "0")).localeCompare(a.fecha + String(a.recibido).padStart(4, "0")));
}

function pintarHistorial() {
  const actual = Number($("#h-cliente").value) || null;
  $("#h-cliente").innerHTML = `<option value="">Todos los clientes</option>${[...P.clientes()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((c) => `<option value="${c.id}"${c.id === actual ? " selected" : ""}>${escapar(c.nombre)}</option>`).join("")}`;
  const filas = filasHistorial();
  const validos = filas.filter((p) => p.estado !== "anulado");
  const lineas = validos.reduce((s, p) => s + p.items.length, 0);
  const bultos = validos.reduce((s, p) => s + D.bultosPedido(p), 0);
  const porProducto = new Map();
  for (const p of validos) for (const i of p.items) porProducto.set(i.producto_id, (porProducto.get(i.producto_id) ?? 0) + Number(i.cantidad));
  const cifras = [[validos.length, "Pedidos"], [lineas, "Líneas"], [bultos, "Bultos pedidos"], [porProducto.size, "Productos distintos"], [validos.length ? (bultos / validos.length).toFixed(1) : "0", "Bultos por pedido"]];
  $("#hist-contador").innerHTML = cifras.map(([n, l]) => `<div><span class="n">${n}</span><span class="l">${l}</span></div>`).join("");
  $("#hist-por-producto").innerHTML = [...porProducto].sort((a, b) => b[1] - a[1]).map(([id, n]) => { const p = D.productoPorId.get(id); return `<li>${escapar(p.nombre)} · <b>${escapar(D.cantidadCorta(n, p))}</b></li>`; }).join("");
  $("#hist-conteo").textContent = `${filas.length} pedidos encontrados${filas.length > validos.length ? ` (${filas.length - validos.length} anulados, no se cuentan)` : ""}`;
  $("#hist-tabla").innerHTML = `<thead><tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Canal</th><th>Ruta</th><th>Estado</th></tr></thead><tbody>${filas.slice(0, 300).map((p) => `<tr><td>${escapar(fechaCorta(p.fecha))} · ${D.horaTexto(p.recibido)}</td><td>${escapar(p.cliente)}</td><td>${escapar(D.resumenPedido(p))}</td><td>${escapar(p.canal)}</td><td>${escapar(D.nombreRuta(p.ruta))}</td><td><span class="estado ${p.estado}">${D.ESTADOS[p.estado].nombre}</span></td></tr>`).join("") || '<tr><td colspan="6" style="text-align:center;color:var(--gris)">No hay pedidos en ese rango.</td></tr>'}</tbody>`;
}

$("#hist-exportar").addEventListener("click", () => {
  const filas = filasHistorial();
  const csv = [["Fecha", "Pedido", "Cliente", "Productos", "Canal", "Ruta", "Estado"], ...filas.map((p) => [p.fecha, p.id, p.cliente, D.resumenPedido(p), p.canal, D.nombreRuta(p.ruta), D.ESTADOS[p.estado].nombre])]
    .map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  a.download = `delidom-historial-${$("#h-desde").value}-a-${$("#h-hasta").value}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

// ---------- arranque ----------

function pintarTodo() {
  pintarHoy();
  pintarNuevo();
  pintarBorrador();
  if ($("#p-hist").classList.contains("act")) pintarHistorial();
}

P.alCambiar(() => pintarTodo()); // otra ventana de la demo cambió algo
reiniciarNuevo();
fijarRango(rango);
pintarTodo();
ir(location.hash.slice(1) || "hoy");
