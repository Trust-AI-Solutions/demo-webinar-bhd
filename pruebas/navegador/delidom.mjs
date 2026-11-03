// Parte de pruebas/navegador.mjs (que levanta el servidor y define BASE_URL).
// Prueba de punta a punta de Delidom en el navegador, sin gastar la clave: /api/ia se
// intercepta y responde con un entregar_pedido de guion.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const REPO = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/, "");
const require = createRequire(`${REPO}/package.json`);
const { chromium } = require("playwright");
const CAP = `${REPO}/pruebas/capturas/`;
const BASE = `${process.env.BASE_URL}/delidom/`;

const errores = [];
let ok = 0;
const verificar = (c, m) => { if (!c) { console.error("✗", m); process.exitCode = 1; } else { ok++; console.log("✓", m); } };

const respuesta = (input) => ({ stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "entregar_pedido", input }] });
const CATERING = {
  cliente: "Catering Fiesta Real", numero_externo: null, fecha_entrega: null, fecha_dicha: "el sábado", contacto: "Ramón", entregar_en: null, condicion_pago: null, nota: "Lo recibe Ramón en la cocina",
  items: [
    { descripcion: "galones de piña", codigo_externo: null, ean: null, cantidad: 6, unidad: "GL", unidades_por_bulto: null },
    { descripcion: "galones de tamarindo", codigo_externo: null, ean: null, cantidad: 3, unidad: "GL", unidades_por_bulto: null },
    { descripcion: "jugos de naranja", codigo_externo: null, ean: null, cantidad: 2, unidad: null, unidades_por_bulto: null },
    { descripcion: "fundas de pulpa de mango", codigo_externo: null, ean: null, cantidad: 3, unidad: "FDO", unidades_por_bulto: null },
  ],
};
const ORDEN = {
  cliente: "SUPERMERCADOS LA CADENA, SRL", numero_externo: "OC-2216", fecha_entrega: "12/11/2026", fecha_dicha: null, contacto: "Lic. Ana Méndez", entregar_en: "Centro de Distribución, Aut. Duarte Km 10½", condicion_pago: "TRANSF. 30 DIAS S/DESC.", nota: "Recibir de 7:00 a 11:00 a. m. por el andén 3",
  items: [
    { descripcion: "JUGO CHINOLA 12 OZ (DELIDOM)", codigo_externo: "LC-30211", ean: "7469990000019", cantidad: 35, unidad: "FDO", unidades_por_bulto: 20 },
    { descripcion: "JUGO FRESA 12 OZ (DELIDOM)", codigo_externo: "LC-30455", ean: "7469990099013", cantidad: 10, unidad: "FDO", unidades_por_bulto: 20 },
    { descripcion: "JUGO PIÑA 16 OZ (DELIDOM)", codigo_externo: "LC-30471", ean: null, cantidad: 12, unidad: "FDO", unidades_por_bulto: 20 },
    { descripcion: "JUGO MANGO 12 OZ (DELIDOM)", codigo_externo: "LC-30490", ean: "7469990099020", cantidad: 8, unidad: "FDO", unidades_por_bulto: 20 },
  ],
};
let guion = CATERING;
let solicitudes = [];

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pagina = await ctx.newPage();
pagina.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
pagina.on("pageerror", (e) => errores.push(String(e)));
await pagina.route("**/api/ia", async (r) => { solicitudes.push(JSON.parse(r.request().postData())); await r.fulfill({ json: respuesta(guion) }); });

await pagina.goto(BASE);
await pagina.waitForSelector(".pedido");
verificar(await pagina.locator(".cambiador nav a[aria-current=page]").innerText() === "Delidom", "la barra de cambio marca Delidom");
const activos = await pagina.locator("#pizarra .pedido").count();
verificar(activos === 10, `pizarra con 10 pedidos activos (${activos})`);
verificar(await pagina.locator(".grupo-ruta.sin-ruta").count() === 1, "grupo Sin ruta resaltado");
await pagina.screenshot({ path: `${CAP}delidom-hoy.png`, fullPage: true });

// Filtros: KPI pendiente y ficha de ruta.
await pagina.click('.kpi[data-kpi="pendiente"]');
verificar(await pagina.locator("#pizarra .pedido.preparacion").count() === 0, "KPI Pendientes filtra la pizarra");
await pagina.click('.kpi[data-kpi=""]');
await pagina.click('.ficha-ruta[data-ruta="4"]');
verificar((await pagina.locator("#pizarra .grupo-ruta").count()) === 1, "ficha Ruta 4 muestra solo esa ruta");
await pagina.click('.ficha-ruta[data-ruta=""]');

// Avanzar y deshacer.
const primera = pagina.locator("#pizarra .pedido.pendiente").first();
const id = await primera.getAttribute("data-id");
await primera.locator('[data-accion="avanzar"]').click();
verificar(await pagina.locator(`.pedido[data-id="${id}"]`).getAttribute("class").then((c) => c.includes("preparacion")), "Iniciar preparación cambia el estado");
await pagina.click("#toast button");
verificar(await pagina.locator(`.pedido[data-id="${id}"]`).getAttribute("class").then((c) => c.includes("pendiente")), "Deshacer lo devuelve a pendiente");

// Ticket.
await pagina.locator(`.pedido[data-id="${id}"] [data-accion="ticket"]`).click();
await pagina.waitForTimeout(300);
const ticket = await pagina.frameLocator("#ticket-marco").locator("body").innerText();
verificar(/Pedidos /.test(ticket) && /\d{2}-\d{2}-\d{2}/.test(ticket), `ticket con fecha y cliente (${ticket.split("\n").slice(0, 3).join(" | ")})`);
await pagina.screenshot({ path: `${CAP}delidom-ticket.png` });
await pagina.click("#ventana-ticket [data-cerrar]");

// Modo pizarra.
await pagina.click("#modo-pizarra");
verificar(await pagina.locator("nav.pestanas").isHidden(), "modo pizarra oculta las pestañas");
await pagina.screenshot({ path: `${CAP}delidom-pizarra.png` });
await pagina.keyboard.press("Escape");
verificar(await pagina.locator("nav.pestanas").isVisible(), "Esc sale del modo pizarra");

// Nuevo pedido.
await pagina.click('[data-ir="nuevo"]');
await pagina.selectOption("#sel-cli", "11");
verificar(/Ruta 3/.test(await pagina.locator("#auto-cli").innerText()), "elegir cliente completa la ruta");
await pagina.click('[data-prod="1"][data-d="1"]');
await pagina.click('[data-prod="1"][data-d="1"]');
await pagina.click('[data-prod="27"][data-d="1"]');
await pagina.screenshot({ path: `${CAP}delidom-nuevo.png`, fullPage: true });
await pagina.click("#form-nuevo .btn-ppal");
await pagina.waitForTimeout(200);
verificar(await pagina.locator("#pizarra .pedido").count() === 11, "el pedido nuevo entra a la pizarra");
verificar(/2 gal chinola · 1 funda pulpa mango/.test(await pagina.locator("#pizarra").innerText()), "con sus líneas");

// Pegar mensaje (Catering): supuesto, empate y fecha dicha con palabras.
await pagina.click('[data-ir="pegar"]');
await pagina.click('[data-ej="1"]');
await pagina.click("#leer-texto");
await pagina.waitForSelector("#ia-res:not([hidden]) .linea-ia");
const sol = solicitudes.at(-1);
verificar(sol.modo === "delidom-lector" && /6 galones de piña/.test(sol.mensajes[0].content.at(-1).text), "envía el mensaje al lector");
verificar(await pagina.locator(".linea-ia.rev").count() === 1, "tamarindo queda como supuesto");
  verificar(await pagina.locator(".bed-unidad").first().innerText() === "gal", "la unidad al lado de la cantidad");
verificar(await pagina.locator(".linea-ia.falta").count() === 1, "naranja sin elegir (empate)");
verificar(await pagina.locator("[data-confirmar]").isDisabled(), "no se puede confirmar con faltantes");
await pagina.screenshot({ path: `${CAP}delidom-borrador-texto.png`, fullPage: true });
const naranja = pagina.locator(".linea-ia.falta select");
const sugerido = await naranja.locator('optgroup[label="Sugeridos"] option').first().getAttribute("value");
await naranja.selectOption(sugerido);
await pagina.fill('[data-campo="fecha"]', "2026-11-14");
await pagina.locator('[data-campo="fecha"]').dispatchEvent("change");
verificar(await pagina.locator("[data-confirmar]").isEnabled(), "con producto y fecha se puede confirmar");
await pagina.click("[data-confirmar]");
await pagina.waitForTimeout(300);
verificar(await pagina.locator("#p-hoy.act").count() === 1 && await pagina.locator(".pedido.recien").count() === 1, "el pedido confirmado aparece resaltado en la pizarra");
verificar(/aprendida/.test(await pagina.locator("#toast").innerText()), "avisa que aprendió la línea elegida a mano");

// Mismo mensaje otra vez: la línea aprendida ya calza sola.
await pagina.click('[data-ir="pegar"]');
await pagina.click('[data-ej="1"]');
await pagina.click("#leer-texto");
await pagina.waitForSelector("#ia-res:not([hidden]) .linea-ia");
verificar(await pagina.locator(".linea-ia.falta").count() === 0 && /aprendido/.test(await pagina.locator("#ia-res").innerText()), "la segunda vez la naranja calza por lo aprendido");
await pagina.click("[data-descartar]");

// Orden de compra en PDF: fecha ambigua, alias del cliente, producto que no existe.
guion = ORDEN;
const popup = pagina.waitForEvent("popup").catch(() => null);
await pagina.click('[data-ejarch="0"]');
(await popup)?.close();
await pagina.waitForSelector("#ia-res:not([hidden]) .linea-ia");
const solPdf = solicitudes.at(-1);
verificar(solPdf.mensajes[0].content[0].type === "document" && solPdf.mensajes[0].content[0].source.media_type === "application/pdf", "envía el PDF como documento");
const textoRes = await pagina.locator("#ia-res").innerText();
verificar(/código de barras/.test(textoRes) && /código del cliente/.test(textoRes), "calza por código de barras y por código del cliente");
verificar(/35 FDO × 20 UN = 700 unidades/.test(textoRes), "muestra la equivalencia de fardos");
verificar(await pagina.locator(".ambigua button").count() === 2, "pregunta la fecha ambigua");
verificar(await pagina.locator("select[data-campo=cliente]").inputValue() === "1", "reconoce al cliente por el membrete");
await pagina.screenshot({ path: `${CAP}delidom-borrador-pdf.png`, fullPage: true });
await pagina.locator(".ambigua button").first().click();
await pagina.locator(".linea-ia.falta select").selectOption({ label: "Jugo de chinola 12 oz" });
await pagina.click("[data-confirmar]");
await pagina.waitForTimeout(300);
verificar(/OC OC-2216/.test(await pagina.locator(".pedido.recien").innerText()), "la orden entra con su número");

// Historial.
await pagina.click('[data-ir="hist"]');
await pagina.click('[data-rango="hoy"]');
verificar(/pedidos/i.test(await pagina.locator("#hist-contador").innerText()) && await pagina.locator("#hist-tabla tbody tr").count() >= 14, "historial de hoy con los pedidos");
await pagina.click('[data-rango="mes"]');
await pagina.screenshot({ path: `${CAP}delidom-historial.png` });

// Celular.
const movil = await navegador.newPage({ viewport: { width: 390, height: 844 } });
movil.on("pageerror", (e) => errores.push(String(e)));
await movil.goto(BASE);
await movil.waitForSelector(".pedido");
await movil.screenshot({ path: `${CAP}delidom-movil.png` });
const ancho = await movil.evaluate(() => document.documentElement.scrollWidth);
verificar(ancho <= 390, `sin desborde horizontal en el celular (${ancho}px)`);

verificar(errores.length === 0, `sin errores en la consola${errores.length ? `: ${errores.join(" | ")}` : ""}`);
await navegador.close();
console.log(`${ok} verificaciones`);
