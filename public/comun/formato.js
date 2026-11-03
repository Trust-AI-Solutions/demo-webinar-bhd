// Formato de montos, fechas y texto de la IA (con escape de HTML: nunca se inserta
// texto del modelo sin escapar).

const numero = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 0 });
const numero2 = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const rd = (n) => `RD$${numero.format(Math.round(n ?? 0))}`;
export const rd2 = (n) => `RD$${numero2.format(n ?? 0)}`;
export const num = (n) => numero.format(n ?? 0);
export const porcentaje = (n) => (n === null || n === undefined ? "—" : `${Math.round(n * 10) / 10} %`);

const MESES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function fechaCorta(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}
export function fechaLarga(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} de ${MESES_LARGOS[m - 1]} de ${a}`;
}
export const nombreMes = (iso) => MESES_LARGOS[Number(iso.slice(5, 7)) - 1];

export function escapar(t) {
  return String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Markdown mínimo: **negrita**, *negrita de WhatsApp*, _cursiva_, listas con "-" o "•" y saltos de línea.
export function textoEnriquecido(t) {
  const lineas = escapar(t).split("\n");
  const html = [];
  let enLista = false;
  for (const crudo of lineas) {
    const linea = crudo.trimEnd();
    const item = linea.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (item) {
      if (!enLista) { html.push("<ul>"); enLista = true; }
      html.push(`<li>${enLinea(item[1])}</li>`);
      continue;
    }
    if (enLista) { html.push("</ul>"); enLista = false; }
    html.push(linea ? `<p>${enLinea(linea)}</p>` : "");
  }
  if (enLista) html.push("</ul>");
  return html.join("");
}
function enLinea(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*(\S(?:.*?\S)?)\*(?=[\s.,;:!?)]|$)/g, "$1<strong>$2</strong>")
    .replace(/(^|[\s(])_(\S(?:.*?\S)?)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>")
    .replace(/^#{1,4}\s+/, "");
}
