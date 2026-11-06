// Choferes, Productos y Tiendas: la parte que administra Minis sin depender del equipo.
// La ruta del día sí se guarda en la demo (el asistente de WhatsApp la usa); el catálogo
// de productos y tiendas se muestra tal cual y no se edita en la demostración.

import * as N from "./negocio.js";
import { escapar, rd, iniciales, aviso, conectarExportes } from "./util.js";

const SOLO_DEMO = "En la demostración el catálogo no se modifica: en el sistema real, este cambio se guarda al instante.";

// ---------- Choferes y rutas ----------

let choferRuta = 1;

export function pintarChoferes(caja) {
  const rutas = N.rutas();
  const mias = rutas[choferRuta];
  const asignadas = new Set(Object.values(rutas).flat());
  const sinChofer = N.TIENDAS.filter((t) => !asignadas.has(t.id));
  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Asignar la ruta de hoy 🍒</h2>
      <p class="nota">Elija el chofer y <b>marque las tiendas que visita hoy</b>: cada marca se guarda al instante. El asistente de WhatsApp le da esa lista al chofer, en orden, y no le deja cerrar el día sin pasar por todas. Si un chofer repite casi siempre el mismo recorrido, «Usar su ruta habitual» lo recupera con un clic.</p>
      <div class="controles">
        <label for="choferRuta">Chofer</label>
        <select id="choferRuta">${N.CHOFERES.map((c) => `<option value="${c.id}" ${c.id === choferRuta ? "selected" : ""}>${escapar(c.nombre)}</option>`).join("")}</select>
        <button class="boton" id="btnGuardarRutaHoy">✅ Guardar ruta de hoy</button>
        <button class="boton" id="btnRutaHabitual" style="background:var(--tallo)">↺ Usar su ruta habitual</button>
        <button class="boton claro" id="btnLimpiarRuta">Quitar todas</button>
      </div>
      <div class="rejilla-asignar" id="rejillaAsignar">${N.TIENDAS.map((t) => {
        const otro = N.CHOFERES.find((c) => c.id !== choferRuta && rutas[c.id].includes(t.id));
        return `<label class="${otro ? "ocupada" : ""}" title="${escapar(otro ? `Asignada a ${otro.nombre}` : t.nombre)}">
          <input type="checkbox" value="${t.id}" ${mias.includes(t.id) ? "checked" : ""} ${otro ? "disabled" : ""}> ${escapar(t.nombre)}${otro ? `<small>${escapar(otro.nombre.split(" ")[0])}</small>` : ""}</label>`;
      }).join("")}</div>
      <div class="resumen-rutas">${N.CHOFERES.map((c) => `<span>${escapar(c.nombre)}: <b>${rutas[c.id].length}</b></span>`).join("")}
        ${sinChofer.length ? `<span class="sin" title="${escapar(sinChofer.map((t) => t.nombre).join(", "))}">⚠️ ${sinChofer.length} tienda${sinChofer.length === 1 ? "" : "s"} sin chofer</span>` : `<span class="positivo">✓ las ${N.TIENDAS.length} tiendas asignadas</span>`}</div>
    </div>

    <div class="tarjeta">
      <h2>Progreso de las rutas de hoy</h2>
      <p class="nota">Cada cereza es una tienda de la ruta: llena = visita cerrada con el checklist completo; apagada = pendiente. Los choferes visitan de lunes a sábado.</p>
      <div class="rejilla-choferes" id="rejillaChoferes">${N.CHOFERES.map((c) => {
        const tiendas = N.rutaDe(c.id);
        const hechas = tiendas.filter((t) => N.visitaDeHoy(t.id)).length;
        const p = tiendas.length ? Math.round((hechas / tiendas.length) * 100) : 0;
        return `<div class="chofer tarjeta" data-iniciales="${iniciales(c.nombre)}" style="margin:0">
          <h3>${escapar(c.nombre)}</h3>
          <div class="ruta">${tiendas.length ? `${hechas}/${tiendas.length} tiendas · ${escapar(tiendas[0].nombre)} → ${escapar(tiendas.at(-1).nombre)}` : "Sin ruta asignada hoy"}</div>
          <div class="visitas">${tiendas.map((t) => { const v = N.visitaDeHoy(t.id); return `<span class="${v ? "hecha" : ""}" title="${escapar(t.nombre)}${v ? ` · ${escapar(v.hora)}` : " · pendiente"}">🍒</span>`; }).join("")}</div>
          <div class="ruta-progreso" style="margin-left:0"><div><span>Avance</span><b>${p}%</b></div><div class="ruta-progreso-pista"><i style="width:${p}%"></i></div></div>
        </div>`;
      }).join("")}</div>
    </div>

    <div class="tarjeta">
      <h2>Administrar choferes</h2>
      <p class="nota">El teléfono de WhatsApp es la llave con la que el asistente identifica a cada chofer. <b>Desactivar</b> lo saca de las rutas sin perder nada; sus conteos se conservan.</p>
      <div class="controles">
        <input type="text" id="nuevoChoferNombre" placeholder="Nombre del chofer" aria-label="Nombre del chofer">
        <input type="text" id="nuevoChoferTel" placeholder="+1 809 000 0000" aria-label="Teléfono de WhatsApp">
        <button class="boton" data-solo-demo>Agregar chofer</button>
      </div>
      <div class="envoltura-tabla">
        <table id="tablaChoferes">
          <thead><tr><th>Chofer</th><th>WhatsApp</th><th>Ruta habitual</th><th>Estado</th><th></th></tr></thead>
          <tbody>${N.CHOFERES.map((c) => `<tr><td><b>${escapar(c.nombre)}</b></td><td>${escapar(c.telefono)}</td><td>${escapar(c.ruta)}</td><td><span class="positivo">Activo</span></td><td><button class="mini-editar" data-solo-demo>Editar</button></td></tr>`).join("")}</tbody>
        </table>
      </div>
    </div>`;

  caja.querySelector("#choferRuta").addEventListener("change", (e) => { choferRuta = Number(e.target.value); pintarChoferes(caja); });
  caja.querySelectorAll("#rejillaAsignar input").forEach((inp) => inp.addEventListener("change", () => {
    const lista = [...caja.querySelectorAll("#rejillaAsignar input:checked")].map((x) => Number(x.value));
    N.asignarRuta(choferRuta, lista);
  }));
  caja.querySelector("#btnGuardarRutaHoy").addEventListener("click", () => aviso(`Ruta de hoy guardada: ${N.rutaDe(choferRuta).length} tiendas para ${N.chofer(choferRuta).nombre}. El asistente ya la tiene.`));
  caja.querySelector("#btnRutaHabitual").addEventListener("click", () => { N.asignarRuta(choferRuta, N.rutaHabitual(choferRuta)); aviso("Se cargó su ruta habitual."); });
  caja.querySelector("#btnLimpiarRuta").addEventListener("click", () => N.asignarRuta(choferRuta, []));
  caja.querySelectorAll("[data-solo-demo]").forEach((b) => b.addEventListener("click", () => aviso(SOLO_DEMO)));
}

// ---------- Productos ----------

export function pintarProductos(caja) {
  const enChecklist = N.contados().length;
  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Productos en venta 🍒</h2>
      <p class="nota">Esta lista es el corazón del sistema: define el <b>checklist que completan los choferes</b> y el mapeo con el que se <b>lee el informe PDF de la cadena</b> (por código de artículo). Al agregar o desactivar un producto, el checklist y la lectura del PDF se ajustan solos.</p>
      <div class="controles">
        <input type="text" placeholder="Código en la cadena (ej. LP-40299)" aria-label="Código de artículo en la cadena">
        <input type="text" placeholder="Nombre del producto" aria-label="Nombre del producto">
        <input type="text" placeholder="Precio a liquidar RD$" aria-label="Precio a liquidar">
        <button class="boton" data-solo-demo>Agregar producto</button>
      </div>
      <p class="nota">Checklist actual de los choferes: <b>${enChecklist} productos</b> (los otros ${N.PRODUCTOS.length - enChecklist} se reponen sin contarlos).</p>
      <div class="envoltura-tabla">
        <table id="tablaProductos">
          <thead><tr><th>Código en la cadena</th><th>Código Minis</th><th>Producto</th><th class="num">Precio a liquidar (RD$)</th><th>Checklist</th><th>Estado</th><th></th></tr></thead>
          <tbody>${N.PRODUCTOS.map((p) => `<tr><td>${escapar(p.codigoLP)}</td><td>${escapar(p.codigo)}</td><td><b>${escapar(p.nombre)}</b></td><td class="num">${rd(p.precio)}</td>
            <td>${p.conteo ? '<span class="pastilla verde">sí</span>' : '<span class="pastilla">no</span>'}</td><td><span class="positivo">Activo</span></td><td><button class="mini-editar" data-solo-demo>Editar</button></td></tr>`).join("")}</tbody>
        </table>
      </div>
      <div class="controles" style="margin-top:12px"><button class="boton" data-exportar="tablaProductos" data-nombre="productos">⬇ Exportar a Excel</button></div>
    </div>`;
  caja.querySelectorAll("[data-solo-demo]").forEach((b) => b.addEventListener("click", () => aviso(SOLO_DEMO)));
  conectarExportes(caja);
}

// ---------- Tiendas ----------

let tiendaSurtido = 1;

export function pintarTiendas(caja) {
  const t = N.tienda(tiendaSurtido);
  caja.innerHTML = `
    <div class="tarjeta">
      <h2>Administrar tiendas 🍒</h2>
      <p class="nota">Los supermercados donde Minis tiene consignación. Al <b>agregar</b> una tienda aparece de inmediato en todos los filtros, rutas y pantallas; al <b>desactivarla</b> deja de aparecer pero conserva su historial.</p>
      <div class="controles">
        <input type="text" placeholder="Nombre de la tienda (ej. Caribe Av. Duarte)" aria-label="Nombre de la tienda">
        <button class="boton" data-solo-demo>Agregar tienda</button>
      </div>
      <p class="nota">Tiendas activas: <b>${N.TIENDAS.length}</b>, en tres cadenas.</p>
      <div class="envoltura-tabla">
        <table id="tablaTiendas">
          <thead><tr><th>Tienda</th><th>Nombre en el informe de la cadena</th><th>Ruta habitual</th><th>Estado</th><th></th></tr></thead>
          <tbody>${N.TIENDAS.map((x) => {
            const s = N.stockTienda(x.id);
            return `<tr><td><b>${escapar(x.nombre)}</b></td><td>${x.enReporte ? escapar(x.enReporte) : '<span class="nota">igual que en el panel</span>'}</td><td>${escapar(N.chofer(x.chofer).ruta)}</td>
              <td>${s ? '<span class="positivo">Activa</span>' : '<span class="pastilla ambar">Nueva · sin conteo</span>'}</td><td><button class="mini-editar" data-solo-demo>Editar</button></td></tr>`;
          }).join("")}</tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:10px">El <b>nombre en el informe</b> es como el PDF de la cadena llama a la tienda (por ejemplo, «HLP-03 LUPERON»). Si coincide con el nombre del panel no hace falta ponerlo.</p>
    </div>

    <div class="tarjeta">
      <h2>Surtido de cada tienda 🍒</h2>
      <p class="nota">Los productos que <b>esa tienda lleva</b>: esta lista es exactamente el <b>checklist que el asistente de WhatsApp le pregunta al chofer</b> al visitarla.</p>
      <div class="controles">
        <label for="tiendaSurtido">Tienda</label>
        <select id="tiendaSurtido">${N.TIENDAS.map((x) => `<option value="${x.id}" ${x.id === t.id ? "selected" : ""}>${escapar(x.nombre)}</option>`).join("")}</select>
        <button class="boton" data-solo-demo>✅ Guardar surtido</button>
        <span class="nota" style="margin:0">${N.contados().length} productos en el checklist de ${escapar(t.nombre)}</span>
      </div>
      <div class="rejilla-asignar" id="rejillaSurtido">${N.PRODUCTOS.map((p) => `<label><input type="checkbox" ${p.conteo ? "checked" : ""} disabled> ${escapar(p.nombre)} <small style="margin-left:auto;color:#5c4a45">par ${N.parEn(p, t)}</small></label>`).join("")}</div>
    </div>`;
  caja.querySelector("#tiendaSurtido").addEventListener("change", (e) => { tiendaSurtido = Number(e.target.value); pintarTiendas(caja); });
  caja.querySelectorAll("[data-solo-demo]").forEach((b) => b.addEventListener("click", () => aviso(SOLO_DEMO)));
}
