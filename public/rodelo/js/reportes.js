// Reportes matinales por gerencia (los que el panel real envía a las 6:00 a. m.), armados
// con plantilla sobre los datos ficticios: titular, indicadores con comparativo, alertas
// del área y recomendación. Así siempre salen igual en vivo.

import * as N from "./negocio.js";
import { sumarDias } from "./datos.js";

export const GERENCIAS = [
  { clave: "general", icono: "🏢", nombre: "Gerencia General", desc: "Ventas, utilidad acumulada del mes, clientes en riesgo y todas las alertas.", areas: null },
  { clave: "comercial", icono: "📈", nombre: "Comercial", desc: "Ventas por vendedor y ruta, clientes con caída, órdenes atrasadas y errores de despacho.", areas: ["comercial"] },
  { clave: "inventario", icono: "📦", nombre: "Almacén / Inventario", desc: "Inventario de más de 90 días, costo inmovilizado y errores de despacho.", areas: ["inventario"] },
  { clave: "produccion", icono: "🏭", nombre: "Producción", desc: "Plan contra real de la semana y desviaciones sobre el umbral.", areas: ["produccion"] },
  { clave: "operaciones", icono: "⚙️", nombre: "Operaciones", desc: "Resumen de indicadores y estado de las alertas de todas las áreas.", areas: null },
];

const rd = (n) => `RD$ ${Math.round(n).toLocaleString("en-US")}`;
const pct = (a, b) => (b ? `${a >= b ? "+" : ""}${(((a - b) / b) * 100).toFixed(1)}%` : "sin comparativo");

function ventasUltimoDia(d) {
  const dias = N.ventasDiarias(d, 40);
  const ultimo = dias[0];
  if (!ultimo) return null;
  const objetivo = sumarDias(ultimo.fecha, -28);
  const previo = dias.slice(1).reduce((m, f) => (!m || Math.abs(new Date(f.fecha) - new Date(objetivo)) < Math.abs(new Date(m.fecha) - new Date(objetivo)) ? f : m), null);
  return { ultimo, previo };
}

function alertasDe(alertas, areas) {
  const activas = alertas.filter((a) => a.estado !== "resuelta" && (!areas || areas.includes(a.area)));
  return activas.length ? activas.map((a) => `- **${a.severidad}** · ${N.infoTipo(a.tipo).titulo}: ${a.descripcion}`).join("\n") : "- Sin alertas activas en el área.";
}

export function generarReporte(clave, d, alertas) {
  const g = GERENCIAS.find((x) => x.clave === clave);
  const v = ventasUltimoDia(d);
  const mes = N.ventasMesEquivalente(d);
  const cobros = N.cobrosResumen(d);
  const caidas = N.clientesCaida(d).filter((c) => c.variacion_pct <= -50);
  const vend = N.vendedoresDesempeno(d);
  const inv = N.inventarioResumen(d), viejos = N.inventario90(d);
  const prod = N.produccionSemana(d), prod30 = N.produccionDias(d, 30);
  const bajos = prod30.filter((x) => x.cumplimiento_pct < 70);
  const activas = alertas.filter((a) => a.estado !== "resuelta");
  const top = activas[0];
  let titular, indicadores, recomendacion;

  if (clave === "general" || clave === "operaciones") {
    titular = top ? `${activas.length} alertas activas; la más urgente: ${N.infoTipo(top.tipo).titulo.toLowerCase()}.` : "Sin alertas activas; la operación está al día.";
    indicadores = [
      v && `Ventas del ${v.ultimo.fecha}: ${rd(v.ultimo.ventas)} (${pct(v.ultimo.ventas, v.previo?.ventas)} vs. ${v.previo?.fecha ?? "—"})`,
      `Ventas del mes al día de hoy: ${rd(mes.mes_actual.ingresos)} (${mes.variacion_ingresos_pct >= 0 ? "+" : ""}${mes.variacion_ingresos_pct}% vs. el mismo tramo del mes anterior)`,
      `Utilidad del mes al día de hoy: ${rd(mes.mes_actual.utilidad)} (${mes.variacion_utilidad_pct >= 0 ? "+" : ""}${mes.variacion_utilidad_pct}%)`,
      `Cuentas por cobrar vencidas: ${rd(cobros.monto_vencido)} en ${cobros.clientes_con_vencido} clientes`,
      clave === "operaciones" ? `Producción de la semana: ${prod.length ? Math.round(prod.reduce((s, x) => s + x.cumplimiento_pct, 0) / prod.length) : "—"}% del plan en promedio` : `Clientes con caída significativa: ${caidas.length}`,
    ].filter(Boolean);
    recomendacion = top ? N.infoTipo(top.tipo).accion : "Revisar las tendencias en Indicadores.";
  } else if (clave === "comercial") {
    const peor = vend[0];
    titular = caidas.length ? `${caidas.length} clientes con caída significativa de compras y ${peor.vendedor} al ${peor.cumplimiento_pct}% de su meta.` : `${peor.vendedor} es el vendedor con menor cumplimiento (${peor.cumplimiento_pct}%).`;
    indicadores = [
      ...caidas.map((c) => `${c.nombre} (${c.codigo}, ${c.ruta}): ${rd(c.prom_mensual_reciente)}/mes vs. ${rd(c.prom_mensual_base)}/mes (${c.variacion_pct}%)`),
      `Menor cumplimiento: ${peor.vendedor} (${peor.ruta}), ${rd(peor.venta_prom_mensual)}/mes vs. meta ${rd(peor.meta_mensual)} (${peor.cumplimiento_pct}%)`,
      `Órdenes atrasadas: ${N.ordenesAtrasadas(d).length}`,
      `Errores de despacho detectados (30 días): ${d.errores_despacho.filter((e) => e.fecha >= sumarDias(d.hoy, -30)).length}`,
    ];
    recomendacion = caidas.length ? `Priorizar esta semana la visita a ${caidas.map((c) => c.nombre).join(" y ")}, y acompañar a ${peor.vendedor} en su ruta.` : `Acompañar a ${peor.vendedor} en su ruta esta semana.`;
  } else if (clave === "inventario") {
    titular = viejos.length ? `${viejos.length} productos llevan más de 90 días en almacén, con ${rd(inv.costo_mas_90_dias)} inmovilizados.` : "Sin inventario de más de 90 días.";
    indicadores = [
      `Valor del inventario: ${rd(inv.valor_inventario)} en ${inv.unidades.toLocaleString("en-US")} unidades`,
      ...viejos.map((x) => `${x.nombre} ${x.presentacion} (${x.codigo}): ${x.cantidad} unidades, ${x.dias_antiguedad} días, ${rd(x.costo_inmovilizado)}`),
      `Errores de despacho por presentación (30 días): ${d.errores_despacho.filter((e) => e.tipo_error === "presentacion").length}`,
    ];
    recomendacion = viejos.length ? `Evaluar una promoción o redistribución de ${viejos.map((x) => `${x.nombre} ${x.presentacion}`).join(" y ")} antes de que pierdan frescura.` : "Mantener la rotación actual.";
  } else {
    const promedio = prod.length ? Math.round(prod.reduce((s, x) => s + x.cumplimiento_pct, 0) / prod.length) : null;
    titular = bajos.length ? `${bajos.length} días del último mes quedaron por debajo del 70% del plan.` : "La producción del mes se mantuvo sobre el umbral.";
    indicadores = [
      `Cumplimiento de la semana: ${promedio ?? "—"}% del plan`,
      ...prod.map((x) => `${x.fecha}: ${x.producido.toLocaleString("en-US")} de ${x.planificado.toLocaleString("en-US")} unidades (${x.cumplimiento_pct}%)`),
      ...bajos.map((x) => `Día bajo el umbral: ${x.fecha} (${x.cumplimiento_pct}%)`),
    ];
    recomendacion = bajos.length ? "Revisar la causa de los días con desviación y asegurar el plan de recuperación para la próxima semana." : "Mantener el plan.";
  }

  return `**Rodelo Copilot · ${g.nombre} · ${d.hoy}**

**Titular del día:** ${titular}

**Indicadores**
${indicadores.map((x) => `- ${x}`).join("\n")}

**Alertas activas**
${alertasDe(alertas, g.areas)}

**Recomendación del día:** ${recomendacion}`;
}
