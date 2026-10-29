// Iconos de trazo simple (SVG en línea).
const t = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONOS = {
  pino: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 6.5 9h3L5 15h4.5L6 20h12l-3.5-5H19l-4.5-6h3z" fill="#fff"/><path d="M11 20h2v2h-2z" fill="#e0a526"/></svg>`,
  inicio: t('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  ventas: t('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>'),
  inventario: t('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'),
  clientes: t('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
  pedidos: t('<path d="M6 2h12l2 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M4 6h16M9 11h6M9 15h6"/>'),
  alertas: t('<path d="M12 3a6 6 0 0 0-6 6c0 6-2.5 8-2.5 8h17S18 15 18 9a6 6 0 0 0-6-6z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'),
  chispa: t('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
  cerrar: t('<path d="M18 6 6 18M6 6l12 12"/>'),
  ampliar: t('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  reiniciar: t('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  enviar: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>`,
  whatsapp: t('<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.3-4.3a8.5 8.5 0 1 1 15.7-4.4z"/><path d="M8.8 8.6c.3 2.9 2.7 5.4 5.6 5.8l1.2-1.3 2 .8-.3 1.8c-4.4.4-9-4-8.6-8.6l1.8-.3.8 2z"/>'),
  pantalla: t('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
};
