// Parte de pruebas/navegador.mjs (que levanta el servidor y define BASE_URL).
// Prueba en el navegador de /rodelo/ con un "Claude" de guion (sin gastar la clave).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const REPO = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/, "");
const require = createRequire(REPO + "/package.json");
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL;
const CAPTURAS = REPO + "/pruebas/capturas/";

const errores = [];
const ok = (c, m) => { console.log(c ? "✓" : "✗", m); if (!c) process.exitCode = 1; };

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
pagina.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
pagina.on("pageerror", (e) => errores.push(String(e)));

// Guion: primero pide dos bloques; con sus resultados responde con una tabla.
let llamadas = 0, recibido = null;
await pagina.route("**/api/ia", async (route) => {
  const cuerpo = JSON.parse(route.request().postData());
  llamadas++;
  if (cuerpo.modo !== "rodelo-copiloto") return route.fulfill({ status: 400, json: { error: "modo" } });
  const ultimo = cuerpo.mensajes.at(-1);
  if (typeof ultimo.content === "string") {
    return route.fulfill({ json: { stop_reason: "tool_use", content: [
      { type: "text", text: "Reviso los datos." },
      { type: "tool_use", id: "t1", name: "consultar_bloque", input: { bloque: "clientes_caida" } },
      { type: "tool_use", id: "t2", name: "consultar_bloque", input: { bloque: "vendedores_desempeno" } },
    ] } });
  }
  recibido = ultimo.content.map((b) => JSON.parse(b.content));
  const caidas = recibido[0].filas.filter((c) => c.variacion_pct <= -50);
  const tabla = ["| Cliente | Base/mes | Reciente/mes | Variación |", "|---|---|---|---|", ...caidas.map((c) => `| ${c.nombre} (${c.codigo}) | RD$ ${Math.round(c.prom_mensual_base).toLocaleString("en-US")} | RD$ ${Math.round(c.prom_mensual_reciente).toLocaleString("en-US")} | ${c.variacion_pct}% |`)].join("\n");
  return route.fulfill({ json: { stop_reason: "end_turn", content: [{ type: "text", text: `**${caidas.length} clientes** muestran una caída significativa de compras.\n\n${tabla}\n\n<script>alert(1)</script>\n\n**Recomendación:** priorizar visita comercial esta semana.` }] } });
});

await pagina.goto(`${BASE}/rodelo/`);
await pagina.waitForSelector(".kpi");
ok(await pagina.locator(".cambiador nav a[aria-current=page]").innerText() === "Grupo Rodelo", "barra de soluciones marca Grupo Rodelo");
ok(await pagina.locator(".kpi").count() === 4, "Inicio muestra 4 KPI");
ok(await pagina.locator("#riskList .risk").count() === 3, "3 riesgos prioritarios");
ok(Number(await pagina.locator("#navAlertBadge").innerText()) >= 9, "insignia de alertas");
const layout = await pagina.evaluate(() => ({ app: document.querySelector(".app").getBoundingClientRect(), doc: document.documentElement.scrollHeight, vh: innerHeight }));
ok(Math.abs(layout.app.top - 44) < 1 && Math.abs(layout.app.bottom - layout.vh) < 1, `el panel ocupa la pantalla bajo la barra (${layout.app.top}–${layout.app.bottom})`);
await pagina.screenshot({ path: CAPTURAS + "rodelo-inicio.png" });

// Chat con el guion
await pagina.click('.nav button[data-view="chat"]');
await pagina.click(".suggestion >> nth=1");
await pagina.waitForSelector(".msg.bot table");
ok(llamadas === 2, `dos llamadas a /api/ia (${llamadas})`);
ok(recibido?.length === 2 && recibido[0].bloque === "clientes_caida", "los resultados de las herramientas vuelven al servidor");
const respuesta = await pagina.locator(".msg.bot").last().innerHTML();
ok(/CL-0005/.test(respuesta) && /CL-0012/.test(respuesta), "la tabla trae CL-0005 y CL-0012");
ok(!/<script>/.test(respuesta) && /&lt;script&gt;/.test(respuesta), "el texto de la IA se escapa");
ok(await pagina.locator(".pasos .paso").count() === 2, "se ven los bloques consultados");
await pagina.screenshot({ path: CAPTURAS + "rodelo-chat.png" });

// Alertas: filtrar, abrir y resolver
await pagina.click('.nav button[data-view="alertas"]');
const total = await pagina.locator(".alert-row").count();
await pagina.selectOption("#severityFilter", "alta");
const altas = await pagina.locator(".alert-row").count();
ok(altas > 0 && altas < total, `filtro por severidad (${altas} de ${total})`);
await pagina.selectOption("#severityFilter", "all");
await pagina.click(".alert-row >> nth=0");
await pagina.waitForSelector("#marcarResuelta");
const antes = Number(await pagina.locator("#navAlertBadge").innerText());
await pagina.click("#marcarResuelta");
await pagina.waitForTimeout(150);
ok(Number(await pagina.locator("#navAlertBadge").innerText()) === antes - 1, "resolver baja la insignia");
ok(await pagina.locator(".alert-row >> nth=0 >> .status").innerText() === "resuelta", "la alerta queda resuelta");
await pagina.screenshot({ path: CAPTURAS + "rodelo-alertas.png" });
await pagina.reload();
await pagina.waitForSelector(".alert-row");
ok(await pagina.locator(".status.resuelta").count() === 1, "el estado se conserva al recargar");

// Indicadores, las cuatro pestañas
await pagina.click('.nav button[data-view="indicadores"]');
for (const tab of ["ventas", "inventario", "produccion", "comercial"]) {
  await pagina.click(`.tab[data-tab="${tab}"]`);
  ok((await pagina.locator("#indicatorSummary .summary-item").count()) === 4, `indicadores: ${tab}`);
  await pagina.screenshot({ path: CAPTURAS + `rodelo-indicadores-${tab}.png` });
}

// Reportes
await pagina.click('.nav button[data-view="reportes"]');
ok(await pagina.locator(".report-card").count() === 5, "5 reportes por gerencia");
await pagina.click('.report-card >> nth=1 >> button');
await pagina.waitForSelector(".modal-backdrop.show");
ok(/Pedro Castillo/.test(await pagina.locator("#modalBody").innerText()), "reporte comercial menciona al vendedor bajo meta");
await pagina.screenshot({ path: CAPTURAS + "rodelo-reporte.png" });
await pagina.keyboard.press("Escape");

// Restablecer desde la barra
await pagina.click(".cambiador .restablecer");
await pagina.click('.nav button[data-view="alertas"]');
ok(await pagina.locator(".status.resuelta").count() === 0, "Restablecer borra el seguimiento");

// Teléfono
await pagina.setViewportSize({ width: 390, height: 844 });
await pagina.click('.nav button[data-view="inicio"]');
await pagina.waitForTimeout(400);
await pagina.screenshot({ path: CAPTURAS + "rodelo-movil.png" });
await pagina.setViewportSize({ width: 1440, height: 900 });
await pagina.click('.nav button[data-view="alertas"]');
await pagina.waitForTimeout(300);
await pagina.screenshot({ path: CAPTURAS + "rodelo-alertas-arriba.png" });
await pagina.setViewportSize({ width: 390, height: 844 });
const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth);
ok(ancho <= 390, `sin desplazamiento horizontal en teléfono (${ancho}px)`);

ok(errores.length === 0, `sin errores en la consola ${errores.join(" | ")}`);
await navegador.close();
