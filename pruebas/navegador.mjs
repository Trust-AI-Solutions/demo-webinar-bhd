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
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".md": "text/plain" };

let id = 0;
const uso = (name, input) => ({ type: "tool_use", id: `toolu_${++id}`, name, input });
const ultimoResultado = (mensajes) => {
  const u = mensajes.at(-1);
  return Array.isArray(u.content) ? JSON.parse(u.content.find((b) => b.type === "tool_result").content) : null;
};

// Guion: decide la siguiente respuesta según el modo y cuántos pasos lleva el turno.
function claudeDeGuion({ modo, mensajes }) {
  const pregunta = [...mensajes].reverse().find((m) => m.role === "user" && typeof m.content === "string").content;
  const resultado = ultimoResultado(mensajes);
  const pasos = mensajes.length - mensajes.findLastIndex((m) => m.role === "user" && typeof m.content === "string") - 1;
  if (modo === "whatsapp") {
    if (/pedido/i.test(pregunta)) {
      if (pasos === 0) return { stop_reason: "tool_use", content: [{ type: "thinking", thinking: "", signature: "x" }, uso("registrar_pedido", { items: [{ codigo: "CEM-001", cantidad: 25 }, { codigo: "ACE-001", cantidad: 10 }], nombre_cliente: "Carlos Prueba", telefono: "809-555-7788", tipo_entrega: "envío", direccion: "Calle 5 #12, Villa Mella", forma_pago: "transferencia" })] };
      return { stop_reason: "end_turn", content: [{ type: "text", text: `¡Listo! Su pedido *${resultado.pedido}* quedó registrado.\n\nTotal a pagar: *RD$${resultado.total_a_pagar.toLocaleString("en-US")}*. Sale ${resultado.cuando}.` }] };
    }
    if (pasos === 0) return { stop_reason: "tool_use", content: [uso("buscar_productos", { texto: "cemento gris" })] };
    const p = resultado.productos[0];
    return { stop_reason: "end_turn", content: [{ type: "text", text: `Sí, tenemos *${p.nombre}* a RD$${p.precio_sin_itbis} el ${p.unidad}, más ITBIS. ¿Cuántos necesita?` }] };
  }
  if (pasos === 0) return { stop_reason: "tool_use", content: [uso("resumen_ventas", { agrupar_por: "sucursal" }), uso("ver_alertas", {})] };
  const r = mensajes.at(-1).content.map((b) => JSON.parse(b.content));
  return { stop_reason: "end_turn", content: [{ type: "text", text: `En los últimos 30 días vendió **RD$${Math.round(r[0].ventas_sin_itbis).toLocaleString("en-US")}**, con margen de ${r[0].margen_pct} %.\n\n- Herrera: RD$${Math.round(r[0].grupos[0].ventas).toLocaleString("en-US")}\n- Alertas urgentes: ${r[1].alertas.filter((a) => a.gravedad === "alta").length}` }] };
}

const servidor = http.createServer(async (req, res) => {
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
  const titulos = { inicio: "Inicio", ventas: "Ventas", inventario: "Inventario", cobros: "Clientes y cobros", pedidos: "Pedidos", alertas: "Alertas" };
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
  await wa.locator("#mensaje").fill("¿Tienen cemento gris?");
  await wa.locator("#mensaje").press("Enter");
  await wa.locator(".wa-msj.tienda").nth(1).waitFor();
  verificar(/RD\$640/.test(await wa.locator(".wa-msj.tienda").nth(1).innerText()), "WhatsApp responde el precio real del catálogo");
  await wa.locator("#mensaje").fill("Sí, quiero hacer el pedido: 25 sacos de cemento y 10 varillas de 3/8, envío a Villa Mella");
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
