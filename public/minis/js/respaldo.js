// Datos · Respaldo: 1) importar el informe de ventas de la cadena (el PDF del correo, leído
// con IA y aprobado por una persona), 2) el plan B cuando el informe no llega (digitar o
// pegar desde Excel) y 3) descargar un respaldo.

import * as N from "./negocio.js";
import { mapearReporte, contextoReporte } from "./herramientas.js";
import { leerDocumento, prepararArchivo, archivoDeEjemplo } from "../../comun/ia.js";
import { escapar, ent, fechaMedia, aviso, descargar } from "./util.js";

const EJEMPLO_PDF = "ejemplos/reporte-ventas-las-palmas.pdf";
let borrador = null;   // lectura del informe pendiente de aprobar
let leyendo = false;
let error = "";
let manual = { fecha: null, tienda: null, modo: "digitar" };
let errorManual = "";

export function pintar(caja) {
  const hoy = N.hoy();
  const sin = N.tiendasSinVentas(hoy);
  const importados = informesImportados();
  manual.fecha ??= hoy;
  manual.tienda ??= (sin[0] ?? N.TIENDAS[0]).id;

  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Importar informe de ventas de la cadena</h2>
      <p class="nota">Suba aquí el PDF que ${escapar(N.CADENA_REPORTE)} manda por correo cada mañana (antes, 37 páginas copiadas a mano en Excel). La IA lo lee, el sistema lo cuadra con las tiendas y la lista de <b>Productos</b>, y usted revisa antes de guardar: actualiza el panel y alimenta la conciliación, sin digitar nada.</p>
      ${borrador ? revision() : `<div class="zona-carga" id="zona">
        <div class="emoji">🍒📄</div>
        <p><b>Arrastre el PDF del informe</b> o una foto, o elíjalo abajo.<br>La lectura tarda unos 30 segundos.</p>
        <div class="acciones">
          <label class="boton claro">Elegir archivo<input type="file" id="archivo" accept="application/pdf,image/jpeg,image/png,image/webp" hidden></label>
          <button class="boton" id="usar-ejemplo" ${leyendo ? "disabled" : ""}>Procesar el informe de ejemplo</button>
          <a class="boton claro" href="${EJEMPLO_PDF}" target="_blank" rel="noopener">Ver el PDF</a>
        </div>
        ${leyendo ? '<div class="leyendo">Leyendo el informe <i></i><i></i><i></i></div>' : ""}
        ${error ? `<p class="error">${escapar(error)}</p>` : ""}
      </div>`}
      <p class="nota" style="margin-top:10px" id="pill-ventas"><b>${N.TIENDAS.length - sin.length} de ${N.TIENDAS.length}</b> tiendas con ventas de hoy${sin.length ? ` · faltan: ${escapar(sin.map((t) => t.nombre).join(", "))}` : " ✓"}</p>
      ${importados.length ? `<div class="envoltura-tabla" style="margin-top:10px"><table><thead><tr><th>Informes subidos en la demo</th><th class="num">Tiendas</th><th class="num">Unidades</th><th>Fuente</th><th></th></tr></thead><tbody>
        ${importados.map((i) => `<tr><td>${escapar(fechaMedia(i.fecha))}</td><td class="num">${i.tiendas}</td><td class="num">${ent(i.unidades)}</td><td><span class="pastilla">${i.fuente === "manual" ? "✏️ carga manual" : "📄 informe"}</span></td><td><button class="mini-editar" data-borrar="${i.fecha}|${i.fuente}">Borrar</button></td></tr>`).join("")}
      </tbody></table></div>` : ""}
    </div>

    <div class="tarjeta">
      <h2>Respaldo de datos</h2>
      <p class="nota">Descargue una copia de todo (tiendas, productos, choferes y movimientos) para guardar fuera del sistema o restaurar si hay un problema. La base de datos además guarda respaldos automáticos cada día.</p>
      <div class="controles">
        <button class="boton" id="btnRespaldoJSON">Descargar respaldo completo (JSON)</button>
        <button class="boton claro" id="btnRespaldoCSV">Descargar movimientos de hoy (CSV)</button>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Ventas sin informe de la cadena · carga manual</h2>
      <p class="nota">El plan B cuando el informe <b>no llega</b>: elija la fecha y la tienda, digite las unidades vendidas (o pegue la tabla de Excel) y guarde. Los registros quedan con fuente <span class="pastilla">manual</span> y alimentan la conciliación igual que el PDF; cuando llegue el informe oficial, prevalece el informe.</p>
      <div class="controles">
        <button class="boton ${manual.modo === "digitar" ? "" : "claro"}" data-modo="digitar">✏️ Digitar por tienda</button>
        <button class="boton ${manual.modo === "pegar" ? "" : "claro"}" data-modo="pegar">📋 Pegar desde Excel</button>
        <label for="ventasDiaFecha">Fecha</label>
        <input type="date" id="ventasDiaFecha" value="${manual.fecha}" max="${hoy}">
        ${manual.modo === "digitar" ? `<select id="ventasDiaTienda" aria-label="Tienda">${N.TIENDAS.map((t) => `<option value="${t.id}" ${t.id === manual.tienda ? "selected" : ""}>${escapar(t.nombre)}${N.ventaDia(t.id, manual.fecha) ? "" : " · sin ventas"}</option>`).join("")}</select>
        <button class="boton" id="btnGuardarVentasDia">💾 Guardar día de ventas</button>` : ""}
      </div>
      ${manual.modo === "digitar" ? `<div class="envoltura-tabla"><table id="tablaVentasDia"><thead><tr><th>Producto</th><th class="num">Unidades vendidas ✏️</th></tr></thead><tbody>
        ${N.PRODUCTOS.map((p) => { const v = N.ventaDia(manual.tienda, manual.fecha)?.[p.codigo]; return `<tr><td>${escapar(p.nombre)}</td><td class="num"><input class="venta-dia" type="number" min="0" inputmode="numeric" data-producto="${p.codigo}" value="${v ?? ""}" placeholder="0" aria-label="${escapar(p.nombre)}"></td></tr>`; }).join("")}
      </tbody></table></div>` : `<textarea id="pegado" rows="7" style="width:100%;margin-top:10px;padding:10px;border:1px solid #d8c3c9;border-radius:8px;font:13px/1.4 ui-monospace,Menlo,monospace" placeholder="Tienda&#9;Bizcocho de vainilla&#9;Coco horneado&#9;…"></textarea>
        <div class="controles" style="margin-top:8px"><button class="boton claro" id="ejemplo-pegar">Usar un ejemplo</button><button class="boton" id="cargar-pegado">Cargar ventas</button></div>`}
      ${errorManual ? `<p class="error">${escapar(errorManual)}</p>` : ""}
    </div>`;

  conectarLector(caja);
  conectarManual(caja);
  caja.querySelectorAll("[data-borrar]").forEach((b) => b.addEventListener("click", () => {
    const [fecha, fuente] = b.dataset.borrar.split("|");
    N.borrarVentas(fecha, fuente);
    aviso(`Se borró lo subido del ${fechaMedia(fecha)}.`);
  }));
  caja.querySelector("#btnRespaldoJSON").addEventListener("click", () => {
    const copia = { generado: new Date().toISOString(), tiendas: N.TIENDAS, productos: N.PRODUCTOS, choferes: N.CHOFERES, rutas: N.rutas(), visitas: N.visitas(), ventas: N.ventas() };
    descargar(`respaldo_minis_${N.hoy()}.json`, JSON.stringify(copia, null, 1), "application/json");
    aviso("Respaldo completo descargado.");
  });
  caja.querySelector("#btnRespaldoCSV").addEventListener("click", () => {
    const filas = [["Fecha", "Tienda", "Producto", "En exhibición", "Repuesto", "Descarte", "Vendido (informe)"]];
    for (const r of N.resumenDia(hoy)) for (const p of N.PRODUCTOS) {
      const c = r.visita?.conteos.find((x) => x.producto === p.codigo);
      filas.push([hoy, r.tienda.nombre, p.nombre, c?.quedaban ?? "", c?.dejados ?? "", c?.descarte ?? "", N.ventaDia(r.tienda.id, hoy)?.[p.codigo] ?? ""]);
    }
    descargar(`movimientos_${hoy}.csv`, "﻿" + filas.map((f) => f.map((x) => `"${x}"`).join(";")).join("\r\n"), "text/csv;charset=utf-8");
    aviso("Movimientos de hoy descargados.");
  });
}

function informesImportados() {
  const extra = N.estado.leer().ventas;
  const por = new Map();
  for (const v of extra) {
    const k = `${v.fecha}|${v.fuente ?? "informe"}`;
    const x = por.get(k) ?? por.set(k, { fecha: v.fecha, fuente: v.fuente ?? "informe", tiendas: new Set(), unidades: 0 }).get(k);
    x.tiendas.add(v.tienda);
    x.unidades += v.cantidad;
  }
  return [...por.values()].map((x) => ({ ...x, tiendas: x.tiendas.size })).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ---------- Informe PDF leído con IA ----------

function revision() {
  const b = borrador;
  const filas = b.lineas.map((l, i) => `<tr class="${!l.tienda || !l.producto ? "fila-alerta" : ""}">
    <td class="celda-suave">${escapar(l.original.tienda)}</td>
    <td>${l.tienda ? escapar(l.tienda.nombre) : '<span class="pill pill-error">No se encontró</span>'}</td>
    <td class="celda-suave">${escapar(l.original.producto)}${l.original.codigo_cadena ? ` · ${escapar(l.original.codigo_cadena)}` : ""}</td>
    <td>${l.producto ? escapar(l.producto.nombre) : `<select data-linea="${i}" aria-label="Producto de Minis"><option value="">Elegir producto…</option>${N.PRODUCTOS.map((p) => `<option value="${p.codigo}">${escapar(p.nombre)}</option>`).join("")}</select>`}</td>
    <td class="num">${ent(l.unidades)}</td>
  </tr>`).join("");
  const pendientes = b.lineas.filter((l) => !l.tienda || !l.producto).length;
  const unidades = b.lineas.reduce((s, l) => s + l.unidades, 0);
  return `<div class="card borrador revision-ia" id="borrador">
    <p class="titulo-borrador"><span class="pill pill-ia">IA</span> BORRADOR — nada se guarda hasta que usted confirme</p>
    <div class="resumen-borrador">
      <span>Cadena: <b>${escapar(b.cadena ?? "—")}</b></span>
      <span>Fecha en el informe: <b>${escapar(b.fecha ?? "—")}</b></span>
      <span><b>${b.lineas.length}</b> líneas · <b>${b.tiendas}</b> tiendas · <b>${ent(unidades)}</b> unidades</span>
    </div>
    ${b.dudas.length ? `<div class="aviso"><b>Para revisar:</b> ${b.dudas.map(escapar).join(" · ")}</div>` : ""}
    ${pendientes ? `<div class="aviso">${pendientes} línea${pendientes === 1 ? "" : "s"} sin cuadrar con el catálogo: elija el producto o se dejarán fuera.</div>` : ""}
    <div class="envoltura-tabla" style="max-height:420px;overflow-y:auto;margin-top:8px"><table class="tabla">
      <thead><tr><th>Tienda en el informe</th><th>Tienda</th><th>Producto en el informe</th><th>Producto</th><th class="num">Unidades</th></tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
    <p class="ayuda">Las ventas se cargan como ventas de hoy.</p>
    <div class="controles" style="margin-top:10px;background:none;border:0;padding:0">
      <button class="boton" id="registrar-reporte">Registrar ventas de ${b.tiendas} tiendas</button>
      <button class="boton claro" id="descartar">Descartar borrador</button>
    </div>
  </div>`;
}

async function leer(caja, obtenerArchivo) {
  if (leyendo) return;
  leyendo = true; error = "";
  pintar(caja);
  try {
    const archivo = await obtenerArchivo();
    const propuesta = await leerDocumento("minis-reporte", { archivo, contexto: contextoReporte(), herramienta: "proponer_ventas" });
    borrador = mapearReporte(propuesta);
  } catch (e) {
    error = e.message;
  } finally {
    leyendo = false;
    if (caja.isConnected) pintar(caja);
  }
}

function conectarLector(caja) {
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
  }));
  caja.querySelector("#descartar")?.addEventListener("click", () => { borrador = null; pintar(caja); });
  caja.querySelector("#registrar-reporte")?.addEventListener("click", () => {
    const lineas = borrador.lineas.filter((l) => l.tienda && l.producto).map((l) => ({ tienda: l.tienda.id, producto: l.producto.codigo, cantidad: l.unidades }));
    borrador = null; // antes de guardar: el cambio de estado repinta la pantalla
    const r = N.registrarVentas(lineas);
    aviso(`✔ Se registraron ventas de ${r.tiendas} tiendas (${r.registradas} líneas). El panel y la conciliación ya las incluyen.`);
  });
}

// ---------- Carga manual ----------

function conectarManual(caja) {
  caja.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => { manual.modo = b.dataset.modo; errorManual = ""; pintar(caja); }));
  caja.querySelector("#ventasDiaFecha").addEventListener("change", (e) => { manual.fecha = e.target.value || N.hoy(); pintar(caja); });
  caja.querySelector("#ventasDiaTienda")?.addEventListener("change", (e) => { manual.tienda = Number(e.target.value); pintar(caja); });
  caja.querySelector("#btnGuardarVentasDia")?.addEventListener("click", () => {
    const lineas = [...caja.querySelectorAll("input.venta-dia")].filter((i) => i.value !== "").map((i) => ({ tienda: manual.tienda, producto: i.dataset.producto, cantidad: Number(i.value) }));
    if (!lineas.length) { errorManual = "Digite al menos un producto."; return pintar(caja); }
    errorManual = "";
    N.registrarVentas(lineas, manual.fecha, "manual");
    aviso(`✔ Ventas de ${N.tienda(manual.tienda).nombre} guardadas como carga manual.`);
  });
  caja.querySelector("#ejemplo-pegar")?.addEventListener("click", () => {
    const tiendas = N.tiendasSinVentas(manual.fecha);
    let semilla = 7;
    const azar = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
    const filas = [["Tienda", ...N.PRODUCTOS.map((p) => p.nombre)].join("\t"), ...tiendas.map((t) => [t.nombre.normalize("NFD").replace(/[̀-ͯ]/g, ""), ...N.PRODUCTOS.map((p) => Math.round(N.parEn(p, t) * 0.25 * (0.4 + azar())))].join("\t"))];
    caja.querySelector("#pegado").value = filas.join("\n");
  });
  caja.querySelector("#cargar-pegado")?.addEventListener("click", () => {
    const { lineas, problemas } = leerPegado(caja.querySelector("#pegado").value);
    if (!lineas.length) { errorManual = problemas[0] ?? "No se encontraron ventas en lo pegado."; return pintar(caja); }
    errorManual = "";
    const r = N.registrarVentas(lineas, manual.fecha, "manual");
    aviso(`✔ Se registraron ventas de ${r.tiendas} tiendas (${r.registradas} celdas leídas)${problemas.length ? ` · ${problemas.length} sin reconocer` : ""}.`);
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
