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

// 1. Panel: Hoy
const ir = async (seccion) => { await pagina.click(`nav.secciones [data-seccion="${seccion}"]`); await pagina.waitForSelector(`#sec-${seccion}.visible`); await pagina.waitForTimeout(260); };
await pagina.goto(BASE);
await pagina.waitForSelector("#tablaHoy");
ok(await pagina.locator(".cambiador").count() === 1, "barra para cambiar de solución");
ok(await pagina.locator("nav.secciones button").count() === 10, "barra lateral con 9 secciones y el chofer por WhatsApp");
ok((await pagina.locator("#tablaHoy tbody tr").count()) === 29, "28 tiendas (y el total) en Hoy");
ok(/7\/28/.test(await pagina.locator("#kpi-visitadas").innerText()), "7 de 28 visitadas hoy");
ok(await pagina.locator("#avisosHoy li").count() === 2, "dos avisos para la oficina");
ok(/8 tiendas sin informe/.test(await pagina.locator("#sec-hoy").innerText()), "las 8 de Las Palmas sin informe de hoy");
await pagina.screenshot({ path: CAP + "minis-hoy.png", fullPage: true });

// Mes, conciliación (con su detalle), previsión, stock, choferes, productos y tiendas
await ir("mes");
ok((await pagina.locator("#tablaMes tbody tr").count()) === 29, "mes: 28 tiendas y el total");
await pagina.screenshot({ path: CAP + "minis-mes.png", fullPage: true });
await ir("semana");
await pagina.selectOption("#periodoConc", "mes");
ok(await pagina.locator("#tablaConc .alerta-txt").count() >= 2, "conciliación: los dos errores del informe aparecen como diferencia");
await pagina.locator("#tablaConc tr.fila-dia", { has: pagina.locator(".alerta-txt") }).first().click();
await pagina.waitForSelector("#tarjetaDetalleDia");
ok(/Caribe/.test(await pagina.locator("#tablaDetalleDia").innerText()), "el detalle dice en qué tienda no cuadra");
await pagina.screenshot({ path: CAP + "minis-conciliacion.png", fullPage: true });
await ir("prevision");
ok((await pagina.locator("#tablaPrevision tbody tr").count()) === 15, "previsión: 14 productos y el total");
ok(await pagina.locator("#tablaPrevision .tendencia.sube").count() >= 1, "previsión con tendencia");
await pagina.selectOption("#vistaPrevision", "dia");
await pagina.waitForSelector("#diaPrevision");
await pagina.screenshot({ path: CAP + "minis-prevision.png", fullPage: true });
await ir("stock");
ok(await pagina.locator("#tablaStock .fila-alerta", { hasText: "chinola" }).count() === 1, "stock de Caribe Naco: chinola en ámbar");
await pagina.screenshot({ path: CAP + "minis-stock.png", fullPage: true });
await ir("choferes");
ok(await pagina.locator("#rejillaChoferes .chofer").count() === 4, "cuatro choferes con su progreso");
await pagina.locator("#rejillaAsignar label", { hasText: "Del Sol Moca" }).locator("input").isDisabled().then((d) => ok(d, "una tienda de otra ruta no se puede marcar"));
await pagina.screenshot({ path: CAP + "minis-choferes-rutas.png", fullPage: true });
await ir("productos");
ok((await pagina.locator("#tablaProductos tbody tr").count()) === 14, "14 productos");
await ir("tiendas");
ok((await pagina.locator("#tablaTiendas tbody tr").count()) === 28, "28 tiendas");

// 2. Datos: leer el informe con IA y registrar; después, carga manual pegada desde Excel
await ir("datos");
ok(/20 de 28/.test(await pagina.locator("#pill-ventas").innerText()), "20 de 28 tiendas con ventas");
await pagina.click("#usar-ejemplo");
await pagina.waitForSelector("#borrador");
ok(await pagina.locator("#borrador .pill-error, #borrador select").count() >= 1, "el brownie queda para revisar");
await pagina.screenshot({ path: CAP + "minis-borrador.png", fullPage: true });
await pagina.click("#registrar-reporte");
await pagina.waitForFunction(() => /23 de 28/.test(document.querySelector("#pill-ventas")?.innerText ?? ""));
ok(true, "tras el informe: 23 de 28 (el brownie queda fuera) con ventas");
await pagina.click('[data-modo="pegar"]');
await pagina.click("#ejemplo-pegar");
await pagina.click("#cargar-pegado");
await pagina.waitForFunction(() => /28 de 28/.test(document.querySelector("#pill-ventas")?.innerText ?? ""));
ok(true, "tras pegar: 28 de 28 con ventas");
ok(await pagina.locator("[data-borrar]").count() === 2, "los dos cargues quedan listados, con Borrar");
await pagina.screenshot({ path: CAP + "minis-datos.png", fullPage: true });
await ir("hoy");
ok(/28 de 28/.test(await pagina.locator("#kpis").innerText()), "Hoy ya tiene las ventas de las 28");

// 3. Choferes por WhatsApp
await ir("whatsapp");
await pagina.waitForSelector("#chat .wa-msj.bot");
const enviar = async (t) => { const n = await pagina.locator("#chat .wa-msj").count(); await pagina.fill("#mensaje", t); await pagina.press("#mensaje", "Enter"); await pagina.waitForFunction((n) => document.querySelectorAll("#chat .wa-msj").length >= n + 2, n); };
await enviar("Buenas, llegué al Del Sol de Piantini");
await enviar("vainilla 3 y lo demás está bien");
ok(/faltan/i.test(await pagina.locator("#chat .wa-paso").last().innerText()), "el panel no deja cerrar incompleto");
await enviar("Sí, ciérralo");
ok(await pagina.locator(".wa-paso.guardado").count() === 1, "visita guardada");
ok(await pagina.locator("#ruta .pill-linea", { hasText: "por WhatsApp" }).count() === 1, "la ruta muestra la visita por WhatsApp");
ok(await pagina.locator("#avisos li.nueva").count() === 1, "aviso nuevo para la oficina");
ok((await pagina.locator("#contador-avisos").innerText()) === "1", "contador de avisos en la barra lateral");
await pagina.screenshot({ path: CAP + "minis-choferes.png", fullPage: true });
await ir("hoy");
ok(/8\/28/.test(await pagina.locator("#kpi-visitadas").innerText()), "el panel suma la visita: 8 de 28");
ok(await pagina.locator("#tablaConteosVivo .pastilla.verde").count() === 1, "el conteo recién llegado aparece en vivo");

// Móvil
await pagina.setViewportSize({ width: 390, height: 844 });
await pagina.screenshot({ path: CAP + "minis-movil.png" });
await pagina.click('nav.secciones [data-seccion="whatsapp"]');
await pagina.waitForTimeout(300);
await pagina.screenshot({ path: CAP + "minis-movil-choferes.png" });
const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth);
ok(ancho <= 392, `sin desplazamiento horizontal en móvil (${ancho}px)`);

await navegador.close();
console.log(errores.length ? `\n${errores.length} problemas:\n${errores.join("\n")}` : "\nTodo bien.");
process.exit(errores.length ? 1 : 0);
