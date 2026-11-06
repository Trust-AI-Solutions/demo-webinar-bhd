# Demo para el webinar con BHD · Tres pymes, tres soluciones con IA

Demo en vivo para el webinar "Oportunidad de IA para tu empresa" (BHD, 10 de noviembre de 2026).
Muestra, con **datos ficticios**, las soluciones de la fase beta para tres clientes reales, que
autorizaron mostrar su nombre (confirmado el 03/11/2026). Una barra arriba de cada pantalla
permite ir y volver entre las tres (o Alt+1, Alt+2, Alt+3; Alt+0 vuelve al inicio).

| Solución | Qué se ve | Agentes de IA |
|---|---|---|
| **Minis by Mónica** (`/minis/`) | El panel vigente del piloto: Hoy, Mes, conciliación contra el informe de la cadena, previsión de despacho, stock en tienda, rutas de choferes, productos, tiendas y datos; más el chofer por WhatsApp | `minis-chofer`: el chofer reporta el conteo de la tienda por WhatsApp; no cierra la visita si falta un producto. `minis-reporte`: lee el reporte de ventas de la cadena en PDF |
| **Grupo Rodelo** (`/rodelo/`) | Rodelo Copilot: resumen ejecutivo, chat ejecutivo, reportes matinales por gerencia, centro de alertas e indicadores | `rodelo-copiloto`: responde preguntas del negocio con cifras de los datos y termina con una recomendación |
| **Delidom** (`/delidom/`) | Central de Pedidos: pedidos de hoy por ruta (pendiente → preparación → despachado), nuevo pedido, ticket de 72 mm, historial | `delidom-lector`: transcribe un WhatsApp pegado, una orden de compra en PDF o una foto; el catálogo se asigna en el navegador y una persona confirma |

Cada solución copia el aspecto y el comportamiento de lo que se construyó para el cliente. Las
tiendas, clientes, productos, precios, personas, teléfonos y documentos son inventados. Lo que
**no** se muestra: el asistente de ventas "Dulce" de Minis (fue solo una propuesta), los nombres
de los sistemas que alimentan a Rodelo y cualquier dato o documento real de los clientes.

## Cómo funciona

```
navegador                                           Netlify o Render                 Anthropic
public/<solución>/ ── conversación + modo ──▶ /api/ia (netlify/functions/ia) ──▶ Claude
       ▲                                          │ agrega las instrucciones y
       │ resultado de la herramienta              │ herramientas del agente (modos.mjs)
       └── public/<solución>/js/herramientas ◀── pide una herramienta ──┘
           (consulta los datos ficticios en el navegador)
```

- Los datos se generan en el navegador con una semilla fija y anclados al día de hoy
  (`public/<solución>/js/datos.js`). No hay base de datos.
- Lo que se crea durante la demo (visitas, ventas cargadas, rutas, pedidos, alertas resueltas) se guarda en el
  navegador, por solución (`public/comun/estado.js`). "Restablecer" en la barra lo borra para esa
  solución; "Restablecer la demo" en la portada, para las tres.
- La clave de Anthropic solo existe en el servidor. El navegador nunca la ve.
- Cada agente se registra en `netlify/functions/ia/modos.mjs`, con sus instrucciones en
  `minis.mjs`, `rodelo.mjs` y `delidom.mjs`, y sus herramientas en
  `public/<solución>/js/definiciones.js` (una sola vez, con la etiqueta que ve la persona).
- Modelo: `claude-opus-5-5`, esfuerzo `low` en los chats y `medium` en los lectores de documentos.
  Se cambia con `MODELO_IA`, `ESFUERZO_IA` y `ESFUERZO_DOCUMENTO` sin tocar el código.
- Los lectores (`minis-reporte`, `delidom-lector`) solo transcriben; el código empareja cada línea
  con el catálogo y nunca adivina en un empate. Nada se aplica sin aprobarlo en pantalla.

Lo que está sembrado en los datos para que la IA lo encuentre, y el orden sugerido para
mostrarlo, está en [GUION-DEMO.md](GUION-DEMO.md).

## Publicar en Render

`servidor.mjs` entrega `public/` y atiende `/api/ia` con la misma función que Netlify.

1. En Render, dentro del espacio de trabajo de Trust **Demo AI Solutions** (nunca en el de un
   cliente): **New → Blueprint** con este repo (lee `render.yaml`), o **New → Web Service** con
   `npm ci --omit=dev` y `node servidor.mjs`.
2. En **Environment**, cargar `ANTHROPIC_API_KEY` y `CLAVE_DEMO` desde LastPass.
3. El plan gratuito se duerme tras 15 minutos sin visitas y tarda cerca de un minuto en
   despertar: abrir el sitio unos minutos antes del webinar.
4. Si un push no despliega solo, **Manual Deploy → Deploy latest commit** (o reconectar el repo de
   GitHub en Settings).

## Publicar en Netlify

1. **Add new project → Import an existing project → GitHub** y elegir
   `Trust-AI-Solutions/demo-webinar-bhd`. Netlify lee `netlify.toml` (publica `public/`, función en
   `netlify/functions/`). No hace falta comando de build.
2. En **Environment variables** (alcance: Functions): `ANTHROPIC_API_KEY` y, recomendado,
   `CLAVE_DEMO` (una palabra que la demo pide antes de usar la IA). Las dos están en LastPass.
3. Volver a desplegar para que la función lea las variables.

Protecciones: 40 consultas por minuto por visitante, conversaciones de hasta 90 mensajes,
archivos de hasta 4 MB y `noindex`.

## Documentos de ejemplo

Se generan con `npm run ejemplos` (necesita Playwright, ver abajo):

- `public/minis/ejemplos/reporte-ventas-las-palmas.pdf`: reporte de ventas de Hiper Las Palmas
  (cadena ficticia) con las 8 tiendas que faltan hoy y un brownie que no es de Minis.
- `public/delidom/ejemplos/orden-compra-la-cadena.pdf`: orden de compra de Supermercado La Cadena
  con fardos, códigos de barra, una fecha ambigua y un producto que no está en el catálogo.
- `public/delidom/ejemplos/pedido-escrito-a-mano.jpg`: un pedido escrito a mano.

## Pruebas

```bash
npm run pruebas
```

Pruebas de datos, herramientas y agentes de las tres soluciones, de la función y del servidor.

```bash
npm i --no-save playwright && npx playwright install chromium
npm run navegador
```

Recorre las tres soluciones en un navegador con un "Claude" de guion (intercepta `/api/ia`), sin
gastar la clave, y guarda capturas en `pruebas/capturas/`. Para probar con la IA real en local:
`npm start` con `ANTHROPIC_API_KEY` en el entorno de la terminal.

## Estructura

```
public/index.html            portada con las tres soluciones
public/comun/                barra para cambiar de solución, conversación con la IA, estado, clave, formato
public/minis/                Minis by Mónica (panel de gestión y chofer por WhatsApp)
public/rodelo/               Grupo Rodelo (Rodelo Copilot)
public/delidom/              Delidom (Central de Pedidos)
netlify/functions/ia/        la función que llama a Claude y los agentes de cada solución
servidor.mjs, render.yaml    la misma demo en Render
ejemplos/                    generadores de los documentos de ejemplo
pruebas/                     pruebas (npm run pruebas) y recorrido en el navegador (npm run navegador)
```
