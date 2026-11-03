// Iconos de trazo simple (SVG en línea).
const t = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONOS = {
  logo: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8.5 17h15l-2.2 10.2a1.5 1.5 0 0 1-1.5 1.2h-7.6a1.5 1.5 0 0 1-1.5-1.2z" fill="#f6be88"/><path d="M12.6 18.5l.7 8.4M16 18.5v8.4M19.4 18.5l-.7 8.4" stroke="#4a2419" stroke-width="1.1" stroke-linecap="round" opacity=".45"/><path d="M7 17.4c-1.4-.3-2.2-1.6-1.8-3 .4-1.5 1.9-2.1 3.1-1.8-.3-2.2 1.3-4 3.4-4 .3-2.1 2.2-3.6 4.3-3.6s4 1.5 4.3 3.6c2.1 0 3.7 1.8 3.4 4 1.2-.3 2.7.3 3.1 1.8.4 1.4-.4 2.7-1.8 3z" fill="#f8a7c1"/><path d="M11 13.2c1.6.9 3.2 1.1 5 1.1s3.4-.2 5-1.1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><circle cx="16" cy="4.6" r="2.2" fill="#d6336c"/><path d="M16.4 2.6c.6-.9 1.4-1.4 2.4-1.5" stroke="#c0e3a1" stroke-width="1.1" stroke-linecap="round"/><path d="M10 11.6l1.3-.6M20.2 10.4l1.2.7M14 9.4l.4-1.2M18.2 13.2l1.2-.2" stroke="#fde5a0" stroke-width="1.2" stroke-linecap="round"/></svg>`,
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
  flecha: t('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  sube: `<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 2 11 10H1z"/></svg>`,
  baja: `<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 10 1 2h10z"/></svg>`,
  pantalla: t('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
};
