// Herramientas de los dos agentes de Minis, en un solo lugar: nombre, etiqueta que ve la
// persona, descripción y parámetros. El servidor (netlify/functions/ia/minis.mjs) las envía a
// Claude sin la etiqueta; el navegador las ejecuta en herramientas.js (una función por nombre).

const CHOFER = [
  {
    name: "buscar_tienda",
    etiqueta: "Buscando la tienda",
    description: "Busca una tienda por su nombre aproximado (por ejemplo 'el Caribe de la Núñez' o 'Del Sol de Moca'). Devuelve las tiendas que coinciden con su id, nombre, ruta y si ya se visitó hoy. Si devuelve varias, pregunta al chofer cuál es. Si no devuelve ninguna, pide otro nombre: nunca inventes una tienda.",
    input_schema: {
      type: "object",
      properties: { texto: { type: "string", description: "Lo que dijo el chofer sobre la tienda." } },
      required: ["texto"],
    },
  },
  {
    name: "ver_productos_de_conteo",
    etiqueta: "Revisando la lista de conteo",
    description: "Lista de productos que el chofer debe contar en una tienda (código, nombre y nivel par de esa tienda). Son exactamente los que hay que contar, ni uno menos. Úsala al identificar la tienda, antes de pedir el conteo.",
    input_schema: {
      type: "object",
      properties: { tienda_id: { type: "integer" } },
      required: ["tienda_id"],
    },
  },
  {
    name: "registrar_visita",
    etiqueta: "Cerrando la visita",
    description: "Guarda la visita a la tienda con lo que QUEDABA de cada producto antes de reponer. Solo úsala cuando tengas el conteo de TODOS los productos de la lista y el chofer ya confirmó el resumen. Si falta alguno, devuelve un error con los que faltan. Devuelve las alertas para la oficina (productos que quedaron por debajo de la mitad del par).",
    input_schema: {
      type: "object",
      properties: {
        tienda_id: { type: "integer" },
        conteos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              codigo: { type: "string", description: "Código del producto (P01…)." },
              quedaban: { type: "integer", description: "Unidades que quedaban en el exhibidor antes de reponer. 'No queda' o 'se acabó' = 0." },
              dejados: { type: ["integer", "null"], description: "Unidades que dejó el chofer, solo si lo dijo; si no, null." },
            },
            required: ["codigo", "quedaban"],
          },
        },
        notas: { type: "string", description: "Novedades de la tienda que mencionó el chofer (nevera dañada, producto vencido retirado...)." },
      },
      required: ["tienda_id", "conteos"],
    },
  },
];

const REPORTE = [
  {
    name: "proponer_ventas",
    etiqueta: "Leyendo el reporte",
    description: "Entrega la transcripción del reporte de ventas de la cadena. Una línea por tienda y producto, tal como aparece en el documento. No sumes, no corrijas y no conviertas nada: el panel busca cada tienda y producto y una persona revisa antes de guardar.",
    input_schema: {
      type: "object",
      properties: {
        cadena: { type: ["string", "null"], description: "Nombre de la cadena que envía el reporte (el membrete)." },
        fecha_reporte: { type: ["string", "null"], description: "Fecha de las ventas tal como está impresa (no la fecha de impresión)." },
        lineas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tienda: { type: "string", description: "La tienda tal como aparece (código y nombre)." },
              producto: { type: "string", description: "La descripción del producto tal como aparece." },
              codigo_cadena: { type: ["string", "null"], description: "El código del artículo de la cadena, si aparece." },
              unidades: { type: "integer", description: "Unidades vendidas." },
            },
            required: ["tienda", "producto", "unidades"],
          },
        },
        dudas: { type: "array", items: { type: "string" }, description: "Lo que no se lee bien o no queda claro, en frases cortas." },
      },
      required: ["lineas", "dudas"],
    },
  },
];

export const DEFINICIONES = { "minis-chofer": CHOFER, "minis-reporte": REPORTE };
export const ETIQUETAS = Object.fromEntries([...CHOFER, ...REPORTE].map((d) => [d.name, d.etiqueta]));
