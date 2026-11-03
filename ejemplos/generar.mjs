// Genera los dos PDF de ejemplo de "Importar PDF o foto" (todo ficticio):
// una orden de compra de una cafetería, la hoja de reparto de la ruta de la mañana, el
// reporte de ventas de la cadena en consignación y la foto de un encargo escrito a mano.
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
  <div><h1>CAFETERÍA EL MESÓN DEL CAFÉ, SRL</h1><div class="gris">RNC 1-32-00000-0 (ficticio) · Calle Dr. Delgado, Gazcue, Distrito Nacional<br>Tel. 809-555-1007 · compras@mesondelcafe.ejemplo</div></div>
  <div style="text-align:right"><b style="font-size:14pt">ORDEN DE COMPRA</b><br>No. OC-2026-0418<br><span class="gris">Fecha: 10/11/2026</span></div>
</div>
<div class="caja"><b>Proveedor:</b> Panadería y Repostería El Trigal, SRL · Sucursal Gazcue<br><b>Entrega:</b> En la cafetería, Calle Dr. Delgado, Gazcue<br><b>Condiciones:</b> Crédito a 15 días</div>
<table>
  <thead><tr><th style="width:8%">Ítem</th><th>Descripción</th><th style="width:12%">Unidad</th><th class="n" style="width:12%">Cantidad</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Pan de agua</td><td>Und.</td><td class="n">200</td></tr>
    <tr><td>2</td><td>Croissant de mantequilla</td><td>Und.</td><td class="n">60</td></tr>
    <tr><td>3</td><td>Pastelitos de pollo</td><td>Und.</td><td class="n">80</td></tr>
    <tr><td>4</td><td>Quipes</td><td>Und.</td><td class="n">50</td></tr>
    <tr><td>5</td><td>Pan de masa madre (hogaza)</td><td>Und.</td><td class="n">12</td></tr>
    <tr><td>6</td><td>Danesas de guayaba</td><td>Und.</td><td class="n">40</td></tr>
    <tr><td>7</td><td>Bizcocho dominicano de 2 lb (para el viernes)</td><td>Und.</td><td class="n">1</td></tr>
  </tbody>
</table>
<div class="caja"><b>Indicaciones:</b> Entregar de lunes a sábado antes de las 7:00 a. m. por la puerta lateral. Recibe Carmen Rosario (ficticio), encargada de cocina. El bizcocho es para el viernes a las 4:00 p. m., con el mensaje "Feliz retiro, Don Luis".</div>
<div class="firmas"><div>Solicitado por: Administración</div><div>Aprobado por: Gerencia</div></div>
<p class="ficticio">Documento ficticio, creado para una demostración. Empresa, RNC, personas y datos inventados.</p>`;

const RUTA = [
  ["P-1302", "Entregado completo", "Recibió el dueño en el mostrador"],
  ["P-1305", "NO ENTREGADO", "Cafetería cerrada (día feriado en la universidad). Volver mañana a primera hora"],
  ["P-1306", "Entregado parcial", "Faltaron 2 docenas de pan sobao, no alcanzó la hornada. Van en la ruta de mañana"],
  ["P-1307", "Entregado completo", "Pagó en efectivo"],
  ["P-1319", "Entregado completo", "Sra. Tavárez, calle 8, Los Prados"],
];
const REPORTE = `<!doctype html><meta charset="utf-8">${BASE}
<div class="cab">
  <div><h1>Panadería El Trigal · Hoja de reparto</h1><div class="gris">Sucursal Gazcue · Ruta de la mañana</div></div>
  <div style="text-align:right"><b style="font-size:13pt">RUTA 1</b><br><span class="gris">Repartidor: Ramón Peña (ficticio)<br>Motor: placa K-000000 (ficticia)</span></div>
</div>
<table>
  <thead><tr><th style="width:11%">Pedido</th><th style="width:30%">Cliente</th><th style="width:20%">Resultado</th><th>Observaciones del repartidor</th></tr></thead>
  <tbody>${RUTA.map(([id, res, obs]) => `<tr><td><b>${id}</b></td><td>${pedido(id)?.cliente ?? "Sra. Tavárez"}</td><td class="mano">${res}</td><td class="mano">${obs}</td></tr>`).join("")}</tbody>
</table>
<div class="caja">Salida: 5:40 a. m. · Regreso: 8:15 a. m. · Gavetas devueltas: 9 de 10</div>
<div class="firmas"><div>Firma del repartidor</div><div>Recibido por despacho</div></div>
<p class="ficticio">Documento ficticio, creado para una demostración. Empresa, personas y datos inventados.</p>`;

// Reporte de ventas de la cadena (consignación). Las unidades están fijas: en Naco reportan
// 32 panes de molde vendidos y solo se entregaron 30 (no cuadra), y en Piantini aparece una
// galleta de coco que no es de El Trigal.
const VENDIDAS = {
  "canasta-gazcue": { "GAL-001": 19, "GAL-003": 22, "PAN-007": 20, "GAL-004": 7, "GAL-006": 3 },
  "canasta-naco": { "GAL-001": 26, "GAL-003": 24, "PAN-007": 32, "GAL-004": 11, "GAL-006": 6 },
  "canasta-piantini": { "GAL-001": 33, "GAL-003": 35, "PAN-007": 29, "GAL-004": 14, "GAL-006": 9 },
  "canasta-los-prados": { "GAL-001": 9, "GAL-003": 11, "PAN-007": 12, "GAL-004": 4, "GAL-006": 1 },
};
const c = d.consignacion;
const precioCadena = (pr) => Math.round(d.porCodigo[pr.codigo].precio * 100) / 100;
const filasVentas = c.tiendas.flatMap((t) => {
  const filas = c.productos.map((pr) => [t.enReporte, pr.codigoCliente, pr.nombreCliente, VENDIDAS[t.id][pr.codigo], precioCadena(pr), pr.precioLiquidar]);
  if (t.id === "canasta-piantini") filas.push([t.enReporte, "7409912", "GALLETA COCO DOÑA LULA 12U", 6, 140, 112]);
  return filas;
});
const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const totalLiquidar = filasVentas.reduce((a, f) => a + f[3] * f[5], 0);
const VENTAS = `<!doctype html><meta charset="utf-8">${BASE}
<div class="cab">
  <div><h1>MINIMARKETS LA CANASTA</h1><div class="gris">Cadena ficticia · Departamento de Compras · Proveedores en consignación</div></div>
  <div style="text-align:right"><b style="font-size:13pt">REPORTE DE VENTAS</b><br>Proveedor: 30418 · EL TRIGAL, SRL<br><span class="gris">Periodo: últimos 7 días al corte de hoy</span></div>
</div>
<table style="font-size:9.5pt">
  <thead><tr><th>Tienda</th><th>Artículo</th><th>Descripción</th><th class="n">Unid. vendidas</th><th class="n">PVP</th><th class="n">A liquidar unid.</th><th class="n">A liquidar total</th></tr></thead>
  <tbody>${filasVentas.map(([t, cod, desc, u, pvp, liq]) => `<tr><td>${t}</td><td>${cod}</td><td>${desc}</td><td class="n">${u}</td><td class="n">${fmt(pvp)}</td><td class="n">${fmt(liq)}</td><td class="n">${fmt(u * liq)}</td></tr>`).join("")}</tbody>
</table>
<div class="caja"><b>Total a liquidar al proveedor: RD$${fmt(totalLiquidar)}</b> · Precios sin ITBIS · Comisión de la cadena: 20 % del PVP · Pago a 15 días después de recibida la factura.</div>
<p class="ficticio">Documento ficticio, creado para una demostración. Cadena, tiendas, códigos y cifras inventados.</p>`;

// Foto de un encargo escrito a mano (para probar "Importar PDF o foto" con una imagen)
const FOTO = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; background: #6b5a48; width: 900px; height: 1200px; display: grid; place-items: center; }
  .hoja { width: 640px; height: 900px; background: #fbf8ef; transform: rotate(-3deg); box-shadow: 0 20px 40px rgba(0,0,0,.45);
    padding: 50px 56px; font: italic 27px/1.65 "DejaVu Serif", serif; color: #1d3170;
    background-image: repeating-linear-gradient(#fbf8ef 0 43px, #b9cbe6 43px 45px); }
  h1 { font: bold italic 30px "DejaVu Serif", serif; margin: 0 0 18px; color: #1d3170; }
  .nota { margin-top: 24px; }
  .pie { margin-top: 40px; font-size: 18px; color: #7a6a5a; }
</style><div class="hoja">
  <h1>Encargo · Panadería El Trigal</h1>
  Cliente: Yolanda Familia<br>
  Tel. 829-555-0777<br>
  Para: viernes 4:00 p. m. (retira en Gazcue)<br>
  1 bizcocho dominicano de 5 lb<br>
  50 pastelitos de pollo<br>
  50 quipes<br>
  2 docenas de cupcakes decorados<br>
  1 torta de guanábana<br>
  <div class="nota">Que diga "Felicidades, Mamá Tita"<br>Paga por transferencia</div>
  <div class="pie">Nota escrita a mano, ficticia, para la demostración</div>
</div>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
for (const [html, nombre] of [[ORDEN, "orden-de-compra-meson-del-cafe.pdf"], [REPORTE, "reporte-de-entregas-ruta-manana.pdf"], [VENTAS, "reporte-ventas-la-canasta.pdf"]]) {
  await pagina.setContent(html);
  await pagina.pdf({ path: `${SALIDA}${nombre}`, format: "Letter", printBackground: true, margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" } });
  console.log(`listo: public/ejemplos/${nombre}`);
}
const foto = await navegador.newPage({ viewport: { width: 900, height: 1200 } });
await foto.setContent(FOTO);
await foto.screenshot({ path: `${SALIDA}foto-encargo-escrito-a-mano.jpg`, type: "jpeg", quality: 82 });
console.log("listo: public/ejemplos/foto-encargo-escrito-a-mano.jpg");
await navegador.close();
