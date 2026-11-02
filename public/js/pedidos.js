// Crear y actualizar pedidos. Lo usan el asistente de WhatsApp (registrar_pedido),
// el formulario "Nuevo pedido" del panel y la importación de PDF o fotos, así que los
// tres calculan el ITBIS y el envío de la misma forma.

import * as N from "./negocio.js";
import { modificarEstado, siguienteNumero } from "./estado.js";

export const ESTADOS = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];
const r2 = (n) => Math.round(n * 100) / 100;
const numero = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);

// Líneas con precio del catálogo, subtotal, ITBIS y total (sin envío).
export function calcularLineas(items) {
  const d = N.datos();
  if (!Array.isArray(items) || items.length === 0) return { error: "La lista de artículos está vacía." };
  const lineas = [], noEncontrados = [];
  for (const it of items) {
    const p = d.porCodigo[String(it?.codigo ?? "").toUpperCase()];
    const cantidad = numero(it?.cantidad);
    if (!p || !cantidad) { noEncontrados.push(it?.codigo ?? "(sin código)"); continue; }
    const disponible = Object.values(p.stock).reduce((a, b) => a + b, 0);
    lineas.push({ codigo: p.codigo, nombre: p.nombre, unidad: p.unidad, cantidad, precio: p.precio, importe: r2(p.precio * cantidad), disponible: disponible >= cantidad ? "sí" : `solo hay ${disponible}` });
  }
  if (noEncontrados.length) return { error: `Estos códigos no existen o la cantidad no es válida: ${noEncontrados.join(", ")}. Busca el producto con buscar_productos y usa su código.` };
  const subtotal = r2(lineas.reduce((a, l) => a + l.importe, 0));
  const itbis = r2(subtotal * N.EMPRESA.itbis);
  return { lineas, subtotal, itbis, total: r2(subtotal + itbis) };
}

export function costoEnvio(subtotal, entrega) {
  if (entrega !== "envío") return 0;
  return subtotal >= 15000 ? 0 : 500;
}

// Registra un pedido nuevo. origen: "asistente" (WhatsApp), "manual" (formulario) o "documento" (PDF o foto).
export function crearPedido({ cliente, telefono, canal, sucursal, entrega, direccion, forma_pago, nota, items, origen }) {
  const c = calcularLineas(items);
  if (c.error) return c;
  const tipoEntrega = entrega === "envío" ? "envío" : "retiro en tienda";
  const envio = costoEnvio(c.subtotal, tipoEntrega);
  const ahora = new Date();
  return modificarEstado((estado) => {
    const p = {
      id: `P-${siguienteNumero(estado)}`, fecha: N.hoy(), hora: `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, "0")}`,
      cliente, telefono: telefono || "", canal, sucursal: sucursal === "villa-mella" || sucursal === "Villa Mella" ? "villa-mella" : "herrera",
      estado: "nuevo", entrega: tipoEntrega, direccion: tipoEntrega === "envío" ? direccion : undefined, forma_pago: forma_pago || "por confirmar", nota: nota || undefined,
      items: c.lineas.map((l) => ({ codigo: l.codigo, nombre: l.nombre, cantidad: l.cantidad, precio: l.precio })),
      subtotal: c.subtotal, itbis: c.itbis, envio, total: r2(c.total + envio), origen,
    };
    estado.pedidos.unshift(p);
    return p;
  }, { tipo: "pedido", origen });
}

// Cambios de estado y notas sobre pedidos existentes (por ejemplo, el reporte del chofer).
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
