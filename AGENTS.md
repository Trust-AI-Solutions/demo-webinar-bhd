# AGENTS.md · demo-webinar-bhd

Demo en vivo para el webinar de BHD: las soluciones de IA de la fase beta para **Minis by Mónica**, **Grupo Rodelo** y **Delidom**, con datos ficticios, conectadas a Claude. Claude Code lo lee a través de `CLAUDE.md`.

## Reglas

- Los nombres de las tres empresas se pueden mostrar: lo autorizaron (confirmado por Jorge el 03/11/2026). Todo lo demás es ficticio: tiendas, cadenas, clientes, productos, precios, personas, teléfonos, correos, números de documento.
- Nunca copiar datos, documentos, capturas ni identificadores reales de los repos de los clientes (`pymes-rd-agentes`, `rodelo-copilot`, `Minisbymonica`, `trusts-ai-solution`): solo la forma de las pantallas, de los agentes y de los datos.
- Sin nombres de cadenas reales (Bravo, Nacional, Jumbo, La Sirena, Plaza Lama, Olé, Aprezio…).
- Rodelo: dentro de la demo y en las instrucciones del agente, nunca nombrar los sistemas que lo alimentan; decir "fuentes del negocio". La única excepción es el caso en la portada, que dice "CRM, SAP y Google Drive" (pedido por Jorge el 03/11/2026).
- La portada presenta cada caso real (el problema, la solución entregada y el resultado según el dueño) con las cifras que Trust aprobó. Sin nombrar la cadena de supermercados de Minis.
- Minis: no mostrar "Dulce" ni Mini Lovers (fueron una propuesta, no se construyeron).
- Ningún secreto en el repo. La clave de Anthropic y `CLAVE_DEMO` viven en Netlify, en Render y en LastPass.
- Publicar solo en cuentas de Trust (Render: espacio "Demo AI Solutions"), nunca en el espacio de trabajo de un cliente.
- Todo lo que ve el público, en español dominicano, sin jerga técnica. El texto del modelo siempre se escapa (`escapar` en `public/comun/formato.js`).
- Cada solución conserva el aspecto de lo que se construyó para el cliente, en su versión más nueva (ver `DESIGN.md`). Minis sigue el panel de `pymes-rd-agentes/minis-panel`: se copia la forma, nunca sus datos ni su conexión a la base real.
- Antes de subir: `npm run pruebas` y `npm run navegador` en verde.
- Commits pequeños en `main`, con la cuenta de Trust de cada persona.

## Mapa

| Ruta | Qué hay |
|---|---|
| `public/index.html` | Portada con las tres soluciones y "Restablecer la demo" |
| `public/comun/cambiador.js` | La barra fija para cambiar de solución (y los atajos Alt+0…3). Cada solución la monta primero; su encabezado fijo va en `top: var(--alto-cambiador)` |
| `public/comun/ia.js` | `Conversacion` (agentes de chat con herramientas) y `leerDocumento` (agentes lectores: PDF, foto o texto pegado) contra `/api/ia` |
| `public/comun/estado.js` | `crearEstado(solución, vacío)`: lo creado en la demo, en `localStorage`, compartido entre ventanas |
| `public/<solución>/js/datos.js` | La empresa y sus datos ficticios, con semilla fija y anclados a hoy; las situaciones sembradas |
| `public/<solución>/js/definiciones.js` | Cada herramienta de sus agentes, una sola vez: nombre, etiqueta, descripción y parámetros |
| `public/<solución>/js/herramientas.js` (Delidom: `mapeo.js`) | Lo que hace cada herramienta en el navegador / el emparejamiento con el catálogo |
| `public/minis/js/` | El panel vigente del piloto: `negocio.js` (cálculos: conciliación, previsión, stock, rutas), una pantalla por módulo (`hoy.js`, `analisis.js`, `gestion.js`, `respaldo.js`) y el chofer por WhatsApp (`choferes.js`) |
| `netlify/functions/ia/ia.mjs` | La función que llama a Claude |
| `netlify/functions/ia/modos.mjs` | El registro de agentes; las instrucciones de cada uno en `minis.mjs`, `rodelo.mjs`, `delidom.mjs` y las reglas comunes en `comun.mjs` |
| `servidor.mjs`, `render.yaml` | La misma demo en Render |
| `ejemplos/*.mjs` | Generan los documentos de ejemplo de `public/<solución>/ejemplos/` (`npm run ejemplos`) |
| `pruebas/` | `npm run pruebas` (datos, herramientas, función, servidor) y `npm run navegador` (las tres soluciones con un "Claude" de guion) |

## Cómo se hace

- **Agregar un agente:** definir sus herramientas en `public/<solución>/js/definiciones.js`, sus instrucciones fijas en `netlify/functions/ia/<solución>.mjs` (con `REGLAS_DEMO` al final) y registrarlo en `AGENTES` con un nombre `<solución>-<rol>`. `documento: true` si recibe un archivo o un texto pegado en un solo mensaje.
- **Agregar una herramienta:** definirla en `definiciones.js` y escribir su función en el navegador; la prueba de la solución revisa que coincidan.
- **Cambiar datos:** `datos.js` de la solución. Sus pruebas fijan las situaciones sembradas; si una cambia, cambiar la prueba y `GUION-DEMO.md`.
- **Probar con la IA real en local:** `npm start` con `ANTHROPIC_API_KEY` en el entorno de la terminal.
