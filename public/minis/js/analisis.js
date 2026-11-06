// Semana · Conciliación, Previsión y Stock en tienda: lo que el panel calcula solo con lo que
// ya registran los choferes y el informe de ventas de la cadena.

import * as N from "./negocio.js";
import { ent, rd, escapar, fechaCorta, fechaMedia, rangoTexto, selectorTiendas, conectarSelectores, conectarExportes, elegidas, descargar, aviso } from "./util.js";

// ---------- Conciliación ----------

const conc = { periodo: "semana", vista: "dia", desde: null, hasta: null, detalle: null };
const SELLO = {
  ok: '<span class="positivo">✓ conciliado</span>',
  diferencia: '<span class="pastilla roja">⚠️ revisar</span>',
  pendiente: '<span class="pastilla ambar" title="La cadena todavía no manda el informe de ventas">⏳ falta reporte</span>',
  "en-curso": '<span class="pastilla" title="Se concilia cuando el chofer vuelva a contar">🚚 en curso</span>',
  "sin-visita": '<span class="pastilla">sin visita</span>',
  futuro: '<span class="pastilla">—</span>',
};

export function pintarConciliacion(caja) {
  const hoy = N.hoy();
  let [desde, hasta] = conc.periodo === "rango" ? [conc.desde ?? N.sumarDias(hoy, -6), conc.hasta ?? hoy] : N.rangoPeriodo(conc.periodo);
  const sel = elegidas("conc");
  const porDia = conc.vista === "dia";
  const valido = desde && hasta && desde <= hasta;
  const filas = valido ? N.conciliacion(desde, hasta, { elegidas: sel, porDia }) : [];
  const comparables = filas.filter((r) => r.minis !== null && r.informe !== null);
  const descuadres = comparables.filter((r) => r.minis !== r.informe);
  const tot = (k) => comparables.reduce((s, r) => s + r[k], 0);

  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Conciliación de consignación 🍒</h2>
      <p class="nota">Compara lo que vendió cada tienda <b>según los conteos de sus choferes</b> (lo que quedó en exhibición al irse menos lo que encontraron al volver) contra el <b>informe de ventas de la cadena</b> para esos mismos días. Elija el <b>período</b> y véalo <b>por día</b> (para revisar una fecha) o <b>por producto</b> (para validar la factura). La semana de facturación va de <b>lunes a sábado</b>; el domingo no hay visita y su venta entra con la del sábado. Si un informe todavía no llegó, aparece como <b>pendiente</b>, nunca como venta cero.</p>
      <div class="controles">
        <label for="periodoConc">Período</label>
        <select id="periodoConc">
          ${[["hoy", "Hoy"], ["ayer", "Ayer"], ["semana", "Semana de facturación (lun–sáb)"], ["semana-1", "Semana anterior"], ["mes", "Últimos 30 días"], ["rango", "Rango personalizado…"]].map(([v, t]) => `<option value="${v}" ${conc.periodo === v ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        ${conc.periodo === "rango" ? `<label for="fechaDesde">Desde</label><input type="date" id="fechaDesde" value="${desde}" max="${hoy}"><label for="fechaHasta">hasta</label><input type="date" id="fechaHasta" value="${hasta}" max="${hoy}">` : ""}
        <label for="vistaConc">Ver</label>
        <select id="vistaConc"><option value="dia" ${porDia ? "selected" : ""}>Por día</option><option value="producto" ${porDia ? "" : "selected"}>Por producto</option></select>
        ${selectorTiendas("conc")}
        <button class="boton" data-exportar="tablaConc" data-nombre="conciliacion">⬇ Exportar a Excel</button>
        <b style="color:var(--cereza);font-size:12.5px">${valido ? escapar(rangoTexto(desde, hasta)) : ""}</b>
      </div>
      <div class="envoltura-tabla">
        <table id="tablaConc">
          <thead><tr><th>${porDia ? "Día" : "Producto"}</th><th class="num">Registro Minis</th><th class="num">Informe de la cadena</th><th class="num">Diferencia</th><th class="num">Importe (RD$)</th><th>Estado</th></tr></thead>
          <tbody>${!valido ? '<tr><td colspan="6" class="vacio">Elija un rango de fechas válido.</td></tr>' : sel && sel.size === 0 ? '<tr><td colspan="6" class="vacio">Elija al menos una tienda.</td></tr>' : filas.map((r) => {
            const dif = r.minis !== null && r.informe !== null ? r.minis - r.informe : null;
            const etiqueta = porDia ? `<b>${escapar(fechaCorta(r.fecha))}</b>${r.sabado ? ' <span class="pastilla" title="Incluye la venta del domingo: ese día el chofer no visita">sáb + dom</span>' : ""}` : escapar(r.etiqueta);
            return `<tr ${porDia && r.minis !== null ? `class="fila-dia ${conc.detalle === r.fecha ? "elegida" : ""}" data-fecha="${r.fecha}" title="Ver el detalle por producto"` : ""}>
              <td>${etiqueta}</td>
              <td class="num">${ent(r.minis)}</td>
              <td class="num">${ent(r.informe)}</td>
              <td class="num ${dif === null ? "" : dif === 0 ? "positivo" : "alerta-txt"}">${dif === null ? "—" : dif === 0 ? "✓ 0" : (dif > 0 ? "+" : "") + dif}</td>
              <td class="num">${r.informe === null ? "—" : rd(r.importe)}</td>
              <td>${porDia ? SELLO[r.estado] : r.minis === null ? SELLO["en-curso"] : r.minis === r.informe ? SELLO.ok : SELLO.diferencia}</td></tr>`;
          }).join("") + `<tr class="total"><td>Total del período</td><td class="num">${ent(tot("minis"))}</td><td class="num">${ent(tot("informe"))}</td><td class="num">${tot("minis") - tot("informe") ? (tot("minis") - tot("informe") > 0 ? "+" : "") + (tot("minis") - tot("informe")) : "✓ 0"}</td><td class="num">${rd(comparables.reduce((s, r) => s + r.importe, 0))}</td><td></td></tr>`}</tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:12px">${valido ? `${escapar(rangoTexto(desde, hasta))} · ${sel ? `${sel.size} tienda${sel.size === 1 ? "" : "s"}` : "todas las tiendas"}` : ""}${descuadres.length ? ` · <span class="alerta-txt">⚠️ ${descuadres.length} ${porDia ? "día" : "producto"}${descuadres.length === 1 ? "" : "s"} con diferencia</span>` : comparables.length ? " · ✓ todo cuadra" : ""}${porDia ? " · <i>haga clic en un día para ver el detalle por producto</i>" : ""}</p>
    </div>
    ${conc.detalle ? detalleHTML(conc.detalle, sel) : ""}`;

  caja.querySelector("#periodoConc").addEventListener("change", (e) => { conc.periodo = e.target.value; conc.detalle = null; pintarConciliacion(caja); });
  caja.querySelector("#vistaConc").addEventListener("change", (e) => { conc.vista = e.target.value; conc.detalle = null; pintarConciliacion(caja); });
  caja.querySelector("#fechaDesde")?.addEventListener("change", (e) => { conc.desde = e.target.value; pintarConciliacion(caja); });
  caja.querySelector("#fechaHasta")?.addEventListener("change", (e) => { conc.hasta = e.target.value; pintarConciliacion(caja); });
  caja.querySelectorAll(".fila-dia").forEach((tr) => tr.addEventListener("click", () => {
    conc.detalle = tr.dataset.fecha;
    pintarConciliacion(caja);
    caja.querySelector("#tarjetaDetalleDia")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  caja.querySelector("#btnCerrarDetalle")?.addEventListener("click", () => { conc.detalle = null; pintarConciliacion(caja); });
  conectarSelectores(caja, () => pintarConciliacion(caja));
  conectarExportes(caja);
}

function detalleHTML(fecha, sel) {
  const filas = N.detalleDia(fecha, { elegidas: sel });
  return `<div class="tarjeta" id="tarjetaDetalleDia">
    <h2>Detalle del ${escapar(fechaMedia(fecha))}</h2>
    <p class="nota">Producto por producto de ese tramo: para saber <b>cuál</b> no cuadra y en qué tienda, no solo cuánto.</p>
    <div class="controles">
      <button class="boton" data-exportar="tablaDetalleDia" data-nombre="detalle_${fecha}">⬇ Exportar a Excel</button>
      <button class="boton claro" id="btnCerrarDetalle">Cerrar</button>
    </div>
    <div class="envoltura-tabla">
      <table id="tablaDetalleDia">
        <thead><tr><th>Producto</th><th class="num">Registro Minis</th><th class="num">Informe de la cadena</th><th class="num">Diferencia</th><th class="num">Importe (RD$)</th><th>Dónde no cuadra</th></tr></thead>
        <tbody>${filas.map((r) => {
          const dif = r.minis - r.informe;
          return `<tr><td>${escapar(r.etiqueta)}</td><td class="num">${ent(r.minis)}</td><td class="num">${ent(r.informe)}</td>
            <td class="num ${dif === 0 ? "positivo" : "alerta-txt"}">${dif === 0 ? "✓ 0" : (dif > 0 ? "+" : "") + dif}</td>
            <td class="num">${rd(r.importe)}</td><td>${r.tiendas.length ? escapar(r.tiendas.join(", ")) : ""}</td></tr>`;
        }).join("")}</tbody>
      </table>
    </div>
  </div>`;
}

// ---------- Previsión ----------

const prev = { vista: "semana", dia: 0, margen: 0.1 };
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FLECHA = { sube: "↑ sube", baja: "↓ baja", igual: "→ estable" };

export function pintarPrevision(caja) {
  const sel = elegidas("prev");
  const porDia = prev.vista === "dia";
  const r = N.prevision({ elegidas: sel, margen: prev.margen, dia: porDia ? prev.dia : null });
  const lunes = N.sumarDias(N.hoy(), 7 - ((N.diaSemana(N.hoy()) + 6) % 7));
  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Previsión de despacho · ${porDia ? `${DIAS[prev.dia].toLowerCase()} de la próxima semana` : `semana del ${escapar(fechaCorta(lunes))}`} 🍒</h2>
      <p class="nota">Sugerencia de cuánto enviar de <b>cada producto</b>, calculada con el <b>promedio de ventas del informe de la cadena</b> (semanas completas de lunes a domingo, hasta las 4 más recientes) más un margen de seguridad para no quedarse corta. Por <b>día</b>, la semana se reparte según el peso real de cada día de venta (la venta del domingo la cubre el despacho del sábado). Sin filtro ve el total por producto (cuánto producir); al elegir tiendas, ve cuánto enviarles. Es una sugerencia: la palabra final siempre es de Minis.</p>
      <div class="controles">
        <label for="vistaPrevision">Vista</label>
        <select id="vistaPrevision"><option value="semana" ${porDia ? "" : "selected"}>Semana completa</option><option value="dia" ${porDia ? "selected" : ""}>Por día</option></select>
        ${porDia ? `<select id="diaPrevision" aria-label="Día">${DIAS.map((d, i) => `<option value="${i}" ${prev.dia === i ? "selected" : ""}>${d}</option>`).join("")}</select>` : ""}
        <label for="margenPrevision">Margen de seguridad</label>
        <select id="margenPrevision">${[[0, "Sin margen (promedio exacto)"], [0.1, "+10 % (recomendado)"], [0.2, "+20 % (semanas fuertes / feriados)"]].map(([v, t]) => `<option value="${v}" ${prev.margen === v ? "selected" : ""}>${t}</option>`).join("")}</select>
        ${selectorTiendas("prev")}
        <button class="boton" data-exportar="tablaPrevision" data-nombre="prevision">⬇ Exportar esta vista</button>
        <button class="boton" id="btnDespachoCompleto" style="background:var(--tallo)">⬇ Hoja de despacho completa (tienda × producto)</button>
      </div>
      <div class="envoltura-tabla">
        <table id="tablaPrevision">
          <thead><tr><th>Producto</th><th class="num">Promedio ${r.semanas.length} semanas</th><th class="num">Última semana</th><th>Tendencia</th><th class="num">Previsión sugerida 🍒</th></tr></thead>
          <tbody>${r.filas.map((f) => `<tr><td>${escapar(f.producto.nombre)}</td><td class="num">${ent(f.promedio)}</td><td class="num">${ent(f.ultima)}</td>
            <td><span class="tendencia ${f.tendencia}">${FLECHA[f.tendencia]}</span></td><td class="num"><b>${ent(f.sugerido)}</b></td></tr>`).join("")}
          <tr class="total"><td>Total</td><td class="num">${ent(r.filas.reduce((s, f) => s + f.promedio, 0))}</td><td class="num">${ent(r.filas.reduce((s, f) => s + f.ultima, 0))}</td><td></td><td class="num">${ent(r.filas.reduce((s, f) => s + f.sugerido, 0))}</td></tr></tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:12px">Semanas usadas: ${r.semanas.map((l) => escapar(fechaCorta(l))).join(" · ")}. Peso de cada día: ${DIAS.map((d, i) => `${d.slice(0, 3)} ${Math.round(r.pesos[i] * 100)} %`).join(" · ")}.</p>
      <p class="nota" style="margin-top:6px">La <b>hoja de despacho completa</b> descarga la previsión de cada producto para cada tienda: el reemplazo directo de la planilla que hoy se arma a mano.</p>
    </div>`;
  caja.querySelector("#vistaPrevision").addEventListener("change", (e) => { prev.vista = e.target.value; pintarPrevision(caja); });
  caja.querySelector("#diaPrevision")?.addEventListener("change", (e) => { prev.dia = Number(e.target.value); pintarPrevision(caja); });
  caja.querySelector("#margenPrevision").addEventListener("change", (e) => { prev.margen = Number(e.target.value); pintarPrevision(caja); });
  caja.querySelector("#btnDespachoCompleto").addEventListener("click", () => {
    const filas = [["Tienda", ...N.PRODUCTOS.map((p) => p.nombre), "Total"]];
    for (const t of N.TIENDAS) {
      const x = N.prevision({ elegidas: new Set([t.id]), margen: prev.margen, dia: porDia ? prev.dia : null }).filas.map((f) => f.sugerido);
      filas.push([t.nombre, ...x, x.reduce((s, n) => s + n, 0)]);
    }
    descargar(`hoja_de_despacho_${N.hoy()}.csv`, "﻿" + filas.map((f) => f.map((c) => `"${c}"`).join(";")).join("\r\n"), "text/csv;charset=utf-8");
    aviso("Hoja de despacho descargada: 28 tiendas × 14 productos.");
  });
  conectarSelectores(caja, () => pintarPrevision(caja));
  conectarExportes(caja);
}

// ---------- Stock en tienda ----------

let tiendaStock = 6; // Caribe Naco: se ve la chinola por debajo del par

export function pintarStock(caja) {
  const t = N.tienda(tiendaStock);
  const filas = N.stockDetalle(t.id);
  const s = N.stockTienda(t.id);
  const valor = filas.reduce((a, f) => a + (f.actual ?? 0) * f.producto.precio, 0);
  const inicioMes = `${N.hoy().slice(0, 8)}01`;
  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Stock en tienda · consignación 🍒</h2>
      <p class="nota">Cuánto producto de Minis hay <b>ahora</b> en cada tienda: es dinero de Minis parado en el exhibidor. El sistema lo lleva solo con lo que ya registra: <b>stock al empezar el mes + despachos − ventas − descartes</b>, y lo corrige con cada conteo del chofer (la columna <b>Ajuste</b>: producto no reportado, dejado en otra góndola, no contado). En ámbar, lo que quedó por debajo de la mitad del nivel par.</p>
      <div class="controles">
        <label for="filtroTiendaStock">Tienda</label>
        <select id="filtroTiendaStock">${N.TIENDAS.map((x) => `<option value="${x.id}" ${x.id === t.id ? "selected" : ""}>${escapar(x.nombre)}</option>`).join("")}</select>
        <button class="boton" data-exportar="tablaStock" data-nombre="stock_${t.nombre.replace(/\s+/g, "_")}">⬇ Exportar a Excel</button>
        <span class="nota" style="margin:0">${s ? `Último conteo: ${escapar(s.dias === 0 ? "hoy" : `hace ${s.dias} día${s.dias === 1 ? "" : "s"}`)}, ${escapar(s.visita.hora)} · ${escapar(N.chofer(s.visita.chofer)?.nombre ?? "")}` : "<b>Sin conteo todavía</b>: entra al panel con su primera visita."}</span>
      </div>
      <div class="envoltura-tabla">
        <table id="tablaStock">
          <thead><tr><th>Producto</th><th class="num">Stock al ${escapar(fechaCorta(inicioMes))}</th><th class="num">Despachos</th><th class="num">Ventas</th><th class="num">Descartes</th><th class="num">Ajuste</th><th class="num">Stock actual 🍒</th><th class="num">Nivel par</th></tr></thead>
          <tbody>${filas.map((f) => `<tr class="${f.contado && f.actual < f.par / 2 ? "fila-alerta" : ""}">
            <td>${escapar(f.producto.nombre)}${f.producto.conteo ? "" : ' <span class="pastilla" title="Este producto no está en el checklist del chofer">sin conteo</span>'}</td>
            <td class="num">${ent(f.inicial)}</td><td class="num">${f.producto.conteo ? ent(f.despachos) : "—"}</td><td class="num">${ent(f.ventas)}</td><td class="num">${f.descartes || "—"}</td>
            <td class="num ${f.ajuste ? "alerta-txt" : ""}">${f.ajuste === null ? "—" : f.ajuste ? (f.ajuste > 0 ? "+" : "") + f.ajuste : "0"}</td>
            <td class="num"><b>${ent(f.actual)}</b></td><td class="num">${f.par}</td></tr>`).join("")}
          <tr class="total"><td>Total</td><td class="num">${ent(filas.reduce((a, f) => a + f.inicial, 0))}</td><td class="num">${ent(filas.reduce((a, f) => a + f.despachos, 0))}</td><td class="num">${ent(filas.reduce((a, f) => a + f.ventas, 0))}</td><td class="num">${ent(filas.reduce((a, f) => a + f.descartes, 0))}</td><td></td><td class="num">${ent(filas.reduce((a, f) => a + (f.actual ?? 0), 0))}</td><td></td></tr></tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:12px">Valor en consignación en esta tienda: <b>RD$ ${rd(valor)}</b>.</p>
    </div>`;
  caja.querySelector("#filtroTiendaStock").addEventListener("change", (e) => { tiendaStock = Number(e.target.value); pintarStock(caja); });
  conectarExportes(caja);
}
