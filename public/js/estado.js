// Lo que cambia durante la demo: pedidos y cotizaciones creados por el asistente de
// WhatsApp, conversaciones que piden a una persona y cambios de estado de pedidos.
// Vive en el navegador (localStorage) y se avisa a las otras ventanas abiertas de la
// demo (panel y WhatsApp lado a lado) con BroadcastChannel y el evento "storage".

const CLAVE = "demo-los-pinos-v1";
const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CLAVE) : null;
const oyentes = new Set();
let memoria = null; // respaldo si el navegador bloquea localStorage

function vacio() {
  return { pedidos: [], cotizaciones: [], atenciones: [], cambiosEstado: {}, secuencia: 1500 };
}

export function leerEstado() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return { ...vacio(), ...JSON.parse(crudo) };
  } catch { /* sin localStorage: se usa la memoria */ }
  return memoria ? structuredClone(memoria) : vacio();
}

export function guardarEstado(estado, evento = { tipo: "cambio" }) {
  memoria = structuredClone(estado);
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* ignorar */ }
  canal?.postMessage(evento);
  avisar(evento);
}

export function modificarEstado(funcion, evento) {
  const estado = leerEstado();
  const resultado = funcion(estado);
  guardarEstado(estado, evento);
  return resultado;
}

export function siguienteNumero(estado) {
  estado.secuencia += 1;
  return estado.secuencia;
}

export function restablecerDemo() {
  memoria = null;
  try { localStorage.removeItem(CLAVE); } catch { /* ignorar */ }
  canal?.postMessage({ tipo: "restablecido" });
  avisar({ tipo: "restablecido" });
}

export function alCambiar(funcion) {
  oyentes.add(funcion);
  return () => oyentes.delete(funcion);
}

function avisar(evento) {
  for (const f of oyentes) {
    try { f(evento); } catch (e) { console.error(e); }
  }
}

canal?.addEventListener("message", (e) => avisar(e.data));
canal?.unref?.(); // en Node (pruebas) no retiene el proceso; en el navegador no existe
if (!canal && typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === CLAVE) avisar({ tipo: "cambio" }); });
}
