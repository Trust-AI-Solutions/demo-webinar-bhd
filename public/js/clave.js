// Ventana para pedir la clave de la demo. El texto se escribe oculto (••••) para que
// nadie la lea si la pantalla se está compartiendo; el ojo la muestra un momento.
// La usan el panel y WhatsApp, así que trae sus propios estilos.

const ESTILOS = `
.clave-dialogo { border: 0; padding: 0; border-radius: 6px; width: min(380px, calc(100vw - 32px)); background: #fff; color: #1c1f1d; box-shadow: 0 30px 60px -20px rgba(0, 0, 0, .45); font: 15px/1.45 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Sitio", "Inter", "Segoe UI", system-ui, sans-serif; overflow: hidden; }
.clave-dialogo::backdrop { background: rgba(28, 31, 29, .55); }
.clave-dialogo .franja { background: #1c1f1d; color: #fff; padding: 14px 18px; font-weight: 700; font-size: 16px; letter-spacing: -.01em; }
.clave-dialogo form { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 12px; margin: 0; }
.clave-dialogo p { margin: 0; color: #4a524d; font-size: 14px; }
.clave-dialogo .error { color: #9b2b1f; font-weight: 600; }
.clave-dialogo .campo { display: flex; border: 1px solid #c9c6bd; border-radius: 4px; overflow: hidden; }
.clave-dialogo .campo:focus-within { outline: 3px solid #f0bf2e; outline-offset: 1px; border-color: #1c1f1d; }
.clave-dialogo input { flex: 1; min-width: 0; border: 0; padding: 11px 12px; font: inherit; font-size: 16px; letter-spacing: .08em; outline: none; background: #fff; color: inherit; }
.clave-dialogo .ojo { border: 0; border-left: 1px solid #dedcd5; background: #f8f7f4; width: 46px; display: grid; place-items: center; cursor: pointer; color: #4a524d; }
.clave-dialogo .ojo svg { width: 20px; height: 20px; }
.clave-dialogo .acciones { display: flex; justify-content: flex-end; gap: 8px; }
.clave-dialogo .acciones button { border-radius: 4px; padding: 9px 16px; font: inherit; font-weight: 700; font-size: 14px; cursor: pointer; }
.clave-dialogo .cancelar { background: #fff; border: 1px solid #c9c6bd; color: #1c1f1d; }
.clave-dialogo .entrar { background: #1c1f1d; border: 0; color: #fff; }
.clave-dialogo button:focus-visible { outline: 3px solid #f0bf2e; outline-offset: 2px; }
`;

const OJO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const OJO_TACHADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

let estilosPuestos = false;
let pendiente = null; // si ya hay una ventana abierta, se reutiliza la misma respuesta

// Devuelve la clave escrita, o null si la persona cancela.
export function pedirClave(error = "") {
  if (pendiente) return pendiente;
  if (!estilosPuestos) {
    const estilo = document.createElement("style");
    estilo.textContent = ESTILOS;
    document.head.appendChild(estilo);
    estilosPuestos = true;
  }
  const dialogo = document.createElement("dialog");
  dialogo.className = "clave-dialogo";
  dialogo.setAttribute("aria-labelledby", "clave-titulo");
  dialogo.innerHTML = `
    <div class="franja" id="clave-titulo">Clave de la demo</div>
    <form method="dialog">
      <p>Para usar el asistente de IA, escriba la clave de la demo. Se recuerda en este navegador.</p>
      <p class="error" role="alert"></p>
      <div class="campo">
        <input type="password" name="clave" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Clave de la demo" required>
        <button type="button" class="ojo" aria-label="Mostrar la clave" aria-pressed="false">${OJO}</button>
      </div>
      <div class="acciones">
        <button type="button" class="cancelar">Cancelar</button>
        <button type="submit" class="entrar">Entrar</button>
      </div>
    </form>`;
  const textoError = dialogo.querySelector(".error");
  textoError.textContent = error;
  textoError.hidden = !error;
  const entrada = dialogo.querySelector("input");
  const ojo = dialogo.querySelector(".ojo");
  ojo.addEventListener("click", () => {
    const mostrar = entrada.type === "password";
    entrada.type = mostrar ? "text" : "password";
    ojo.innerHTML = mostrar ? OJO_TACHADO : OJO;
    ojo.setAttribute("aria-pressed", String(mostrar));
    ojo.setAttribute("aria-label", mostrar ? "Ocultar la clave" : "Mostrar la clave");
    entrada.focus();
  });
  document.body.appendChild(dialogo);

  pendiente = new Promise((resolver) => {
    const cerrar = (valor) => {
      entrada.value = "";
      dialogo.close();
      dialogo.remove();
      pendiente = null;
      resolver(valor);
    };
    dialogo.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const valor = entrada.value.trim();
      if (valor) cerrar(valor);
    });
    dialogo.querySelector(".cancelar").addEventListener("click", () => cerrar(null));
    dialogo.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(null); });
  });
  dialogo.showModal();
  entrada.focus();
  return pendiente;
}
