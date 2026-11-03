// Delidom · ticket de despacho de 72 mm. Copia la forma del papelito que el equipo
// escribía a mano: la fecha de entrega arriba (DD-MM-AA), "Pedidos <cliente>" y las
// cantidades AGRUPADAS POR TAMAÑO con el sabor en minúsculas. Sin precios ni códigos.

import { productoPorId, nombreRuta } from "./datos.js";
import { escapar } from "../../comun/formato.js";

const ORDEN = (pres) => {
  const oz = /^(\d+)oz$/.exec(pres ?? "");
  if (oz) return 1000 + Number(oz[1]);
  if (pres === "LB") return 2000;
  if (pres === "GL") return 3000;
  return 4000;
};
const ETIQUETA = (pres) => (/^\d+oz$/.test(pres ?? "") ? pres.replace("oz", "onz") : pres === "GL" ? "galón" : pres === "LB" ? "pulpa (fundas)" : "sin tamaño");

// "Jugo de pitahaya y guanábana 12 oz" -> "pitahaya y guanábana"
const saborDe = (p) => p.nombre.replace(/^(Jugo|Pulpa) de /, "").replace(/ \d+ oz$/, "").toLowerCase();

export function armarTicket(pedido) {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(pedido.fecha_entrega ?? "") ? pedido.fecha_entrega : pedido.fecha;
  const [a, m, d] = fecha.split("-");
  const grupos = new Map();
  for (const it of pedido.items) {
    const p = productoPorId.get(it.producto_id);
    const clave = p?.presentacion ?? "";
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(`${it.cantidad} ${p ? saborDe(p) : ""}`);
  }
  const bloques = [...grupos.keys()].sort((x, y) => ORDEN(x) - ORDEN(y)).map((k) => `
    <div class="grupo"><div class="tam">${escapar(ETIQUETA(k))}</div>${grupos.get(k).map((l) => `<div class="linea">${escapar(l)}</div>`).join("")}</div>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Pedidos ${escapar(pedido.cliente)} · ${d}-${m}-${a.slice(2)}</title>
<style>
  @page { size: 72mm auto; margin: 4mm 3mm; }
  * { box-sizing: border-box; }
  body { width: 66mm; margin: 0 auto; padding: 4mm 2mm; font-family: Arial, Helvetica, system-ui, sans-serif; font-size: 13px; color: #000; line-height: 2.05; background: #fff; }
  .fecha { text-align: center; font-size: 13.5px; font-weight: 700; margin-bottom: 10px; }
  .cliente { font-weight: 700; font-size: 13.5px; margin-bottom: 6px; }
  .grupo { margin-bottom: 12px; }
  .tam { font-weight: 700; }
  .linea { white-space: nowrap; }
  .nota { margin-top: 4px; line-height: 1.5; font-size: 12px; }
  .pie { margin-top: 10px; line-height: 1.5; font-size: 10.5px; color: #333; border-top: 1px dashed #999; padding-top: 6px; }
</style></head><body>
  <div class="fecha">${d}-${m}-${a.slice(2)}</div>
  <div class="cliente">Pedidos ${escapar(String(pedido.cliente).toLowerCase())}</div>
  ${bloques || '<div class="linea">(sin líneas)</div>'}
  ${pedido.nota ? `<div class="nota">${escapar(pedido.nota)}</div>` : ""}
  <div class="pie">${escapar(nombreRuta(pedido.ruta))} · ${escapar(pedido.id)}${pedido.numero_externo ? ` · OC ${escapar(pedido.numero_externo)}` : ""}</div>
</body></html>`;
}
