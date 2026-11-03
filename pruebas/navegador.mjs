// Prueba de punta a punta en el navegador, SIN gastar la clave: un servidor local
// sirve public/ y responde /api/ia con un "Claude" de guion que pide herramientas
// reales (buscar, registrar pedido, consultar ventas). Verifica que el pedido hecho
// en WhatsApp aparece en el panel y guarda capturas en pruebas/capturas/.
// Uso: node pruebas/navegador.mjs

import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const RAIZ = fileURLToPath(new URL("../public/", import.meta.url));
const CAPTURAS = fileURLToPath(new URL("./capturas/", import.meta.url));
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".md": "text/plain", ".pdf": "application/pdf" };

let id = 0;
let exigirClave = false; // simula CLAVE_DEMO="pinos" en Netlify
const uso = (name, input) => ({ type: "tool_use", id: `toolu_${++id}`, name, input });
const ultimoResultado = (mensajes) => {
  const u = mensajes.at(-1);
  return Array.isArray(u.content) ? JSON.parse(u.content.find((b) => b.type === "tool_result").content) : null;
};

// Guion: decide la siguiente respuesta según el modo y cuántos pasos lleva el turno.
function claudeDeGuion({ modo, mensajes }) {
  if (modo === "documento") {
    // Lo que respondería Claude al leer cada PDF de ejemplo.
    const bloques = mensajes[0].content;
    const archivo = bloques.find((b) => b.type === "document" || b.type === "image");
    const texto = bloques.find((b) => b.type === "text").text;
    const nombreArchivo = texto.match(/^Archivo recibido: (.*)$/m)?.[1] ?? "";
    if (!archivo?.source?.data?.length || !/MENÚ/.test(texto)) return { stop_reason: "end_turn", content: [{ type: "text", text: "falta el documento o el contexto" }] };
    if (/la-canasta/.test(nombreArchivo)) {
      const v = (tienda, codigo, unidades, texto_original = codigo) => ({ tienda, texto_original, codigo, unidades });
      return { stop_reason: "tool_use", content: [uso("proponer_resultado", { tipo: "reporte_de_ventas", resumen: "Reporte de ventas de Minimarkets La Canasta, cuatro tiendas.", periodo: "últimos 7 días al corte de hoy", ventas_reportadas: [
        v("La Canasta Gazcue", "GAL-001", 19), v("La Canasta Naco", "PAN-007", 32), v("La Canasta Naco", "GAL-001", 26), v("La Canasta Piantini", "GAL-003", 35),
        v("La Canasta Piantini", null, 6, "GALLETA COCO DOÑA LULA 12U"),
      ], dudas: ["La galleta de coco de Piantini no es de El Trigal."] })] };
    }
    if (/reporte/.test(nombreArchivo)) {
      return { stop_reason: "tool_use", content: [uso("proponer_resultado", { tipo: "reporte_de_entregas", resumen: "Hoja de reparto de la ruta de la mañana con cinco entregas.", actualizaciones: [
        { pedido: "P-1302", estado: "entregado", nota: "Recibió el dueño" },
        { pedido: "P-1305", estado: null, nota: "Cafetería cerrada; volver mañana" },
        { pedido: "P-1319", estado: "entregado", nota: "Sra. Tavárez" },
      ], dudas: ["El pedido P-1319 no existe en el panel."] })] };
    }
    return { stop_reason: "tool_use", content: [uso("proponer_resultado", { tipo: "orden_de_compra", resumen: "Orden de compra OC-2026-0418 de la Cafetería El Mesón del Café para la semana.", pedido_nuevo: {
      cliente: "Cafetería El Mesón del Café, SRL", telefono: "809-555-1007", entrega: "envío", direccion: "Calle Dr. Delgado, Gazcue", sucursal: "Gazcue", forma_pago: "crédito a 15 días", referencia: "OC-2026-0418", nota: "Entregar antes de las 7:00 a. m.",
      lineas: [{ texto_original: "Pan de agua", codigo: "PAN-001", cantidad: 200 }, { texto_original: "Pastelitos de pollo", codigo: "SAL-001", cantidad: 80 }, { texto_original: "Pan de masa madre (hogaza)", codigo: null, cantidad: 12 }],
    }, dudas: ["El pan de masa madre no está en el menú."] })] };
  }
  const pregunta = [...mensajes].reverse().find((m) => m.role === "user" && typeof m.content === "string").content;
  const resultado = ultimoResultado(mensajes);
  const pasos = mensajes.length - mensajes.findLastIndex((m) => m.role === "user" && typeof m.content === "string") - 1;
  if (modo === "whatsapp") {
    if (/pedido/i.test(pregunta)) {
      if (pasos === 0) return { stop_reason: "tool_use", content: [{ type: "thinking", thinking: "", signature: "x" }, uso("registrar_pedido", { items: [{ codigo: "BIZ-003", cantidad: 1 }, { codigo: "SAL-001", cantidad: 25 }], nombre_cliente: "Carlos Prueba", telefono: "809-555-7788", tipo_entrega: "envío", direccion: "Calle 5 #12, Naco", forma_pago: "transferencia", para_cuando: "sábado 3:00 p. m." })] };
      return { stop_reason: "end_turn", content: [{ type: "text", text: `¡Listo! Su pedido *${resultado.pedido}* quedó registrado.\n\nTotal a pagar: *RD$${resultado.total_a_pagar.toLocaleString("en-US")}*. Sale ${resultado.cuando}.` }] };
    }
    if (pasos === 0) return { stop_reason: "tool_use", content: [uso("buscar_productos", { texto: "bizcocho de 3 libras" })] };
    const p = resultado.productos[0];
    return { stop_reason: "end_turn", content: [{ type: "text", text: `Sí, tenemos *${p.nombre}* a RD$${p.precio_sin_itbis} el ${p.unidad}, más ITBIS. ¿Cuántos necesita?` }] };
  }
  if (pasos === 0) return { stop_reason: "tool_use", content: [uso("resumen_ventas", { agrupar_por: "sucursal" }), uso("ver_alertas", {})] };
  const r = mensajes.at(-1).content.map((b) => JSON.parse(b.content));
  return { stop_reason: "end_turn", content: [{ type: "text", text: `En los últimos 30 días vendió **RD$${Math.round(r[0].ventas_sin_itbis).toLocaleString("en-US")}**, con margen de ${r[0].margen_pct} %.\n\n- Gazcue: RD$${Math.round(r[0].grupos[0].ventas).toLocaleString("en-US")}\n- Alertas urgentes: ${r[1].alertas.filter((a) => a.gravedad === "alta").length}` }] };
}

const servidor = http.createServer(async (req, res) => {
  if (req.url === "/api/ia" && req.method === "POST" && exigirClave && req.headers["x-clave-demo"] !== "pinos") {
    for await (const c of req) { /* descartar cuerpo */ }
    res.writeHead(401, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "Clave de la demo incorrecta.", codigo: "clave" }));
  }
  if (req.url === "/api/ia" && req.method === "POST") {
    let cuerpo = "";
    for await (const c of req) cuerpo += c;
    const r = claudeDeGuion(JSON.parse(cuerpo));
    await new Promise((ok) => setTimeout(ok, 250));
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(r));
  }
  const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const archivo = join(RAIZ, ruta.endsWith("/") ? `${ruta}index.html` : ruta);
    res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
    res.end(await readFile(archivo));
  } catch {
    res.writeHead(404); res.end("no");
  }
});

await new Promise((ok) => servidor.listen(0, ok));
const base = `http://localhost:${servidor.address().port}`;
await mkdir(CAPTURAS, { recursive: true });
const navegador = await chromium.launch();
const errores = [];
const fallas = [];
const verificar = (cond, mensaje) => { if (!cond) fallas.push(mensaje); console.log(`${cond ? "✓" : "✗"} ${mensaje}`); };

try {
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
  // Google Fonts no es necesario para la prueba
  await pagina.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

  await pagina.goto(`${base}/index.html`);
  await pagina.screenshot({ path: `${CAPTURAS}portada.png` });

  await pagina.goto(`${base}/panel.html`);
  const titulos = { inicio: "Inicio", ventas: "Ventas", inventario: "Insumos y menú", cobros: "Clientes y cobros", pedidos: "Pedidos", alertas: "Alertas" };
  for (const [vista, titulo] of Object.entries(titulos)) {
    await pagina.click(`#nav [data-vista=${vista}]`);
    await pagina.waitForTimeout(700);
    verificar((await pagina.locator("#titulo").innerText()) === titulo && pagina.url().endsWith(`#${vista}`), `el menú abre ${titulo}`);
    await pagina.screenshot({ path: `${CAPTURAS}panel-${vista}.png`, fullPage: vista !== "inventario" });
  }
  await pagina.goBack();
  await pagina.waitForTimeout(300);
  verificar((await pagina.locator("#titulo").innerText()) === "Pedidos", "el botón Atrás vuelve a la pantalla anterior");
  await pagina.evaluate(() => { location.hash = "cobros"; });
  await pagina.waitForTimeout(300);
  verificar((await pagina.locator("#titulo").innerText()) === "Clientes y cobros", "un enlace con #pantalla abre esa pantalla");
  await pagina.click("#nav [data-vista=inventario]");
  await pagina.fill("#inv-texto", "televisor plasma");
  verificar(await pagina.locator("#t-inv .vacio").count() === 1, "la búsqueda sin resultados lo dice");
  await pagina.goto(`${base}/panel.html#inicio`);
  verificar((await pagina.locator(".indicador").count()) === 6, "inicio muestra 6 indicadores");
  verificar((await pagina.locator("#inicio-alertas li").count()) === 5, "inicio muestra 5 alertas");

  // Asistente del panel
  await pagina.click("#abrir-asistente");
  await pagina.click("#sugerencias .chip >> nth=0");
  await pagina.waitForSelector(".burbuja.ia");
  const respuestaPanel = await pagina.locator(".burbuja.ia").last().innerText();
  verificar(/vendió RD\$[\d,]+/.test(respuestaPanel), `el asistente del panel responde con cifras (${respuestaPanel.split("\n")[0]})`);
  verificar((await pagina.locator(".pasos span").count()) >= 2, "se muestran los pasos de la consulta");
  await pagina.screenshot({ path: `${CAPTURAS}panel-asistente.png` });

  // Vista en vivo: WhatsApp + panel
  await pagina.goto(`${base}/en-vivo.html`);
  const wa = pagina.frameLocator('iframe[title="Asistente de WhatsApp"]');
  const panel = pagina.frameLocator('iframe[title="Panel del negocio"]');
  await wa.locator(".wa-msj.tienda").first().waitFor();
  verificar(!(await wa.locator(".volver").isVisible()), "en la vista en vivo no aparece el botón Volver del WhatsApp");
  await wa.locator("#mensaje").fill("¿A cómo está el bizcocho de 3 libras?");
  await wa.locator("#mensaje").press("Enter");
  await wa.locator(".wa-msj.tienda").nth(1).waitFor();
  verificar(/RD\$1850/.test(await wa.locator(".wa-msj.tienda").nth(1).innerText()), "WhatsApp responde el precio real del menú");
  await wa.locator("#mensaje").fill("Sí, quiero hacer el pedido: el bizcocho y 25 pastelitos de pollo para el sábado, envío a Naco");
  await wa.locator("#enviar").click();
  await wa.locator(".wa-msj.tienda >> text=/quedó registrado/").waitFor();
  const numeroPedido = (await wa.locator(".wa-msj.tienda >> text=/quedó registrado/").innerText()).match(/P-\d+/)[0];
  await panel.locator(`.pedido:has-text("${numeroPedido}")`).waitFor({ timeout: 4000 });
  verificar(true, `el pedido ${numeroPedido} de WhatsApp aparece en el panel`);
  verificar(await panel.locator(`.pedido.nuevo-llegado:has-text("${numeroPedido}")`).count() === 1, "el pedido nuevo se resalta");
  verificar(await panel.locator(".aviso-flotante div").count() >= 1, "el panel muestra el aviso del pedido nuevo");
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${CAPTURAS}en-vivo.png` });

  // Restablecer
  pagina.once("dialog", (d) => d.accept());
  await pagina.click("#restablecer");
  await pagina.waitForTimeout(500);
  verificar(await panel.locator(`.pedido:has-text("${numeroPedido}")`).count() === 0, "restablecer borra el pedido de la demo");

  // Pedidos: nuevo pedido a mano e importar PDF
  await pagina.goto(`${base}/panel.html#pedidos`);
  await pagina.click("#nuevo-pedido");
  const hoja = pagina.locator("dialog.hoja");
  await hoja.locator("input[name=cliente]").fill("Hotel Brisas de Gazcue (ficticio)");
  await hoja.locator("input[name=cliente]").dispatchEvent("change");
  verificar(await hoja.locator("input[name=telefono]").inputValue() === "809-555-1000", "al escoger un cliente existente se llena su teléfono");
  await hoja.locator(".linea-pedido .producto").fill("PAN-001 · Pan de agua · RD$10/unidad");
  await hoja.locator(".linea-pedido .cantidad").fill("100");
  verificar(/RD\$1,330/.test(await hoja.locator(".totales").innerText()) || /RD\$1,180/.test(await hoja.locator(".totales").innerText()), `el formulario calcula el total con ITBIS (${(await hoja.locator(".totales").innerText()).replace(/\s+/g, " ")})`);
  await hoja.locator("select[name=entrega]").selectOption("envío");
  await hoja.locator("button[type=submit]").click();
  verificar(/dirección/.test(await hoja.locator(".error").innerText()), "para envío pide la dirección");
  await hoja.locator("input[name=direccion]").fill("Av. Luperón 100");
  await pagina.screenshot({ path: `${CAPTURAS}nuevo-pedido.png` });
  await hoja.locator("button[type=submit]").click();
  await pagina.locator('.columna[data-chip=trigo] .pedido:has-text("Hotel Brisas")').waitFor({ timeout: 3000 });
  verificar(/a mano/.test(await pagina.locator('.columna[data-chip=trigo] .pedido:has-text("Hotel Brisas")').first().innerText()), "el pedido a mano entra en Nuevo, marcado como hecho a mano");

  await pagina.click("#importar-documento");
  await pagina.click("dialog.hoja [data-ejemplo='0']");
  await pagina.locator("dialog.hoja [data-aplicar]").waitFor();
  verificar(await pagina.locator("dialog.hoja tr.sin-catalogo").count() === 1, "la línea que no está en el menú se marca");
  await pagina.screenshot({ path: `${CAPTURAS}importar-orden.png` });
  await pagina.click("dialog.hoja [data-aplicar]");
  await pagina.locator('.pedido:has-text("Mesón del Café")').first().waitFor({ timeout: 3000 });
  verificar(/Cotizar aparte: 12 × Pan de masa madre/.test(await pagina.locator('.columna[data-chip=trigo] .pedido:has-text("Mesón del Café")').innerText()), "la orden de compra crea el pedido y anota lo que falta cotizar");

  await pagina.click("#importar-documento");
  await pagina.click("dialog.hoja [data-ejemplo='1']");
  await pagina.locator("dialog.hoja [data-aplicar]").waitFor();
  verificar(/Aplicar 2 cambios/.test(await pagina.locator("dialog.hoja [data-aplicar]").innerText()), "la hoja del repartidor ignora el pedido que no existe");
  await pagina.screenshot({ path: `${CAPTURAS}importar-reporte.png` });
  await pagina.click("dialog.hoja [data-aplicar]");
  await pagina.waitForTimeout(300);
  verificar(await pagina.locator('.columna[data-chip=harina] .pedido:has-text("P-1302")').count() === 1, "P-1302 pasa a Entregado");
  verificar(/Novedad: Cafetería cerrada/.test(await pagina.locator('.pedido:has-text("P-1305")').innerText()), "P-1305 muestra la novedad del repartidor");
  await pagina.screenshot({ path: `${CAPTURAS}pedidos-actualizados.png`, fullPage: true });
  await pagina.click("#importar-documento");
  await pagina.click("dialog.hoja [data-ejemplo='2']");
  await pagina.locator("dialog.hoja [data-aplicar]").waitFor();
  verificar(await pagina.locator("dialog.hoja tr.sin-catalogo").count() === 2, "el reporte de ventas marca lo que no cuadra y lo que no es de El Trigal");
  await pagina.screenshot({ path: `${CAPTURAS}importar-ventas.png` });
  await pagina.click("dialog.hoja [data-aplicar]");
  await pagina.goto(`${base}/panel.html#ventas`);
  await pagina.locator("#consignacion .indicador").first().waitFor();
  verificar(/no cuadra|Reportan 32 vendidos y se entregaron 30/.test(await pagina.locator("#consignacion").innerText()), "Ventas muestra la consignación y lo que no cuadra");
  await pagina.locator("#consignacion").screenshot({ path: `${CAPTURAS}consignacion.png` });
  await pagina.evaluate(() => localStorage.removeItem("demo-el-trigal-v1"));

  // Clave de la demo: se escribe oculta, avisa si es incorrecta y luego deja pasar
  exigirClave = true;
  const conClave = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
  await conClave.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await conClave.goto(`${base}/whatsapp.html`);
  await conClave.evaluate(() => localStorage.clear());
  await conClave.fill("#mensaje", "¿A cómo está el bizcocho de 3 libras?");
  await conClave.press("#mensaje", "Enter");
  const campo = conClave.locator(".clave-dialogo input");
  await campo.waitFor();
  verificar(await campo.getAttribute("type") === "password", "la clave se escribe oculta (••••)");
  await campo.fill("equivocada");
  await conClave.screenshot({ path: `${CAPTURAS}clave-oculta.png` });
  await conClave.click(".clave-dialogo .entrar");
  await conClave.locator(".clave-dialogo .error:not([hidden])").waitFor();
  verificar((await conClave.locator(".clave-dialogo .error").innerText()).includes("no es correcta"), "una clave incorrecta lo dice y vuelve a pedirla");
  await conClave.click(".clave-dialogo .ojo");
  verificar(await conClave.locator(".clave-dialogo input").getAttribute("type") === "text", "el ojo muestra la clave al pedirlo");
  await conClave.fill(".clave-dialogo input", "pinos");
  await conClave.click(".clave-dialogo .entrar");
  await conClave.locator(".wa-msj.tienda").nth(1).waitFor();
  verificar(await conClave.locator(".clave-dialogo").count() === 0, "con la clave correcta el asistente responde");
  verificar(await conClave.evaluate(() => localStorage.getItem("demo-los-pinos-clave")) === "pinos", "la clave queda recordada en el navegador");
  await conClave.close();
  exigirClave = false;

  // Teléfono
  const movil = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  await movil.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await movil.goto(`${base}/whatsapp.html`);
  await movil.screenshot({ path: `${CAPTURAS}whatsapp-movil.png` });
  await movil.click(".volver");
  await movil.waitForURL(/index\.html$/);
  verificar(true, "el botón Volver al inicio de WhatsApp lleva a la portada");
  await movil.goto(`${base}/panel.html`);
  await movil.waitForTimeout(600);
  const anchoMovil = await movil.evaluate(() => document.documentElement.scrollWidth);
  verificar(anchoMovil <= 392, `el panel cabe en un teléfono sin desplazamiento lateral (ancho ${anchoMovil})`);
  await movil.screenshot({ path: `${CAPTURAS}panel-movil.png`, fullPage: true });
} finally {
  await navegador.close();
  servidor.close();
}

const erroresReales = errores.filter((e) => !/ERR_FAILED|net::/.test(e));
verificar(erroresReales.length === 0, `sin errores en la consola${erroresReales.length ? `: ${erroresReales.join(" | ")}` : ""}`);
if (fallas.length) { console.error(`\n${fallas.length} verificación(es) fallaron.`); process.exit(1); }
console.log("\nTodo bien. Capturas en pruebas/capturas/");
