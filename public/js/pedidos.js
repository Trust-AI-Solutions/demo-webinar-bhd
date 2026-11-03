// Crear y actualizar pedidos. Lo usan el asistente de WhatsApp (registrar_pedido),
// el formulario "Nuevo pedido" del panel y la importación de PDF o fotos, así que los
// tres calculan el ITBIS y el envío de la misma forma.

import * as N from "./negocio.js";
import { modificarEstado, siguienteNumero } from "./estado.js";

export const ESTADOS = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];
const r2 = (n) => Math.round(n * 100) / 100;
const numero = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);

// Líneas con precio del menú, subtotal, ITBIS y total (sin envío).
export function calcularLineas(items) {
  const d = N.datos();
  if (!Array.isArray(items) || items.length === 0) return { error: "La lista de artículos está vacía." };
  const lineas = [], noEncontrados = [];
  for (const it of items) {
    const p = d.porCodigo[String(it?.codigo ?? "").toUpperCase()];
    const cantidad = numero(it?.cantidad);
    if (!p || !cantidad) { noEncontrados.push(it?.codigo ?? "(sin código)"); continue; }
    lineas.push({ codigo: p.codigo, nombre: p.nombre, unidad: p.unidad, cantidad, precio: p.precio, importe: r2(p.precio * cantidad), ...(p.anticipacionHoras ? { por_encargo: `${p.anticipacionHoras} horas de anticipación` } : {}) });
  }
  if (noEncontrados.length) return { error: `Estos códigos no existen o la cantidad no es válida: ${noEncontrados.join(", ")}. Busca el producto con buscar_productos y usa su código.` };
  const subtotal = r2(lineas.reduce((a, l) => a + l.importe, 0));
  const itbis = r2(subtotal * N.EMPRESA.itbis);
  return { lineas, subtotal, itbis, total: r2(subtotal + itbis) };
}

export function costoEnvio(subtotal, entrega) {
  if (entrega !== "envío") return 0;
  return subtotal >= 3000 ? 0 : 150;
}

// Registra un pedido nuevo. origen: "asistente" (WhatsApp), "manual" (formulario) o "documento" (PDF o foto).
export function crearPedido({ cliente, telefono, canal, sucursal, entrega, direccion, forma_pago, para_cuando, nota, items, origen }) {
  const c = calcularLineas(items);
  if (c.error) return c;
  const tipoEntrega = entrega === "envío" ? "envío" : "retiro en tienda";
  const envio = costoEnvio(c.subtotal, tipoEntrega);
  const ahora = new Date();
  return modificarEstado((estado) => {
    const p = {
      id: `P-${siguienteNumero(estado)}`, fecha: N.hoy(), hora: `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, "0")}`,
      cliente, telefono: telefono || "", canal, sucursal: sucursal === "los-prados" || sucursal === "Los Prados" ? "los-prados" : "gazcue",
      estado: "nuevo", entrega: tipoEntrega, direccion: tipoEntrega === "envío" ? direccion : undefined, forma_pago: forma_pago || "por confirmar", para_cuando: para_cuando || undefined, nota: nota || undefined,
      items: c.lineas.map((l) => ({ codigo: l.codigo, nombre: l.nombre, cantidad: l.cantidad, precio: l.precio })),
      subtotal: c.subtotal, itbis: c.itbis, envio, total: r2(c.total + envio), origen,
    };
    estado.pedidos.unshift(p);
    return p;
  }, { tipo: "pedido", origen });
}

// Cambios de estado y notas sobre pedidos existentes (por ejemplo, la hoja del repartidor).
// Devuelve cuántos se aplicaron y cuáles no existen.
export function actualizarPedidos(cambios) {
  const existentes = new Map(N.todosLosPedidos().map((p) => [p.id, p]));
  const aplicados = [], noEncontrados = [];
  modificarEstado((estado) => {
    estado.notas ??= {};
    for (const c of cambios) {
      const id = String(c.pedido ?? "").toUpperCase().replace(/^P(\d)/, "P-$1");
      if (!existentes.has(id)) { noEncontrados.push(c.pedido); continue; }
      if (ESTADOS.includes(c.estado)) estado.cambiosEstado[id] = c.estado;
      if (c.nota) estado.notas[id] = c.nota;
      aplicados.push(id);
    }
  }, { tipo: "actualizacion" });
  return { aplicados, noEncontrados };
}

// Reporte de ventas de la cadena (consignación): se guarda el último importado.
// lineas: [{ tienda (nombre en el panel o en el reporte), codigo (del menú), unidades }]
export function guardarReporteVentas({ lineas, periodo, noReconocidas = [] }) {
  const c = N.datos().consignacion;
  const tiendaDe = (texto) => {
    const t = N.normalizar(texto);
    return c.tiendas.find((x) => N.normalizar(x.nombre) === t || N.normalizar(x.enReporte) === t || t.includes(N.normalizar(x.nombre.replace("La Canasta ", ""))));
  };
  const precio = Object.fromEntries(c.productos.map((p) => [p.codigo, p.precioLiquidar]));
  const validas = [], sinTienda = [];
  for (const l of lineas) {
    const t = tiendaDe(l.tienda);
    const codigo = String(l.codigo ?? "").toUpperCase();
    if (!t || !(codigo in precio)) { sinTienda.push(`${l.tienda}: ${l.texto_original ?? codigo}`); continue; }
    validas.push({ tienda: t.id, codigo, unidades: Math.max(0, Math.floor(Number(l.unidades) || 0)), importe: r2(precio[codigo] * (Number(l.unidades) || 0)) });
  }
  const ahora = new Date();
  modificarEstado((estado) => {
    estado.reporteVentas = { importado: `${N.hoy()} ${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, "0")}`, periodo: periodo || "", lineas: validas, noReconocidas: [...noReconocidas, ...sinTienda] };
  }, { tipo: "reporte" });
  return { guardadas: validas.length, noReconocidas: sinTienda };
}
