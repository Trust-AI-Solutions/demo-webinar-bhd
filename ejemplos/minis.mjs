// Genera el reporte de ventas de ejemplo de Minis by Mónica (todo ficticio): el que
// Hiper Las Palmas, una cadena inventada, envía cada mañana con lo vendido por tienda.
// Trae una trampa para la demo: un artículo que no es del catálogo de Minis ("MINIS BROWNIE
// 2 UN", LP-40290), que el panel marca para revisar en vez de adivinar.
// Uso: node ejemplos/minis.mjs   (escribe en public/minis/ejemplos/)

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { PRODUCTOS, TIENDAS, esDeLasPalmas, parEn } from "../public/minis/js/datos.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const SALIDA = fileURLToPath(new URL("../public/minis/ejemplos/", import.meta.url));

// Descripción del artículo en la cadena (abreviada, en mayúsculas, como en su sistema).
const DESCRIPCION = {
  P01: "MINIS BIZC VAINILLA 1 UN", P02: "MINIS BIZC CHOCOLATE 1 UN", P03: "MINIS BIZC ZANAHORIA 1 UN", P04: "MINIS COCO HORNEADO 6 OZ",
  P05: "MINIS CHEESEC BITES FRESA 4 UN", P06: "MINIS CHEESEC BITES CHINOLA 4 UN", P07: "MINIS PAN GUINEO 1 UN", P08: "MINIS GALL AVENA 8 UN",
  P09: "MINIS GALL CHISPAS 8 UN", P10: "MINIS FLORENTINAS 6 UN", P11: "MINIS MANTECADITOS 10 UN", P12: "MINIS POLVORONES 10 UN",
  P13: "MINIS POLVORON GUAYABA 10 UN", P14: "MINIS GALL. JENGIBRE 8 UN",
};
const PRECIO_GONDOLA = (p) => Math.round(p.precio * 1.32);

let semilla = 41;
const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
const dd = (d) => String(d).padStart(2, "0");
const hoy = new Date();
const fecha = `${dd(hoy.getDate())}/${dd(hoy.getMonth() + 1)}/${hoy.getFullYear()}`;

const tiendas = TIENDAS.filter(esDeLasPalmas);
let totalU = 0, totalV = 0;
const bloques = tiendas.map((t, i) => {
  const filas = [];
  for (const p of PRODUCTOS) {
    const u = Math.max(0, Math.round(parEn(p, t) * 0.24 * (0.3 + azar() * 1.3) - 0.2));
    if (u === 0 && azar() < 0.6) continue;
    filas.push([p.codigoLP, DESCRIPCION[p.codigo], u, u * PRECIO_GONDOLA(p)]);
  }
  if (i === 2) filas.push(["LP-40290", "MINIS BROWNIE 2 UN", 3, 3 * 210]); // no está en el catálogo de Minis
  const su = filas.reduce((s, f) => s + f[2], 0), sv = filas.reduce((s, f) => s + f[3], 0);
  totalU += su; totalV += sv;
  return `<tr class="tienda"><td colspan="4">${t.enReporte} · ${t.nombre.replace("Las Palmas ", "").toUpperCase()}</td></tr>
    ${filas.map(([c, d, u, v]) => `<tr><td>${c}</td><td>${d}</td><td class="n">${u}</td><td class="n">${v.toLocaleString("en-US")}.00</td></tr>`).join("")}
    <tr class="sub"><td></td><td>Subtotal tienda</td><td class="n">${su}</td><td class="n">${sv.toLocaleString("en-US")}.00</td></tr>`;
}).join("");

const HTML = `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { font: 9.5pt/1.35 "DejaVu Sans Mono", "Courier New", monospace; color: #111; margin: 0; }
  .cab { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; }
  h1 { font: bold 15pt/1.1 Arial, sans-serif; margin: 0; letter-spacing: .02em; }
  .gris { color: #444; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { text-align: left; border-bottom: 1px solid #111; padding: 4px 6px; font-size: 8.5pt; }
  td { padding: 2px 6px; }
  .n { text-align: right; }
  tr.tienda td { padding-top: 10px; font-weight: bold; border-bottom: 1px dashed #777; }
  tr.sub td { border-top: 1px solid #bbb; font-weight: bold; }
  tr.total td { border-top: 2px solid #111; font-weight: bold; padding-top: 6px; }
  .ficticio { margin-top: 22px; font: 8pt Arial, sans-serif; color: #777; text-align: center; }
</style>
<div class="cab">
  <div><h1>HIPER LAS PALMAS, S.R.L.</h1><div class="gris">Departamento de Compras · Consignación<br>RNC 1-01-00000-0 (ficticio) · Av. Luperón, Santo Domingo</div></div>
  <div style="text-align:right"><b>REPORTE DE VENTAS POR PROVEEDOR</b><br>Fecha de ventas: ${fecha}<br><span class="gris">Impreso: ${fecha} 06:02 a. m.</span></div>
</div>
<p><b>Proveedor:</b> 00418 · MINIS BY MONICA, S.R.L. &nbsp; <b>Modalidad:</b> Consignación &nbsp; <b>Tiendas:</b> ${tiendas.length}</p>
<table>
  <thead><tr><th style="width:14%">Artículo</th><th>Descripción</th><th class="n" style="width:14%">Unid. vendidas</th><th class="n" style="width:16%">Venta RD$</th></tr></thead>
  <tbody>${bloques}
    <tr class="total"><td></td><td>TOTAL PROVEEDOR</td><td class="n">${totalU}</td><td class="n">${totalV.toLocaleString("en-US")}.00</td></tr>
  </tbody>
</table>
<p class="ficticio">Documento ficticio, creado para una demostración. Cadena, RNC, tiendas y cifras inventados.</p>`;

await mkdir(SALIDA, { recursive: true });
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(HTML);
await pagina.pdf({ path: `${SALIDA}reporte-ventas-las-palmas.pdf`, format: "Letter", printBackground: true, margin: { top: "14mm", bottom: "14mm", left: "14mm", right: "14mm" } });
await navegador.close();
console.log(`Listo: ${SALIDA}reporte-ventas-las-palmas.pdf (${tiendas.length} tiendas, ${totalU} unidades)`);
