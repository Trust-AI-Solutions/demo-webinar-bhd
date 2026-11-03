// Herramientas que la IA puede usar, en un solo lugar: nombre, etiqueta que ve la persona,
// descripción y parámetros. La función de Netlify (netlify/functions/ia/config.mjs) las
// envía a Claude sin la etiqueta; el navegador las ejecuta en herramientas.js (una función
// por nombre) y muestra la etiqueta. Para agregar una herramienta: definirla aquí y
// escribir su función en herramientas.js; la prueba de la función revisa que coincidan.

const fecha = { type: "string", description: "Fecha en formato AAAA-MM-DD." };

const HERRAMIENTAS_PANEL = [
  {
    name: "resumen_ventas",
    etiqueta: "Revisando las ventas",
    description: "Ventas (sin ITBIS), costo, margen bruto, número de facturas y ticket promedio de un periodo, con filtros opcionales y agrupación. Los datos cubren los últimos 6 meses hasta hoy. Para comparar periodos, llama una vez por periodo.",
    input_schema: {
      type: "object",
      properties: {
        desde: { ...fecha, description: "Inicio del periodo (AAAA-MM-DD). Por defecto, 30 días antes de 'hasta'." },
        hasta: { ...fecha, description: "Fin del periodo, inclusive (AAAA-MM-DD). Por defecto, hoy." },
        sucursal: { type: "string", enum: ["Gazcue", "Los Prados"] },
        categoria: { type: "string", description: "Categoría del menú: Pan del día, Bizcochos y tortas, Repostería y postres, Galletas y empacados, Salados, Café y bebidas." },
        vendedor: { type: "string", description: "Nombre o parte del nombre del vendedor." },
        cliente: { type: "string", description: "Nombre o parte del nombre del cliente." },
        agrupar_por: { type: "string", enum: ["dia", "semana", "mes", "categoria", "sucursal", "vendedor", "producto", "cliente"] },
        limite: { type: "integer", description: "Máximo de grupos a devolver cuando se agrupa por algo que no es tiempo. Por defecto 15." },
      },
    },
  },
  {
    name: "consultar_menu",
    etiqueta: "Revisando el menú",
    description: "Productos del menú con precio, costo, margen, si son por encargo y unidades vendidas en 30 días. Sirve para buscar un producto o ver lo que no se vende (sin_ventas_en_dias).",
    input_schema: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Palabras del nombre del producto." },
        categoria: { type: "string" },
        sin_ventas_en_dias: { type: "integer", description: "Solo productos que no se vendieron en esta cantidad de días." },
        orden: { type: "string", enum: ["mas_vendidos"] },
        limite: { type: "integer" },
      },
    },
  },
  {
    name: "consultar_insumos",
    etiqueta: "Revisando los insumos",
    description: "Insumos de producción (harinas, lácteos y huevos, azúcares y rellenos, carnes y quesos, empaques) con existencia, uso diario y días que alcanzan en cada sucursal, costo y proveedor. El mínimo es lo que se usa en 3 días. Sirve para saber qué comprar y qué se acaba.",
    input_schema: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Palabras del nombre del insumo, por ejemplo 'mantequilla'." },
        categoria: { type: "string", enum: ["Harinas y granos", "Lácteos y huevos", "Azúcares y rellenos", "Carnes y quesos", "Empaques"] },
        sucursal: { type: "string", enum: ["Gazcue", "Los Prados"] },
        solo_bajo_minimo: { type: "boolean" },
        limite: { type: "integer" },
      },
    },
  },
  {
    name: "cuentas_por_cobrar",
    etiqueta: "Revisando las cuentas por cobrar",
    description: "Saldos pendientes de clientes con crédito: total por cobrar, vencido, tramos por días de atraso y detalle por cliente (límite de crédito, si lo pasó, factura más atrasada).",
    input_schema: {
      type: "object",
      properties: {
        cliente: { type: "string" },
        vencidas_mas_de_dias: { type: "integer", description: "Solo clientes con alguna factura vencida hace más de estos días." },
        limite: { type: "integer" },
      },
    },
  },
  {
    name: "buscar_clientes",
    etiqueta: "Buscando clientes",
    description: "Datos de clientes registrados: tipo, teléfono, sucursal, crédito, compras de los últimos 90 días y última compra.",
    input_schema: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Nombre, parte del nombre o teléfono." },
        tipo: { type: "string", enum: ["hotel", "cafeteria", "colmado", "restaurante", "oficina", "institucion", "catering", "particular"] },
        limite: { type: "integer" },
      },
    },
  },
  {
    name: "ver_pedidos",
    etiqueta: "Revisando los pedidos",
    description: "Pedidos recientes con su estado (nuevo, en preparación, listo para entrega, en ruta, entregado), canal (Mostrador, Teléfono, WhatsApp, Correo), si es un encargo y para cuándo. Incluye los que llegan por el asistente de WhatsApp.",
    input_schema: {
      type: "object",
      properties: {
        estado: { type: "string" },
        canal: { type: "string" },
        solo_encargos: { type: "boolean", description: "Solo encargos (bizcochos, tortas, bandejas) que aún no se entregan." },
        limite: { type: "integer" },
      },
    },
  },
  {
    name: "ver_consignacion",
    etiqueta: "Revisando la consignación",
    description: "Productos en consignación en Minimarkets La Canasta (ficticio): por tienda y producto, lo entregado en los últimos 7 días, lo vendido según el último reporte importado de la cadena, lo que queda en tienda, el importe a liquidar y lo que no cuadra.",
    input_schema: { type: "object", properties: { tienda: { type: "string", description: "Parte del nombre de la tienda, por ejemplo 'Naco'." } } },
  },
  {
    name: "ver_alertas",
    etiqueta: "Revisando las alertas",
    description: "Alertas activas del negocio: insumos que se acaban, clientes atrasados o sobre su límite, caídas de ventas por sucursal, márgenes que bajan, productos del menú que no se venden y clientes de WhatsApp que esperan a una persona.",
    input_schema: { type: "object", properties: {} },
  },
];

const items = {
  type: "array",
  description: "Productos con el código del menú (obtenido con buscar_productos) y la cantidad.",
  items: {
    type: "object",
    properties: { codigo: { type: "string" }, cantidad: { type: "integer", minimum: 1 } },
    required: ["codigo", "cantidad"],
  },
};

const HERRAMIENTAS_WHATSAPP = [
  {
    name: "buscar_productos",
    etiqueta: "Buscando en el menú",
    description: "Busca en el menú por palabras del nombre o por categoría. Devuelve código, nombre, unidad, precio sin ITBIS y si es por encargo (con cuántas horas de anticipación).",
    input_schema: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Palabras clave, por ejemplo 'bizcocho 3 libras', 'pan de agua', 'picaderas'." },
        categoria: { type: "string" },
        limite: { type: "integer" },
      },
    },
  },
  {
    name: "crear_cotizacion",
    etiqueta: "Preparando la cotización",
    description: "Prepara una cotización con subtotal, ITBIS, costo de envío y total. No registra un pedido.",
    input_schema: {
      type: "object",
      properties: {
        items,
        nombre_cliente: { type: "string" },
        tipo_entrega: { type: "string", enum: ["envío", "retiro en tienda"] },
      },
      required: ["items"],
    },
  },
  {
    name: "registrar_pedido",
    etiqueta: "Registrando el pedido",
    description: "Registra un pedido confirmado por el cliente. Aparece de inmediato en el panel del negocio. Úsalo solo después de que el cliente confirme el resumen.",
    input_schema: {
      type: "object",
      properties: {
        items,
        nombre_cliente: { type: "string" },
        telefono: { type: "string" },
        tipo_entrega: { type: "string", enum: ["envío", "retiro en tienda"] },
        direccion: { type: "string", description: "Obligatoria si es envío." },
        sucursal: { type: "string", enum: ["Gazcue", "Los Prados"], description: "Sucursal de retiro o la más cercana a la dirección." },
        forma_pago: { type: "string", enum: ["efectivo", "transferencia", "tarjeta", "crédito (por aprobar)"] },
        para_cuando: { type: "string", description: "Fecha y hora de entrega o retiro, por ejemplo 'sábado 15 de noviembre, 3:00 p. m.'. Obligatoria si hay productos por encargo." },
        nota: { type: "string", description: "Mensaje escrito en el bizcocho u otras indicaciones." },
      },
      required: ["items", "nombre_cliente", "telefono", "tipo_entrega", "forma_pago"],
    },
  },
  {
    name: "pasar_a_persona",
    etiqueta: "Avisando al equipo",
    description: "Avisa al equipo que este cliente necesita a una persona (descuentos, crédito, diseños especiales, alergias, reclamos o si lo pide). El aviso aparece en el panel.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Resumen breve de lo que necesita el cliente." },
        nombre_cliente: { type: "string" },
      },
      required: ["motivo"],
    },
  },
];

// ---------- documento (PDF o foto que llega al panel) ----------

export const ESTADOS_PEDIDO = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];

const HERRAMIENTAS_DOCUMENTO = [
  {
    name: "proponer_resultado",
    etiqueta: "Leyendo el documento",
    description: "Entrega lo que encontraste en el documento. Nada se aplica hasta que una persona lo revise y lo apruebe en el panel.",
    input_schema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["orden_de_compra", "reporte_de_entregas", "reporte_de_ventas", "otro"], description: "orden_de_compra: un cliente pide productos. reporte_de_entregas: informa cómo quedaron pedidos que ya existen. reporte_de_ventas: una cadena en consignación informa lo que vendió por tienda y producto. otro: nada de lo anterior." },
        resumen: { type: "string", description: "Una frase sobre qué es el documento y de quién viene." },
        pedido_nuevo: {
          type: "object",
          description: "Solo si tipo es orden_de_compra.",
          properties: {
            cliente: { type: "string", description: "Nombre del cliente tal como está en la lista de clientes si coincide; si no, como aparece en el documento." },
            telefono: { type: "string" },
            entrega: { type: "string", enum: ["envío", "retiro en tienda"] },
            direccion: { type: "string" },
            sucursal: { type: "string", enum: ["Gazcue", "Los Prados"] },
            forma_pago: { type: "string", enum: ["efectivo", "transferencia", "tarjeta", "crédito (por aprobar)", "crédito a 15 días"] },
            referencia: { type: "string", description: "Número de orden de compra del cliente, si lo trae." },
            para_cuando: { type: "string", description: "Fecha y hora de entrega o retiro, si el documento la trae." },
            nota: { type: "string", description: "Indicaciones del documento (días y horario de entrega, persona que recibe, etc.)." },
            lineas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  texto_original: { type: "string", description: "La línea tal como está escrita en el documento." },
                  codigo: { type: ["string", "null"], description: "Código del menú que corresponde, o null si ningún producto del menú coincide con seguridad." },
                  cantidad: { type: "integer", minimum: 1 },
                },
                required: ["texto_original", "codigo", "cantidad"],
              },
            },
          },
          required: ["cliente", "lineas"],
        },
        actualizaciones: {
          type: "array",
          description: "Solo si tipo es reporte_de_entregas: una por pedido mencionado.",
          items: {
            type: "object",
            properties: {
              pedido: { type: "string", description: "Número de pedido tal como aparece (por ejemplo P-1302)." },
              estado: { type: ["string", "null"], enum: [...ESTADOS_PEDIDO, null], description: "Nuevo estado, o null si el pedido no cambia de estado." },
              nota: { type: "string", description: "Novedad breve para el equipo (cliente ausente, entrega parcial, quién recibió…)." },
            },
            required: ["pedido", "estado"],
          },
        },
        periodo: { type: "string", description: "Solo si tipo es reporte_de_ventas: el periodo que cubre el reporte, tal como aparece." },
        ventas_reportadas: {
          type: "array",
          description: "Solo si tipo es reporte_de_ventas: una por línea del reporte.",
          items: {
            type: "object",
            properties: {
              tienda: { type: "string", description: "Nombre de la tienda en el panel (por ejemplo 'La Canasta Naco')." },
              texto_original: { type: "string", description: "El producto tal como está escrito en el reporte." },
              codigo: { type: ["string", "null"], description: "Código del menú, o null si no es un producto en consignación." },
              unidades: { type: "integer", minimum: 0 },
            },
            required: ["tienda", "texto_original", "codigo", "unidades"],
          },
        },
        dudas: { type: "array", items: { type: "string" }, description: "Lo que una persona debe revisar: productos que no están en el menú, pedidos que no existen, letra ilegible, datos que faltan." },
      },
      required: ["tipo", "resumen", "dudas"],
    },
  },
];

export const DEFINICIONES = { panel: HERRAMIENTAS_PANEL, whatsapp: HERRAMIENTAS_WHATSAPP, documento: HERRAMIENTAS_DOCUMENTO };

// Texto que ve la persona mientras la IA usa cada herramienta ("Revisando las ventas…").
export const ETIQUETAS = Object.fromEntries(Object.values(DEFINICIONES).flat().map((h) => [h.name, h.etiqueta]));
