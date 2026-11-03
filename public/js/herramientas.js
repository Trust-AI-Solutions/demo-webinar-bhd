// Herramientas que la IA puede usar. Las definiciones (nombre, descripción y
// parámetros) viven en la función de Netlify; aquí se ejecutan, en el navegador,
// sobre los datos ficticios. El asistente de WhatsApp nunca ve costos ni márgenes.

import * as N from "./negocio.js";
import { modificarEstado, siguienteNumero } from "./estado.js";
import { calcularLineas, costoEnvio, crearPedido } from "./pedidos.js";

const ETIQUETAS = {
  resumen_ventas: "Revisando las ventas",
  consultar_menu: "Revisando el menú",
  consultar_insumos: "Revisando los insumos",
  cuentas_por_cobrar: "Revisando las cuentas por cobrar",
  buscar_clientes: "Buscando clientes",
  ver_pedidos: "Revisando los pedidos",
  ver_alertas: "Revisando las alertas",
  ver_consignacion: "Revisando la consignación",
  buscar_productos: "Buscando en el menú",
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
  consultar_menu: (e) => N.buscarProductos({ texto: texto(e.texto), categoria: texto(e.categoria), sinVentasDias: numero(e.sin_ventas_en_dias), orden: texto(e.orden), limite: numero(e.limite, 15) }),
  consultar_insumos: (e) => N.consultarInsumos({ texto: texto(e.texto), categoria: texto(e.categoria), sucursal: texto(e.sucursal), soloBajoMinimo: !!e.solo_bajo_minimo, limite: numero(e.limite, 30) }),
  cuentas_por_cobrar: (e) => N.cuentasPorCobrar({ cliente: texto(e.cliente), vencidasMasDeDias: numero(e.vencidas_mas_de_dias, 0), limite: numero(e.limite, 15) }),
  buscar_clientes: (e) => N.buscarClientes({ texto: texto(e.texto), tipo: texto(e.tipo), limite: numero(e.limite, 10) }),
  ver_pedidos: (e) => N.verPedidos({ estado: texto(e.estado), canal: texto(e.canal), soloEncargos: !!e.solo_encargos, limite: numero(e.limite, 15) }),
  ver_alertas: () => ({ alertas: N.alertas() }),
  ver_consignacion: (e) => N.consignacion({ tienda: texto(e.tienda) }),
};

// ---------- WhatsApp (cliente de la panadería) ----------

const WHATSAPP = {
  buscar_productos: (e) => {
    const r = N.buscarProductos({ texto: texto(e.texto), categoria: texto(e.categoria), limite: numero(e.limite, 8) });
    return {
      encontrados: r.encontrados,
      productos: r.productos.map((p) => ({
        codigo: p.codigo, nombre: p.nombre, unidad: p.unidad, precio_sin_itbis: p.precio_sin_itbis,
        disponibilidad: p.por_encargo ? `por encargo, con ${p.anticipacion_horas >= 48 ? `${p.anticipacion_horas / 24} días` : `${p.anticipacion_horas} horas`} de anticipación` : "del día, disponible en tienda",
      })),
      nota: r.encontrados === 0 ? "No está en el menú. Prueba con otra palabra o pregunta al cliente por más detalles." : undefined,
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
    const d = N.datos();
    const hayEncargo = Array.isArray(e.items) && e.items.some((it) => d.porCodigo[String(it?.codigo ?? "").toUpperCase()]?.anticipacionHoras > 0);
    if (hayEncargo && !texto(e.para_cuando)) return { error: "Hay productos por encargo: falta la fecha y hora de entrega (para_cuando). Pídesela al cliente." };
    const pedido = crearPedido({
      cliente: nombre, telefono, canal: "WhatsApp", sucursal: texto(e.sucursal), entrega, direccion: texto(e.direccion),
      forma_pago: texto(e.forma_pago), para_cuando: texto(e.para_cuando), nota: texto(e.nota), items: e.items, origen: "asistente",
    });
    if (pedido.error) return pedido;
    const ahora = new Date();
    const salida = texto(e.para_cuando) ?? (entrega === "envío" ? (ahora.getHours() < 11 ? "hoy en la tarde" : "mañana") : "listo para retirar en 1 hora");
    return { pedido: pedido.id, total_a_pagar: pedido.total, subtotal: pedido.subtotal, itbis: pedido.itbis, envio: pedido.envio, entrega: pedido.entrega, cuando: salida, ...(hayEncargo ? { adelanto_para_reservar: Math.round(pedido.total * 50) / 100 } : {}), estado: "registrado; el equipo lo verá en el panel ahora mismo" };
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
