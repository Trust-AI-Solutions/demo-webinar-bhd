// Pantalla de pedidos: formulario "Nuevo pedido" (a mano, como en el mostrador o por
// teléfono) e "Importar PDF o foto" (la IA lee una orden de compra o la hoja del
// repartidor y propone el pedido o los cambios; una persona revisa y aplica).

import * as N from "./negocio.js";
import { calcularLineas, costoEnvio, crearPedido, actualizarPedidos, guardarReporteVentas } from "./pedidos.js";
import { leerDocumento } from "./ia.js";
import { rd, num, escapar } from "./formato.js";

const $ = (s, r = document) => r.querySelector(s);
const TAMANO_MAXIMO_PDF = 4 * 1024 * 1024;
const LADO_MAXIMO_FOTO = 1600;
const EJEMPLOS = [
  { archivo: "ejemplos/orden-de-compra-meson-del-cafe.pdf", nombre: "Orden de compra" },
  { archivo: "ejemplos/reporte-de-entregas-ruta-manana.pdf", nombre: "Hoja del repartidor" },
  { archivo: "ejemplos/reporte-ventas-la-canasta.pdf", nombre: "Reporte de ventas de La Canasta" },
];

let avisar = () => {};
export function configurarPedidos({ aviso }) { avisar = aviso; }

export const botonesPedidos = () => `
  <div class="acciones">
    <button class="boton" type="button" id="nuevo-pedido">Nuevo pedido</button>
    <button class="boton secundario" type="button" id="importar-documento">Importar PDF o foto</button>
  </div>`;

export function conectarBotones(raiz) {
  $("#nuevo-pedido", raiz)?.addEventListener("click", abrirNuevoPedido);
  $("#importar-documento", raiz)?.addEventListener("click", abrirImportar);
}

function hoja(titulo) {
  const d = document.createElement("dialog");
  d.className = "hoja";
  d.innerHTML = `<div class="hoja-cabecera"><h2>${titulo}</h2><button type="button" class="icono-boton cerrar-hoja" aria-label="Cerrar">×</button></div><div class="hoja-cuerpo"></div>`;
  document.body.appendChild(d);
  const cerrar = () => { d.close(); d.remove(); };
  $(".cerrar-hoja", d).addEventListener("click", cerrar);
  d.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
  d.showModal();
  return { d, cuerpo: $(".hoja-cuerpo", d), cerrar };
}

// ---------- nuevo pedido a mano ----------

const etiquetaProducto = (p) => `${p.codigo} · ${p.nombre} · ${rd(p.precio)}/${p.unidad}`;
const codigoDe = (texto) => (String(texto).toUpperCase().match(/^\s*([A-Z]{3}-\d{3})\b/) ?? [])[1];

export function abrirNuevoPedido() {
  const d = N.datos();
  const { d: dialogo, cuerpo, cerrar } = hoja("Nuevo pedido");
  cuerpo.innerHTML = `
    <form class="formulario-pedido" novalidate>
      <datalist id="lista-clientes">${d.clientes.map((c) => `<option value="${escapar(c.nombre)}"></option>`).join("")}</datalist>
      <datalist id="lista-productos">${d.productos.map((p) => `<option value="${escapar(etiquetaProducto(p))}"></option>`).join("")}</datalist>
      <div class="rejilla">
        <label class="ancho">Cliente<input name="cliente" list="lista-clientes" autocomplete="off" required></label>
        <label>Teléfono<input name="telefono" inputmode="tel" autocomplete="off"></label>
        <label>Canal<select name="canal"><option>Mostrador</option><option>Teléfono</option><option>Correo</option></select></label>
        <label>Sucursal<select name="sucursal"><option value="gazcue">Gazcue</option><option value="los-prados">Los Prados</option></select></label>
        <label>Entrega<select name="entrega"><option value="retiro en tienda">Retira en tienda</option><option value="envío">Envío</option></select></label>
        <label class="ancho direccion" hidden>Dirección de entrega<input name="direccion" autocomplete="off"></label>
        <label>Forma de pago<select name="forma_pago"><option>efectivo</option><option>transferencia</option><option>tarjeta</option><option>crédito a 15 días</option></select></label>
        <label>Para cuándo<input name="para_cuando" autocomplete="off"></label>
      </div>
      <h3>Productos</h3>
      <div class="lineas-pedido"></div>
      <button class="boton secundario pequeno" type="button" id="agregar-linea">+ Agregar producto</button>
      <label class="ancho">Nota<input name="nota" autocomplete="off"></label>
      <dl class="totales"></dl>
      <p class="error" role="alert" hidden></p>
      <div class="acciones-hoja"><button class="boton secundario" type="button" data-cancelar>Cancelar</button><button class="boton" type="submit">Guardar pedido</button></div>
    </form>`;
  const f = $("form", cuerpo);
  const lineas = $(".lineas-pedido", f);

  const agregarLinea = () => {
    const fila = document.createElement("div");
    fila.className = "linea-pedido";
    fila.innerHTML = `<input class="producto" list="lista-productos" autocomplete="off" placeholder="Producto" aria-label="Producto"><input class="cantidad" type="number" min="1" step="1" value="1" aria-label="Cantidad"><span class="importe">—</span><button type="button" class="quitar" aria-label="Quitar producto">×</button>`;
    lineas.appendChild(fila);
    $(".quitar", fila).addEventListener("click", () => { fila.remove(); if (!lineas.children.length) agregarLinea(); recalcular(); });
    $(".producto", fila).focus();
  };

  const leerItems = () => [...lineas.children].map((fila) => {
    const codigo = codigoDe($(".producto", fila).value);
    const p = codigo ? d.porCodigo[codigo] : null;
    const cantidad = Math.floor(Number($(".cantidad", fila).value));
    $(".importe", fila).textContent = p && cantidad > 0 ? rd(p.precio * cantidad) : "—";
    fila.classList.toggle("sin-producto", !!$(".producto", fila).value.trim() && !p);
    return p && cantidad > 0 ? { codigo, cantidad } : null;
  }).filter(Boolean);

  const recalcular = () => {
    const items = leerItems();
    const c = items.length ? calcularLineas(items) : { subtotal: 0, itbis: 0, total: 0 };
    const envio = costoEnvio(c.subtotal, f.entrega.value);
    $(".totales", f).innerHTML = `<div><dt>Subtotal</dt><dd>${rd(c.subtotal)}</dd></div><div><dt>ITBIS 18 %</dt><dd>${rd(c.itbis)}</dd></div><div><dt>Envío</dt><dd>${f.entrega.value === "envío" ? (envio ? rd(envio) : "Gratis") : "—"}</dd></div><div class="total"><dt>Total</dt><dd>${rd(c.total + envio)}</dd></div>`;
    return items;
  };

  f.cliente.addEventListener("change", () => {
    const c = d.clientes.find((x) => x.nombre === f.cliente.value);
    if (c) { f.telefono.value = c.telefono; f.sucursal.value = c.sucursal; if (c.credito) f.forma_pago.value = "crédito a 15 días"; }
  });
  f.entrega.addEventListener("change", () => { $(".direccion", f).hidden = f.entrega.value !== "envío"; recalcular(); });
  f.addEventListener("input", recalcular);
  f.addEventListener("change", recalcular);
  $("#agregar-linea", f).addEventListener("click", agregarLinea);
  $("[data-cancelar]", f).addEventListener("click", cerrar);
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const items = recalcular();
    const error = !f.cliente.value.trim() ? "Escriba el nombre del cliente."
      : !items.length ? "Agregue al menos un producto del menú."
      : lineas.querySelector(".sin-producto") ? "Hay un producto que no está en el menú: escójalo de la lista."
      : f.entrega.value === "envío" && !f.direccion.value.trim() ? "Para envío hace falta la dirección." : "";
    const caja = $(".error", f);
    caja.textContent = error; caja.hidden = !error;
    if (error) return;
    const p = crearPedido({ cliente: f.cliente.value.trim(), telefono: f.telefono.value.trim(), canal: f.canal.value, sucursal: f.sucursal.value, entrega: f.entrega.value, direccion: f.direccion.value.trim(), forma_pago: f.forma_pago.value, para_cuando: f.para_cuando.value.trim(), nota: f.nota.value.trim(), items, origen: "manual" });
    if (p.error) { caja.textContent = p.error; caja.hidden = false; return; }
    cerrar();
  });
  agregarLinea();
  recalcular();
  f.cliente.focus();
  return dialogo;
}

// ---------- importar PDF o foto ----------

function contextoParaLaIA() {
  const d = N.datos();
  const pedidos = N.todosLosPedidos().filter((p) => p.estado !== "entregado" || p.fecha === d.hoy);
  return [
    "MENÚ (código | producto | unidad | precio sin ITBIS | anticipación):",
    ...d.productos.map((p) => `${p.codigo} | ${p.nombre} | ${p.unidad} | ${p.precio} | ${p.anticipacionHoras ? `${p.anticipacionHoras} horas` : "del día"}`),
    "",
    "CLIENTES (nombre | teléfono | tipo | crédito):",
    ...d.clientes.map((c) => `${c.nombre} | ${c.telefono} | ${c.tipo} | ${c.credito ? "sí" : "no"}`),
    "",
    `CONSIGNACIÓN EN ${d.consignacion.cliente.toUpperCase()}`,
    "Tiendas (nombre en el panel | nombre en el reporte de la cadena):",
    ...d.consignacion.tiendas.map((t) => `${t.nombre} | ${t.enReporte}`),
    "Productos (código del menú | código de la cadena | nombre en el reporte de la cadena):",
    ...d.consignacion.productos.map((p) => `${p.codigo} | ${p.codigoCliente} | ${p.nombreCliente}`),
    "",
    "PEDIDOS ABIERTOS Y ENTREGADOS HOY (número | cliente | estado | entrega):",
    ...pedidos.map((p) => `${p.id} | ${p.cliente} | ${p.estado} | ${p.entrega}`),
  ].join("\n");
}

const aBase64 = (blob) => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(",")[1]);
  r.onerror = () => mal(new Error("No se pudo leer el archivo."));
  r.readAsDataURL(blob);
});

// Las fotos del teléfono pesan mucho: se reducen a 1600 px por lado antes de enviarlas.
async function prepararArchivo(archivo) {
  if (archivo.type === "application/pdf" || /\.pdf$/i.test(archivo.name)) {
    if (archivo.size > TAMANO_MAXIMO_PDF) throw new Error("El PDF pesa más de 4 MB. Pruebe con uno más liviano o con una foto.");
    return { tipo: "document", media_type: "application/pdf", datos: await aBase64(archivo), nombre: archivo.name, vista: null };
  }
  if (!archivo.type.startsWith("image/")) throw new Error("Solo se aceptan PDF o fotos (JPG o PNG).");
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  const blob = await new Promise((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
  return { tipo: "image", media_type: "image/jpeg", datos: await aBase64(blob), nombre: archivo.name, vista: URL.createObjectURL(blob) };
}

export function abrirImportar() {
  const { d: dialogo, cuerpo, cerrar } = hoja("Importar PDF o foto");

  const elegir = (error = "") => {
    cuerpo.innerHTML = `
      <label class="soltar" tabindex="0">
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden>
        Arrastre un PDF o una foto, o haga clic para escogerlo
      </label>
      ${error ? `<p class="error" role="alert">${escapar(error)}</p>` : ""}
      <h3>Ejemplos</h3>
      <ul class="ejemplos">${EJEMPLOS.map((e, i) => `<li><span>${e.nombre}</span><a class="boton secundario pequeno" href="${e.archivo}" target="_blank" rel="noopener">Ver</a><button class="boton pequeno" type="button" data-ejemplo="${i}">Leer con IA</button></li>`).join("")}</ul>`;
    const entrada = $("input[type=file]", cuerpo);
    const zona = $(".soltar", cuerpo);
    entrada.addEventListener("change", () => entrada.files[0] && leer(entrada.files[0]));
    zona.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); entrada.click(); } });
    zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("encima"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("encima"));
    zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("encima"); if (e.dataTransfer.files[0]) leer(e.dataTransfer.files[0]); });
    cuerpo.querySelectorAll("[data-ejemplo]").forEach((b) => b.addEventListener("click", async () => {
      const e = EJEMPLOS[Number(b.dataset.ejemplo)];
      try {
        const r = await fetch(e.archivo);
        if (!r.ok) throw new Error("No se encontró el ejemplo.");
        const blob = await r.blob();
        leer(new File([blob], e.archivo.split("/").pop(), { type: "application/pdf" }));
      } catch (err) { elegir(err.message); }
    }));
  };

  const leer = async (archivo) => {
    cuerpo.innerHTML = `<div class="leyendo"><span class="punto-carga" aria-hidden="true"></span><span>Leyendo <b>${escapar(archivo.name)}</b>…</span></div>`;
    try {
      const preparado = await prepararArchivo(archivo);
      if (preparado.vista) cuerpo.insertAdjacentHTML("beforeend", `<img class="vista-foto" src="${preparado.vista}" alt="Foto que se está leyendo">`);
      const resultado = await leerDocumento(preparado, contextoParaLaIA());
      if (!dialogo.open) return;
      mostrarResultado(resultado, preparado);
    } catch (e) {
      if (dialogo.open) elegir(e.message);
    }
  };

  const mostrarResultado = (r, archivo) => {
    const d = N.datos();
    const dudas = Array.isArray(r.dudas) ? r.dudas.filter(Boolean) : [];
    const bloqueDudas = dudas.length ? `<div class="dudas"><b>Para revisar</b><ul>${dudas.map((x) => `<li>${escapar(x)}</li>`).join("")}</ul></div>` : "";
    const tipos = { orden_de_compra: "Orden de compra", reporte_de_entregas: "Reporte de entregas", reporte_de_ventas: "Reporte de ventas" };
    const cabecera = `<p class="resumen-documento"><span class="insignia">${tipos[r.tipo] ?? "Otro documento"}</span> ${escapar(r.resumen ?? "")}</p>`;

    if (r.tipo === "orden_de_compra" && r.pedido_nuevo?.lineas?.length) {
      const p = r.pedido_nuevo;
      const lineas = p.lineas.map((l) => {
        const prod = l.codigo ? d.porCodigo[String(l.codigo).toUpperCase()] : null;
        return { ...l, prod, cantidad: Math.max(1, Math.floor(Number(l.cantidad) || 1)) };
      });
      const items = lineas.filter((l) => l.prod).map((l) => ({ codigo: l.prod.codigo, cantidad: l.cantidad }));
      const c = items.length ? calcularLineas(items) : { subtotal: 0, itbis: 0, total: 0 };
      const entrega = p.entrega === "envío" ? "envío" : "retiro en tienda";
      const envio = costoEnvio(c.subtotal, entrega);
      cuerpo.innerHTML = `${cabecera}
        <dl class="datos-cliente"><div><dt>Cliente</dt><dd>${escapar(p.cliente)}</dd></div><div><dt>Teléfono</dt><dd>${escapar(p.telefono || "—")}</dd></div><div><dt>Entrega</dt><dd>${escapar(entrega)}${p.direccion ? `: ${escapar(p.direccion)}` : ""}</dd></div><div><dt>Pago</dt><dd>${escapar(p.forma_pago || "por confirmar")}</dd></div>${p.para_cuando ? `<div><dt>Para</dt><dd>${escapar(p.para_cuando)}</dd></div>` : ""}${p.referencia ? `<div><dt>Referencia</dt><dd>${escapar(p.referencia)}</dd></div>` : ""}</dl>
        <div class="tabla-envoltura"><table class="tabla-documento"><thead><tr><th>En el documento</th><th>En el menú</th><th class="n">Cant.</th><th class="n">Importe</th></tr></thead><tbody>
        ${lineas.map((l) => `<tr class="${l.prod ? "" : "sin-catalogo"}"><td>${escapar(l.texto_original)}</td><td>${l.prod ? escapar(l.prod.nombre) : `<span class="insignia alta">No está en el menú</span>`}</td><td class="n">${num(l.cantidad)}</td><td class="n">${l.prod ? rd(l.prod.precio * l.cantidad) : "—"}</td></tr>`).join("")}
        </tbody></table></div>
        <dl class="totales"><div><dt>Subtotal</dt><dd>${rd(c.subtotal)}</dd></div><div><dt>ITBIS 18 %</dt><dd>${rd(c.itbis)}</dd></div><div><dt>Envío</dt><dd>${entrega === "envío" ? (envio ? rd(envio) : "Gratis") : "—"}</dd></div><div class="total"><dt>Total</dt><dd>${rd(c.total + envio)}</dd></div></dl>
        ${bloqueDudas}
        <div class="acciones-hoja"><button class="boton secundario" type="button" data-otro>Leer otro</button><button class="boton" type="button" data-aplicar ${items.length ? "" : "disabled"}>Crear el pedido</button></div>`;
      $("[data-aplicar]", cuerpo).addEventListener("click", () => {
        const faltantes = lineas.filter((l) => !l.prod).map((l) => `${l.cantidad} × ${l.texto_original}`);
        const nota = [p.referencia ? `Orden ${p.referencia}` : "", p.nota ?? "", faltantes.length ? `Cotizar aparte: ${faltantes.join("; ")}` : ""].filter(Boolean).join(". ");
        const nuevo = crearPedido({ cliente: p.cliente, telefono: p.telefono, canal: archivo.tipo === "image" ? "WhatsApp" : "Correo", sucursal: p.sucursal, entrega, direccion: p.direccion, forma_pago: p.forma_pago, para_cuando: p.para_cuando, nota, items, origen: "documento" });
        if (nuevo.error) { avisar(nuevo.error); return; }
        cerrar();
      });
    } else if (r.tipo === "reporte_de_entregas" && r.actualizaciones?.length) {
      const existentes = new Map(N.todosLosPedidos().map((p) => [p.id, p]));
      const filas = r.actualizaciones.map((a) => ({ ...a, id: String(a.pedido ?? "").toUpperCase().replace(/^P(\d)/, "P-$1") })).map((a) => ({ ...a, actual: existentes.get(a.id) }));
      const aplicables = filas.filter((a) => a.actual);
      cuerpo.innerHTML = `${cabecera}
        <div class="tabla-envoltura"><table class="tabla-documento"><thead><tr><th>Pedido</th><th>Estado</th><th>Novedad</th></tr></thead><tbody>
        ${filas.map((a) => `<tr class="${a.actual ? "" : "sin-catalogo"}"><td><b>${escapar(a.pedido)}</b><span class="detalle">${a.actual ? escapar(a.actual.cliente) : "No existe en el panel"}</span></td><td>${!a.actual ? `<span class="insignia alta">No se aplica</span>` : a.estado && a.estado !== a.actual.estado ? `${escapar(a.actual.estado)} → <b>${escapar(a.estado)}</b>` : `${escapar(a.actual.estado)} <span class="detalle">sin cambio</span>`}</td><td>${escapar(a.nota || "—")}</td></tr>`).join("")}
        </tbody></table></div>
        ${bloqueDudas}
        <div class="acciones-hoja"><button class="boton secundario" type="button" data-otro>Leer otro</button><button class="boton" type="button" data-aplicar ${aplicables.length ? "" : "disabled"}>Aplicar ${aplicables.length} ${aplicables.length === 1 ? "cambio" : "cambios"}</button></div>`;
      $("[data-aplicar]", cuerpo).addEventListener("click", () => {
        const { aplicados } = actualizarPedidos(aplicables.map((a) => ({ pedido: a.id, estado: a.estado, nota: a.nota })));
        cerrar();
        avisar(`Reporte aplicado: ${aplicados.length} ${aplicados.length === 1 ? "pedido actualizado" : "pedidos actualizados"}`);
      });
    } else if (r.tipo === "reporte_de_ventas" && r.ventas_reportadas?.length) {
      const c = d.consignacion;
      const prod = Object.fromEntries(c.productos.map((p) => [p.codigo, p]));
      const entregado = Object.fromEntries(c.entregas.map((e) => [`${e.tienda}|${e.codigo}`, e.unidades]));
      const tiendaDe = (texto) => { const t = N.normalizar(texto); return c.tiendas.find((x) => N.normalizar(x.nombre) === t || N.normalizar(x.enReporte) === t || t.includes(N.normalizar(x.nombre.replace("La Canasta ", "")))); };
      const filas = r.ventas_reportadas.map((v) => {
        const t = tiendaDe(v.tienda), p = prod[String(v.codigo ?? "").toUpperCase()];
        const ent = t && p ? entregado[`${t.id}|${p.codigo}`] ?? 0 : null;
        return { ...v, t, p, ent, unidades: Math.max(0, Math.floor(Number(v.unidades) || 0)) };
      });
      const validas = filas.filter((f) => f.t && f.p);
      const total = validas.reduce((a, f) => a + f.unidades * f.p.precioLiquidar, 0);
      cuerpo.innerHTML = `${cabecera}
        <dl class="datos-cliente"><div><dt>Cadena</dt><dd>${escapar(c.cliente)}</dd></div><div><dt>Periodo</dt><dd>${escapar(r.periodo || "—")}</dd></div><div><dt>A liquidar</dt><dd>${rd(total)}</dd></div><div><dt>Comisión de la cadena</dt><dd>${c.comision * 100} %</dd></div></dl>
        <div class="tabla-envoltura"><table class="tabla-documento"><thead><tr><th>Tienda</th><th>Producto</th><th class="n">Entregado</th><th class="n">Vendido</th><th class="n">Quedan</th><th class="n">A liquidar</th></tr></thead><tbody>
        ${filas.map((f) => {
          const raro = f.p && f.t && f.unidades > f.ent;
          return `<tr class="${f.t && f.p && !raro ? "" : "sin-catalogo"}"><td>${escapar(f.t ? f.t.nombre : f.tienda)}</td><td>${f.p ? `${escapar(f.p.nombre)}<span class="detalle">${escapar(f.texto_original)}</span>` : `${escapar(f.texto_original)}<span class="detalle"><span class="insignia alta">No es de El Trigal</span></span>`}</td><td class="n">${f.ent ?? "—"}</td><td class="n">${num(f.unidades)}</td><td class="n">${f.p && f.t ? (raro ? `<span class="insignia alta">${f.ent - f.unidades}</span>` : num(f.ent - f.unidades)) : "—"}</td><td class="n">${f.p && f.t ? rd(f.unidades * f.p.precioLiquidar) : "—"}</td></tr>`;
        }).join("")}
        </tbody></table></div>
        ${bloqueDudas}
        <div class="acciones-hoja"><button class="boton secundario" type="button" data-otro>Leer otro</button><button class="boton" type="button" data-aplicar ${validas.length ? "" : "disabled"}>Guardar el reporte</button></div>`;
      $("[data-aplicar]", cuerpo).addEventListener("click", () => {
        const noReconocidas = filas.filter((f) => !f.p && f.t).map((f) => `${f.t.nombre}: ${f.texto_original} (${f.unidades})`);
        const g = guardarReporteVentas({ lineas: validas.map((f) => ({ tienda: f.t.nombre, codigo: f.p.codigo, unidades: f.unidades, texto_original: f.texto_original })), periodo: r.periodo, noReconocidas });
        cerrar();
        avisar(`Reporte de ventas guardado: ${g.guardadas} líneas. La consignación está en Ventas.`);
      });
    } else {
      cuerpo.innerHTML = `${cabecera}${bloqueDudas}<div class="acciones-hoja"><button class="boton" type="button" data-otro>Leer otro</button></div>`;
    }
    $("[data-otro]", cuerpo)?.addEventListener("click", () => elegir());
  };

  elegir();
  return dialogo;
}
