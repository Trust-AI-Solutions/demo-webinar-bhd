// Lo que cambia durante la demo (visitas, pedidos, alertas resueltas...), por solución.
// Vive en el navegador (localStorage) y se avisa a las otras ventanas abiertas de la
// misma solución con BroadcastChannel y el evento "storage". Cada solución crea el suyo:
//   const estado = crearEstado("minis", () => ({ visitas: [] }));
// "Restablecer la demo" en la portada borra los tres.

const PREFIJO = "demo-ia-pymes:";
let canalGeneral = null;
const todos = new Set();

export function crearEstado(nombre, vacio) {
  const clave = PREFIJO + nombre;
  const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(clave) : null;
  canal?.unref?.();
  const oyentes = new Set();
  let memoria = null; // respaldo si el navegador bloquea localStorage

  const avisar = (evento) => {
    for (const f of oyentes) {
      try { f(evento); } catch (e) { console.error(e); }
    }
  };

  const api = {
    leer() {
      try {
        const crudo = localStorage.getItem(clave);
        if (crudo) return { ...vacio(), ...JSON.parse(crudo) };
      } catch { /* sin localStorage: se usa la memoria */ }
      return memoria ? structuredClone(memoria) : vacio();
    },
    guardar(estado, evento = { tipo: "cambio" }) {
      memoria = structuredClone(estado);
      try { localStorage.setItem(clave, JSON.stringify(estado)); } catch { /* ignorar */ }
      canal?.postMessage(evento);
      avisar(evento);
    },
    // modificar((e) => { e.visitas.push(v); return v; }, { tipo: "visita" })
    modificar(funcion, evento) {
      const estado = api.leer();
      const resultado = funcion(estado);
      api.guardar(estado, evento);
      return resultado;
    },
    restablecer() {
      memoria = null;
      try { localStorage.removeItem(clave); } catch { /* ignorar */ }
      canal?.postMessage({ tipo: "restablecido" });
      avisar({ tipo: "restablecido" });
    },
    alCambiar(funcion) {
      oyentes.add(funcion);
      return () => oyentes.delete(funcion);
    },
  };

  canal?.addEventListener("message", (e) => avisar(e.data));
  if (!canal && typeof window !== "undefined") {
    window.addEventListener("storage", (e) => { if (e.key === clave) avisar({ tipo: "cambio" }); });
  }
  todos.add(api);
  return api;
}

// Borra lo creado en las tres soluciones (la portada no carga sus módulos).
export function restablecerTodo() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIJO)) localStorage.removeItem(k);
  } catch { /* ignorar */ }
  for (const api of todos) api.restablecer();
  if (typeof BroadcastChannel !== "undefined") {
    canalGeneral ??= new BroadcastChannel(PREFIJO + "todos");
    canalGeneral.postMessage({ tipo: "restablecido" });
  }
}
