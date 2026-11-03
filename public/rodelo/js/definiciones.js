// Herramientas del Rodelo Copilot, en un solo lugar: nombre, etiqueta que ve la persona,
// descripción y parámetros. La función del servidor (netlify/functions/ia/rodelo.mjs) las
// envía a Claude sin la etiqueta; el navegador las ejecuta en herramientas.js.
// Como en el panel real, el copiloto no escribe consultas: elige entre bloques fijos y
// probados, y cada cifra sale de ellos.

// Bloque -> lo que se muestra mientras el copiloto lo consulta.
export const BLOQUES = {
  utilidad_mensual: "Ingresos, costos y utilidad por mes",
  ventas_mes_equivalente: "Este mes contra el mismo tramo del mes anterior",
  ventas_diarias: "Ventas y utilidad por día",
  clientes_caida: "Tendencia de compras por cliente",
  vendedores_desempeno: "Cumplimiento de meta por vendedor",
  ventas_por_vendedor: "Ventas por vendedor (30 días)",
  ordenes_atrasadas: "Órdenes atrasadas",
  errores_despacho: "Errores de despacho",
  cobros_resumen: "Resumen de cuentas por cobrar",
  cobros_por_cliente: "Cuentas por cobrar por cliente",
  inventario_resumen: "Resumen del inventario",
  inventario_90: "Inventario con más de 90 días",
  inventario_por_producto: "Inventario por producto",
  produccion_semana: "Producción de la semana",
  produccion_30_dias: "Producción contra plan (30 días)",
  alertas_activas: "Alertas activas",
};

export const DEFINICIONES = {
  "rodelo-copiloto": [
    {
      name: "consultar_bloque",
      etiqueta: "Consultando los datos del negocio",
      description: `Devuelve un bloque de datos del negocio (ficticios para la demo), ya calculado. Montos en RD$. Puede llamar varias veces en paralelo con bloques distintos.
Bloques:
- utilidad_mensual: por mes (hasta 13), ingresos, costos, utilidad y facturas; "parcial": true marca el mes en curso.
- ventas_mes_equivalente: del día 1 a hoy de este mes contra el mismo tramo del mes anterior (ingresos, costos, utilidad, facturas y variación %). Úselo para comparar este mes con el anterior.
- ventas_diarias: ventas, utilidad y facturas por día de los últimos 30 días.
- clientes_caida: un renglón por cliente con promedio mensual base (3 primeros meses del semestre), promedio de los 2 últimos meses completos y variacion_pct. Caída SIGNIFICATIVA: variacion_pct <= -50.
- vendedores_desempeno: venta promedio mensual de los 3 últimos meses completos contra la meta, con cumplimiento_pct.
- ventas_por_vendedor: ventas, facturas y clientes de los últimos 30 días por vendedor.
- ordenes_atrasadas: pedidos en estado atrasado con cliente, vendedor, fecha, días de atraso y monto.
- errores_despacho: errores detectados antes de facturar (tipo, dónde se detectó, cliente, ruta, vendedor).
- cobros_resumen: facturas abiertas, monto pendiente, facturas vencidas, monto vencido y clientes con vencido.
- cobros_por_cliente: por cliente, pendiente, vencido, facturas vencidas y días del mayor atraso.
- inventario_resumen: productos, unidades, valor del inventario y lo que tiene más de 90 días.
- inventario_90: productos con más de 90 días de antigüedad y su costo inmovilizado.
- inventario_por_producto: existencia, días de antigüedad y costo por producto.
- produccion_semana: plan contra producido por día de los últimos 7 días, con cumplimiento_pct.
- produccion_30_dias: lo mismo para los últimos 30 días (umbral de alerta: menos de 70 %).
- alertas_activas: incongruencias detectadas por el motor de alertas que no se han resuelto.`,
      input_schema: {
        type: "object",
        properties: {
          bloque: { type: "string", enum: Object.keys(BLOQUES) },
          cliente: { type: "string", description: "Opcional: nombre o código (CL-0005) para filtrar clientes_caida o cobros_por_cliente." },
          vendedor: { type: "string", description: "Opcional: nombre del vendedor para filtrar vendedores_desempeno o ventas_por_vendedor." },
          producto: { type: "string", description: "Opcional: nombre, presentación o código para filtrar inventario_por_producto." },
        },
        required: ["bloque"],
      },
    },
  ],
};

export const ETIQUETAS = Object.fromEntries(Object.values(DEFINICIONES).flat().map((d) => [d.name, d.etiqueta]));
