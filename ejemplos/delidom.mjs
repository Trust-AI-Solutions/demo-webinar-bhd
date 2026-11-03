// Genera los documentos de ejemplo del lector de Delidom (todo ficticio) en public/delidom/ejemplos/:
// - orden-compra-la-cadena.pdf: orden de compra de un supermercado, con códigos del cliente,
//   códigos de barras, fardos "/ 20 UN" y las trampas de las órdenes reales: el proveedor
//   impreso como "razón social", una fecha de entrega ambigua (12/11/2026) distinta de la de
//   impresión y de la vigencia, un código de barras nuevo y un producto que Delidom no tiene.
// - pedido-escrito-a-mano.jpg: la foto de un papelito con un pedido.
// Los códigos de barras salen del catálogo ficticio (public/delidom/js/datos.js).
// Uso: node ejemplos/delidom.mjs

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { PRODUCTOS } from "../public/delidom/js/datos.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const SALIDA = fileURLToPath(new URL("../public/delidom/ejemplos/", import.meta.url));

const eanDe = (desc) => PRODUCTOS.find((p) => p.descripcion === desc).ean;
// Un código de barras válido que NO está en el catálogo (producto nuevo de la cadena).
function eanNuevo(n) {
  const base = `7469990${String(n).padStart(5, "0")}`;
  const suma = [...base].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return base + ((10 - (suma % 10)) % 10);
}

// [código del cliente, descripción, EAN, fardos, costo unitario]
const LINEAS = [
  ["LC-30211", "JUGO CHINOLA 12 OZ (DELIDOM)", eanDe("JUGO CHINOLA 12oz - 20 UND"), 35, 38.5],
  ["LC-30212", "JUGO LIMON 12 OZ (DELIDOM)", eanDe("JUGO LIMON 12oz - 20 UND"), 31, 36],
  ["LC-30213", "JUGO NARANJA 12 OZ (DELIDOM)", eanDe("JUGO NARANJA 12oz - 20 UND"), 24, 38.5],
  ["LC-30214", "JUGO PITAHAYA GUANABANA 12 OZ (DELIDOM)", eanDe("JUGO PITAHAYA GUANABANA 12oz - 20 UND"), 7, 42],
  ["LC-30455", "JUGO FRESA 12 OZ (DELIDOM)", eanNuevo(9901), 10, 40],
  ["LC-30460", "JUGO CHINOLA 16 OZ (DELIDOM)", eanDe("JUGO CHINOLA 16oz - 20 UND"), 18, 47],
  ["LC-30461", "JUGO NARANJA 16 OZ (DELIDOM)", eanDe("JUGO NARANJA 16oz - 20 UND"), 15, 47],
  ["LC-30470", "JUGO LIMON 16 OZ (DELIDOM)", eanDe("JUGO LIMON 16oz - 20 UND"), 12, 44],
  ["LC-30471", "JUGO PIÑA 16 OZ (DELIDOM)", "", 12, 47],
  ["LC-30480", "JUGO TAMARINDO 12 OZ (DELIDOM)", eanDe("JUGO TAMARINDO 12oz - 20 UND"), 9, 38.5],
  ["LC-30481", "JUGO CEREZA 12 OZ (DELIDOM)", eanDe("JUGO CEREZA 12oz - 20 UND"), 6, 40],
  ["LC-30490", "JUGO MANGO 12 OZ (DELIDOM)", eanNuevo(9902), 8, 40],
];
const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const totalBultos = LINEAS.reduce((s, l) => s + l[3], 0);
const totalMonto = LINEAS.reduce((s, l) => s + l[3] * 20 * l[4], 0);

const ORDEN = `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { font: 9.5pt/1.35 "DejaVu Sans Mono", "Courier New", monospace; color: #111; margin: 0; }
  .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 8px; }
  h1 { font: bold 15pt Arial, sans-serif; margin: 0; letter-spacing: .02em; }
  .gris { color: #444; font-size: 8.5pt; }
  .doc { text-align: right; }
  .doc b { font: bold 13pt Arial, sans-serif; }
  .bloques { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .caja { border: 1px solid #555; padding: 6px 8px; }
  .caja .t { font: bold 8pt Arial, sans-serif; text-transform: uppercase; color: #333; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 8.2pt; }
  th { font: bold 7.6pt Arial, sans-serif; text-transform: uppercase; text-align: left; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 5px 4px; }
  td { padding: 4px; border-bottom: 1px dotted #999; vertical-align: top; }
  .n { text-align: right; }
  .cod, .n, .nw { white-space: nowrap; }
  .tot { margin-top: 8px; display: flex; justify-content: flex-end; gap: 28px; font-weight: bold; }
  .obs { margin-top: 12px; border: 1px solid #555; padding: 6px 8px; }
  .firmas { display: flex; gap: 40px; margin-top: 26px; }
  .firmas div { flex: 1; border-top: 1px solid #111; padding-top: 4px; font-size: 8pt; text-align: center; }
  .ficticio { margin-top: 12px; font: 8pt Arial, sans-serif; color: #777; text-align: center; }
</style>
<div class="cab">
  <div><h1>SUPERMERCADOS LA CADENA, SRL</h1><div class="gris">RNC 1-30-00000-0 (ficticio) · Av. Independencia #204, Sto. Dgo. Oeste<br>Departamento de Compras · Tel. 809-555-0134 · compras@lacadena.ejemplo</div></div>
  <div class="doc"><b>ORDEN DE COMPRA</b><br>No. OC-2216<br><span class="gris">Fecha impresión: 09/11/2026 · Pág. 1 de 1</span></div>
</div>
<div class="bloques">
  <div class="caja"><div class="t">Proveedor</div>NOMBRE O RAZÓN SOCIAL: DELIDOM, SRL<br>Cód. proveedor: PR-0877 · Santo Domingo Oeste</div>
  <div class="caja"><div class="t">Entrega</div>Fecha de entrega: 12/11/2026<br>Entregar en: Centro de Distribución, Aut. Duarte Km 10½<br>Válida hasta: 19/11/2026</div>
  <div class="caja"><div class="t">Comprador</div>Lic. Ana Méndez (ficticio) · Ext. 2214</div>
  <div class="caja"><div class="t">Condición de pago</div>TRANSF. 30 DIAS S/DESC.</div>
</div>
<table>
  <thead><tr><th>Pos</th><th>Código</th><th>Descripción</th><th>Código de barras</th><th class="n">Cant.</th><th>Und</th><th>Empaque</th><th class="n">Costo unit.</th><th class="n">Total</th></tr></thead>
  <tbody>${LINEAS.map(([cod, desc, ean, cant, costo], i) => `<tr><td>${i + 1}</td><td class="cod">${cod}</td><td>${desc}</td><td class="nw">${ean}</td><td class="n">${cant}</td><td>FDO</td><td class="nw">/ 20 UN</td><td class="n">${fmt(costo)}</td><td class="n">${fmt(cant * 20 * costo)}</td></tr>`).join("")}</tbody>
</table>
<div class="tot"><span>Total bultos: ${totalBultos}</span><span>Total RD$ ${fmt(totalMonto)}</span></div>
<div class="obs"><b>Observaciones:</b> Recibir de 7:00 a 11:00 a. m. por el andén 3. Presentar esta orden con la factura. Producto con vencimiento mínimo de 20 días.</div>
<div class="firmas"><div>Elaborado por</div><div>Autorizado por</div></div>
<p class="ficticio">Documento ficticio, creado para una demostración. Cadena, RNC, códigos de barras, personas y cifras inventados.</p>`;

// Foto de un pedido escrito a mano (letra de mano del sistema, hoja rayada, un poco torcida)
const FOTO = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; background: #5f6e64; width: 900px; height: 1200px; display: grid; place-items: center; }
  .hoja { width: 620px; height: 880px; background: #fdfbf3; transform: rotate(-2.5deg); box-shadow: 0 22px 44px rgba(0,0,0,.45);
    padding: 54px 56px; font: 31px/46px "Bradley Hand", "Noteworthy", "Segoe Print", "Comic Sans MS", cursive; color: #1b2f6b;
    background-image: repeating-linear-gradient(transparent 0 44px, #b8c8e2 44px 46px); background-position: 0 40px; }
  .t { font-size: 36px; font-weight: bold; }
  .pie { margin-top: 38px; font: 17px Arial, sans-serif; color: #8a8a7a; }
</style><div class="hoja">
  <div class="t">Repostería Dulce Hogar</div>
  Pedido p/ el jueves<br>
  3 fundas pulpa fresa<br>
  2 fundas mango trocitos<br>
  4 gal limón<br>
  1 pulpa chinola<br>
  <br>
  Llamar antes de llegar — Rosa<br>
  <div class="pie">Nota ficticia, para la demostración</div>
</div>`;

await mkdir(SALIDA, { recursive: true });
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(ORDEN);
await pagina.pdf({ path: `${SALIDA}orden-compra-la-cadena.pdf`, format: "Letter", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" } });
const foto = await navegador.newPage({ viewport: { width: 900, height: 1200 } });
await foto.setContent(FOTO);
await foto.screenshot({ path: `${SALIDA}pedido-escrito-a-mano.jpg`, type: "jpeg", quality: 82 });
await navegador.close();
console.log(`Listo: ${SALIDA}`);
