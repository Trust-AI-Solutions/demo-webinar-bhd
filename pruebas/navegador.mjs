// Prueba de punta a punta en el navegador, SIN gastar la clave: levanta servidor.mjs en un
// puerto libre y recorre las tres soluciones con un "Claude" de guion (cada script
// intercepta /api/ia). Guarda capturas en pruebas/capturas/.
// Necesita Playwright (no está en las dependencias): npm i --no-save playwright && npx playwright install chromium
// Uso: npm run navegador

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { crearServidor } from "../servidor.mjs";

mkdirSync(fileURLToPath(new URL("./capturas/", import.meta.url)), { recursive: true });
const servidor = crearServidor();
await new Promise((ok) => servidor.listen(0, ok));
const BASE_URL = `http://localhost:${servidor.address().port}`;

let fallos = 0;
for (const solucion of ["minis", "rodelo", "delidom"]) {
  console.log(`\n=== ${solucion}`);
  // Se corre aparte (con su propio Node) y sin bloquear: el servidor de este proceso sigue atendiendo.
  const hijo = spawn(process.execPath, [fileURLToPath(new URL(`./navegador/${solucion}.mjs`, import.meta.url))], { stdio: "inherit", env: { ...process.env, BASE_URL } });
  const codigo = await new Promise((ok) => hijo.on("exit", ok));
  if (codigo !== 0) fallos++;
}
servidor.close();
console.log(fallos ? `\n${fallos} solución(es) con problemas.` : "\nTodo bien en las tres soluciones. Capturas en pruebas/capturas/");
process.exit(fallos ? 1 : 0);
