// Servidor para Render (o cualquier hosting de Node): entrega el sitio de public/ y
// atiende /api/ia con la misma función que usa Netlify (netlify/functions/ia/ia.mjs).
// Sin dependencias nuevas. Las claves (ANTHROPIC_API_KEY, CLAVE_DEMO) vienen del
// entorno del servicio; nunca del repo.
// Uso: node servidor.mjs   (puerto en PORT, 3000 por defecto)

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import funcionIA from "./netlify/functions/ia/ia.mjs";

const RAIZ = fileURLToPath(new URL("./public/", import.meta.url));
const MAX_CUERPO = 6 * 1024 * 1024; // lo mismo que acepta Netlify
const CONSULTAS_POR_MINUTO = 40; // el mismo freno por visitante que en Netlify
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".pdf": "application/pdf", ".woff2": "font/woff2", ".md": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};
const CABECERAS = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Robots-Tag": "noindex" };

function visitante(req) {
  return String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || req.socket.remoteAddress || "?";
}

function crearFreno() {
  const vistas = new Map();
  return (quien) => {
    const ahora = Date.now();
    const lista = (vistas.get(quien) ?? []).filter((t) => ahora - t < 60_000);
    lista.push(ahora);
    vistas.set(quien, lista);
    if (vistas.size > 5000) for (const [k, v] of vistas) if (ahora - v.at(-1) > 60_000) vistas.delete(k);
    return lista.length <= CONSULTAS_POR_MINUTO;
  };
}

async function leerCuerpo(req) {
  const partes = [];
  let total = 0;
  for await (const parte of req) {
    total += parte.length;
    if (total > MAX_CUERPO) throw new Error("demasiado grande");
    partes.push(parte);
  }
  return Buffer.concat(partes);
}

async function atenderIA(req, res, frenoOk) {
  if (req.method !== "POST") { res.writeHead(405, { "content-type": "application/json", ...CABECERAS }); return res.end(JSON.stringify({ error: "Usa POST." })); }
  if (!frenoOk) { res.writeHead(429, { "content-type": "application/json", ...CABECERAS }); return res.end(JSON.stringify({ error: "Demasiadas consultas seguidas. Espera un momento." })); }
  let cuerpo;
  try { cuerpo = await leerCuerpo(req); } catch {
    res.writeHead(413, { "content-type": "application/json", ...CABECERAS });
    return res.end(JSON.stringify({ error: "El archivo es demasiado grande. Prueba con un PDF más liviano o una foto." }));
  }
  const peticion = new Request(`http://localhost${req.url}`, { method: "POST", headers: Object.entries(req.headers).filter(([, v]) => typeof v === "string"), body: cuerpo });
  const respuesta = await funcionIA(peticion, {});
  res.writeHead(respuesta.status, { ...Object.fromEntries(respuesta.headers), ...CABECERAS });
  res.end(Buffer.from(await respuesta.arrayBuffer()));
}

async function atenderArchivo(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, CABECERAS); return res.end(); }
  let ruta;
  try { ruta = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400, CABECERAS); return res.end(); }
  const archivo = normalize(join(RAIZ, ruta.endsWith("/") ? `${ruta}index.html` : ruta));
  if (!archivo.startsWith(RAIZ.endsWith(sep) ? RAIZ : RAIZ + sep)) { res.writeHead(404, CABECERAS); return res.end("No encontrado"); }
  try {
    if (!(await stat(archivo)).isFile()) throw new Error("no es archivo");
    const datos = await readFile(archivo);
    // Siempre se revalida (con la fecha del archivo), para que cada cambio publicado se vea al recargar.
    const fecha = (await stat(archivo)).mtime.toUTCString();
    if (req.headers["if-modified-since"] === fecha) { res.writeHead(304, CABECERAS); return res.end(); }
    const cache = "no-cache";
    res.writeHead(200, { "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream", "cache-control": cache, "last-modified": fecha, ...CABECERAS });
    res.end(req.method === "HEAD" ? undefined : datos);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8", ...CABECERAS });
    res.end("No encontrado");
  }
}

export function crearServidor() {
  const freno = crearFreno();
  return http.createServer(async (req, res) => {
    try {
      const ruta = new URL(req.url, "http://x").pathname;
      if (ruta === "/salud") { res.writeHead(200, { "content-type": "text/plain", ...CABECERAS }); return res.end("ok"); }
      if (ruta === "/api/ia") return await atenderIA(req, res, freno(visitante(req)));
      return await atenderArchivo(req, res);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.writeHead(500, { "content-type": "application/json", ...CABECERAS });
      res.end(JSON.stringify({ error: "Error del servidor." }));
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const puerto = Number(process.env.PORT) || 3000;
  crearServidor().listen(puerto, () => console.log(`Demo lista en el puerto ${puerto}`));
}
