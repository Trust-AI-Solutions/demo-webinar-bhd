// DATOS FICTICIOS de "Ferretería Los Pinos, SRL" (empresa inventada para la demo).
// Todo se genera aquí con una semilla fija, anclado a la fecha de hoy: cada vez que
// se abre la demo, los últimos 6 meses de ventas terminan hoy. No hay base de datos:
// lo que cambia durante la demo (pedidos y cotizaciones del asistente de WhatsApp,
// conversaciones que piden a una persona) se guarda en el navegador (estado.js).
//
// Situaciones sembradas a propósito para que la IA las encuentre:
//  1. La sucursal Villa Mella vende alrededor de un tercio menos en las últimas 4 semanas.
//  2. El cemento gris en Herrera alcanza para uno o dos días.
//  3. Constructora Ozama pasó su límite de crédito y tiene facturas con más de 60 días.
//  4. El costo de las pinturas subió 12 % hace 6 semanas y el precio no se ajustó:
//     el margen de esa categoría cayó.
//  5. Hay inventario sin movimiento en 90 días (calentadores de agua de 30 galones).

export const EMPRESA = {
  nombre: "Ferretería Los Pinos, SRL",
  nombreCorto: "Ferretería Los Pinos",
  ciudad: "Santo Domingo",
  telefono: "809-555-0142",
  whatsapp: "809-555-0143",
  horario: "Lunes a sábado de 7:30 a. m. a 6:00 p. m.; domingos de 8:00 a. m. a 12:00 m. (solo Herrera)",
  envio: "Envío gratis en el Gran Santo Domingo para pedidos desde RD$15,000 antes de ITBIS; si no, RD$500. Pedidos confirmados antes de las 2:00 p. m. salen el mismo día; después, al día siguiente.",
  pagos: "Efectivo, transferencia, tarjeta de débito o crédito. Crédito a 30 días solo para clientes aprobados.",
  itbis: 0.18,
};

export const SUCURSALES = [
  { id: "herrera", nombre: "Herrera", direccion: "Av. Isabel Aguiar, Herrera, Santo Domingo Oeste (dirección ficticia)" },
  { id: "villa-mella", nombre: "Villa Mella", direccion: "Av. Hermanas Mirabal, Villa Mella, Santo Domingo Norte (dirección ficticia)" },
];

export const VENDEDORES = [
  { id: "V01", nombre: "Ramón Peralta", sucursal: "herrera" },
  { id: "V02", nombre: "Yesenia Castillo", sucursal: "herrera" },
  { id: "V03", nombre: "Julio Batista", sucursal: "villa-mella" },
  { id: "V04", nombre: "Mariela Ureña", sucursal: "villa-mella" },
];

export const CATEGORIAS = [
  "Cemento y agregados", "Acero y varillas", "Plomería", "Electricidad", "Pinturas",
  "Herramientas manuales", "Herramientas eléctricas", "Tornillería y fijaciones",
  "Madera y plywood", "Cerrajería y ferretería general",
];

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

// ---------- catálogo ----------
// [nombre, unidad, precio RD$ sin ITBIS, popularidad 0-10, mínimo por sucursal]

const CATALOGO_BASE = {
  "Cemento y agregados": [
    ["Cemento gris tipo Portland 42.5 kg", "saco", 640, 10, 60],
    ["Cemento blanco 40 kg", "saco", 1250, 3, 15],
    ["Arena lavada", "metro cúbico", 1900, 6, 10],
    ["Grava 3/4", "metro cúbico", 2150, 5, 8],
    ["Block de concreto 6 pulgadas", "unidad", 42, 9, 1500],
    ["Block de concreto 8 pulgadas", "unidad", 52, 7, 1000],
    ["Block de concreto 4 pulgadas", "unidad", 34, 5, 800],
    ["Pegamento para cerámica 20 kg", "saco", 520, 6, 40],
    ["Pegamento para porcelanato 20 kg", "saco", 780, 4, 25],
    ["Lechada para juntas 5 kg", "funda", 260, 4, 30],
    ["Cal hidratada 25 kg", "saco", 390, 3, 20],
    ["Mezcla lista para empañete 40 kg", "saco", 450, 4, 30],
    ["Impermeabilizante de techo acrílico 5 galones", "cubeta", 4850, 5, 12],
    ["Malla electrosoldada 6x6", "lámina", 1650, 3, 15],
    ["Yeso en polvo 25 kg", "saco", 420, 2, 10],
  ],
  "Acero y varillas": [
    ["Varilla corrugada 3/8 x 20 pies", "unidad", 335, 9, 300],
    ["Varilla corrugada 1/2 x 20 pies", "unidad", 585, 8, 200],
    ["Varilla corrugada 3/4 x 20 pies", "unidad", 1290, 4, 60],
    ["Varilla corrugada 1/4 x 20 pies", "unidad", 160, 5, 120],
    ["Alambre dulce calibre 16", "libra", 85, 7, 150],
    ["Alambre de púas 400 m", "rollo", 3400, 2, 6],
    ["Tubo cuadrado 1 x 1 pulgada calibre 18", "unidad", 980, 3, 20],
    ["Tubo cuadrado 2 x 2 pulgadas calibre 16", "unidad", 1850, 2, 12],
    ["Angular 1 1/2 x 1/8", "unidad", 1150, 2, 15],
    ["Plancha de zinc acanalado calibre 26 x 12 pies", "unidad", 1180, 6, 80],
    ["Plancha galvalume calibre 26 x 12 pies", "unidad", 1490, 4, 50],
    ["Estribos de 3/8 (paquete de 50)", "paquete", 1450, 4, 20],
    ["Malla ciclónica 5 pies x 50 pies", "rollo", 6900, 2, 5],
    ["Clavos para zinc con arandela (libra)", "libra", 140, 5, 60],
  ],
  "Plomería": [
    ["Tubo PVC presión 1/2 pulgada x 19 pies", "unidad", 210, 8, 120],
    ["Tubo PVC presión 3/4 pulgada x 19 pies", "unidad", 290, 6, 80],
    ["Tubo PVC sanitario 4 pulgadas x 19 pies", "unidad", 980, 6, 40],
    ["Tubo PVC sanitario 2 pulgadas x 19 pies", "unidad", 430, 5, 50],
    ["Codo PVC 1/2 pulgada", "unidad", 18, 7, 300],
    ["Codo PVC 4 pulgadas sanitario", "unidad", 135, 5, 60],
    ["Tee PVC 1/2 pulgada", "unidad", 22, 6, 200],
    ["Pegamento PVC 1/4 galón", "unidad", 640, 6, 30],
    ["Llave de paso 1/2 pulgada bronce", "unidad", 395, 5, 40],
    ["Llave de lavamanos cromada", "unidad", 1150, 4, 20],
    ["Mezcladora de fregadero", "unidad", 2850, 3, 10],
    ["Inodoro blanco de dos piezas", "unidad", 6200, 3, 8],
    ["Lavamanos de pedestal blanco", "unidad", 3900, 2, 6],
    ["Tanque de agua 250 galones", "unidad", 7800, 3, 6],
    ["Tanque de agua 500 galones", "unidad", 13500, 2, 4],
    ["Bomba de agua 1/2 HP", "unidad", 6900, 3, 6],
    ["Calentador de agua eléctrico 30 galones", "unidad", 14900, 0, 3],
    ["Cinta teflón 3/4", "unidad", 35, 7, 200],
    ["Flotante para tanque 1/2", "unidad", 420, 3, 15],
    ["Manguera de jardín 50 pies", "unidad", 1250, 3, 12],
  ],
  "Electricidad": [
    ["Cable THHN 12 negro (rollo 100 m)", "rollo", 4350, 6, 15],
    ["Cable THHN 12 blanco (rollo 100 m)", "rollo", 4350, 6, 15],
    ["Cable THHN 10 negro (rollo 100 m)", "rollo", 6650, 4, 8],
    ["Cable THHN 14 (rollo 100 m)", "rollo", 3100, 4, 10],
    ["Cable dúplex 2x12 (metro)", "metro", 68, 6, 300],
    ["Tubo conduit PVC 1/2 pulgada x 10 pies", "unidad", 75, 7, 200],
    ["Caja rectangular PVC", "unidad", 28, 7, 300],
    ["Tomacorriente doble blanco", "unidad", 115, 8, 150],
    ["Interruptor sencillo blanco", "unidad", 105, 7, 150],
    ["Breaker 20 amperios", "unidad", 390, 5, 40],
    ["Breaker 30 amperios", "unidad", 420, 4, 30],
    ["Panel eléctrico 8 circuitos", "unidad", 2650, 3, 8],
    ["Bombillo LED 9 W", "unidad", 95, 9, 300],
    ["Bombillo LED 15 W", "unidad", 155, 6, 150],
    ["Lámpara LED de techo 18 W", "unidad", 690, 4, 30],
    ["Reflector LED 50 W", "unidad", 1150, 3, 15],
    ["Cinta aislante negra", "unidad", 55, 8, 200],
    ["Extensión eléctrica 25 pies", "unidad", 650, 4, 20],
    ["Protector de voltaje para nevera", "unidad", 1350, 4, 15],
    ["Inversor 1,500 W", "unidad", 18500, 1, 3],
    ["Batería de ciclo profundo 200 Ah", "unidad", 16900, 1, 4],
  ],
  "Pinturas": [
    ["Pintura acrílica blanca interior (galón)", "galón", 980, 9, 80],
    ["Pintura acrílica blanca interior (cubeta 5 galones)", "cubeta", 4450, 7, 25],
    ["Pintura acrílica exterior blanca (galón)", "galón", 1190, 7, 50],
    ["Pintura acrílica exterior blanca (cubeta 5 galones)", "cubeta", 5450, 5, 15],
    ["Pintura acrílica color crema (galón)", "galón", 1050, 6, 30],
    ["Pintura acrílica color gris perla (galón)", "galón", 1050, 5, 30],
    ["Pintura acrílica color azul cielo (galón)", "galón", 1050, 4, 20],
    ["Pintura de aceite blanca (galón)", "galón", 1450, 4, 20],
    ["Pintura anticorrosiva gris (galón)", "galón", 1380, 4, 20],
    ["Sellador acrílico (galón)", "galón", 690, 6, 40],
    ["Masilla para paredes (galón)", "galón", 620, 5, 30],
    ["Diluyente (galón)", "galón", 450, 4, 25],
    ["Brocha 3 pulgadas", "unidad", 135, 7, 80],
    ["Rodillo 9 pulgadas con mango", "unidad", 360, 7, 50],
    ["Bandeja para pintura", "unidad", 160, 5, 40],
    ["Cinta de enmascarar 2 pulgadas", "unidad", 120, 6, 80],
    ["Lija de agua número 150", "unidad", 30, 5, 200],
  ],
  "Herramientas manuales": [
    ["Martillo de uña 16 oz", "unidad", 490, 5, 20],
    ["Cinta métrica 8 metros", "unidad", 380, 6, 30],
    ["Nivel de aluminio 24 pulgadas", "unidad", 640, 3, 12],
    ["Pala cuadrada con mango", "unidad", 690, 4, 20],
    ["Pico con mango", "unidad", 850, 2, 10],
    ["Carretilla 6 pies cúbicos", "unidad", 4300, 3, 8],
    ["Llana metálica dentada", "unidad", 320, 4, 20],
    ["Cuchara de albañil 7 pulgadas", "unidad", 290, 5, 25],
    ["Destornilladores juego de 6", "juego", 520, 4, 15],
    ["Alicate universal 8 pulgadas", "unidad", 430, 4, 15],
    ["Llave ajustable 10 pulgadas", "unidad", 560, 3, 12],
    ["Segueta con arco", "unidad", 390, 3, 12],
    ["Machete 22 pulgadas", "unidad", 420, 3, 15],
    ["Escalera de aluminio 6 peldaños", "unidad", 5200, 2, 5],
    ["Cubeta de albañil", "unidad", 140, 6, 50],
  ],
  "Herramientas eléctricas": [
    ["Taladro percutor 1/2 pulgada 650 W", "unidad", 3950, 3, 6],
    ["Atornillador inalámbrico 20 V", "unidad", 6200, 2, 4],
    ["Esmeriladora angular 4 1/2 pulgadas", "unidad", 3450, 3, 6],
    ["Sierra circular 7 1/4 pulgadas", "unidad", 6900, 2, 4],
    ["Rotomartillo SDS 800 W", "unidad", 8900, 1, 3],
    ["Disco de corte para metal 4 1/2", "unidad", 75, 7, 120],
    ["Disco de corte para concreto 4 1/2", "unidad", 390, 5, 30],
    ["Broca para concreto 3/8", "unidad", 120, 6, 60],
    ["Juego de brocas para metal 13 piezas", "juego", 890, 3, 10],
    ["Máquina de soldar 200 A", "unidad", 11500, 1, 3],
    ["Electrodos 6013 1/8 (libra)", "libra", 160, 5, 60],
  ],
  "Tornillería y fijaciones": [
    ["Clavos de acero 2 1/2 pulgadas (libra)", "libra", 95, 8, 150],
    ["Clavos corrientes 3 pulgadas (libra)", "libra", 70, 7, 150],
    ["Tornillo para madera 1 1/2 (caja de 100)", "caja", 260, 5, 40],
    ["Tornillo para plycem 1 1/4 (caja de 100)", "caja", 290, 4, 40],
    ["Tarugo plástico 1/4 (bolsa de 100)", "bolsa", 140, 6, 60],
    ["Ancla de expansión 3/8", "unidad", 38, 5, 200],
    ["Pernos 3/8 x 3 con tuerca", "unidad", 32, 4, 200],
    ["Bisagra de 3 pulgadas (par)", "par", 120, 5, 60],
    ["Silicón transparente", "unidad", 280, 6, 50],
    ["Espuma expansiva", "unidad", 450, 3, 20],
  ],
  "Madera y plywood": [
    ["Plywood 3/4 4x8 pies", "lámina", 2650, 5, 30],
    ["Plywood 1/2 4x8 pies", "lámina", 1950, 5, 30],
    ["Plywood 1/4 4x8 pies", "lámina", 1150, 3, 20],
    ["Madera de pino 2x4x12 pies", "unidad", 640, 6, 80],
    ["Madera de pino 1x4x10 pies", "unidad", 330, 4, 60],
    ["Madera de pino 2x6x12 pies", "unidad", 980, 3, 40],
    ["Plycem 4x8 pies 8 mm", "lámina", 1290, 3, 25],
    ["Puerta de madera interior 32 pulgadas", "unidad", 5900, 2, 6],
    ["Puerta de metal exterior 36 pulgadas", "unidad", 11200, 1, 3],
  ],
  "Cerrajería y ferretería general": [
    ["Candado de 40 mm", "unidad", 390, 5, 30],
    ["Candado de 60 mm", "unidad", 690, 3, 15],
    ["Cerradura de pomo para puerta", "unidad", 980, 4, 15],
    ["Cerradura de seguridad doble cilindro", "unidad", 2350, 2, 6],
    ["Cadena galvanizada 1/4 (pie)", "pie", 75, 3, 100],
    ["Soga de nylon 3/8 (pie)", "pie", 18, 4, 300],
    ["Lona plástica 12x15 pies", "unidad", 980, 3, 12],
    ["Guantes de trabajo (par)", "par", 160, 7, 80],
    ["Lentes de seguridad", "unidad", 180, 4, 30],
    ["Casco de seguridad", "unidad", 390, 3, 20],
    ["Botas de goma (par)", "par", 950, 3, 15],
    ["Escoba de fibra", "unidad", 210, 5, 30],
    ["Recogedor plástico", "unidad", 120, 4, 30],
  ],
};

const PREFIJOS = {
  "Cemento y agregados": "CEM", "Acero y varillas": "ACE", "Plomería": "PLO", "Electricidad": "ELE",
  "Pinturas": "PIN", "Herramientas manuales": "HMA", "Herramientas eléctricas": "HEL",
  "Tornillería y fijaciones": "TOR", "Madera y plywood": "MAD", "Cerrajería y ferretería general": "GEN",
};

const MARGEN_CATEGORIA = {
  "Cemento y agregados": 0.13, "Acero y varillas": 0.15, "Plomería": 0.30, "Electricidad": 0.32,
  "Pinturas": 0.34, "Herramientas manuales": 0.38, "Herramientas eléctricas": 0.28,
  "Tornillería y fijaciones": 0.42, "Madera y plywood": 0.20, "Cerrajería y ferretería general": 0.40,
};

const PROVEEDORES = {
  "Cemento y agregados": "Cementos del Caribe (ficticio)", "Acero y varillas": "Aceros Quisqueya (ficticio)",
  "Plomería": "Distribuidora Hidro Sur (ficticio)", "Electricidad": "Eléctrica Antillana (ficticio)",
  "Pinturas": "Pinturas Brisa Tropical (ficticio)", "Herramientas manuales": "Importadora Herramax (ficticio)",
  "Herramientas eléctricas": "Importadora Herramax (ficticio)", "Tornillería y fijaciones": "Fijaciones del Cibao (ficticio)",
  "Madera y plywood": "Maderas del Norte (ficticio)", "Cerrajería y ferretería general": "Suplidora Central (ficticio)",
};

// ---------- clientes ----------

const NOMBRES = ["Rafael", "Carmen", "José", "Altagracia", "Luis", "Mercedes", "Pedro", "Rosa", "Juan Carlos", "Yolanda",
  "Manuel", "Francisca", "Héctor", "Dulce María", "Wilson", "Ana Julia", "Domingo", "Margarita", "Félix", "Josefina",
  "Ramón Antonio", "Elena", "Cristian", "Patricia", "Andrés", "Teresa", "Fausto", "Nelly", "Starling", "Mayra"];
const APELLIDOS = ["Pérez", "Rodríguez", "Martínez", "Santos", "Reyes", "Jiménez", "Familia", "Mejía", "Rosario", "Almonte",
  "Taveras", "Polanco", "Vásquez", "Guzmán", "Féliz", "De la Rosa", "Encarnación", "Cabrera", "Núñez", "Paulino",
  "Ventura", "Medina", "Sánchez", "Tejada", "Abreu", "Mateo", "Lantigua", "Del Orbe", "Frías", "Valdez"];
const EMPRESAS_CLIENTES = [
  ["Constructora Ozama", "constructora", 250000],
  ["Edificaciones Brisa Norte, SRL", "constructora", 400000],
  ["Inversiones Palmar Alto, SRL", "constructora", 300000],
  ["Construcciones Hermanos Tejada", "constructora", 200000],
  ["Proyectos Arco Iris del Este", "constructora", 350000],
  ["Desarrollos Monte Verde, SRL", "constructora", 500000],
  ["Ingeniería y Obras del Sur", "constructora", 250000],
  ["Remodelaciones Casa Linda", "contratista", 120000],
  ["Herrería El Yunque", "taller", 80000],
  ["Taller de Ebanistería Caoba Fina", "taller", 60000],
  ["Electricidad Total Rosario", "contratista", 90000],
  ["Plomería Express del Norte", "contratista", 70000],
  ["Pinturas y Acabados Valdez", "contratista", 75000],
  ["Condominio Torres del Parque", "condominio", 100000],
  ["Colegio Nuevo Amanecer (ficticio)", "institucion", 120000],
  ["Junta de Vecinos Los Girasoles", "institucion", 40000],
  ["Mantenimiento Industrial Caribe", "contratista", 150000],
  ["Hotel Playa Serena (ficticio)", "institucion", 200000],
  ["Inmobiliaria Puerta del Sol", "constructora", 300000],
  ["Techados y Estructuras Lantigua", "contratista", 110000],
  ["Herrería y Portones Paulino", "taller", 60000],
  ["Constructora Mella Unida", "constructora", 220000],
  ["Obras Civiles Frías & Asociados", "constructora", 280000],
  ["Supermercado La Esquina (ficticio)", "institucion", 50000],
  ["Iglesia Comunidad de Fe Villa Mella", "institucion", 30000],
  ["Reparaciones Generales Abreu", "contratista", 50000],
  ["Taller de Aluminio y Vidrio Nuñez", "taller", 70000],
  ["Ferretería Barrio Nuevo (revendedor)", "revendedor", 150000],
  ["Colmado y Ferretería Don Fausto (revendedor)", "revendedor", 80000],
  ["Constructora Cibao Sur", "constructora", 250000],
  ["Grupo Inmobiliario Altos de Arroyo", "constructora", 350000],
  ["Instalaciones Eléctricas Mejía", "contratista", 80000],
  ["Mantenimiento de Piscinas Azul Claro", "contratista", 40000],
  ["Clínica Dental Sonrisa (ficticio)", "institucion", 30000],
  ["Escuela Técnica Santa Cruz (ficticio)", "institucion", 60000],
  ["Desarrollos Verde Mar", "constructora", 300000],
  ["Taller de Soldadura Encarnación", "taller", 50000],
  ["Remodelaciones Express Guzmán", "contratista", 70000],
  ["Viviendas Económicas del Ozama", "constructora", 260000],
  ["Mantenimiento de Edificios Cabrera", "contratista", 90000],
];

// ---------- generación ----------

let cache = null;

export function generarDatos(hoyISO = fechaISO(new Date())) {
  if (cache && cache.hoy === hoyISO) return cache;
  const azar = generadorAleatorio(20261110);
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

  // Productos
  const productos = [];
  for (const categoria of CATEGORIAS) {
    CATALOGO_BASE[categoria].forEach(([nombre, unidad, precio, popularidad, minimo], i) => {
      const margen = MARGEN_CATEGORIA[categoria] * (0.85 + azar() * 0.3);
      productos.push({
        codigo: `${PREFIJOS[categoria]}-${String(i + 1).padStart(3, "0")}`,
        nombre, categoria, unidad, precio,
        costo: redondear(precio * (1 - margen), 2),
        popularidad, minimo, proveedor: PROVEEDORES[categoria], stock: {},
      });
    });
  }
  const porCodigo = Object.fromEntries(productos.map((p) => [p.codigo, p]));

  // Pinturas: el costo subió 12 % hace 42 días; el precio no se ajustó.
  const diaAumentoPintura = sumarDias(hoyISO, -42);
  for (const p of productos) {
    p.costoAnterior = p.costo;
    if (p.categoria === "Pinturas") p.costo = redondear(p.costoAnterior * 1.12, 2);
  }

  // Clientes
  const clientes = [];
  EMPRESAS_CLIENTES.forEach(([nombre, tipo, limite], i) => {
    clientes.push({
      id: `C${String(i + 1).padStart(3, "0")}`, nombre, tipo, credito: true, limiteCredito: limite,
      sucursal: i % 3 === 2 ? "villa-mella" : "herrera",
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
    const esMaestro = azar() < 0.45;
    clientes.push({
      id: `C${String(i + 1).padStart(3, "0")}`,
      nombre: esMaestro ? `${n} (maestro constructor)` : n,
      tipo: esMaestro ? "maestro" : "particular",
      credito: esMaestro && azar() < 0.3, limiteCredito: esMaestro ? 30000 : 0,
      sucursal: azar() < 0.55 ? "herrera" : "villa-mella",
      telefono: `829-555-${String(2000 + i * 13).slice(-4)}`,
      clienteDesde: sumarDias(hoyISO, -entre(30, 1800)),
    });
  }
  for (const c of clientes) if (!c.credito) c.limiteCredito = 0;
  const ozama = clientes[0];

  // Ventas de los últimos 182 días
  const pesos = productos.map((p) => (p.popularidad === 0 ? 0 : p.popularidad ** 1.6));
  const totalPeso = pesos.reduce((a, b) => a + b, 0);
  const elegirProducto = () => {
    let r = azar() * totalPeso;
    for (let i = 0; i < productos.length; i++) { r -= pesos[i]; if (r <= 0) return productos[i]; }
    return productos[0];
  };
  const clientesPorSucursal = {
    herrera: clientes.filter((c) => c.sucursal === "herrera"),
    "villa-mella": clientes.filter((c) => c.sucursal === "villa-mella"),
  };
  const facturas = [];
  const lineas = [];
  const inicio = sumarDias(hoyISO, -181);
  const horaActual = new Date().getHours() + new Date().getMinutes() / 60;
  const fraccionHoy = Math.min(1, Math.max(0.15, (horaActual - 7.5) / 10.5));
  let numero = 4800;

  for (let d = 0; d <= 181; d++) {
    const fecha = sumarDias(inicio, d);
    const [a, m, dd] = fecha.split("-").map(Number);
    const diaSemana = new Date(a, m - 1, dd).getDay();
    const diasAtras = 181 - d;
    for (const suc of SUCURSALES) {
      let base = suc.id === "herrera" ? 9.5 : 7;
      if (diaSemana === 0) base = suc.id === "herrera" ? 3 : 0;
      if (diaSemana === 6) base *= 1.3;
      if (suc.id === "villa-mella" && diasAtras < 28) base *= 0.76; // situación sembrada 1
      base *= 1 + (d / 181) * 0.08; // leve crecimiento en el semestre
      if (diasAtras === 0) base *= fraccionHoy;
      const cantidad = Math.max(0, Math.round(base + (azar() - 0.5) * base * 0.5));
      const vendedores = VENDEDORES.filter((v) => v.sucursal === suc.id);
      for (let k = 0; k < cantidad; k++) {
        numero++;
        const registrado = azar() < 0.45;
        let cliente = registrado ? elegir(clientesPorSucursal[suc.id]) : null;
        if (registrado && azar() < 0.035 && suc.id === "herrera") cliente = ozama;
        const esEmpresa = cliente && ["constructora", "contratista", "revendedor"].includes(cliente.tipo);
        const nLineas = esEmpresa ? entre(2, 6) : entre(1, 4);
        const id = `F-${numero}`;
        let total = 0, costoTotal = 0;
        const vistos = new Set();
        for (let l = 0; l < nLineas; l++) {
          const p = elegirProducto();
          if (vistos.has(p.codigo)) continue;
          vistos.add(p.codigo);
          const grande = p.precio < 200 ? 10 : p.precio < 1000 ? 4 : 1;
          let cant = esEmpresa ? entre(1, 6) * grande * (p.precio < 800 ? 3 : 1) : entre(1, 3) * Math.max(1, grande / 2);
          cant = Math.max(1, Math.round(cant));
          const descuento = esEmpresa ? [0, 0, 0.03, 0.05, 0.08][entre(0, 4)] : 0;
          const precio = redondear(p.precio * (1 - descuento), 2);
          const costoUnit = p.categoria === "Pinturas" && fecha < diaAumentoPintura ? p.costoAnterior : p.costo;
          const importe = redondear(precio * cant, 2);
          total += importe; costoTotal += costoUnit * cant;
          lineas.push({ factura: id, fecha, sucursal: suc.id, codigo: p.codigo, categoria: p.categoria, cantidad: cant, precio, importe, costo: redondear(costoUnit * cant, 2) });
        }
        if (total === 0) { numero--; continue; }
        const aCredito = cliente && cliente.credito && azar() < 0.7;
        facturas.push({
          id, fecha, sucursal: suc.id, vendedor: elegir(vendedores).id,
          cliente: cliente ? cliente.id : null, total: redondear(total, 2), costo: redondear(costoTotal, 2),
          condicion: aCredito ? "crédito 30 días" : elegir(["efectivo", "efectivo", "tarjeta", "transferencia"]),
          vence: aCredito ? sumarDias(fecha, 30) : fecha, pagado: aCredito ? 0 : redondear(total, 2),
        });
      }
    }
  }

  // Cobros: la mayoría paga entre 15 y 45 días después; Ozama (sembrada 3) dejó de pagar hace 105 días.
  for (const f of facturas) {
    if (f.condicion !== "crédito 30 días") continue;
    const edad = diasEntre(f.fecha, hoyISO);
    if (f.cliente === ozama.id) { if (edad > 105) f.pagado = f.total; continue; }
    const lento = azar() < 0.12;
    const diasPago = lento ? entre(40, 80) : entre(12, 42);
    if (edad > diasPago) f.pagado = f.total;
    else if (edad > 20 && azar() < 0.25) f.pagado = redondear(f.total * 0.5, 2);
  }

  // Límites de crédito acordes con lo que cada cliente suele deber; solo Ozama queda por encima.
  const saldos = {};
  for (const f of facturas) if (f.cliente && f.total > f.pagado) saldos[f.cliente] = (saldos[f.cliente] ?? 0) + f.total - f.pagado;
  for (const c of clientes) {
    if (c === ozama || !c.credito) continue;
    const saldo = saldos[c.id] ?? 0;
    if (saldo * 1.25 > c.limiteCredito) c.limiteCredito = Math.ceil((saldo * 1.4) / 25000) * 25000;
  }

  // Inventario por sucursal
  for (const p of productos) {
    for (const s of SUCURSALES) {
      const factor = s.id === "herrera" ? 1 : 0.7;
      p.stock[s.id] = Math.round(p.minimo * factor * (1.1 + azar() * 2.4));
    }
  }
  // Situaciones sembradas 2 y 5, y algunos productos bajo mínimo
  porCodigo["CEM-001"].stock.herrera = 12;
  porCodigo["PLO-017"].stock = { herrera: 9, "villa-mella": 5 };
  porCodigo["ACE-002"].stock["villa-mella"] = 61;
  porCodigo["ELE-013"].stock.herrera = 112;
  porCodigo["PIN-001"].stock["villa-mella"] = 19;
  porCodigo["CEM-013"].stock.herrera = 7;

  // Pedidos de los últimos días (los del asistente de WhatsApp se agregan desde estado.js)
  const estados = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];
  const canales = ["Mostrador", "Teléfono", "Teléfono", "WhatsApp", "Correo"];
  const pedidos = [];
  for (let i = 0; i < 16; i++) {
    const diasAtras = i < 7 ? 0 : i < 12 ? 1 : 2;
    const c = elegir(clientes.slice(0, 60));
    const items = [];
    const n = entre(1, 4);
    for (let j = 0; j < n; j++) {
      const p = elegirProducto();
      if (items.some((x) => x.codigo === p.codigo)) continue;
      items.push({ codigo: p.codigo, nombre: p.nombre, cantidad: p.precio < 800 ? entre(5, 40) : entre(1, 6), precio: p.precio });
    }
    const subtotal = items.reduce((a, x) => a + x.cantidad * x.precio, 0);
    pedidos.push({
      id: `P-${1300 + i}`, fecha: sumarDias(hoyISO, -diasAtras), hora: `${entre(8, 16)}:${String(entre(0, 59)).padStart(2, "0")}`,
      cliente: c.nombre, telefono: c.telefono, canal: elegir(canales), sucursal: c.sucursal,
      estado: diasAtras === 0 ? estados[entre(0, 3)] : diasAtras === 1 ? estados[entre(2, 4)] : "entregado",
      entrega: azar() < 0.6 ? "envío" : "retiro en tienda", items,
      subtotal: redondear(subtotal, 2), total: redondear(subtotal * (1 + EMPRESA.itbis), 2), origen: "sistema",
    });
  }

  cache = { hoy: hoyISO, productos, porCodigo, clientes, facturas, lineas, pedidos, vendedores: VENDEDORES, sucursales: SUCURSALES };
  return cache;
}
