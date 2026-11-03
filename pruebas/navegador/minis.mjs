// Parte de pruebas/navegador.mjs (que levanta el servidor y define BASE_URL).
// Recorre /minis/ en un navegador con un "Claude" de guion (intercepta /api/ia).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const REPO = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/, "");
const require = createRequire(REPO + "/package.json");
const { chromium } = require("playwright");
const BASE = `${process.env.BASE_URL}/minis/`;
const CAP = REPO + "/pruebas/capturas/";

const errores = [];
const ok = (c, m) => { if (!c) { errores.push(m); console.log("✗", m); } else console.log("✓", m); };

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
pagina.on("console", (m) => { if (m.type() === "error") errores.push("consola: " + m.text()); });
pagina.on("pageerror", (e) => errores.push("pageerror: " + e.message));

// Guion: según el modo y el último mensaje, devuelve la respuesta de "Claude".
let turnoChofer = 0;
await pagina.route("**/api/ia", async (route) => {
  const cuerpo = JSON.parse(route.request().postData());
  const ultimo = cuerpo.mensajes.at(-1);
  const resp = (content, stop = "end_turn") => route.fulfill({ json: { stop_reason: stop, content } });
  if (cuerpo.modo === "minis-reporte") {
    ok(cuerpo.mensajes[0].content[0].type === "document", "el PDF viaja como documento");
    return resp([{ type: "tool_use", id: "t1", name: "proponer_ventas", input: {
      cadena: "HIPER LAS PALMAS, S.R.L.", fecha_reporte: "03/11/2026",
      tiendas: [
        { tienda: "HLP-03 · LUPERON", ventas: ["LP-40211 | MINIS BIZC VAINILLA 1 UN | 3", "LP-40220 | MINIS COCO HORNEADO 6 OZ | 2"] },
        { tienda: "HLP-07 · SAN ISIDRO", ventas: ["LP-40253 | MINIS GALL. JENGIBRE 8 UN | 1"] },
        { tienda: "HLP-08 · LOS MINA", ventas: ["LP-40290 | MINIS BROWNIE 2 UN | 3"] },
        { tienda: "HLP-19 · BOCA CHICA", ventas: ["LP-40272 | MINIS POLVORONES 10 UN | 4"] },
      ],
      dudas: ["El artículo LP-40290 (brownie) no aparece en la lista de Minis."],
    } }], "tool_use");
  }
  // minis-chofer
  if (typeof ultimo.content === "string") {
    turnoChofer++;
    if (turnoChofer === 1) return resp([{ type: "tool_use", id: "c1", name: "buscar_tienda", input: { texto: "Del Sol de Piantini" } }], "tool_use");
    if (turnoChofer === 2) return resp([{ type: "tool_use", id: "c3", name: "registrar_visita", input: { tienda_id: 4, conteos: [{ codigo: "P01", quedaban: 3 }] } }], "tool_use");
    // turno 3: visita completa
    const conteos = ["P01","P02","P03","P04","P05","P06","P07","P08","P09","P10","P11","P12"].map((c) => ({ codigo: c, quedaban: c === "P06" ? 0 : 3, dejados: c === "P06" ? 1 : null }));
    return resp([{ type: "tool_use", id: "c4", name: "registrar_visita", input: { tienda_id: 4, conteos, notas: "Nevera fallando" } }], "tool_use");
  }
  const resultado = JSON.parse(ultimo.content[0].content);
  if (resultado.tiendas) return resp([{ type: "tool_use", id: "c2", name: "ver_productos_de_conteo", input: { tienda_id: resultado.tiendas[0].id } }], "tool_use");
  if (resultado.productos) return resp([{ type: "text", text: "¡Perfecto! Estás en *Del Sol Piantini*. Dime lo que quedaba de cada producto antes de reponer." }]);
  if (resultado.faltan) return resp([{ type: "text", text: `Todavía me faltan: ${resultado.faltan.join(", ")}. Sin eso no puedo cerrar la visita 🙏` }]);
  if (resultado.guardada) return resp([{ type: "text", text: `Listo ✔ Visita cerrada en ${resultado.tienda}. La oficina ya sabe que la chinola quedó baja. ¿Sigues a la próxima?` }]);
  return resp([{ type: "text", text: "Ok" }]);
});

// 1. Panel
await pagina.goto(BASE);
await pagina.waitForSelector("#tabla-stock");
ok(await pagina.locator(".cambiador").count() === 1, "barra para cambiar de solución");
ok((await pagina.locator("#tabla-stock tbody tr").count()) === 28, "28 tiendas en el panel");
ok(/7 \/ 28/.test(await pagina.locator("#kpi-visitadas").innerText()), "7 de 28 visitadas hoy");
ok(await pagina.locator(".pill-error", { hasText: "Sin conteo" }).count() === 1, "una tienda sin conteo");
ok(await pagina.locator(".pill-warn", { hasText: "6 días" }).count() === 1, "una tienda con conteo viejo");
await pagina.screenshot({ path: CAP + "minis-panel.png", fullPage: true });
await pagina.locator("#tabla-stock tr", { hasText: "Caribe Naco" }).locator("button").click();
ok(await pagina.locator(".fila-alerta", { hasText: "chinola" }).count() === 1, "detalle: chinola en ámbar");
await pagina.screenshot({ path: CAP + "minis-detalle.png", fullPage: true });
await pagina.click("#volver");

// 2. Despacho: leer el reporte con IA y registrar
await pagina.click("#tab-despacho");
await pagina.waitForSelector("#tabla-despacho");
ok(/20 de 28/.test(await pagina.locator("#pill-ventas").innerText()), "20 de 28 tiendas con ventas");
await pagina.click("#usar-ejemplo");
await pagina.waitForSelector("#borrador");
ok(await pagina.locator("#borrador .pill-error, #borrador select").count() >= 1, "el brownie queda para revisar");
await pagina.screenshot({ path: CAP + "minis-borrador.png", fullPage: true });
await pagina.click("#registrar-reporte");
await pagina.waitForFunction(() => /23 de 28/.test(document.querySelector("#pill-ventas")?.innerText ?? ""));
ok(true, "tras el reporte: 23 de 28 (el brownie queda fuera) con ventas");
// pegar desde Excel
await pagina.click('[data-modo="pegar"]');
await pagina.click("#ejemplo-pegar");
await pagina.click("#cargar-pegado");
await pagina.waitForFunction(() => /28 de 28/.test(document.querySelector("#pill-ventas")?.innerText ?? ""));
ok(true, "tras pegar: 28 de 28 con ventas");
await pagina.click("#confirmar");
await pagina.waitForSelector("#hojas .hoja");
ok(await pagina.locator("#hojas .hoja").count() === 5, "4 hojas de reparto + 1 de producción");
await pagina.screenshot({ path: CAP + "minis-despacho.png", fullPage: true });
await pagina.evaluate(() => { window.print = () => {}; });
await pagina.click("#imprimir");
await pagina.emulateMedia({ media: "print" });
await pagina.screenshot({ path: CAP + "minis-impresion.png", fullPage: true });
await pagina.emulateMedia({ media: "screen" });

// 3. Choferes por WhatsApp
await pagina.click("#tab-choferes");
await pagina.waitForSelector("#chat .wa-msj.bot");
const enviar = async (t) => { const n = await pagina.locator("#chat .wa-msj").count(); await pagina.fill("#mensaje", t); await pagina.press("#mensaje", "Enter"); await pagina.waitForFunction((n) => document.querySelectorAll("#chat .wa-msj").length >= n + 2, n); };
await enviar("Buenas, llegué al Del Sol de Piantini");
await enviar("vainilla 3 y lo demás está bien");
ok(/faltan/i.test(await pagina.locator("#chat .wa-paso").last().innerText()), "el panel no deja cerrar incompleto");
await enviar("Sí, ciérralo");
ok(await pagina.locator(".wa-paso.guardado").count() === 1, "visita guardada");
ok(await pagina.locator("#ruta .pill-linea", { hasText: "por WhatsApp" }).count() === 1, "la ruta muestra la visita por WhatsApp");
ok(await pagina.locator("#avisos li.nueva").count() === 1, "aviso nuevo para la oficina");
ok((await pagina.locator("#contador-avisos").innerText()) === "1", "contador de avisos en la pestaña");
await pagina.screenshot({ path: CAP + "minis-choferes.png", fullPage: true });
await pagina.click("#tab-panel");
ok(/8 \/ 28/.test(await pagina.locator("#kpi-visitadas").innerText()), "el panel suma la visita: 8 de 28");

// Móvil
await pagina.setViewportSize({ width: 390, height: 844 });
await pagina.screenshot({ path: CAP + "minis-movil.png" });
await pagina.click("#tab-choferes");
await pagina.screenshot({ path: CAP + "minis-movil-choferes.png" });
const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth);
ok(ancho <= 392, `sin desplazamiento horizontal en móvil (${ancho}px)`);

await navegador.close();
console.log(errores.length ? `\n${errores.length} problemas:\n${errores.join("\n")}` : "\nTodo bien.");
process.exit(errores.length ? 1 : 0);
