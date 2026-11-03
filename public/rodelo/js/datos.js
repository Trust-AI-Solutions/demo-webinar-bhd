// Grupo Rodelo: datos FICTICIOS para la demo, generados en el navegador con semilla fija
// y anclados a hoy. Es la misma receta del generador sintético del proyecto real
// (6 meses de historial, lunes a sábado), con las seis situaciones sembradas a propósito:
//
//   A1. 2 clientes con caída sostenida de compras ......... CL-0005, CL-0012
//   A2. 1 vendedor claramente bajo la meta ................ V-06 (Pedro Castillo)
//   A3. Lotes de inventario con más de 90 días ............ PR-0019, PR-0022
//   A4. 3 pedidos con presentación atípica (10 oz en vez de 5 oz), clientes 3, 9 y 21
//   A5. 2 días con producción real muy por debajo del plan (hace 6 y 13 días hábiles)
//   A6. Facturas vencidas concentradas en 2 clientes ...... CL-0007, CL-0025
//
// No hay base de datos: todo se calcula aquí y se guarda en memoria.

// ---------- azar con semilla ----------
function crearAzar(semilla) {
  let a = semilla >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    random,
    entero: (min, max) => min + Math.floor(random() * (max - min + 1)),
    uniforme: (min, max) => min + random() * (max - min),
    uno: (lista) => lista[Math.floor(random() * lista.length)],
    muestra(lista, k) {
      const copia = lista.slice();
      for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
      return copia.slice(0, k);
    },
  };
}

// ---------- fechas (en UTC para no depender de la zona horaria) ----------
export const aFecha = (iso) => new Date(`${iso}T00:00:00Z`);
export const aISO = (d) => d.toISOString().slice(0, 10);
export const sumarDias = (iso, n) => { const d = aFecha(iso); d.setUTCDate(d.getUTCDate() + n); return aISO(d); };
export const sumarMeses = (iso, n) => { const d = aFecha(iso); d.setUTCMonth(d.getUTCMonth() + n); return aISO(d); };
export const diaSemana = (iso) => aFecha(iso).getUTCDay(); // 0 domingo … 6 sábado
export const inicioMes = (iso) => `${iso.slice(0, 7)}-01`;
export const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 86_400_000);
const redondear = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// ---------- catálogos ----------
const NOMBRES_V = ["Ana Peralta", "Luis Mercedes", "Carmen Díaz", "Rafael Núñez", "Yudelka Santos", "Pedro Castillo", "Miguel Taveras", "Rosa Almonte"];
const RUTAS = ["Zona Colonial", "Villa Mella", "Los Alcarrizos", "Herrera", "Santo Domingo Este", "San Cristóbal", "Santiago Norte", "Boca Chica"];
const CANALES = [...Array(18).fill("colmado"), ...Array(7).fill("supermercado"), ...Array(4).fill("distribuidor"), "institucional"];
const PREFIJO = { colmado: "Colmado", supermercado: "Super", distribuidor: "Distribuidora", institucional: "Cafetería" };
const APELLIDOS = ["El Progreso", "Doña Chita", "La Economía", "Hermanos Rosario", "San Miguel", "El Vecino", "La Bendición", "Los Primos", "Punto Fresco", "El Ahorro",
  "Villa Juana", "La Esquina", "Don Ramón", "Estrella", "El Detalle", "La 27", "Buen Precio", "Mi Barrio", "Central", "La Fe",
  "Ozama", "El Valle", "Quisqueya", "La Altagracia", "Duarte", "Naco", "Gazcue", "Bella Vista", "Los Ríos", "Arroyo Hondo"];
const FAMILIAS = [
  ["semillas de cajuil", ["Cajuil Natural", "Cajuil Salado", "Cajuil con Miel"]],
  ["maní", ["Maní Tostado", "Maní Salado", "Maní Dulce", "Maní Picante"]],
];
export const PRESENTACIONES = ["tarro 5 oz", "tarro 10 oz", "funda 2 oz", "display 12 und"];

export const SITUACIONES = {
  caida: [5, 12], vendedorBajo: 6, inventarioViejo: [19, 22], presentacion: [3, 9, 21], morosos: [7, 25],
};

// Semilla elegida para que las seis situaciones salgan limpias (sin casos dudosos de más) en las fechas
// de la demo: limpia del 3 al 16 de noviembre de 2026 (ensayo y webinar) y la mayoría de los días hasta enero.
export const SEMILLA = 462;
let cache = null;

// hoy: AAAA-MM-DD. Mismo día, mismos datos.
export function generarDatos(hoy, semilla = SEMILLA) {
  if (cache?.hoy === hoy && cache.semilla === semilla) return cache;
  const az = crearAzar(semilla);
  const inicio = sumarDias(hoy, -182);

  const vendedores = NOMBRES_V.map((nombre, i) => ({ id: i + 1, codigo: `V-${String(i + 1).padStart(2, "0")}`, nombre, ruta: RUTAS[i], meta_mensual: 220000 }));
  const clientes = CANALES.map((canal, i) => ({
    id: i + 1, codigo: `CL-${String(i + 1).padStart(4, "0")}`, nombre: `${PREFIJO[canal]} ${APELLIDOS[i]}`, canal,
    ruta: RUTAS[i % 8], vendedor_id: (i % 8) + 1, dias_credito: az.uno([0, 15, 30]),
  }));

  // 25 productos: los primeros nombres de cada familia en sus cuatro presentaciones.
  const productos = [];
  for (const [familia, nombres] of FAMILIAS) {
    for (const nombre of nombres) {
      for (const presentacion of PRESENTACIONES) {
        if (productos.length >= 25) break;
        const base = az.uniforme(30, 120);
        productos.push({ id: productos.length + 1, codigo: `PR-${String(productos.length + 1).padStart(4, "0")}`, nombre, presentacion, familia, costo: redondear(base), precio: redondear(base * az.uniforme(1.35, 1.75)) });
      }
    }
  }
  const porId = Object.fromEntries(productos.map((p) => [p.id, p]));
  const diezOz = Object.fromEntries(productos.filter((p) => p.presentacion === "tarro 10 oz").map((p) => [p.nombre, p.id]));
  const cincoOz = Object.fromEntries(productos.filter((p) => p.presentacion === "tarro 5 oz").map((p) => [p.nombre, p.id]));

  // ---------- pedidos, líneas y facturas ----------
  const pedidos = [], lineas = [], facturas = [];
  const FACTOR_CAIDA = { 3: 0.55, 2: 0.30, 1: 0.18, 0: 0.15 };
  const mesesAtras = (iso) => (Number(hoy.slice(0, 4)) - Number(iso.slice(0, 4))) * 12 + (Number(hoy.slice(5, 7)) - Number(iso.slice(5, 7)));
  const facturar = (pedido, total, costo, cliente, pVencida) => {
    const venc = sumarDias(pedido.fecha, cliente.dias_credito || 7);
    const vencida = az.random() < pVencida && venc < hoy;
    let pago = vencida ? null : sumarDias(venc, -az.entero(0, 5));
    if (pago && pago > hoy) pago = null;
    facturas.push({
      id: facturas.length + 1, codigo: `FAC-${String(facturas.length + 1).padStart(5, "0")}`, cliente_id: cliente.id, pedido_id: pedido.id, fecha: pedido.fecha,
      monto_total: redondear(total), costo_total: redondear(costo), fecha_vencimiento: venc, fecha_pago: pago, estado_pago: vencida ? "vencida" : pago ? "pagada" : "pendiente",
    });
  };
  const nuevoPedido = (cliente, fecha, estado) => {
    const p = { id: pedidos.length + 1, cliente_id: cliente.id, vendedor_id: cliente.vendedor_id, fecha, estado };
    pedidos.push(p);
    return p;
  };
  const nuevaLinea = (pedido, producto_id, cantidad) => {
    const l = { id: lineas.length + 1, pedido_id: pedido.id, producto_id, cantidad, precio_unit: porId[producto_id].precio };
    lineas.push(l);
    return l;
  };

  // Cada cliente compra con un ritmo propio (cada ~3 o 4 días, con variación), para que
  // el ruido no fabrique caídas que no son. A1: el ritmo de los clientes en caída se alarga
  // mes a mes. A2: los clientes del vendedor 6 compran con menos frecuencia.
  const proxima = {};
  for (const c of clientes) proxima[c.id] = sumarDias(inicio, az.entero(0, 3));
  for (let fecha = inicio; fecha <= hoy; fecha = sumarDias(fecha, 1)) {
    if (diaSemana(fecha) === 0) continue; // lunes a sábado
    for (const c of clientes) {
      if (fecha < proxima[c.id]) continue;
      let ritmo = 3.7;
      if (SITUACIONES.caida.includes(c.id)) ritmo /= FACTOR_CAIDA[mesesAtras(fecha)] ?? 1; // A1
      if (c.vendedor_id === SITUACIONES.vendedorBajo) ritmo /= 0.34; // A2
      proxima[c.id] = sumarDias(fecha, Math.max(1, Math.round(ritmo * az.uniforme(0.75, 1.25))));
      const atrasado = az.random() < 0.04 && diasEntre(fecha, hoy) < 20;
      const p = nuevoPedido(c, fecha, atrasado ? "atrasado" : "facturado");
      let total = 0, costo = 0;
      for (let n = az.entero(2, 3); n > 0; n--) {
        const pr = az.entero(1, productos.length);
        const l = nuevaLinea(p, pr, az.uno([12, 24, 24, 36]));
        total += l.cantidad * l.precio_unit;
        costo += l.cantidad * porId[pr].costo;
      }
      if (p.estado === "facturado") facturar(p, total, costo, c, SITUACIONES.morosos.includes(c.id) ? 0.45 : 0.002); // A6
    }
  }

  // ---------- A4: el hábito de tarro 5 oz y el pedido reciente en tarro 10 oz ----------
  const unidades = new Map(); // cliente|nombre|presentación -> unidades
  const pedidoDe = Object.fromEntries(pedidos.map((p) => [p.id, p]));
  for (const l of lineas) {
    const pr = porId[l.producto_id];
    const k = `${pedidoDe[l.pedido_id].cliente_id}|${pr.nombre}|${pr.presentacion}`;
    unidades.set(k, (unidades.get(k) ?? 0) + l.cantidad);
  }
  const azA4 = crearAzar(47);
  const errores_despacho = [];
  SITUACIONES.presentacion.forEach((cid, k) => {
    const c = clientes[cid - 1];
    const faltante = (nombre) => Math.max(0, Math.floor((0.93 / 0.07) * ((unidades.get(`${cid}|${nombre}|tarro 10 oz`) ?? 0) + 24)) - (unidades.get(`${cid}|${nombre}|tarro 5 oz`) ?? 0));
    const nombre = Object.keys(diezOz).reduce((a, b) => (faltante(b) < faltante(a) ? b : a));
    const compras = Math.max(26, Math.floor(faltante(nombre) / 30) + 1);
    for (let i = 0; i < compras; i++) {
      const f = sumarDias(inicio, Math.floor((i * 168) / compras) + azA4.entero(0, 2));
      if (diaSemana(f) === 0) continue;
      const p = nuevoPedido(c, f, "facturado");
      const l = nuevaLinea(p, cincoOz[nombre], azA4.uno([24, 36]));
      const venc = sumarDias(f, c.dias_credito || 7);
      const pago = [sumarDias(venc, -azA4.entero(0, 3)), hoy].sort()[0];
      facturas.push({
        id: facturas.length + 1, codigo: `FAC-${String(facturas.length + 1).padStart(5, "0")}`, cliente_id: cid, pedido_id: p.id, fecha: f,
        monto_total: redondear(l.cantidad * l.precio_unit), costo_total: redondear(l.cantidad * porId[l.producto_id].costo), fecha_vencimiento: venc, fecha_pago: pago, estado_pago: "pagada",
      });
    }
    const fErr = sumarDias(hoy, -azA4.entero(2, 10));
    const p = nuevoPedido(c, fErr, "digitado");
    nuevaLinea(p, diezOz[nombre], 24);
    errores_despacho.push({ id: k + 1, fecha: fErr, pedido_id: p.id, cliente_id: cid, vendedor_id: c.vendedor_id, tipo_error: "presentacion", detectado_en: azA4.uno(["almacen", "facturacion"]) });
  });

  // ---------- inventario (corte de hoy); A3: dos lotes con más de 90 días ----------
  const inventario = productos.map((p) => ({
    producto_id: p.id, fecha_corte: hoy, cantidad: az.entero(40, 600),
    dias_antiguedad: SITUACIONES.inventarioViejo.includes(p.id) ? az.entero(95, 140) : az.entero(3, 45), costo_unitario: p.costo,
  }));

  // ---------- producción de los últimos 30 días; A5: dos días muy por debajo ----------
  const diaHabil = (atras) => { let d = sumarDias(hoy, -atras); while ([0, 6].includes(diaSemana(d))) d = sumarDias(d, -1); return d; };
  const diasMalos = [diaHabil(6), diaHabil(13)];
  const produccion = [];
  for (let f = sumarDias(hoy, -30); f <= hoy; f = sumarDias(f, 1)) {
    if ([0, 6].includes(diaSemana(f))) continue; // lunes a viernes
    for (const p of az.muestra(productos, 8)) {
      const plan = az.entero(100, 400);
      const factor = diasMalos.includes(f) ? az.uniforme(0.45, 0.6) : az.uniforme(0.92, 1.03);
      produccion.push({ fecha: f, producto_id: p.id, cantidad_planificada: plan, cantidad_producida: Math.floor(plan * factor) });
    }
  }

  cache = { hoy, semilla, inicio, vendedores, clientes, productos, porId, pedidos, lineas, facturas, errores_despacho, inventario, produccion, diasMalos };
  return cache;
}
