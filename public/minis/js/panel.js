// Panel: la mercancía en consignación es dinero de la empresa parado en las tiendas.
// Muestra el stock estimado por tienda y su valor, y el detalle de cada tienda.

import * as N from "./negocio.js";
import { rd, num, escapar } from "../../comun/formato.js";

let detalle = null;
let ultimaResaltada = null;
// La última tienda cerrada por WhatsApp se resalta al volver al panel.
N.estado.alCambiar((ev) => { if (ev?.tipo === "visita") ultimaResaltada = ev.tienda; if (ev?.tipo === "restablecido") ultimaResaltada = null; });

export function pintar(caja, { evento } = {}) {
  if (detalle) return pintarDetalle(caja, detalle);
  const k = N.kpis();
  const avisos = N.alertasOficina();
  const filas = N.TIENDAS.map((t) => {
    const s = N.stockTienda(t.id);
    const e = N.estadoTienda(t.id);
    return `<tr class="${t.id === ultimaResaltada ? "fila-nueva" : ""}">
      <td>${escapar(t.nombre)}</td>
      <td class="celda-suave">${escapar(N.chofer(t.chofer).nombre)}</td>
      <td class="num">${s ? num(s.unidades) : "—"}</td>
      <td class="num">${s ? rd(s.valor) : "—"}</td>
      <td><span class="pill pill-${e.clase}">${escapar(e.texto)}</span></td>
      <td class="num"><button class="btn btn-mini" data-detalle="${t.id}">Ver</button></td>
    </tr>`;
  }).join("");
  caja.innerHTML = `
    <div class="kpis">
      <div class="kpi"><div class="kpi-valor">${rd(k.consignacion)}</div><div class="kpi-nombre">Mercancía en consignación<br>(${k.tiendas_con_conteo} de ${k.tiendas} tiendas con conteo)</div></div>
      <div class="kpi"><div class="kpi-valor">${num(k.unidades)}</div><div class="kpi-nombre">Unidades en tiendas</div></div>
      <div class="kpi"><div class="kpi-valor" id="kpi-visitadas">${k.visitadas_hoy} / ${k.tiendas}</div><div class="kpi-nombre">Tiendas visitadas hoy</div></div>
      <div class="kpi"><div class="kpi-valor">${rd(k.ventas_hoy)}</div><div class="kpi-nombre">Ventas de hoy (${num(k.unidades_vendidas_hoy)} unid.)</div></div>
    </div>
    ${avisos.length ? `<div class="card"><h3>🔔 Avisos de los choferes <small>· productos que quedaron por debajo de la mitad del par</small></h3>
      <ul class="avisos">${avisos.slice(0, 5).map((a) => `<li class="${a.nueva ? "nueva" : ""}">⚠️ <span>${escapar(a.mensaje)}</span><span class="hora">${escapar(a.hora ?? "")}</span></li>`).join("")}</ul></div>` : ""}
    <div class="card">
      <h3>Stock por tienda</h3>
      <div class="scroll-x"><table class="tabla" id="tabla-stock">
        <thead><tr><th>Tienda</th><th>Ruta</th><th class="num">Unidades</th><th class="num">Valor</th><th>Estado</th><th></th></tr></thead>
        <tbody>${filas}</tbody>
      </table></div>
      <p class="ayuda">El stock se estima con el último conteo del chofer + lo que dejó − las ventas reportadas después. Las tiendas "sin conteo" necesitan su primera visita cerrada para entrar al panel.</p>
    </div>`;
  caja.querySelectorAll("[data-detalle]").forEach((b) => b.addEventListener("click", () => {
    detalle = Number(b.dataset.detalle);
    pintar(caja);
    caja.scrollIntoView({ block: "start" });
  }));
}

function pintarDetalle(caja, id) {
  const t = N.tienda(id);
  const s = N.stockTienda(id);
  const volver = `<button class="volver" id="volver">← Volver al panel</button>`;
  if (!s) {
    caja.innerHTML = `${volver}<div class="card"><h3>📍 ${escapar(t.nombre)}</h3><p>Esta tienda todavía no tiene conteo. Entra al panel con su primera visita cerrada.</p><p class="ayuda">Ruta: ${escapar(N.chofer(t.chofer).ruta)} · ${escapar(N.chofer(t.chofer).nombre)}</p></div>`;
  } else {
    const filas = s.lineas.map((l) => `<tr class="${l.bajo ? "fila-alerta" : ""}">
      <td>${escapar(l.producto)}${l.contado ? "" : ' <span class="celda-suave">(sin conteo)</span>'}</td>
      <td class="num">${l.contado ? num(l.stock) : "—"}</td>
      <td class="num">${num(l.par)}</td>
      <td class="num">${num(l.vendido_hoy)}</td>
      <td class="num">${l.contado ? rd(l.valor) : "—"}</td>
    </tr>`).join("");
    caja.innerHTML = `${volver}<div class="card">
      <h3>📍 ${escapar(t.nombre)} <small>· ${escapar(N.chofer(t.chofer).ruta)}</small></h3>
      <p class="ayuda">Último conteo: ${s.dias === 0 ? "hoy" : `hace ${s.dias} día${s.dias === 1 ? "" : "s"}`} a las ${escapar(s.visita.hora)} (${escapar(N.chofer(s.visita.chofer).nombre)}${s.visita.origen === "whatsapp" ? ", por WhatsApp" : ""})${s.visita.notas ? ` · Nota: ${escapar(s.visita.notas)}` : ""}</p>
      <div class="scroll-x"><table class="tabla">
        <thead><tr><th>Producto</th><th class="num">Stock est.</th><th class="num">Nivel par</th><th class="num">Vendido hoy</th><th class="num">Valor</th></tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr><td><b>Total</b></td><td class="num"><b>${num(s.unidades)}</b></td><td></td><td></td><td class="num"><b>${rd(s.valor)}</b></td></tr></tfoot>
      </table></div>
      <p class="ayuda">En ámbar, lo que está por debajo de la mitad del nivel par.</p>
    </div>`;
  }
  caja.querySelector("#volver").addEventListener("click", () => { detalle = null; pintar(caja); });
}
