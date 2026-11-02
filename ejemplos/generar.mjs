// Genera los dos PDF de ejemplo de "Importar PDF o foto" (todo ficticio):
// una orden de compra de un cliente y el reporte de entregas de un chofer.
// Los números de pedido y los clientes salen de los datos ficticios de la demo.
// Uso: node ejemplos/generar.mjs   (escribe en public/ejemplos/)

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { generarDatos } from "../public/js/datos.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const SALIDA = fileURLToPath(new URL("../public/ejemplos/", import.meta.url));
const d = generarDatos("2026-11-10");
const pedido = (id) => d.pedidos.find((p) => p.id === id);

const BASE = `<style>
  * { box-sizing: border-box; }
  body { font: 11pt/1.4 "DejaVu Sans", Arial, sans-serif; color: #1f2328; margin: 0; }
  h1 { font-size: 18pt; margin: 0; letter-spacing: -.01em; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th { background: #e9ecef; text-align: left; font-size: 9pt; text-transform: uppercase; padding: 7px 8px; border: 1px solid #adb5bd; }
  td { padding: 8px; border: 1px solid #adb5bd; vertical-align: top; }
  .n { text-align: right; }
  .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1f2328; padding-bottom: 10px; }
  .gris { color: #555; font-size: 9.5pt; }
  .caja { border: 1px solid #adb5bd; padding: 8px 10px; margin-top: 12px; }
  .firmas { display: flex; gap: 40px; margin-top: 46px; }
  .firmas div { flex: 1; border-top: 1px solid #1f2328; padding-top: 4px; font-size: 9.5pt; }
  .ficticio { margin-top: 28px; font-size: 8.5pt; color: #777; text-align: center; }
  .mano { font-family: "DejaVu Serif", serif; font-style: italic; color: #1d3f8f; }
</style>`;

const ORDEN = `<!doctype html><meta charset="utf-8">${BASE}
<div class="cab">
  <div><h1>EDIFICACIONES BRISA NORTE, SRL</h1><div class="gris">RNC 1-31-00000-0 (ficticio) · Av. Hermanas Mirabal km 9, Villa Mella, Santo Domingo Norte<br>Tel. 809-555-1007 · compras@brisanorte.ejemplo</div></div>
  <div style="text-align:right"><b style="font-size:14pt">ORDEN DE COMPRA</b><br>No. OC-2026-0418<br><span class="gris">Fecha: 10/11/2026</span></div>
</div>
<div class="caja"><b>Proveedor:</b> Ferretería Los Pinos, SRL · Sucursal Villa Mella<br><b>Obra:</b> Residencial Brisa Norte, Torre B, Av. Hermanas Mirabal km 9, Villa Mella<br><b>Condiciones:</b> Crédito a 30 días · Entrega en obra</div>
<table>
  <thead><tr><th style="width:8%">Ítem</th><th>Descripción</th><th style="width:12%">Unidad</th><th class="n" style="width:12%">Cantidad</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Cemento gris Portland 42.5 kg</td><td>Saco</td><td class="n">40</td></tr>
    <tr><td>2</td><td>Varilla corrugada 3/8" x 20'</td><td>Und.</td><td class="n">60</td></tr>
    <tr><td>3</td><td>Varilla corrugada 1/2" x 20'</td><td>Und.</td><td class="n">30</td></tr>
    <tr><td>4</td><td>Alambre dulce cal. 16</td><td>Lb</td><td class="n">25</td></tr>
    <tr><td>5</td><td>Block de 6"</td><td>Und.</td><td class="n">200</td></tr>
    <tr><td>6</td><td>Malla electrosoldada 6x6 (rollo)</td><td>Rollo</td><td class="n">4</td></tr>
    <tr><td>7</td><td>Pintura acrílica blanca interior, cubeta 5 gal.</td><td>Cubeta</td><td class="n">10</td></tr>
  </tbody>
</table>
<div class="caja"><b>Indicaciones:</b> Entregar en obra de lunes a viernes, de 8:00 a. m. a 12:00 m. Recibe el Ing. Manuel Tejeda (ficticio), encargado de almacén. Favor confirmar disponibilidad y fecha de entrega.</div>
<div class="firmas"><div>Solicitado por: Departamento de Compras</div><div>Aprobado por: Gerencia de Proyectos</div></div>
<p class="ficticio">Documento ficticio, creado para una demostración. Empresa, RNC, personas y datos inventados.</p>`;

const RUTA = [
  ["P-1302", "Entregado completo", "Recibió Ing. Pérez en obra"],
  ["P-1305", "NO ENTREGADO", "Cliente ausente. Se llamó 2 veces, no contestó. Volver mañana en la mañana"],
  ["P-1306", "Entregado parcial", "Faltó 1 artículo que no cabía en el camión. Va en la ruta de mañana"],
  ["P-1307", "Entregado completo", "Pagó contra entrega con transferencia"],
  ["P-1319", "Entregado completo", "Sr. Tavárez, calle 8, Los Guaricanos"],
];
const REPORTE = `<!doctype html><meta charset="utf-8">${BASE}
<div class="cab">
  <div><h1>Ferretería Los Pinos · Hoja de ruta</h1><div class="gris">Sucursal Herrera · Despacho</div></div>
  <div style="text-align:right"><b style="font-size:13pt">CAMIÓN 2</b><br><span class="gris">Chofer: Ramón Peña (ficticio)<br>Ayudante: Luis Mejía (ficticio)</span></div>
</div>
<table>
  <thead><tr><th style="width:11%">Pedido</th><th style="width:30%">Cliente</th><th style="width:20%">Resultado</th><th>Observaciones del chofer</th></tr></thead>
  <tbody>${RUTA.map(([id, res, obs]) => `<tr><td><b>${id}</b></td><td>${pedido(id)?.cliente ?? "Sr. Tavárez"}</td><td class="mano">${res}</td><td class="mano">${obs}</td></tr>`).join("")}</tbody>
</table>
<div class="caja">Salida: 8:10 a. m. · Regreso: 1:40 p. m. · Combustible: ¾ de tanque</div>
<div class="firmas"><div>Firma del chofer</div><div>Recibido por despacho</div></div>
<p class="ficticio">Documento ficticio, creado para una demostración. Empresa, personas y datos inventados.</p>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
for (const [html, nombre] of [[ORDEN, "orden-de-compra-brisa-norte.pdf"], [REPORTE, "reporte-de-entregas-camion-2.pdf"]]) {
  await pagina.setContent(html);
  await pagina.pdf({ path: `${SALIDA}${nombre}`, format: "Letter", printBackground: true, margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" } });
  console.log(`listo: public/ejemplos/${nombre}`);
}
await navegador.close();
