// Barra fija arriba de cada solución para ir y volver entre las tres durante el webinar.
// montarCambiador("minis", { restablecer }) la inserta al principio del <body>.
// Atajos de teclado: Alt+1, Alt+2, Alt+3 cambian de solución; Alt+0 vuelve al inicio.
// La altura queda en la variable CSS --alto-cambiador para que cada solución la respete.

export const SOLUCIONES = [
  { id: "minis", nombre: "Minis by Mónica", detalle: "Consignación y reparto", color: "#e02b20" },
  { id: "rodelo", nombre: "Grupo Rodelo", detalle: "Copiloto ejecutivo", color: "#f5c542" },
  { id: "delidom", nombre: "Delidom", detalle: "Central de pedidos", color: "#16774a" },
];

const ESTILOS = `
:root { --alto-cambiador: 44px; }
.cambiador { position: sticky; top: 0; z-index: 1000; height: var(--alto-cambiador); display: flex; align-items: center; gap: 12px; padding: 0 12px; background: #161b22; color: #e6e9ee; font: 600 13px/1 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Sitio", "Segoe UI", system-ui, sans-serif; letter-spacing: 0; -webkit-font-smoothing: antialiased; }
.cambiador a, .cambiador button { color: inherit; text-decoration: none; font: inherit; }
.cambiador .inicio { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 8px; opacity: .85; }
.cambiador .inicio:hover { background: rgba(255, 255, 255, .08); opacity: 1; }
.cambiador nav { display: flex; gap: 4px; margin: 0 auto; background: rgba(255, 255, 255, .06); padding: 3px; border-radius: 10px; }
.cambiador nav a { display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 8px; white-space: nowrap; }
.cambiador nav a:hover { background: rgba(255, 255, 255, .08); }
.cambiador nav a[aria-current="page"] { background: #fff; color: #161b22; }
.cambiador nav i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); flex: none; }
.cambiador .lado { display: flex; align-items: center; gap: 8px; }
.cambiador .ficticio { padding: 5px 9px; border-radius: 999px; background: rgba(240, 132, 36, .18); color: #ffc489; font-size: 12px; }
.cambiador .restablecer { border: 1px solid rgba(255, 255, 255, .22); background: transparent; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 12px; }
.cambiador .restablecer:hover { background: rgba(255, 255, 255, .08); }
.cambiador :focus-visible { outline: 2px solid #f08424; outline-offset: 2px; }
@media (max-width: 760px) {
  .cambiador { gap: 6px; padding: 0 6px; }
  .cambiador .inicio span, .cambiador .ficticio, .cambiador .restablecer { display: none; }
  .cambiador nav a { padding: 7px 8px; font-size: 12px; }
}
@media print { .cambiador { display: none; } }
`;

const CASA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';

// restablecer: función de la solución que borra lo creado en la demo (opcional).
export function montarCambiador(actual, { restablecer } = {}) {
  const estilo = document.createElement("style");
  estilo.textContent = ESTILOS;
  document.head.appendChild(estilo);

  const barra = document.createElement("div");
  barra.className = "cambiador";
  barra.setAttribute("role", "navigation");
  barra.setAttribute("aria-label", "Soluciones de la demo");
  barra.innerHTML = `
    <a class="inicio" href="../" title="Inicio (Alt+0)">${CASA}<span>Inicio</span></a>
    <nav>${SOLUCIONES.map((s, i) => `<a href="../${s.id}/" style="--c:${s.color}" title="${s.detalle} (Alt+${i + 1})"${s.id === actual ? ' aria-current="page"' : ""}><i></i>${s.nombre}</a>`).join("")}</nav>
    <div class="lado">
      <span class="ficticio">Datos ficticios</span>
      ${restablecer ? '<button class="restablecer" type="button" title="Borra lo creado durante la demo en esta solución">Restablecer</button>' : ""}
    </div>`;
  document.body.prepend(barra);

  barra.querySelector(".restablecer")?.addEventListener("click", (e) => {
    restablecer();
    e.currentTarget.textContent = "Listo";
    setTimeout(() => { e.currentTarget.textContent = "Restablecer"; }, 1500);
  });

  document.addEventListener("keydown", (e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const n = Number(e.code?.replace("Digit", ""));
    if (!Number.isInteger(n) || n < 0 || n > SOLUCIONES.length) return;
    e.preventDefault();
    location.href = n === 0 ? "../" : `../${SOLUCIONES[n - 1].id}/`;
  });
}
