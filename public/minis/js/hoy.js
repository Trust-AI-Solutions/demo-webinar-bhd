// Hoy y Mes: las cuatro cifras de arriba, los conteos que van llegando de los choferes,
// el acumulado del día por tienda (con rutas, ventas y cobertura) y el acumulado del mes.

import * as N from "./negocio.js";
import { ent, rd, escapar, fechaMedia, iniciales, selectorTiendas, conectarSelectores, conectarExportes, elegidas } from "./util.js";

let fechaHoy = null; // la fecha elegida en «Hoy» (por defecto, hoy)

export function pintarKPIs(caja) {
  const filas = N.resumenDia(N.hoy());
  const conInforme = filas.filter((r) => r.ventas !== null);
  const ventas = conInforme.reduce((s, r) => s + r.ventas, 0);
  const despacho = filas.reduce((s, r) => s + (r.despacho ?? 0), 0);
  const descarte = filas.reduce((s, r) => s + r.descarte, 0);
  const visitadas = filas.filter((r) => r.visita).length;
  caja.innerHTML = `
    <div class="kpi destacada"><div class="etiqueta">Ventas de hoy 🍒</div>
      <div class="valor">${ent(ventas)}</div>
      <div class="detalle">unidades en ${conInforme.length} de ${filas.length} tiendas con informe</div></div>
    <div class="kpi"><div class="etiqueta">Despacho de hoy</div>
      <div class="valor">${ent(despacho)}</div>
      <div class="detalle">unidades repuestas por los choferes</div></div>
    <div class="kpi"><div class="etiqueta">Descarte de tienda</div>
      <div class="valor">${ent(descarte)}</div>
      <div class="detalle">unidades retiradas hoy</div></div>
    <div class="kpi"><div class="etiqueta">Visitas completas</div>
      <div class="valor" id="kpi-visitadas">${visitadas}/${filas.length}</div>
      <div class="detalle">checklist cerrado por choferes</div></div>`;
}

// ---------- Hoy ----------

export function pintarHoy(caja) {
  const hoy = N.hoy();
  const f = fechaHoy ?? hoy;
  const sel = elegidas("hoy");
  const filas = N.resumenDia(f).filter((r) => !sel || sel.has(r.tienda.id));
  const deHoy = N.visitas().filter((v) => v.fecha === hoy).reverse();
  const avisos = N.alertasOficina();

  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Acumulado de ${f === hoy ? "hoy" : "ese día"}, por tienda <span style="font-size:.6em;color:#5c4a45;font-weight:600">· ${escapar(fechaMedia(f))}</span></h2>
      <p class="nota">La marca verde indica que la visita del chofer está completa (los ${N.contados().length} productos del checklist registrados). Las ventas son las del informe de la cadena; los retiros por vencimiento o avería aparecen como <b>descarte de tienda</b>.</p>
      <div class="controles">
        <label for="fechaHoy">Fecha</label>
        <input type="date" id="fechaHoy" value="${f}" max="${hoy}" min="${N.sumarDias(hoy, -40)}">
        ${selectorTiendas("hoy")}
        <button class="boton" data-exportar="tablaHoy" data-nombre="acumulado_del_dia">⬇ Exportar a Excel</button>
      </div>
      ${analitica(filas, f)}
      <div class="envoltura-tabla">
        <table id="tablaHoy">
          <thead><tr><th>Visita</th><th>Tienda</th><th class="num">Despacho</th><th class="num">Ventas</th><th class="num">Descarte</th><th class="num">En tienda</th></tr></thead>
          <tbody>${filas.map((r) => `<tr>
            <td><span class="cereza-estado ${r.visita ? "" : "pendiente"}" title="${r.visita ? `Visita completa ${escapar(r.visita.hora)}` : "Sin visita"}">🍒</span></td>
            <td>${escapar(r.tienda.nombre)}</td>
            <td class="num">${ent(r.despacho)}</td>
            <td class="num">${r.ventas === null ? `<span title="La cadena todavía no reporta las ventas de esta tienda para esa fecha">—</span>` : ent(r.ventas)}</td>
            <td class="num">${r.descarte || "—"}</td>
            <td class="num">${ent(r.en_tienda)}</td></tr>`).join("")}
            <tr class="total"><td></td><td>Total</td>
            <td class="num">${ent(filas.reduce((s, r) => s + (r.despacho ?? 0), 0))}</td>
            <td class="num">${ent(filas.reduce((s, r) => s + (r.ventas ?? 0), 0))}</td>
            <td class="num">${ent(filas.reduce((s, r) => s + r.descarte, 0))}</td>
            <td class="num">${ent(filas.reduce((s, r) => s + (r.en_tienda ?? 0), 0))}</td></tr></tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:12px">${notaVentas(filas, f)}</p>
    </div>

    <div class="tarjeta" id="cardConteosVivo">
      <h2>Conteos de choferes — EN VIVO 🛰️</h2>
      <p class="nota">Lo que reportan los choferes por WhatsApp al cerrar cada visita: lo que encontraron en exhibición, lo que retiraron y lo que repusieron. Se actualiza solo, sin recargar la página.</p>
      ${avisos.length ? `<div style="margin:12px 0"><b style="font-size:12.5px">🔔 Avisos para la oficina</b> <span class="nota">· productos que quedaron por debajo de la mitad del nivel par</span>
        <ul class="avisos-oficina" id="avisosHoy" style="margin-top:6px">${avisos.slice(0, 5).map((a) => `<li class="${a.nueva ? "nueva" : ""}">⚠️ <span>${escapar(a.mensaje)}</span><span class="hora">${escapar(a.hora ?? "")}</span></li>`).join("")}</ul></div>` : ""}
      <div class="envoltura-tabla">
        <table id="tablaConteosVivo">
          <thead><tr><th>Hora</th><th>Chofer</th><th>Tienda</th><th class="num">Productos contados</th><th class="num">En exhibición</th><th class="num">Repuesto</th><th class="num">Descarte</th></tr></thead>
          <tbody>${deHoy.length ? deHoy.map((v) => `<tr class="${v.origen === "whatsapp" ? "fila-nueva" : ""}">
            <td>${escapar(v.hora)}</td><td>${escapar(N.chofer(v.chofer)?.nombre ?? "")}</td><td><b>${escapar(N.tienda(v.tienda).nombre)}</b>${v.origen === "whatsapp" ? ' <span class="pastilla verde">recién llegado</span>' : ""}</td>
            <td class="num">${v.conteos.length} de ${N.contados().length}</td>
            <td class="num">${ent(v.conteos.reduce((s, c) => s + c.quedaban, 0))}</td>
            <td class="num">${ent(v.conteos.reduce((s, c) => s + (c.dejados ?? 0), 0))}</td>
            <td class="num">${ent(v.conteos.reduce((s, c) => s + (c.descarte ?? 0), 0))}</td></tr>`).join("")
            : '<tr><td colspan="7" class="vacio">Aún no hay conteos hoy.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;

  caja.querySelector("#fechaHoy").addEventListener("change", (e) => { fechaHoy = e.target.value || null; pintarHoy(caja); });
  conectarSelectores(caja, () => pintarHoy(caja));
  conectarExportes(caja);
}

function notaVentas(filas, f) {
  const sin = filas.filter((r) => r.ventas === null);
  if (!sin.length) return "Todas las tiendas elegidas tienen el informe de ventas de la cadena para esa fecha.";
  const lp = sin.filter((r) => N.esDeLasPalmas(r.tienda)).length;
  return `<b>⏳ ${sin.length} tienda${sin.length === 1 ? "" : "s"} sin informe de ventas</b>${lp ? ` (${lp} de ${escapar(N.CADENA_REPORTE)}: su reporte llega por correo en PDF y se sube en <b>Datos · Respaldo</b>)` : ""}. Una tienda sin informe no cuenta como venta cero.`;
}

function analitica(filas, f) {
  const visitas = filas.filter((r) => r.visita).length;
  const pct = filas.length ? Math.round((visitas / filas.length) * 100) : 0;
  const conVentas = filas.filter((r) => r.ventas !== null).sort((a, b) => b.ventas - a.ventas).slice(0, 7);
  const maximo = Math.max(1, ...conVentas.map((r) => r.ventas));
  const total = filas.reduce((s, r) => s + (r.ventas ?? 0), 0);
  const ids = new Set(filas.map((r) => r.tienda.id));
  const rutas = N.CHOFERES.map((c) => {
    const tiendas = N.rutaDe(c.id).filter((t) => ids.has(t.id));
    const hechas = tiendas.filter((t) => N.visitaDelDia(t.id, f)).length;
    return { c, tiendas, hechas };
  }).filter((x) => x.tiendas.length);
  const enRuta = rutas.reduce((s, x) => s + x.tiendas.length, 0);
  const hechas = rutas.reduce((s, x) => s + x.hechas, 0);
  return `<div class="mini-analytics" aria-label="Resumen visual de ventas y visitas">
    <div class="mini-rutas-card">
      <div class="mini-rutas-cab"><div><span>Operación del día</span><h3>Rutas de choferes</h3></div><b>${hechas} de ${enRuta} visitas</b></div>
      <div class="mini-rutas-lista">${rutas.map(({ c, tiendas, hechas }) => {
        const p = Math.round((hechas / tiendas.length) * 100);
        return `<div class="mini-ruta-fila">
          <div class="mini-ruta-fila-cab">
            <div class="mini-ruta-identidad"><span class="mini-ruta-avatar">${iniciales(c.nombre)}</span><div><b>${escapar(c.nombre)}</b><span>${escapar(tiendas[0].nombre)} → ${escapar(tiendas.at(-1).nombre)}</span></div></div>
            <div class="mini-ruta-metrica"><b>${p}%</b>${hechas} de ${tiendas.length}</div>
          </div>
          <div class="mini-ruta-pista"><i style="width:${p}%"></i></div>
        </div>`;
      }).join("")}</div>
    </div>
    <div class="mini-chart-card">
      <div class="mini-chart-cab"><div><span>Rendimiento comercial</span><h3>Tiendas con mayores ventas</h3></div><b>${ent(total)} unidades</b></div>
      <div class="mini-barras">${conVentas.length ? conVentas.map((r) => `<div class="mini-barra-fila">
        <span class="mini-barra-nombre">${escapar(r.tienda.nombre)}</span>
        <div class="mini-barra-pista"><i style="width:${Math.max(8, (r.ventas / maximo) * 100)}%"></i></div>
        <b>${ent(r.ventas)}</b></div>`).join("") : '<p class="nota" style="margin:0">Sin informe de ventas para esa fecha.</p>'}</div>
    </div>
    <div class="mini-donut-card">
      <span class="mini-donut-etiqueta">Cobertura de visitas</span>
      <div class="mini-donut" style="--avance:${pct * 3.6}deg"><div><b>${pct}%</b><span>completas</span></div></div>
      <p>${visitas} de ${filas.length} tienda${filas.length === 1 ? "" : "s"}</p>
    </div>
  </div>`;
}

// ---------- Mes ----------

export function pintarMes(caja) {
  const hoy = N.hoy();
  const filas = N.resumenMes(hoy);
  const mes = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  const t = (k) => filas.reduce((s, r) => s + r[k], 0);
  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Acumulado del mes, por tienda <span style="font-size:.6em;color:#5c4a45;font-weight:600">· ${escapar(mes)}, hasta hoy</span></h2>
      <p class="nota">Unidades e importe a liquidar (RD$) según el informe de ventas de la cadena; el despacho y el descarte, según los conteos de los choferes.</p>
      <div class="controles"><button class="boton" data-exportar="tablaMes" data-nombre="acumulado_mes">⬇ Exportar a Excel</button></div>
      <div class="envoltura-tabla">
        <table id="tablaMes">
          <thead><tr><th>Tienda</th><th class="num">Despacho</th><th class="num">Ventas</th><th class="num">Descarte</th><th class="num">Importe a liquidar (RD$)</th></tr></thead>
          <tbody>${filas.map((r) => `<tr><td>${escapar(r.tienda.nombre)}</td><td class="num">${ent(r.despacho)}</td><td class="num">${ent(r.ventas)}</td><td class="num">${r.descarte || "—"}</td><td class="num">${rd(r.importe)}</td></tr>`).join("")}
          <tr class="total"><td>Total del mes</td><td class="num">${ent(t("despacho"))}</td><td class="num">${ent(t("ventas"))}</td><td class="num">${ent(t("descarte"))}</td><td class="num">${rd(t("importe"))}</td></tr></tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:12px">Las ventas de hoy de ${escapar(N.CADENA_REPORTE)} entran cuando se sube su informe en <b>Datos · Respaldo</b>.</p>
    </div>`;
  conectarExportes(caja);
}
