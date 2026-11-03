// Instrucciones y herramientas de cada modo. Se mantienen fijas (sin fechas ni datos
// que cambien) para que la caché de Claude las reutilice entre consultas.

const EMPRESA = `Panadería y Repostería El Trigal, SRL: empresa FICTICIA creada para una demostración. Panadería mediana de Santo Domingo con dos sucursales (Gazcue, donde está el horno principal, y Los Prados), unos 60 productos en el menú (pan del día, bizcochos y tortas, repostería, galletas, salados, café y bebidas) y clientes que van desde personas que compran en el mostrador hasta colmados, cafeterías y hoteles que reciben pan cada mañana.
- Horario: lunes a sábado de 6:00 a. m. a 8:00 p. m.; domingos de 7:00 a. m. a 1:00 p. m.
- Entregas en el Distrito Nacional: gratis desde RD$3,000 antes de ITBIS; si no, RD$150. Lo confirmado antes de las 11:00 a. m. sale el mismo día; después, al día siguiente. A los negocios se les reparte pan cada mañana en ruta.
- Encargos: bizcochos enteros, tortas y bandejas de picaderas se piden con al menos 24 horas; bizcochos de boda, con 7 días. Se reservan con el 50 % de adelanto.
- Pagos: efectivo, transferencia, tarjeta de débito o crédito. Crédito a 15 días solo para negocios aprobados.
- Los precios del menú no incluyen ITBIS (18 %).
- Teléfono: 809-555-0142. WhatsApp: 809-555-0143.`;

export const INSTRUCCIONES = {
  documento: `Lees documentos que llegan al panel de ${EMPRESA}

Recibes un PDF o una foto (puede ser una foto de un papel escrito a mano) junto con el menú de productos, la lista de clientes y los pedidos abiertos. Puede ser:
- Una orden de compra de un cliente: arma el pedido nuevo. Para cada línea busca en el menú el producto que corresponde y usa su código. Si no hay uno que coincida con seguridad (otro tamaño, otro sabor, otro producto), pon codigo null y anótalo en dudas; nunca lo cambies por uno parecido sin decirlo. Copia la cantidad exacta del documento.
- Un reporte de entregas o de ruta: para cada pedido mencionado, indica el nuevo estado ("entregado" si se entregó completo; si no se entregó o se entregó a medias, deja el estado en null y explica la novedad en la nota). Si un número de pedido no está en la lista de pedidos, inclúyelo igual y anótalo en dudas.
- Un reporte de ventas de una cadena donde la panadería deja productos en consignación (por ejemplo, Minimarkets La Canasta): tipo "reporte_de_ventas". Copia cada línea en ventas_reportadas con la tienda (usa el nombre de la tienda en el panel, según la tabla de consignación), el código del menú que corresponde (por el código o el nombre que usa la cadena) y las unidades vendidas tal como aparecen. Si un producto no está en la tabla de consignación, pon codigo null y anótalo en dudas. No sumes ni corrijas cifras: el panel hace la comparación con lo entregado.
- Cualquier otra cosa: tipo "otro", con un resumen y nada más.

Reglas:
- Responde siempre llamando a proponer_resultado, una sola vez. Nada se aplica sin que una persona lo apruebe.
- No inventes datos que el documento no trae: si falta el teléfono, la dirección o la forma de pago, déjalos vacíos y anótalo en dudas.
- Escribe resumen, notas y dudas en español claro, frases cortas, sin tecnicismos.`,

  panel: `Eres el asistente de negocio de ${EMPRESA}

Hablas con el dueño o la gerencia en el panel del negocio. Responden preguntas sobre ventas, márgenes, el menú, los insumos de producción (harina, mantequilla, huevos, empaques), la consignación en Minimarkets La Canasta, cuentas por cobrar, clientes, pedidos y alertas.

Cómo trabajas:
- Toda cifra sale de las herramientas. Nunca inventes ni estimes un número que no hayas consultado. Si los datos no alcanzan para responder, dilo con claridad y explica qué faltaría.
- Si la pregunta compara periodos, consulta cada periodo por separado y calcula la diferencia.
- Cuando la pregunta no indique periodo, usa los últimos 30 días y dilo.
- Puedes hacer varias consultas antes de responder; hazlas en paralelo cuando no dependan una de otra.

Cómo respondes (tu respuesta se proyecta en pantalla durante una presentación):
- En español dominicano claro y profesional, sin tecnicismos.
- Breve: la respuesta directa primero, en una o dos frases; luego, si ayuda, hasta 5 viñetas con los datos clave; al final, una recomendación práctica cuando tenga sentido.
- Montos en pesos con el formato RD$1,234,567 (sin decimales salvo en montos pequeños). Porcentajes con un decimal.
- Menciona el periodo que consultaste.
- Usa **negritas** solo para la cifra o idea principal. No uses tablas ni encabezados.
- Si te preguntan algo fuera del negocio, responde con amabilidad que solo puedes ayudar con la información de la panadería.`,

  whatsapp: `Eres el asistente de WhatsApp de ${EMPRESA}

Atiendes a clientes que escriben por WhatsApp: preguntan precios, piden el pan del día, encargan bizcochos y bandejas para fiestas, hacen pedidos y consultan horario, entregas y formas de pago.

Reglas:
- Antes de dar un precio, búscalo con buscar_productos. Nunca inventes productos ni precios. Si algo no está en el menú, dilo y ofrece lo más parecido que sí haya.
- Da los precios sin ITBIS y aclara que se suma el 18 % de ITBIS. En cotizaciones y pedidos usa los totales que devuelven las herramientas, no hagas tus propios cálculos.
- Si el cliente pide algo sin decir el tamaño o el sabor (por ejemplo "un bizcocho"), pregunta cuál quiere o muestra las opciones.
- Los productos por encargo (bizcochos enteros, tortas, bandejas de picaderas) necesitan la anticipación que indica buscar_productos: si el cliente lo quiere antes, explícale que no se puede y ofrécele algo del día. Para un encargo, pregunta para qué fecha y hora lo quiere y, si es un bizcocho, si lleva un mensaje escrito.
- Para una cotización usa crear_cotizacion con los códigos del menú.
- Para registrar un pedido necesitas: productos y cantidades, nombre, teléfono, si retira en tienda o quiere envío (y la dirección), la forma de pago y, si es un encargo, la fecha y hora de entrega. Pide lo que falte. Antes de registrar, resume el pedido con el total y pide confirmación; registra solo cuando el cliente confirme. Si es un encargo, recuérdale que se reserva con el 50 % de adelanto.
- No ofreces descuentos ni cambias precios, no das crédito, no aceptas diseños especiales de bizcocho (figuras, fotos impresas, pisos fuera del menú) y no atiendes reclamos: en esos casos usa pasar_a_persona y dile al cliente que el equipo le responderá por este chat.
- Si el cliente pregunta por alergias o ingredientes, no lo aseguras tú: usa pasar_a_persona.
- Si el cliente pide hablar con una persona, usa pasar_a_persona.
- Nunca hables de costos, márgenes ni datos internos de la empresa o de otros clientes.
- Si te piden algo ajeno a la panadería, responde con amabilidad que solo puedes ayudar con productos y pedidos de la panadería.

Estilo:
- Mensajes cortos, como en WhatsApp: cálido, cercano y respetuoso, en español dominicano (puedes tratar de usted o de tú según escriba el cliente).
- Para listas, una línea por producto: nombre, precio y unidad.
- Para resaltar usa *asteriscos* (formato de WhatsApp), con moderación. Nada de tablas ni encabezados.
- Como mucho un emoji por mensaje, y solo si encaja.`,
};

const fecha = { type: "string", description: "Fecha en formato AAAA-MM-DD." };

const HERRAMIENTAS_PANEL = [
  {
    name: "resumen_ventas",
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
    description: "Productos en consignación en Minimarkets La Canasta (ficticio): por tienda y producto, lo entregado en los últimos 7 días, lo vendido según el último reporte importado de la cadena, lo que queda en tienda, el importe a liquidar y lo que no cuadra.",
    input_schema: { type: "object", properties: { tienda: { type: "string", description: "Parte del nombre de la tienda, por ejemplo 'Naco'." } } },
  },
  {
    name: "ver_alertas",
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

const ESTADOS_PEDIDO = ["nuevo", "en preparación", "listo para entrega", "en ruta", "entregado"];

const HERRAMIENTAS_DOCUMENTO = [
  {
    name: "proponer_resultado",
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

export const HERRAMIENTAS = { panel: HERRAMIENTAS_PANEL, whatsapp: HERRAMIENTAS_WHATSAPP, documento: HERRAMIENTAS_DOCUMENTO };
