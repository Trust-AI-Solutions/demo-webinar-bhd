// Grupo Rodelo: las consultas fijas del copiloto (los mismos "bloques" del panel real) y el
// motor de alertas R1–R4, calculados sobre los datos ficticios de datos.js. Las pantallas y
// la IA usan exactamente estas funciones: la IA redacta, aquí se calcula cada cifra.

import { generarDatos, sumarDias, sumarMeses, inicioMes, diasEntre } from "./datos.js";

const r2 = (n) => Math.round(n * 100) / 100;
const suma = (lista, f) => lista.reduce((s, x) => s + f(x), 0);
const contiene = (texto, filtro) => !filtro || String(texto).toLowerCase().includes(String(filtro).toLowerCase());
export const rdTexto = (n) => `RD$ ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function indices(d) {
  if (d._ix) return d._ix;
  const cliente = Object.fromEntries(d.clientes.map((c) => [c.id, c]));
  const vendedor = Object.fromEntries(d.vendedores.map((v) => [v.id, v]));
  const lineasDe = new Map();
  for (const l of d.lineas) { if (!lineasDe.has(l.pedido_id)) lineasDe.set(l.pedido_id, []); lineasDe.get(l.pedido_id).push(l); }
  d._ix = { cliente, vendedor, lineasDe };
  return d._ix;
}

// ---------- bloques ----------

export function utilidadMensual(d) {
  const meses = new Map();
  for (const f of d.facturas) {
    const m = f.fecha.slice(0, 7);
    const x = meses.get(m) ?? { mes: m, ingresos: 0, costos: 0, utilidad: 0, facturas: 0 };
    x.ingresos += f.monto_total; x.costos += f.costo_total; x.utilidad += f.monto_total - f.costo_total; x.facturas += 1;
    meses.set(m, x);
  }
  const mesActual = d.hoy.slice(0, 7);
  return [...meses.values()].sort((a, b) => b.mes.localeCompare(a.mes)).slice(0, 13)
    .map((x) => ({ ...x, ingresos: r2(x.ingresos), costos: r2(x.costos), utilidad: r2(x.utilidad), parcial: x.mes === mesActual }));
}

export function ventasDiarias(d, dias = 30) {
  const desde = sumarDias(d.hoy, -dias);
  const porDia = new Map();
  for (const f of d.facturas) {
    if (f.fecha < desde) continue;
    const x = porDia.get(f.fecha) ?? { fecha: f.fecha, ventas: 0, utilidad: 0, facturas: 0 };
    x.ventas += f.monto_total; x.utilidad += f.monto_total - f.costo_total; x.facturas += 1;
    porDia.set(f.fecha, x);
  }
  return [...porDia.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((x) => ({ ...x, ventas: r2(x.ventas), utilidad: r2(x.utilidad) }));
}

// Base = 3 primeros meses del semestre; reciente = 2 últimos meses completos. Caída relevante: variacion_pct <= -50.
export function clientesCaida(d, { cliente } = {}) {
  const desde = sumarMeses(d.hoy, -6), corte3 = sumarMeses(d.hoy, -3);
  const mes0 = inicioMes(d.hoy), mesMenos2 = sumarMeses(mes0, -2);
  return d.clientes.filter((c) => contiene(c.nombre, cliente) || contiene(c.codigo, cliente)).map((c) => {
    const fs = d.facturas.filter((f) => f.cliente_id === c.id && f.fecha >= desde);
    const base = suma(fs.filter((f) => f.fecha < corte3), (f) => f.monto_total) / 3;
    const reciente = suma(fs.filter((f) => f.fecha >= mesMenos2 && f.fecha < mes0), (f) => f.monto_total) / 2;
    return { codigo: c.codigo, nombre: c.nombre, canal: c.canal, ruta: c.ruta, prom_mensual_base: r2(base), prom_mensual_reciente: r2(reciente), variacion_pct: base ? Math.round((100 * reciente) / base - 100) : null };
  }).sort((a, b) => (a.variacion_pct ?? 1e9) - (b.variacion_pct ?? 1e9));
}

// Promedio de los últimos 3 meses completos contra la meta mensual.
export function vendedoresDesempeno(d, { vendedor } = {}) {
  const mes0 = inicioMes(d.hoy), desde = sumarMeses(mes0, -3);
  const { cliente } = indices(d);
  return d.vendedores.filter((v) => contiene(v.nombre, vendedor)).map((v) => {
    const venta = suma(d.facturas.filter((f) => f.fecha >= desde && f.fecha < mes0 && cliente[f.cliente_id].vendedor_id === v.id), (f) => f.monto_total) / 3;
    return { vendedor: v.nombre, ruta: v.ruta, meta_mensual: v.meta_mensual, venta_prom_mensual: r2(venta), cumplimiento_pct: Math.round((100 * venta) / v.meta_mensual) };
  }).sort((a, b) => a.cumplimiento_pct - b.cumplimiento_pct);
}

export function ventasPorVendedor(d, { dias = 30, vendedor } = {}) {
  const desde = sumarDias(d.hoy, -dias);
  const { cliente } = indices(d);
  return d.vendedores.filter((v) => contiene(v.nombre, vendedor)).map((v) => {
    const fs = d.facturas.filter((f) => f.fecha >= desde && cliente[f.cliente_id].vendedor_id === v.id);
    return { vendedor: v.nombre, ruta: v.ruta, ventas: r2(suma(fs, (f) => f.monto_total)), facturas: fs.length, clientes: new Set(fs.map((f) => f.cliente_id)).size };
  }).sort((a, b) => b.ventas - a.ventas);
}

export function ordenesAtrasadas(d) {
  const { cliente, vendedor, lineasDe } = indices(d);
  return d.pedidos.filter((p) => p.estado === "atrasado").sort((a, b) => a.fecha.localeCompare(b.fecha)).map((p) => ({
    pedido: p.id, cliente: cliente[p.cliente_id].nombre, vendedor: vendedor[p.vendedor_id].nombre, fecha: p.fecha, dias_atraso: diasEntre(p.fecha, d.hoy),
    monto: r2(suma(lineasDe.get(p.id) ?? [], (l) => l.cantidad * l.precio_unit)),
  }));
}

export function erroresDespacho(d) {
  const { cliente, vendedor } = indices(d);
  return d.errores_despacho.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).map((e) => ({
    fecha: e.fecha, pedido: e.pedido_id, tipo_error: e.tipo_error, detectado_en: e.detectado_en, cliente: cliente[e.cliente_id].nombre, ruta: cliente[e.cliente_id].ruta, vendedor: vendedor[e.vendedor_id].nombre,
  }));
}

export function cobrosResumen(d) {
  const abiertas = d.facturas.filter((f) => f.estado_pago !== "pagada");
  const vencidas = abiertas.filter((f) => f.estado_pago === "vencida");
  return {
    facturas_abiertas: abiertas.length, monto_pendiente: r2(suma(abiertas, (f) => f.monto_total)),
    facturas_vencidas: vencidas.length, monto_vencido: r2(suma(vencidas, (f) => f.monto_total)),
    clientes_con_vencido: new Set(vencidas.map((f) => f.cliente_id)).size,
  };
}

export function cobrosPorCliente(d, { cliente: filtro } = {}) {
  const { cliente } = indices(d);
  const por = new Map();
  for (const f of d.facturas) {
    if (f.estado_pago === "pagada") continue;
    const c = cliente[f.cliente_id];
    if (!contiene(c.nombre, filtro) && !contiene(c.codigo, filtro)) continue;
    const x = por.get(c.id) ?? { cliente: c.nombre, codigo: c.codigo, ruta: c.ruta, dias_credito: c.dias_credito, pendiente: 0, vencido: 0, facturas_vencidas: 0, dias_mayor_atraso: 0 };
    x.pendiente += f.monto_total;
    if (f.estado_pago === "vencida") { x.vencido += f.monto_total; x.facturas_vencidas += 1; x.dias_mayor_atraso = Math.max(x.dias_mayor_atraso, diasEntre(f.fecha_vencimiento, d.hoy)); }
    por.set(c.id, x);
  }
  return [...por.values()].map((x) => ({ ...x, pendiente: r2(x.pendiente), vencido: r2(x.vencido) })).sort((a, b) => b.vencido - a.vencido || b.pendiente - a.pendiente);
}

export function inventarioPorProducto(d, { producto } = {}) {
  return d.inventario.map((i) => {
    const p = d.porId[i.producto_id];
    return { codigo: p.codigo, nombre: p.nombre, presentacion: p.presentacion, familia: p.familia, cantidad: i.cantidad, dias_antiguedad: i.dias_antiguedad, costo_inmovilizado: r2(i.cantidad * i.costo_unitario) };
  }).filter((x) => contiene(`${x.nombre} ${x.presentacion} ${x.codigo}`, producto)).sort((a, b) => b.dias_antiguedad - a.dias_antiguedad);
}

export const inventario90 = (d) => inventarioPorProducto(d).filter((x) => x.dias_antiguedad > 90);

export function inventarioResumen(d) {
  const inv = inventarioPorProducto(d);
  const viejos = inv.filter((x) => x.dias_antiguedad > 90);
  return { productos_activos: inv.length, unidades: suma(inv, (x) => x.cantidad), valor_inventario: r2(suma(inv, (x) => x.costo_inmovilizado)), productos_mas_90_dias: viejos.length, costo_mas_90_dias: r2(suma(viejos, (x) => x.costo_inmovilizado)) };
}

export function produccionDias(d, dias = 30) {
  const desde = sumarDias(d.hoy, -dias);
  const por = new Map();
  for (const x of d.produccion) {
    if (x.fecha < desde) continue;
    const y = por.get(x.fecha) ?? { fecha: x.fecha, planificado: 0, producido: 0 };
    y.planificado += x.cantidad_planificada; y.producido += x.cantidad_producida;
    por.set(x.fecha, y);
  }
  return [...por.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((y) => ({ ...y, cumplimiento_pct: Math.round((100 * y.producido) / y.planificado) }));
}

export const produccionSemana = (d) => produccionDias(d, 7);

// Del 1 al día de hoy de este mes contra el mismo tramo del mes anterior.
export function ventasMesEquivalente(d) {
  const dia = Number(d.hoy.slice(8, 10));
  const mes0 = inicioMes(d.hoy), mesAnt = sumarMeses(mes0, -1);
  const finAnt = sumarDias(mesAnt, Math.min(dia, diasEntre(mesAnt, mes0)) - 1);
  const tramo = (desde, hasta) => {
    const fs = d.facturas.filter((f) => f.fecha >= desde && f.fecha <= hasta);
    const ingresos = suma(fs, (f) => f.monto_total), costos = suma(fs, (f) => f.costo_total);
    return { desde, hasta, ingresos: r2(ingresos), costos: r2(costos), utilidad: r2(ingresos - costos), facturas: fs.length };
  };
  const actual = tramo(mes0, d.hoy), anterior = tramo(mesAnt, finAnt);
  const varPct = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null);
  return { mes_actual: actual, mes_anterior_mismo_tramo: anterior, variacion_ingresos_pct: varPct(actual.ingresos, anterior.ingresos), variacion_utilidad_pct: varPct(actual.utilidad, anterior.utilidad) };
}

// ---------- motor de alertas (R1–R4, como el motor real) ----------

export const TIPOS_ALERTA = {
  presentacion_atipica: { icono: "⚠️", color: "red", titulo: "Pedido con presentación atípica", accion: "Confirmar la presentación con el vendedor y el cliente antes de despachar y facturar." },
  desviacion_produccion: { icono: "📉", color: "red", titulo: "Producción por debajo del plan", accion: "Revisar la causa del desvío y acordar un plan de recuperación con Producción." },
  retraso_pago: { icono: "💳", color: "amber", titulo: "Cliente con retraso de pago", accion: "Contactar al cliente y acordar un compromiso de pago con Cuentas por Cobrar." },
  caida_compras: { icono: "🛒", color: "amber", titulo: "Cliente con caída de compras", accion: "Priorizar una visita comercial y revisar su historial de faltantes o errores." },
};
export const infoTipo = (t) => TIPOS_ALERTA[t] ?? { icono: "🔔", color: "blue", titulo: t, accion: "Dar seguimiento con el área responsable." };

export function motorAlertas(d) {
  if (d._alertas) return d._alertas;
  const { cliente, lineasDe } = indices(d);
  const alertas = [];
  const agregar = (a) => alertas.push({ id: alertas.length + 1, ...a });
  const pedidoDe = Object.fromEntries(d.pedidos.map((p) => [p.id, p]));

  // R1 · pedido reciente en tarro 10 oz cuando el hábito del cliente es tarro 5 oz (>= 90 %).
  const hace6m = sumarMeses(d.hoy, -6), hace14 = sumarDias(d.hoy, -14);
  const habito = new Map(); // cliente|nombre -> [5 oz, total]
  for (const l of d.lineas) {
    const p = pedidoDe[l.pedido_id], pr = d.porId[l.producto_id];
    if (p.fecha < hace6m || !["tarro 5 oz", "tarro 10 oz"].includes(pr.presentacion)) continue;
    const k = `${p.cliente_id}|${pr.nombre}`;
    const h = habito.get(k) ?? [0, 0];
    if (pr.presentacion === "tarro 5 oz") h[0] += l.cantidad;
    h[1] += l.cantidad;
    habito.set(k, h);
  }
  const vistos = new Set();
  for (const p of d.pedidos.filter((x) => x.fecha >= hace14).sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    for (const l of lineasDe.get(p.id) ?? []) {
      const pr = d.porId[l.producto_id];
      if (pr.presentacion !== "tarro 10 oz" || vistos.has(p.id)) continue;
      const [cinco, total] = habito.get(`${p.cliente_id}|${pr.nombre}`) ?? [0, 0];
      const pct = total ? cinco / total : 0;
      if (pct < 0.9) continue;
      vistos.add(p.id);
      agregar({ tipo: "presentacion_atipica", severidad: "alta", area: "comercial", fecha_hora: `${p.fecha} 07:40`, entidad_referida: `pedido:${p.id}`,
        descripcion: `Pedido ${p.id}: ${cliente[p.cliente_id].nombre} pidió "${pr.nombre}" en tarro 10 oz; su hábito es tarro 5 oz (${Math.round(pct * 100)}% de sus compras del producto). Confirmar antes de despachar.` });
    }
  }

  // R2 · días con producción real por debajo del 70 % del plan.
  for (const x of produccionDias(d, 30)) {
    if (x.producido >= 0.7 * x.planificado) continue;
    agregar({ tipo: "desviacion_produccion", severidad: x.cumplimiento_pct < 50 ? "alta" : "media", area: "produccion", fecha_hora: `${sumarDias(x.fecha, 1)} 06:00`, entidad_referida: `produccion:${x.fecha}`,
      descripcion: `Producción del ${x.fecha}: ${x.producido.toLocaleString("en-US")} de ${x.planificado.toLocaleString("en-US")} unidades planificadas (${x.cumplimiento_pct}% del plan).` });
  }

  // R3 · cliente con 3 o más facturas vencidas, o más de RD$15,000 vencidos.
  for (const c of cobrosPorCliente(d)) {
    if (!(c.facturas_vencidas >= 3 || c.vencido > 15000)) continue;
    const id = d.clientes.find((x) => x.codigo === c.codigo).id;
    agregar({ tipo: "retraso_pago", severidad: c.vencido > 50000 ? "alta" : "media", area: "finanzas", fecha_hora: `${d.hoy} 06:00`, entidad_referida: `cliente:${id}`,
      descripcion: `${c.cliente} tiene ${c.facturas_vencidas} factura(s) vencida(s) sin pago por ${rdTexto(c.vencido)}.` });
  }

  // R4 · promedio de los 2 últimos meses completos por debajo del 50 % del inicio del semestre.
  const mensual = new Map();
  for (const f of d.facturas) {
    if (f.fecha < hace6m) continue;
    const k = `${f.cliente_id}|${f.fecha.slice(0, 7)}`;
    mensual.set(k, (mensual.get(k) ?? 0) + f.monto_total);
  }
  const meses = [...new Set([...mensual.keys()].map((k) => k.split("|")[1]))].sort();
  const m0 = meses[0], m3 = sumarMeses(`${m0}-01`, 3).slice(0, 7);
  const mesHoy = d.hoy.slice(0, 7), mesMenos2 = sumarMeses(`${mesHoy}-01`, -2).slice(0, 7);
  // Un mes sin compras cuenta como cero (si no, el cliente que dejó de comprar del todo no alertaría).
  const mesesBase = meses.filter((m) => m < m3), mesesRecientes = meses.filter((m) => m >= mesMenos2 && m < mesHoy);
  const promedio = (cid, lista) => (lista.length ? suma(lista, (m) => mensual.get(`${cid}|${m}`) ?? 0) / lista.length : 0);
  for (const c of d.clientes) {
    const base = promedio(c.id, mesesBase), reciente = promedio(c.id, mesesRecientes);
    if (!base || reciente >= 0.5 * base) continue;
    agregar({ tipo: "caida_compras", severidad: reciente < 0.25 * base ? "alta" : "media", area: "comercial", fecha_hora: `${d.hoy} 06:00`, entidad_referida: `cliente:${c.id}`,
      descripcion: `${c.nombre}: compras de ${rdTexto(reciente)}/mes en los últimos 2 meses vs ${rdTexto(base)}/mes al inicio del semestre (caída del ${Math.round(100 * (1 - reciente / base))}%).` });
  }

  const orden = { alta: 0, media: 1, baja: 2 };
  alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad] || b.fecha_hora.localeCompare(a.fecha_hora));
  d._alertas = alertas;
  return alertas;
}

// Alertas con su estado de seguimiento (nueva, vista, resuelta), que vive en el navegador.
export function alertasConEstado(d, estados = {}) {
  return motorAlertas(d).map((a) => ({ ...a, estado: estados[a.entidad_referida + "|" + a.tipo] ?? "nueva" }));
}
export const claveAlerta = (a) => `${a.entidad_referida}|${a.tipo}`;

// Los bloques que puede consultar el copiloto, por nombre.
export const BLOQUES = {
  utilidad_mensual: (d) => utilidadMensual(d),
  ventas_mes_equivalente: (d) => ventasMesEquivalente(d),
  ventas_diarias: (d) => ventasDiarias(d, 30),
  clientes_caida: (d, f) => clientesCaida(d, f),
  vendedores_desempeno: (d, f) => vendedoresDesempeno(d, f),
  ventas_por_vendedor: (d, f) => ventasPorVendedor(d, f),
  ordenes_atrasadas: (d) => ordenesAtrasadas(d),
  errores_despacho: (d) => erroresDespacho(d),
  cobros_resumen: (d) => cobrosResumen(d),
  cobros_por_cliente: (d, f) => cobrosPorCliente(d, f),
  inventario_resumen: (d) => inventarioResumen(d),
  inventario_90: (d) => inventario90(d),
  inventario_por_producto: (d, f) => inventarioPorProducto(d, f),
  produccion_semana: (d) => produccionSemana(d),
  produccion_30_dias: (d) => produccionDias(d, 30),
};

export const datos = (hoy, semilla) => generarDatos(hoy, semilla);
