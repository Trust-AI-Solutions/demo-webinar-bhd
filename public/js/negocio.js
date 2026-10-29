// Consultas sobre los datos ficticios. Las usan las pantallas del panel y también
// la IA (a través de herramientas.js), así que el panel y el asistente siempre
// muestran las mismas cifras.

import { generarDatos, EMPRESA, SUCURSALES, VENDEDORES, CATEGORIAS, sumarDias, diasEntre, fechaISO } from "./datos.js";
import { leerEstado } from "./estado.js";

export { EMPRESA, SUCURSALES, VENDEDORES, CATEGORIAS, sumarDias, diasEntre };

export const hoy = () => fechaISO(new Date());
export const datos = () => generarDatos(hoy());
const r2 = (n) => Math.round(n * 100) / 100;
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

export function normalizar(texto) {
  return String(texto ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9/.\s]/g, " ");
}
function raiz(palabra) {
  if (palabra.length > 4 && palabra.endsWith("es")) return palabra.slice(0, -2);
  if (palabra.length > 3 && palabra.endsWith("s")) return palabra.slice(0, -1);
  return palabra;
}
const PALABRAS_VACIAS = new Set(["de", "del", "la", "el", "los", "las", "para", "con", "un", "una", "y", "en", "por", "x", "que", "tienen", "tiene", "hay", "precio", "cuanto", "cuesta"]);
function terminos(texto) {
  return normalizar(texto).split(/\s+/).filter((p) => p && !PALABRAS_VACIAS.has(p)).map(raiz);
}

const nombreSucursal = (id) => SUCURSALES.find((s) => s.id === id)?.nombre ?? id;
const nombreVendedor = (id) => VENDEDORES.find((v) => v.id === id)?.nombre ?? id;

// ---------- productos ----------

export function buscarProductos({ texto, categoria, sucursal, soloBajoMinimo, sinMovimientoDias, limite = 15, orden } = {}) {
  const d = datos();
  const ventas30 = unidadesVendidas(30);
  let lista = d.productos.map((p) => {
    const stockTotal = Object.values(p.stock).reduce((a, b) => a + b, 0);
    const v30 = ventas30[p.codigo] ?? { total: 0 };
    return { p, stockTotal, v30 };
  });
  if (categoria) {
    const c = normalizar(categoria);
    lista = lista.filter(({ p }) => normalizar(p.categoria).includes(c));
  }
  if (texto) {
    const t = terminos(texto);
    const puntuados = lista.map((x) => {
      const nombre = terminos(`${x.p.nombre} ${x.p.categoria} ${x.p.codigo}`);
      const puntos = t.filter((ti) => nombre.some((n) => n.startsWith(ti) || ti.startsWith(n) && n.length > 2)).length;
      return { ...x, puntos };
    }).filter((x) => x.puntos > 0);
    const mejor = Math.max(0, ...puntuados.map((x) => x.puntos));
    lista = puntuados.filter((x) => x.puntos >= Math.max(1, mejor - (t.length > 2 ? 1 : 0))).sort((a, b) => b.puntos - a.puntos);
  }
  if (soloBajoMinimo) {
    lista = lista.filter(({ p }) => (sucursal ? [sucursal] : Object.keys(p.stock)).some((s) => p.stock[s] < p.minimo * (s === "herrera" ? 1 : 0.7)));
  }
  if (sinMovimientoDias) {
    const vendidos = unidadesVendidas(sinMovimientoDias);
    lista = lista.filter(({ p, stockTotal }) => !vendidos[p.codigo] && stockTotal > 0);
  }
  if (orden === "mas_vendidos") lista.sort((a, b) => b.v30.total - a.v30.total);
  if (orden === "menor_cobertura") lista.sort((a, b) => cobertura(a) - cobertura(b));
  return {
    encontrados: lista.length,
    productos: lista.slice(0, limite).map(({ p, stockTotal, v30 }) => ({
      codigo: p.codigo, nombre: p.nombre, categoria: p.categoria, unidad: p.unidad,
      precio_sin_itbis: p.precio, costo: p.costo, margen_pct: pct(p.precio - p.costo, p.precio),
      stock: Object.fromEntries(Object.entries(p.stock).map(([s, n]) => [nombreSucursal(s), n])),
      stock_total: stockTotal, minimo_herrera: p.minimo, minimo_villa_mella: Math.round(p.minimo * 0.7),
      unidades_vendidas_30_dias: v30.total,
      dias_de_inventario: v30.total ? Math.round((stockTotal / (v30.total / 30)) * 10) / 10 : null,
      dias_de_inventario_por_sucursal: Object.fromEntries(Object.keys(p.stock).map((s) => [nombreSucursal(s), v30[s] ? Math.round((p.stock[s] / (v30[s] / 30)) * 10) / 10 : null])),
      proveedor: p.proveedor,
    })),
  };
}
function cobertura({ stockTotal, v30 }) { return v30.total ? stockTotal / (v30.total / 30) : 9999; }

let cacheUnidades = {};
export function unidadesVendidas(dias) {
  const d = datos();
  const clave = `${d.hoy}-${dias}`;
  if (cacheUnidades[clave]) return cacheUnidades[clave];
  const desde = sumarDias(d.hoy, -dias + 1);
  const r = {};
  for (const l of d.lineas) {
    if (l.fecha < desde) continue;
    r[l.codigo] ??= { total: 0 };
    r[l.codigo].total += l.cantidad;
    r[l.codigo][l.sucursal] = (r[l.codigo][l.sucursal] ?? 0) + l.cantidad;
  }
  cacheUnidades = { [clave]: r, ...cacheUnidades };
  return r;
}

// ---------- ventas ----------

function semanaDe(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d);
  const lunes = new Date(a, m - 1, d - ((f.getDay() + 6) % 7));
  return fechaISO(lunes);
}

export function resumenVentas({ desde, hasta, sucursal, categoria, vendedor, cliente, agruparPor, limite = 15 } = {}) {
  const d = datos();
  hasta = hasta && hasta <= d.hoy ? hasta : d.hoy;
  desde = desde || sumarDias(hasta, -29);
  const sucursalId = sucursal ? SUCURSALES.find((s) => normalizar(s.nombre) === normalizar(sucursal) || s.id === sucursal)?.id : null;
  const vendedorId = vendedor ? VENDEDORES.find((v) => normalizar(v.nombre).includes(normalizar(vendedor)) || v.id === vendedor)?.id : null;
  const clienteObj = cliente ? d.clientes.find((c) => normalizar(c.nombre).includes(normalizar(cliente)) || c.id === cliente) : null;
  if (sucursal && !sucursalId) return { error: `No existe la sucursal "${sucursal}". Sucursales: Herrera, Villa Mella.` };
  if (vendedor && !vendedorId) return { error: `No existe el vendedor "${vendedor}".` };
  if (cliente && !clienteObj) return { error: `No encontré un cliente que coincida con "${cliente}".` };

  const facturas = d.facturas.filter((f) => f.fecha >= desde && f.fecha <= hasta
    && (!sucursalId || f.sucursal === sucursalId) && (!vendedorId || f.vendedor === vendedorId)
    && (!clienteObj || f.cliente === clienteObj.id));
  const ids = new Set(facturas.map((f) => f.id));
  const porFactura = Object.fromEntries(facturas.map((f) => [f.id, f]));
  const cat = categoria ? normalizar(categoria) : null;
  const lineas = d.lineas.filter((l) => ids.has(l.factura) && (!cat || normalizar(l.categoria).includes(cat)));

  const total = lineas.reduce((a, l) => a + l.importe, 0);
  const costo = lineas.reduce((a, l) => a + l.costo, 0);
  const numFacturas = new Set(lineas.map((l) => l.factura)).size;
  const resultado = {
    desde, hasta, filtros: { sucursal: sucursalId ? nombreSucursal(sucursalId) : "todas", categoria: categoria ?? "todas", vendedor: vendedorId ? nombreVendedor(vendedorId) : "todos", cliente: clienteObj?.nombre ?? "todos" },
    ventas_sin_itbis: r2(total), costo: r2(costo), margen_bruto: r2(total - costo), margen_pct: pct(total - costo, total),
    facturas: numFacturas, ticket_promedio: numFacturas ? r2(total / numFacturas) : 0,
    dias_del_periodo: diasEntre(desde, hasta) + 1,
  };
  if (agruparPor) {
    const clave = {
      dia: (l) => l.fecha, semana: (l) => semanaDe(l.fecha), mes: (l) => l.fecha.slice(0, 7),
      categoria: (l) => l.categoria, sucursal: (l) => nombreSucursal(l.sucursal),
      vendedor: (l) => nombreVendedor(porFactura[l.factura].vendedor),
      producto: (l) => `${l.codigo} ${d.porCodigo[l.codigo].nombre}`,
      cliente: (l) => (porFactura[l.factura].cliente ? d.clientes.find((c) => c.id === porFactura[l.factura].cliente).nombre : "Consumidor final (sin registrar)"),
    }[agruparPor];
    if (!clave) return { error: `agrupar_por no válido: ${agruparPor}` };
    const grupos = {};
    for (const l of lineas) {
      const k = clave(l);
      grupos[k] ??= { grupo: k, ventas: 0, costo: 0, unidades: 0, facturas: new Set() };
      grupos[k].ventas += l.importe; grupos[k].costo += l.costo; grupos[k].unidades += l.cantidad; grupos[k].facturas.add(l.factura);
    }
    let lista = Object.values(grupos).map((g) => ({ grupo: g.grupo, ventas: r2(g.ventas), margen_pct: pct(g.ventas - g.costo, g.ventas), unidades: g.unidades, facturas: g.facturas.size, participacion_pct: pct(g.ventas, total) }));
    const cronologico = ["dia", "semana", "mes"].includes(agruparPor);
    lista.sort(cronologico ? (a, b) => a.grupo.localeCompare(b.grupo) : (a, b) => b.ventas - a.ventas);
    const max = cronologico ? 200 : limite;
    resultado.grupos = lista.slice(cronologico ? -max : 0, cronologico ? undefined : max);
    if (lista.length > resultado.grupos.length) resultado.nota = `Se muestran ${resultado.grupos.length} de ${lista.length} grupos.`;
  }
  return resultado;
}

// ---------- clientes y cobros ----------

export function cuentasPorCobrar({ cliente, vencidasMasDeDias = 0, limite = 15 } = {}) {
  const d = datos();
  const porCliente = {};
  for (const f of d.facturas) {
    const saldo = f.total - f.pagado;
    if (saldo < 1 || !f.cliente) continue;
    const atraso = Math.max(0, diasEntre(f.vence, d.hoy));
    const c = (porCliente[f.cliente] ??= { saldo: 0, vencido: 0, facturas: 0, mayorAtraso: 0, tramos: { al_dia: 0, "1_30": 0, "31_60": 0, mas_60: 0 } });
    c.saldo += saldo; c.facturas += 1; c.mayorAtraso = Math.max(c.mayorAtraso, atraso);
    if (atraso > 0) c.vencido += saldo;
    c.tramos[atraso === 0 ? "al_dia" : atraso <= 30 ? "1_30" : atraso <= 60 ? "31_60" : "mas_60"] += saldo;
  }
  let lista = Object.entries(porCliente).map(([id, c]) => {
    const cli = d.clientes.find((x) => x.id === id);
    return {
      cliente: cli.nombre, id, tipo: cli.tipo, telefono: cli.telefono, sucursal: nombreSucursal(cli.sucursal),
      saldo: r2(c.saldo), vencido: r2(c.vencido), dias_mayor_atraso: c.mayorAtraso, facturas_pendientes: c.facturas,
      limite_credito: cli.limiteCredito, sobre_limite: c.saldo > cli.limiteCredito,
      tramos: Object.fromEntries(Object.entries(c.tramos).map(([k, v]) => [k, r2(v)])),
    };
  });
  if (cliente) lista = lista.filter((x) => normalizar(x.cliente).includes(normalizar(cliente)));
  if (vencidasMasDeDias) lista = lista.filter((x) => x.dias_mayor_atraso > vencidasMasDeDias);
  lista.sort((a, b) => b.vencido - a.vencido || b.saldo - a.saldo);
  const tramos = { al_dia: 0, "1_30": 0, "31_60": 0, mas_60: 0 };
  for (const x of lista) for (const k in tramos) tramos[k] += x.tramos[k];
  return {
    total_por_cobrar: r2(lista.reduce((a, x) => a + x.saldo, 0)),
    total_vencido: r2(lista.reduce((a, x) => a + x.vencido, 0)),
    tramos_por_dias_de_atraso: Object.fromEntries(Object.entries(tramos).map(([k, v]) => [k, r2(v)])),
    clientes_con_saldo: lista.length,
    clientes: lista.slice(0, limite),
  };
}

export function buscarClientes({ texto, tipo, limite = 10 } = {}) {
  const d = datos();
  let lista = d.clientes;
  if (texto) { const t = normalizar(texto); lista = lista.filter((c) => normalizar(c.nombre).includes(t) || c.telefono.includes(texto)); }
  if (tipo) lista = lista.filter((c) => c.tipo === tipo);
  const desde = sumarDias(d.hoy, -89);
  return {
    encontrados: lista.length,
    clientes: lista.slice(0, limite).map((c) => {
      const fs = d.facturas.filter((f) => f.cliente === c.id);
      const recientes = fs.filter((f) => f.fecha >= desde);
      return {
        id: c.id, nombre: c.nombre, tipo: c.tipo, telefono: c.telefono, sucursal: nombreSucursal(c.sucursal),
        credito: c.credito, limite_credito: c.limiteCredito, cliente_desde: c.clienteDesde,
        compras_ultimos_90_dias: r2(recientes.reduce((a, f) => a + f.total, 0)), facturas_ultimos_90_dias: recientes.length,
        ultima_compra: fs.at(-1)?.fecha ?? null,
      };
    }),
  };
}

// ---------- pedidos ----------

export function todosLosPedidos() {
  const d = datos();
  const estado = leerEstado();
  return [...estado.pedidos, ...d.pedidos]
    .map((p) => ({ ...p, estado: estado.cambiosEstado[p.id] ?? p.estado }))
    .sort((a, b) => (b.fecha + b.hora.padStart(5, "0")).localeCompare(a.fecha + a.hora.padStart(5, "0")));
}

export function verPedidos({ estado, canal, limite = 15 } = {}) {
  let lista = todosLosPedidos();
  if (estado) lista = lista.filter((p) => normalizar(p.estado).includes(normalizar(estado)));
  if (canal) lista = lista.filter((p) => normalizar(p.canal).includes(normalizar(canal)));
  const abiertos = todosLosPedidos().filter((p) => p.estado !== "entregado");
  return {
    pedidos_abiertos: abiertos.length,
    encontrados: lista.length,
    pedidos: lista.slice(0, limite).map((p) => ({ id: p.id, fecha: p.fecha, hora: p.hora, cliente: p.cliente, canal: p.canal, estado: p.estado, entrega: p.entrega, total_con_itbis: p.total, articulos: p.items.map((i) => `${i.cantidad} x ${i.nombre}`).join("; ") })),
  };
}

// ---------- alertas ----------

export function alertas() {
  const d = datos();
  const lista = [];
  // Inventario que se agota en 3 días o menos (por sucursal)
  const v30 = unidadesVendidas(30);
  for (const p of d.productos) {
    for (const s of SUCURSALES) {
      const diario = (v30[p.codigo]?.[s.id] ?? 0) / 30;
      if (diario > 0 && p.stock[s.id] / diario <= 3) {
        lista.push({ tipo: "inventario", gravedad: "alta", titulo: `${p.nombre} se agota en ${s.nombre}`, detalle: `Quedan ${p.stock[s.id]} (${p.unidad}); se venden unas ${Math.round(diario * 10) / 10} por día: alcanza para ${Math.max(1, Math.round(p.stock[s.id] / diario))} día(s).`, codigo: p.codigo });
      }
    }
  }
  // Clientes sobre su límite de crédito o con más de 60 días de atraso
  for (const c of cuentasPorCobrar({ limite: 200 }).clientes) {
    if (c.sobre_limite || c.dias_mayor_atraso > 60) {
      lista.push({ tipo: "cobros", gravedad: c.dias_mayor_atraso > 60 ? "alta" : "media", titulo: `${c.cliente}: RD$${Math.round(c.saldo).toLocaleString("es-DO")} por cobrar`, detalle: `${c.sobre_limite ? `Pasó su límite de crédito (RD$${c.limite_credito.toLocaleString("es-DO")}). ` : ""}Factura más atrasada: ${c.dias_mayor_atraso} días vencida.` });
    }
  }
  // Sucursal con caída de ventas: últimas 4 semanas contra las 4 anteriores
  for (const s of SUCURSALES) {
    const actual = resumenVentas({ desde: sumarDias(d.hoy, -27), hasta: d.hoy, sucursal: s.id }).ventas_sin_itbis;
    const previo = resumenVentas({ desde: sumarDias(d.hoy, -55), hasta: sumarDias(d.hoy, -28), sucursal: s.id }).ventas_sin_itbis;
    const cambio = pct(actual - previo, previo);
    if (cambio !== null && cambio <= -12) {
      lista.push({ tipo: "ventas", gravedad: "alta", titulo: `Ventas de ${s.nombre} bajaron ${Math.abs(cambio)} %`, detalle: `Últimas 4 semanas: RD$${Math.round(actual).toLocaleString("es-DO")}, contra RD$${Math.round(previo).toLocaleString("es-DO")} en las 4 anteriores.` });
    }
  }
  // Categoría con margen en caída: últimas 6 semanas contra las 12 anteriores
  for (const cat of CATEGORIAS) {
    const actual = resumenVentas({ desde: sumarDias(d.hoy, -41), hasta: d.hoy, categoria: cat }).margen_pct;
    const previo = resumenVentas({ desde: sumarDias(d.hoy, -125), hasta: sumarDias(d.hoy, -42), categoria: cat }).margen_pct;
    if (actual !== null && previo !== null && previo - actual >= 3) {
      lista.push({ tipo: "margen", gravedad: "media", titulo: `El margen de ${cat} bajó de ${previo} % a ${actual} %`, detalle: "El costo de compra subió y los precios de venta no se ajustaron." });
    }
  }
  // Inventario sin movimiento en 90 días
  for (const x of buscarProductos({ sinMovimientoDias: 90, limite: 20 }).productos) {
    const valor = x.stock_total * x.costo;
    lista.push({ tipo: "inventario", gravedad: "baja", titulo: `${x.nombre}: sin ventas en 90 días`, detalle: `Hay ${x.stock_total} en tienda, unos RD$${Math.round(valor).toLocaleString("es-DO")} a costo detenidos.`, codigo: x.codigo });
  }
  // Pedidos de WhatsApp que esperan a una persona
  for (const a of leerEstado().atenciones.filter((x) => !x.atendida)) {
    lista.push({ tipo: "whatsapp", gravedad: "media", titulo: `WhatsApp: ${a.nombre || "un cliente"} pide hablar con una persona`, detalle: a.motivo });
  }
  const orden = { alta: 0, media: 1, baja: 2 };
  return lista.sort((a, b) => orden[a.gravedad] - orden[b.gravedad]);
}

// ---------- indicadores de la pantalla de inicio ----------

export function indicadoresInicio() {
  const d = datos();
  const hoyV = resumenVentas({ desde: d.hoy, hasta: d.hoy });
  const mismoDiaSemanaPasada = resumenVentas({ desde: sumarDias(d.hoy, -7), hasta: sumarDias(d.hoy, -7) });
  const inicioMes = `${d.hoy.slice(0, 8)}01`;
  const diaDelMes = Number(d.hoy.slice(8));
  const mes = resumenVentas({ desde: inicioMes, hasta: d.hoy });
  const [a, m] = d.hoy.split("-").map(Number);
  const inicioMesAnt = fechaISO(new Date(a, m - 2, 1));
  const finCorteAnt = fechaISO(new Date(a, m - 2, Math.min(diaDelMes, new Date(a, m - 1, 0).getDate())));
  const mesAnt = resumenVentas({ desde: inicioMesAnt, hasta: finCorteAnt });
  const cxc = cuentasPorCobrar({ limite: 0 });
  const bajoMinimo = buscarProductos({ soloBajoMinimo: true, limite: 0 }).encontrados;
  const abiertos = todosLosPedidos().filter((p) => p.estado !== "entregado").length;
  return { hoyV, mismoDiaSemanaPasada, mes, mesAnt, cxc, bajoMinimo, abiertos };
}
