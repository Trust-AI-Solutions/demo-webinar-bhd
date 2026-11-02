// Herramientas que la IA puede usar. Las definiciones (nombre, descripción y
// parámetros) viven en la función de Netlify; aquí se ejecutan, en el navegador,
// sobre los datos ficticios. El asistente de WhatsApp nunca ve costos ni márgenes.

import * as N from "./negocio.js";
import { modificarEstado, siguienteNumero } from "./estado.js";
import { calcularLineas, costoEnvio, crearPedido } from "./pedidos.js";

const ETIQUETAS = {
  resumen_ventas: "Revisando las ventas",
  consultar_inventario: "Revisando el inventario",
  cuentas_por_cobrar: "Revisando las cuentas por cobrar",
  buscar_clientes: "Buscando clientes",
  ver_pedidos: "Revisando los pedidos",
  ver_alertas: "Revisando las alertas",
  buscar_productos: "Buscando en el catálogo",
  crear_cotizacion: "Preparando la cotización",
  registrar_pedido: "Registrando el pedido",
  pasar_a_persona: "Avisando al equipo",
};
export const etiquetaHerramienta = (nombre) => ETIQUETAS[nombre] ?? "Consultando";

const texto = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const numero = (v, def) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : def);

// ---------- panel (dueño del negocio) ----------

const PANEL = {
  resumen_ventas: (e) => N.resumenVentas({ desde: texto(e.desde), hasta: texto(e.hasta), sucursal: texto(e.sucursal), categoria: texto(e.categoria), vendedor: texto(e.vendedor), cliente: texto(e.cliente), agruparPor: texto(e.agrupar_por), limite: numero(e.limite, 15) }),
  consultar_inventario: (e) => N.buscarProductos({ texto: texto(e.texto), categoria: texto(e.categoria), sucursal: texto(e.sucursal) === "Villa Mella" ? "villa-mella" : texto(e.sucursal) ? "herrera" : undefined, soloBajoMinimo: !!e.solo_bajo_minimo, sinMovimientoDias: numero(e.sin_ventas_en_dias), orden: texto(e.orden), limite: numero(e.limite, 15) }),
  cuentas_por_cobrar: (e) => N.cuentasPorCobrar({ cliente: texto(e.cliente), vencidasMasDeDias: numero(e.vencidas_mas_de_dias, 0), limite: numero(e.limite, 15) }),
  buscar_clientes: (e) => N.buscarClientes({ texto: texto(e.texto), tipo: texto(e.tipo), limite: numero(e.limite, 10) }),
  ver_pedidos: (e) => N.verPedidos({ estado: texto(e.estado), canal: texto(e.canal), limite: numero(e.limite, 15) }),
  ver_alertas: () => ({ alertas: N.alertas() }),
};

// ---------- WhatsApp (cliente de la ferretería) ----------

const WHATSAPP = {
  buscar_productos: (e) => {
    const r = N.buscarProductos({ texto: texto(e.texto), categoria: texto(e.categoria), limite: numero(e.limite, 8) });
    return {
      encontrados: r.encontrados,
      productos: r.productos.map((p) => ({
        codigo: p.codigo, nombre: p.nombre, unidad: p.unidad, precio_sin_itbis: p.precio_sin_itbis,
        disponibilidad: p.stock_total === 0 ? "agotado" : p.stock_total < 10 ? `pocas unidades (${p.stock_total})` : "disponible",
      })),
      nota: r.encontrados === 0 ? "No hay coincidencias. Prueba con otra palabra o pregunta al cliente por más detalles." : undefined,
    };
  },
  crear_cotizacion: (e) => {
    const c = calcularLineas(e.items);
    if (c.error) return c;
    const entrega = e.tipo_entrega === "envío" ? "envío" : "retiro en tienda";
    const envio = costoEnvio(c.subtotal, entrega);
    return modificarEstado((estado) => {
      const id = `COT-${siguienteNumero(estado)}`;
      const cot = { id, fecha: N.hoy(), cliente: texto(e.nombre_cliente) ?? "Cliente de WhatsApp", entrega, ...c, envio, total_a_pagar: Math.round((c.total + envio) * 100) / 100, valida_hasta: N.sumarDias(N.hoy(), 7) };
      estado.cotizaciones.unshift(cot);
      return cot;
    }, { tipo: "cotizacion" });
  },
  registrar_pedido: (e) => {
    const nombre = texto(e.nombre_cliente), telefono = texto(e.telefono);
    if (!nombre || !telefono) return { error: "Falta el nombre o el teléfono del cliente. Pídeselos antes de registrar el pedido." };
    const entrega = e.tipo_entrega === "envío" ? "envío" : "retiro en tienda";
    if (entrega === "envío" && !texto(e.direccion)) return { error: "Para envío hace falta la dirección. Pídesela al cliente." };
    const pedido = crearPedido({
      cliente: nombre, telefono, canal: "WhatsApp", sucursal: texto(e.sucursal), entrega, direccion: texto(e.direccion),
      forma_pago: texto(e.forma_pago), nota: texto(e.nota), items: e.items, origen: "asistente",
    });
    if (pedido.error) return pedido;
    const ahora = new Date();
    const salida = entrega === "envío" ? (ahora.getHours() < 14 ? "hoy en la tarde" : "mañana") : "listo para retirar en unas 2 horas";
    return { pedido: pedido.id, total_a_pagar: pedido.total, subtotal: pedido.subtotal, itbis: pedido.itbis, envio: pedido.envio, entrega: pedido.entrega, cuando: salida, estado: "registrado; el equipo lo verá en el panel ahora mismo" };
  },
  pasar_a_persona: (e) => {
    const a = modificarEstado((estado) => {
      const x = { id: `A-${siguienteNumero(estado)}`, fecha: N.hoy(), hora: new Date().toTimeString().slice(0, 5), nombre: texto(e.nombre_cliente), motivo: texto(e.motivo) ?? "El cliente pidió hablar con una persona.", atendida: false };
      estado.atenciones.unshift(x);
      return x;
    }, { tipo: "atencion" });
    return { aviso: a.id, resultado: "El equipo recibió el aviso y responderá por este mismo chat en horario laboral." };
  },
};

export async function ejecutarHerramienta(modo, nombre, entrada) {
  const tabla = modo === "whatsapp" ? WHATSAPP : PANEL;
  const funcion = tabla[nombre];
  if (!funcion) return { error: `Herramienta desconocida: ${nombre}` };
  try {
    return funcion(entrada && typeof entrada === "object" ? entrada : {});
  } catch (e) {
    console.error(e);
    return { error: `No se pudo completar la consulta: ${e.message}` };
  }
}
