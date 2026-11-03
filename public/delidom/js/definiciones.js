// Delidom · herramientas de la IA, en un solo lugar (nombre, etiqueta que ve la persona,
// descripción y parámetros). La función del servidor (netlify/functions/ia/delidom.mjs)
// las envía a Claude sin la etiqueta.
// El lector solo TRANSCRIBE: no elige productos del catálogo ni calcula nada. El calce
// lo hace el navegador (mapeo.js), igual que en la solución real.

const opcional = (tipo, description) => ({ anyOf: [{ type: tipo }, { type: "null" }], description });

const UNIDAD = {
  anyOf: [{ type: "string", enum: ["UN", "FDO", "GL", "LB", "CAJA"] }, { type: "null" }],
  description: "Unidad del documento, normalizada: FDO (fardo o funda), GL (galón, galones), LB (libra, libras), CAJA (cajas), UN (und, unidad, unidades). Si no dice unidad, null.",
};

const ITEM = {
  type: "object",
  properties: {
    descripcion: { type: "string", description: "Descripción del producto tal como aparece en el documento o el mensaje, con su tamaño." },
    codigo_externo: opcional("string", "Código interno del cliente para el producto, si aparece."),
    ean: opcional("string", "Código de barras de 13 dígitos, si aparece."),
    cantidad: { type: "number", description: "Cantidad pedida, sin multiplicar por el empaque." },
    unidad: UNIDAD,
    unidades_por_bulto: opcional("integer", "De '/ 20 UN' o '- 20 UND': cuántas unidades trae cada fardo. Si no lo dice, null."),
  },
  required: ["descripcion", "codigo_externo", "ean", "cantidad", "unidad", "unidades_por_bulto"],
};

export const DEFINICIONES = {
  "delidom-lector": [
    {
      name: "entregar_pedido",
      etiqueta: "Leyendo el pedido",
      description: "Entrega lo que dice el pedido, transcrito tal cual. Se llama una sola vez. Lo que no aparece va en null.",
      input_schema: {
        type: "object",
        properties: {
          cliente: opcional("string", "Nombre del cliente que hace el pedido (quien compra; nunca Delidom, que es el proveedor)."),
          numero_externo: opcional("string", "Número de pedido u orden de compra del cliente."),
          fecha_entrega: opcional("string", "Fecha de entrega pedida: AAAA-MM-DD cuando es segura; si es ambigua (día y mes ambos 12 o menos), tal como aparece, por ejemplo '12/11/2026'."),
          fecha_dicha: opcional("string", "Si la entrega se dijo con palabras ('mañana', 'el jueves', 'para el sábado'), esas palabras tal cual."),
          contacto: opcional("string", "Persona de contacto."),
          entregar_en: opcional("string", "Lugar de entrega, si el documento lo indica."),
          condicion_pago: opcional("string", "Condición de pago, por ejemplo 'TRANSF. 30 DIAS S/DESC.'."),
          nota: opcional("string", "Instrucciones para despacho que aparezcan (horario, andén, quién recibe)."),
          items: { type: "array", items: ITEM, description: "Todas las líneas del pedido, una por renglón, en el orden del documento." },
        },
        required: ["cliente", "numero_externo", "fecha_entrega", "fecha_dicha", "contacto", "entregar_en", "condicion_pago", "nota", "items"],
      },
    },
  ],
};

export const ETIQUETAS = Object.fromEntries(Object.values(DEFINICIONES).flat().map((d) => [d.name, d.etiqueta]));
