// DATOS FICTICIOS de "Panadería y Repostería El Trigal, SRL" (empresa inventada para la demo).
// Todo se genera aquí con una semilla fija, anclado a la fecha de hoy: cada vez que
// se abre la demo, los últimos 6 meses de ventas terminan hoy. No hay base de datos:
// lo que cambia durante la demo (pedidos, cotizaciones, avisos) se guarda en el
// navegador (estado.js).
//
// Situaciones sembradas a propósito para que la IA las encuentre:
//  1. La sucursal Los Prados vende alrededor de un tercio menos en las últimas 4 semanas.
//  2. La mantequilla en Gazcue alcanza para uno o dos días de producción.
//  3. Hotel Brisas de Gazcue pasó su límite de crédito y tiene facturas con más de 60 días.
//  4. La mantequilla y la crema subieron hace 6 semanas y el precio de los bizcochos no se
//     ajustó: el margen de "Bizcochos y tortas" cayó.
//  5. Hay productos del menú sin ventas en 90 días (pan de centeno, bizcocho sin azúcar).

export const EMPRESA = {
  nombre: "Panadería y Repostería El Trigal, SRL",
  nombreCorto: "Panadería El Trigal",
  ciudad: "Santo Domingo",
  telefono: "809-555-0142",
  whatsapp: "809-555-0143",
  horario: "Lunes a sábado de 6:00 a. m. a 8:00 p. m.; domingos de 7:00 a. m. a 1:00 p. m.",
  envio: "Entregas en el Distrito Nacional: gratis desde RD$3,000 antes de ITBIS; si no, RD$150. Lo confirmado antes de las 11:00 a. m. sale el mismo día; después, al día siguiente. A negocios (colmados, cafeterías, hoteles) se les reparte pan cada mañana en ruta.",
  encargos: "Bizcochos enteros, tortas y bandejas de picaderas se piden con al menos 24 horas; bizcochos de boda, con 7 días. Se reservan con el 50 % de adelanto.",
  pagos: "Efectivo, transferencia, tarjeta de débito o crédito. Crédito a 15 días solo para negocios aprobados.",
  itbis: 0.18,
};

export const SUCURSALES = [
  { id: "gazcue", nombre: "Gazcue", direccion: "Calle Santiago, Gazcue, Distrito Nacional (dirección ficticia). Aquí está el horno principal." },
  { id: "los-prados", nombre: "Los Prados", direccion: "Calle Max Henríquez Ureña, Los Prados, Distrito Nacional (dirección ficticia)" },
];

export const VENDEDORES = [
  { id: "V01", nombre: "Yudelka Peralta", sucursal: "gazcue" },
  { id: "V02", nombre: "Ramón Castillo", sucursal: "gazcue" },
  { id: "V03", nombre: "Mariela Batista", sucursal: "los-prados" },
  { id: "V04", nombre: "Julio Ureña", sucursal: "los-prados" },
];

export const CATEGORIAS = [
  "Pan del día", "Bizcochos y tortas", "Repostería y postres", "Galletas y empacados", "Salados", "Café y bebidas",
];

export const CATEGORIAS_INSUMOS = ["Harinas y granos", "Lácteos y huevos", "Azúcares y rellenos", "Carnes y quesos", "Empaques"];

// ---------- utilidades ----------

function generadorAleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fechaISO(d) {
  const a = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dia = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${dia}`;
}

export function sumarDias(iso, n) {
  const [a, m, d] = iso.split("-").map(Number);
  return fechaISO(new Date(a, m - 1, d + n));
}

export function diasEntre(desdeISO, hastaISO) {
  const [a1, m1, d1] = desdeISO.split("-").map(Number);
  const [a2, m2, d2] = hastaISO.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

const redondear = (n, dec = 0) => Math.round(n * 10 ** dec) / 10 ** dec;

// ---------- menú ----------
// [nombre, unidad, precio RD$ sin ITBIS, popularidad 0-10, horas de anticipación (0 = se vende del día)]

const MENU = {
  "Pan del día": [
    ["Pan de agua", "unidad", 10, 10, 0],
    ["Pan sobao", "unidad", 12, 9, 0],
    ["Pan integral", "unidad", 15, 6, 0],
    ["Pan de coco", "unidad", 35, 6, 0],
    ["Pan de maíz (porción)", "porción", 45, 5, 0],
    ["Pan de leche (paquete de 6)", "paquete", 95, 6, 0],
    ["Pan de molde blanco", "funda", 145, 7, 0],
    ["Pan de molde integral", "funda", 165, 5, 0],
    ["Pan de hamburguesa (paquete de 8)", "paquete", 130, 5, 0],
    ["Pan de hot dog (paquete de 8)", "paquete", 125, 4, 0],
    ["Baguette", "unidad", 65, 6, 0],
    ["Pan de ajo", "unidad", 85, 5, 0],
    ["Croissant de mantequilla", "unidad", 75, 7, 0],
    ["Pan de batata", "unidad", 40, 3, 0],
    ["Pan de centeno con semillas", "unidad", 120, 0, 0],
  ],
  "Bizcochos y tortas": [
    ["Bizcocho dominicano de 1 libra", "unidad", 650, 6, 24],
    ["Bizcocho dominicano de 2 libras", "unidad", 1250, 7, 24],
    ["Bizcocho dominicano de 3 libras", "unidad", 1850, 6, 24],
    ["Bizcocho dominicano de 5 libras", "unidad", 2950, 4, 24],
    ["Bizcocho de chocolate de 2 libras", "unidad", 1450, 4, 24],
    ["Bizcocho de boda de 3 pisos", "unidad", 14500, 1, 168],
    ["Torta de zanahoria (entera)", "unidad", 1350, 3, 24],
    ["Cheesecake de chinola (entero)", "unidad", 1650, 3, 24],
    ["Tres leches (bandeja mediana)", "bandeja", 950, 5, 24],
    ["Porción de bizcocho dominicano", "porción", 120, 7, 0],
    ["Bizcocho de zanahoria sin azúcar", "unidad", 1450, 0, 24],
  ],
  "Repostería y postres": [
    ["Danesa de guayaba", "unidad", 55, 6, 0],
    ["Dona glaseada", "unidad", 45, 7, 0],
    ["Dona rellena de crema", "unidad", 55, 5, 0],
    ["Brownie", "unidad", 65, 5, 0],
    ["Flan de leche (porción)", "porción", 85, 4, 0],
    ["Quesillo (porción)", "porción", 90, 4, 0],
    ["Pudín de pan (porción)", "porción", 70, 4, 0],
    ["Majarete (vaso)", "vaso", 80, 3, 0],
    ["Tarta de manzana (porción)", "porción", 110, 3, 0],
    ["Alfajor de dulce de leche", "unidad", 50, 4, 0],
    ["Cupcake decorado", "unidad", 75, 5, 0],
    ["Caja de 12 cupcakes decorados", "caja", 850, 3, 24],
  ],
  "Galletas y empacados": [
    ["Galletas de mantequilla (funda de 12)", "funda", 150, 5, 0],
    ["Galletas de avena y pasas (funda de 12)", "funda", 165, 4, 0],
    ["Galletas con chispas de chocolate (funda de 12)", "funda", 175, 5, 0],
    ["Pan tostado (funda)", "funda", 120, 4, 0],
    ["Bizcochitos de anís (funda)", "funda", 110, 3, 0],
    ["Panetón de frutas", "unidad", 650, 3, 0],
  ],
  "Salados": [
    ["Pastelito de pollo", "unidad", 55, 8, 0],
    ["Pastelito de res", "unidad", 55, 7, 0],
    ["Pastelito de queso", "unidad", 50, 6, 0],
    ["Quipe", "unidad", 50, 7, 0],
    ["Empanada de pollo horneada", "unidad", 60, 5, 0],
    ["Sándwich de jamón y queso", "unidad", 165, 6, 0],
    ["Sándwich cubano", "unidad", 250, 4, 0],
    ["Croissant de jamón y queso", "unidad", 145, 5, 0],
    ["Pizza personal", "unidad", 220, 4, 0],
    ["Bandeja de picaderas (25 piezas)", "bandeja", 1450, 3, 24],
    ["Bandeja de picaderas (50 piezas)", "bandeja", 2750, 2, 24],
  ],
  "Café y bebidas": [
    ["Café negro (taza)", "taza", 50, 9, 0],
    ["Café con leche (taza)", "taza", 75, 8, 0],
    ["Capuchino", "taza", 120, 5, 0],
    ["Chocolate caliente", "taza", 95, 4, 0],
    ["Jugo de naranja natural (vaso)", "vaso", 110, 5, 0],
    ["Morir soñando (vaso)", "vaso", 130, 4, 0],
    ["Agua (botella)", "botella", 35, 6, 0],
    ["Refresco (lata)", "lata", 60, 5, 0],
  ],
};

const PREFIJOS = {
  "Pan del día": "PAN", "Bizcochos y tortas": "BIZ", "Repostería y postres": "REP",
  "Galletas y empacados": "GAL", "Salados": "SAL", "Café y bebidas": "BEB",
};

const MARGEN_CATEGORIA = {
  "Pan del día": 0.42, "Bizcochos y tortas": 0.52, "Repostería y postres": 0.56,
  "Galletas y empacados": 0.48, "Salados": 0.47, "Café y bebidas": 0.64,
};

// ---------- insumos (lo que se compra para producir) ----------
// [nombre, categoría, unidad, costo RD$, uso diario en Gazcue, proveedor]
// Gazcue tiene el horno principal; Los Prados hornea menos (35 % del uso de Gazcue).

const INSUMOS = [
  ["Harina de trigo panadera (saco 50 lb)", "Harinas y granos", "saco", 1650, 6, "Molinos del Este (ficticio)"],
  ["Harina de trigo para repostería (saco 50 lb)", "Harinas y granos", "saco", 1850, 1.6, "Molinos del Este (ficticio)"],
  ["Harina de maíz (saco 25 lb)", "Harinas y granos", "saco", 980, 0.4, "Molinos del Este (ficticio)"],
  ["Levadura seca (paquete 500 g)", "Harinas y granos", "paquete", 310, 2.5, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Polvo de hornear (lata 2 lb)", "Harinas y granos", "lata", 420, 0.5, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Mantequilla sin sal (caja 36 lb)", "Lácteos y huevos", "caja", 7400, 1.5, "Lácteos del Valle (ficticio)"],
  ["Margarina para hojaldre (caja 22 lb)", "Lácteos y huevos", "caja", 3100, 0.8, "Lácteos del Valle (ficticio)"],
  ["Huevos (cartón de 30)", "Lácteos y huevos", "cartón", 285, 12, "Granja Avícola Monte Plata (ficticio)"],
  ["Leche entera (galón)", "Lácteos y huevos", "galón", 230, 7, "Lácteos del Valle (ficticio)"],
  ["Leche evaporada (lata)", "Lácteos y huevos", "lata", 72, 14, "Lácteos del Valle (ficticio)"],
  ["Leche condensada (lata)", "Lácteos y huevos", "lata", 98, 10, "Lácteos del Valle (ficticio)"],
  ["Crema de leche para batir (litro)", "Lácteos y huevos", "litro", 340, 4, "Lácteos del Valle (ficticio)"],
  ["Queso crema (bloque 3 lb)", "Lácteos y huevos", "bloque", 760, 1.2, "Lácteos del Valle (ficticio)"],
  ["Azúcar crema (saco 50 lb)", "Azúcares y rellenos", "saco", 1950, 1.4, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Azúcar glas (funda 2 lb)", "Azúcares y rellenos", "funda", 165, 3, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Pasta de guayaba (lata 5 lb)", "Azúcares y rellenos", "lata", 690, 0.8, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Chocolate para cobertura (bloque 5 lb)", "Azúcares y rellenos", "bloque", 1450, 0.6, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Coco rallado (libra)", "Azúcares y rellenos", "libra", 160, 3, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Esencia de vainilla (galón)", "Azúcares y rellenos", "galón", 980, 0.2, "Distribuidora La Espiga Dorada (ficticio)"],
  ["Pechuga de pollo (libra)", "Carnes y quesos", "libra", 135, 9, "Carnes Selectas del Cibao (ficticio)"],
  ["Carne molida de res (libra)", "Carnes y quesos", "libra", 210, 6, "Carnes Selectas del Cibao (ficticio)"],
  ["Jamón de pierna (libra)", "Carnes y quesos", "libra", 240, 4, "Carnes Selectas del Cibao (ficticio)"],
  ["Queso amarillo (libra)", "Carnes y quesos", "libra", 260, 5, "Carnes Selectas del Cibao (ficticio)"],
  ["Café molido (libra)", "Carnes y quesos", "libra", 320, 2.5, "Café de la Loma (ficticio)"],
  ["Caja para bizcocho de 1 a 2 libras", "Empaques", "unidad", 38, 8, "Empaques del Caribe (ficticio)"],
  ["Caja para bizcocho de 3 a 5 libras", "Empaques", "unidad", 55, 5, "Empaques del Caribe (ficticio)"],
  ["Fundas de papel para pan (paquete de 500)", "Empaques", "paquete", 450, 0.9, "Empaques del Caribe (ficticio)"],
  ["Vasos para café 8 oz (paquete de 50)", "Empaques", "paquete", 260, 2.2, "Empaques del Caribe (ficticio)"],
];
const PREFIJO_INSUMO = { "Harinas y granos": "HAR", "Lácteos y huevos": "LAC", "Azúcares y rellenos": "AZU", "Carnes y quesos": "CAR", "Empaques": "EMP" };

// ---------- consignación (cadena de minimarkets ficticia) ----------
// productos: [código del menú, código de la cadena, nombre en el reporte de la cadena, unidades por semana en una tienda típica]

const CONSIGNACION = {
  cliente: "Minimarkets La Canasta (ficticio)",
  comision: 0.2, // la cadena se queda con el 20 % del precio
  tiendas: [
    { id: "canasta-gazcue", nombre: "La Canasta Gazcue", enReporte: "LC-01 GAZCUE", factor: 1 },
    { id: "canasta-naco", nombre: "La Canasta Naco", enReporte: "LC-02 NACO", factor: 1.25 },
    { id: "canasta-piantini", nombre: "La Canasta Piantini", enReporte: "LC-03 ENS. PIANTINI", factor: 1.5 },
    { id: "canasta-los-prados", nombre: "La Canasta Los Prados", enReporte: "LC-04 LOS PRADOS", factor: 0.75 },
  ],
  productos: [
    ["GAL-001", "7401001", "GALLETA MANTEQ. EL TRIGAL 12U", 24],
    ["GAL-003", "7401003", "GALLETA CHISPAS CHOC. EL TRIGAL 12U", 24],
    ["PAN-007", "7401007", "PAN MOLDE BLANCO EL TRIGAL", 24],
    ["GAL-004", "7401004", "PAN TOSTADO EL TRIGAL", 12],
    ["GAL-006", "7401006", "PANETON FRUTAS EL TRIGAL", 8],
  ],
};

// ---------- clientes ----------

const NOMBRES = ["Rafael", "Carmen", "José", "Altagracia", "Luis", "Mercedes", "Pedro", "Rosa", "Juan Carlos", "Yolanda",
  "Manuel", "Francisca", "Héctor", "Ana María", "Wilson", "Ana Julia", "Domingo", "Margarita", "Félix", "Josefina",
  "Ramón Antonio", "Elena", "Cristian", "Patricia", "Andrés", "Teresa", "Fausto", "Nelly", "Starling", "Mayra"];
const APELLIDOS = ["Pérez", "Rodríguez", "Martínez", "Santos", "Reyes", "Jiménez", "Familia", "Mejía", "Rosario", "Almonte",
  "Taveras", "Polanco", "Vásquez", "Guzmán", "Féliz", "De la Rosa", "Encarnación", "Cabrera", "Núñez", "Paulino",
  "Ventura", "Medina", "Sánchez", "Tejada", "Abreu", "Mateo", "Lantigua", "Del Orbe", "Frías", "Valdez"];
// Negocios que compran al por mayor (todos ficticios). [nombre, tipo, límite de crédito]
const NEGOCIOS_CLIENTES = [
  ["Hotel Brisas de Gazcue (ficticio)", "hotel", 60000],
  ["Cafetería El Mesón del Café, SRL", "cafeteria", 50000],
  ["Colmado Los Tres Hermanos", "colmado", 25000],
  ["Restaurante Sabor Criollo", "restaurante", 40000],
  ["Colmado y Bar Don Fausto", "colmado", 20000],
  ["Cafetería Universitaria La Pluma", "cafeteria", 45000],
  ["Oficinas Grupo Atlántico (ficticio)", "oficina", 35000],
  ["Colmado La Bendición", "colmado", 20000],
  ["Hostal Colonial Las Mariposas (ficticio)", "hotel", 30000],
  ["Café Bohemio de Gazcue", "cafeteria", 30000],
  ["Colmado El Buen Vecino", "colmado", 25000],
  ["Comedor Doña Chela", "restaurante", 20000],
  ["Colegio Nuevo Amanecer (ficticio)", "institucion", 40000],
  ["Clínica Dental Sonrisa (ficticio)", "oficina", 15000],
  ["Banca de Apuestas La Suerte (ficticio)", "oficina", 10000],
  ["Cafetería Hospital San Rafael (ficticio)", "cafeteria", 50000],
  ["Colmado Mi Esperanza", "colmado", 20000],
  ["Restaurante La Terraza de Los Prados", "restaurante", 35000],
  ["Eventos y Catering Bella Fiesta", "catering", 60000],
  ["Junta de Vecinos Los Prados", "institucion", 15000],
  ["Colmado Hermanos Paulino", "colmado", 20000],
  ["Gimnasio Cuerpo Sano (ficticio)", "oficina", 10000],
  ["Cafetería Torre Empresarial Naco (ficticio)", "cafeteria", 40000],
  ["Iglesia Comunidad de Fe Gazcue", "institucion", 15000],
  ["Colmado y Cafetería La Esquinita", "colmado", 25000],
  ["Restaurante Mar y Sol", "restaurante", 30000],
  ["Escuela Técnica Santa Cruz (ficticio)", "institucion", 30000],
  ["Floristería y Detalles Primavera", "oficina", 10000],
  ["Colmado Nuevo Horizonte", "colmado", 20000],
  ["Hotel Plaza Independencia (ficticio)", "hotel", 50000],
];
const NEGOCIO = new Set(["hotel", "cafeteria", "colmado", "restaurante", "oficina", "institucion", "catering"]);

// ---------- generación ----------

let cache = null;

export function generarDatos(hoyISO = fechaISO(new Date())) {
  if (cache && cache.hoy === hoyISO) return cache;
  const azar = generadorAleatorio(20261110);
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

  // Productos del menú
  const productos = [];
  for (const categoria of CATEGORIAS) {
    MENU[categoria].forEach(([nombre, unidad, precio, popularidad, anticipacion], i) => {
      const margen = MARGEN_CATEGORIA[categoria] * (0.88 + azar() * 0.24);
      productos.push({
        codigo: `${PREFIJOS[categoria]}-${String(i + 1).padStart(3, "0")}`,
        nombre, categoria, unidad, precio, popularidad,
        costo: redondear(precio * (1 - margen), 2),
        anticipacionHoras: anticipacion,
      });
    });
  }
  const porCodigo = Object.fromEntries(productos.map((p) => [p.codigo, p]));

  // Bizcochos (sembrada 4): la mantequilla y la crema subieron hace 42 días y el costo
  // de cada bizcocho subió 16 %; el precio de venta no se ajustó.
  const diaAumento = sumarDias(hoyISO, -42);
  for (const p of productos) {
    p.costoAnterior = p.costo;
    if (p.categoria === "Bizcochos y tortas") p.costo = redondear(p.costoAnterior * 1.16, 2);
  }

  // Insumos: existencia por sucursal y uso diario. Mínimo = 3 días de uso.
  const insumos = [];
  const contador = {};
  for (const [nombre, categoria, unidad, costo, usoGazcue, proveedor] of INSUMOS) {
    const pre = PREFIJO_INSUMO[categoria];
    contador[pre] = (contador[pre] ?? 0) + 1;
    const uso = { gazcue: usoGazcue, "los-prados": redondear(usoGazcue * 0.35, 2) };
    const stock = {};
    for (const s of SUCURSALES) stock[s.id] = redondear(uso[s.id] * (4 + azar() * 8), uso[s.id] < 1 ? 1 : 0);
    insumos.push({ codigo: `${pre}-${String(contador[pre]).padStart(3, "0")}`, nombre, categoria, unidad, costo, proveedor, uso, stock });
  }
  const insumo = (texto) => insumos.find((x) => x.nombre.startsWith(texto));
  insumo("Mantequilla sin sal").stock.gazcue = 2; // sembrada 2: 1.3 días
  insumo("Queso crema").stock.gazcue = 3; // bajo el mínimo, sin urgencia
  insumo("Caja para bizcocho de 1 a 2").stock["los-prados"] = 7;

  // Clientes: negocios (compran al por mayor) y personas
  const clientes = [];
  NEGOCIOS_CLIENTES.forEach(([nombre, tipo, limite], i) => {
    clientes.push({
      id: `C${String(i + 1).padStart(3, "0")}`, nombre, tipo, credito: true, limiteCredito: limite,
      sucursal: i % 3 === 2 ? "los-prados" : "gazcue",
      telefono: `809-555-${String(1000 + i * 7).padStart(4, "0")}`,
      clienteDesde: sumarDias(hoyISO, -entre(200, 2400)),
    });
  });
  const usados = new Set();
  while (clientes.length < 120) {
    const n = `${elegir(NOMBRES)} ${elegir(APELLIDOS)}`;
    if (usados.has(n)) continue;
    usados.add(n);
    const i = clientes.length;
    clientes.push({
      id: `C${String(i + 1).padStart(3, "0")}`, nombre: n, tipo: "particular", credito: false, limiteCredito: 0,
      sucursal: azar() < 0.55 ? "gazcue" : "los-prados",
      telefono: `829-555-${String(2000 + i * 13).slice(-4)}`,
      clienteDesde: sumarDias(hoyISO, -entre(30, 1800)),
    });
  }
  const hotel = clientes[0];

  // Ventas de los últimos 182 días
  const pesos = productos.map((p) => (p.popularidad === 0 ? 0 : p.popularidad ** 1.7));
  const totalPeso = pesos.reduce((a, b) => a + b, 0);
  const elegirProducto = () => {
    let r = azar() * totalPeso;
    for (let i = 0; i < productos.length; i++) { r -= pesos[i]; if (r <= 0) return productos[i]; }
    return productos[0];
  };
  // Lo que compra un negocio: pan, salados y algo de repostería; casi nunca bebidas.
  const paraNegocio = productos.filter((p) => ["Pan del día", "Salados", "Repostería y postres"].includes(p.categoria) && p.popularidad > 0 && !p.anticipacionHoras);
  const clientesPorSucursal = {
    gazcue: clientes.filter((c) => c.sucursal === "gazcue"),
    "los-prados": clientes.filter((c) => c.sucursal === "los-prados"),
  };
  const facturas = [];
  const lineas = [];
  const inicio = sumarDias(hoyISO, -181);
  const horaActual = new Date().getHours() + new Date().getMinutes() / 60;
  const fraccionHoy = Math.min(1, Math.max(0.12, (horaActual - 6) / 14));
  let numero = 18000;

  for (let d = 0; d <= 181; d++) {
    const fecha = sumarDias(inicio, d);
    const [a, m, dd] = fecha.split("-").map(Number);
    const diaSemana = new Date(a, m - 1, dd).getDay();
    const diasAtras = 181 - d;
    for (const suc of SUCURSALES) {
      let base = suc.id === "gazcue" ? 34 : 26;
      if (diaSemana === 0) base *= 0.55;
      if (diaSemana === 6) base *= 1.25;
      if (suc.id === "los-prados" && diasAtras < 28) base *= 0.62; // situación sembrada 1
      base *= 1 + (d / 181) * 0.06; // leve crecimiento en el semestre
      if (diasAtras === 0) base *= fraccionHoy;
      const cantidad = Math.max(0, Math.round(base + (azar() - 0.5) * base * 0.4));
      const vendedores = VENDEDORES.filter((v) => v.sucursal === suc.id);
      for (let k = 0; k < cantidad; k++) {
        numero++;
        let cliente = null;
        const r = azar();
        if (r < 0.1) cliente = elegir(clientesPorSucursal[suc.id].filter((c) => NEGOCIO.has(c.tipo)));
        else if (r < 0.26) cliente = elegir(clientesPorSucursal[suc.id].filter((c) => c.tipo === "particular"));
        if (cliente && suc.id === "gazcue" && azar() < 0.03) cliente = hotel;
        const esNegocio = cliente && NEGOCIO.has(cliente.tipo);
        const nLineas = esNegocio ? entre(2, 5) : entre(1, 3);
        const id = `F-${numero}`;
        let total = 0, costoTotal = 0;
        const vistos = new Set();
        for (let l = 0; l < nLineas; l++) {
          const p = esNegocio ? elegir(paraNegocio) : elegirProducto();
          if (vistos.has(p.codigo)) continue;
          vistos.add(p.codigo);
          let cant;
          if (esNegocio) cant = p.precio <= 15 ? entre(3, 15) * 10 : p.precio < 100 ? entre(1, 5) * 10 : entre(1, 6);
          else cant = p.precio <= 15 ? entre(3, 20) : p.precio < 200 ? entre(1, 4) : 1;
          const descuento = esNegocio ? [0, 0.05, 0.08, 0.1][entre(0, 3)] : 0;
          const precio = redondear(p.precio * (1 - descuento), 2);
          const costoUnit = p.categoria === "Bizcochos y tortas" && fecha < diaAumento ? p.costoAnterior : p.costo;
          const importe = redondear(precio * cant, 2);
          total += importe; costoTotal += costoUnit * cant;
          lineas.push({ factura: id, fecha, sucursal: suc.id, codigo: p.codigo, categoria: p.categoria, cantidad: cant, precio, importe, costo: redondear(costoUnit * cant, 2) });
        }
        if (total === 0) { numero--; continue; }
        const aCredito = cliente && cliente.credito && azar() < 0.75;
        facturas.push({
          id, fecha, sucursal: suc.id, vendedor: elegir(vendedores).id,
          cliente: cliente ? cliente.id : null, total: redondear(total, 2), costo: redondear(costoTotal, 2),
          condicion: aCredito ? "crédito 15 días" : elegir(["efectivo", "efectivo", "efectivo", "tarjeta", "transferencia"]),
          vence: aCredito ? sumarDias(fecha, 15) : fecha, pagado: aCredito ? 0 : redondear(total, 2),
        });
      }
    }
  }

  // Cobros: la mayoría paga entre 7 y 25 días después; el hotel (sembrada 3) dejó de pagar hace 95 días.
  for (const f of facturas) {
    if (f.condicion !== "crédito 15 días") continue;
    const edad = diasEntre(f.fecha, hoyISO);
    if (f.cliente === hotel.id) { if (edad > 95) f.pagado = f.total; continue; }
    const lento = azar() < 0.12;
    const diasPago = lento ? entre(25, 50) : entre(7, 25);
    if (edad > diasPago) f.pagado = f.total;
    else if (edad > 12 && azar() < 0.25) f.pagado = redondear(f.total * 0.5, 2);
  }

  // Límites de crédito acordes con lo que cada cliente suele deber; solo el hotel queda por encima.
  const saldos = {};
  for (const f of facturas) if (f.cliente && f.total > f.pagado) saldos[f.cliente] = (saldos[f.cliente] ?? 0) + f.total - f.pagado;
  for (const c of clientes) {
    if (c === hotel || !c.credito) continue;
    const saldo = saldos[c.id] ?? 0;
    if (saldo * 1.25 > c.limiteCredito) c.limiteCredito = Math.ceil((saldo * 1.4) / 5000) * 5000;
  }

  // Pedidos de los últimos días (los nuevos de la demo se agregan desde estado.js)
  const estados = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];
  const canales = ["Mostrador", "Teléfono", "Teléfono", "WhatsApp", "WhatsApp", "Correo"];
  const encargos = productos.filter((p) => p.anticipacionHoras === 24);
  const pedidos = [];
  for (let i = 0; i < 16; i++) {
    // Los pedidos de "hoy" nunca quedan en el futuro: su hora va de las 6:00 a. m. hasta
    // unos minutos antes de ahora. Antes de abrir (6:10 a. m.) pasan a ser de ayer.
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const hayHoy = minutosAhora >= 370;
    const diasAtras = i < 7 ? (hayHoy ? 0 : 1) : i < 12 ? 1 : 2;
    const minutoPedido = diasAtras === 0 ? entre(360, Math.max(360, minutosAhora - 5)) : entre(380, 1170);
    const esEncargo = azar() < 0.35;
    const c = esEncargo ? elegir(clientes.slice(30)) : elegir(clientes.slice(0, 30));
    const items = [];
    if (esEncargo) {
      const p = elegir(encargos);
      items.push({ codigo: p.codigo, nombre: p.nombre, cantidad: 1, precio: p.precio });
      if (azar() < 0.5) { const q = elegir(paraNegocio); items.push({ codigo: q.codigo, nombre: q.nombre, cantidad: entre(1, 3) * 12, precio: q.precio }); }
    } else {
      const n = entre(2, 4);
      for (let j = 0; j < n; j++) {
        const p = elegir(paraNegocio);
        if (items.some((x) => x.codigo === p.codigo)) continue;
        items.push({ codigo: p.codigo, nombre: p.nombre, cantidad: p.precio <= 15 ? entre(5, 20) * 10 : p.precio < 100 ? entre(2, 6) * 10 : entre(2, 10), precio: p.precio });
      }
    }
    const subtotal = items.reduce((a, x) => a + x.cantidad * x.precio, 0);
    pedidos.push({
      id: `P-${1300 + i}`, fecha: sumarDias(hoyISO, -diasAtras), hora: `${Math.floor(minutoPedido / 60)}:${String(minutoPedido % 60).padStart(2, "0")}`,
      cliente: c.nombre, telefono: c.telefono, canal: elegir(canales), sucursal: c.sucursal,
      estado: diasAtras === 0 ? estados[entre(0, 3)] : diasAtras === 1 ? estados[entre(2, 4)] : "entregado",
      entrega: azar() < 0.6 ? "envío" : "retiro en tienda", items,
      subtotal: redondear(subtotal, 2), total: redondear(subtotal * (1 + EMPRESA.itbis), 2), origen: "sistema",
    });
  }

  // La ruta de reparto de la mañana (el PDF de ejemplo public/ejemplos/reporte-de-entregas-ruta-manana.pdf)
  // siempre tiene los mismos pedidos y clientes, sea cual sea la fecha.
  const RUTA_MANANA = { "P-1302": "C003", "P-1305": "C006", "P-1306": "C010", "P-1307": "C011" };
  for (const p of pedidos) {
    const c = clientes.find((x) => x.id === RUTA_MANANA[p.id]);
    if (!c) continue;
    const pan = porCodigo["PAN-001"], sobao = porCodigo["PAN-002"], pastelito = porCodigo["SAL-001"];
    const items = [
      { codigo: pan.codigo, nombre: pan.nombre, cantidad: 120 + Number(p.id.slice(-1)) * 20, precio: pan.precio },
      { codigo: sobao.codigo, nombre: sobao.nombre, cantidad: 60, precio: sobao.precio },
      { codigo: pastelito.codigo, nombre: pastelito.nombre, cantidad: 30, precio: pastelito.precio },
    ];
    const subtotal = items.reduce((a, x) => a + x.cantidad * x.precio, 0);
    Object.assign(p, { cliente: c.nombre, telefono: c.telefono, sucursal: "gazcue", estado: "en ruta", entrega: "envío", canal: "Teléfono", items, subtotal: redondear(subtotal, 2), total: redondear(subtotal * (1 + EMPRESA.itbis), 2) });
  }

  // Consignación: la panadería deja productos empacados en las tiendas de una cadena de
  // minimarkets (ficticia) y cobra lo que se vende. La cadena manda cada semana un PDF con
  // las ventas por tienda y producto (public/ejemplos/reporte-ventas-la-canasta.pdf), que se
  // importa en el panel. Lo entregado es fijo para que el PDF de ejemplo cuadre cualquier día.
  const consignacion = {
    cliente: CONSIGNACION.cliente,
    comision: CONSIGNACION.comision,
    tiendas: CONSIGNACION.tiendas,
    productos: CONSIGNACION.productos.map(([codigo, codigoCliente, nombreCliente, porSemana]) => ({
      codigo, codigoCliente, nombreCliente, nombre: porCodigo[codigo].nombre,
      precioLiquidar: redondear(porCodigo[codigo].precio * (1 - CONSIGNACION.comision), 2), porSemana,
    })),
    desde: sumarDias(hoyISO, -6), hasta: hoyISO,
  };
  consignacion.entregas = consignacion.tiendas.flatMap((t) => consignacion.productos.map((pr) => ({ tienda: t.id, codigo: pr.codigo, unidades: Math.round(pr.porSemana * t.factor) })));

  cache = { hoy: hoyISO, productos, porCodigo, insumos, clientes, facturas, lineas, pedidos, consignacion, vendedores: VENDEDORES, sucursales: SUCURSALES };
  return cache;
}
