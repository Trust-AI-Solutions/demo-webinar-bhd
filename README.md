# Demo para el webinar con BHD · Panadería El Trigal

Demo en vivo para el webinar "Oportunidad de IA para tu empresa" (BHD, noviembre de 2026).
Muestra dos herramientas conectadas a Claude (Anthropic) sobre una empresa **inventada**:

- **Panel del negocio** (`panel.html`): ventas, insumos y menú, clientes y cobros, pedidos y alertas,
  más "Pregúntale a tu negocio", un asistente que responde preguntas consultando las cifras.
  En **Pedidos**: "Nuevo pedido" (a mano, con el total calculado) e "Importar PDF o foto": la IA lee
  una orden de compra, la hoja del repartidor o el reporte de ventas de la cadena donde la panadería
  deja empacados en consignación, y propone el pedido, los cambios o la conciliación; una persona
  revisa y aplica. En **Ventas**, la consignación compara lo entregado con lo que la cadena reporta
  vendido, tienda por tienda.
- **Asistente de WhatsApp** (`whatsapp.html`): precios, encargos de bizcochos y bandejas,
  cotizaciones y pedidos. Pasa a una persona cuando hay descuentos, crédito, diseños especiales,
  alergias o reclamos.
- **Los dos a la vez** (`en-vivo.html`): el pedido que hace el cliente por WhatsApp aparece en el
  panel en el momento, con un aviso.

La empresa, sus clientes y sus cifras son ficticios. No hay datos de ninguna empresa del beta ni
de clientes reales. Hasta el 03/11/2026 la empresa inventada era una ferretería; ahora es una
panadería. Para que no se parezca a ningún cliente del beta: no vende en consignación, no hay
reportes de supermercado, no hay productos "minis" y el asistente no tiene nombre propio. El brief y el contexto del evento viven en el segundo cerebro:
`trusts-ai-solution/outputs/webinar-bhd-2026-11/mockup-brief.md`.

## Cómo funciona

```
navegador                                   Netlify                      Anthropic
public/*.html ── conversación ──▶ /api/ia (netlify/functions/ia) ──▶ Claude
     ▲                                          │ (agrega instrucciones,
     │ resultados de herramientas               │  herramientas y la clave)
     └──── public/js/herramientas.js ◀── pide una herramienta ──┘
           (consulta los datos ficticios en el navegador)
```

- Los datos se generan en el navegador (`public/js/datos.js`) con una semilla fija: 63 productos en
  el menú, 28 insumos de producción (con existencia y uso diario por sucursal), 120 clientes
  (personas y negocios: colmados, cafeterías, hoteles), 2 sucursales (Gazcue, con el horno
  principal, y Los Prados), 4 vendedores y unos 10,500 tickets de los últimos 6 meses, siempre
  hasta el día de hoy. No hay base de datos.
- Lo que se crea durante la demo (pedidos, cotizaciones, avisos) se guarda en el navegador y se
  comparte entre las ventanas abiertas. "Restablecer la demo" lo borra.
- La clave de Anthropic solo existe en Netlify. El navegador nunca la ve.
- Modelo: `claude-opus-5-5` con esfuerzo `low` (respuestas rápidas). Se puede cambiar con las
  variables `MODELO_IA` y `ESFUERZO_IA` sin tocar el código. Leer un PDF o una foto usa esfuerzo
  `medium` (variable `ESFUERZO_DOCUMENTO`).
- "Importar PDF o foto" hace una sola consulta: envía el archivo (las fotos se reducen a 1600 px en
  el navegador; PDF de hasta 4 MB) con el menú, los clientes y los pedidos abiertos, y la IA
  responde con la herramienta `proponer_resultado`. Nada se aplica sin aprobarlo en pantalla.

### Situaciones sembradas en los datos (para que la IA las encuentre)

1. La sucursal Los Prados vende alrededor de un tercio menos en las últimas 4 semanas.
2. La mantequilla en Gazcue alcanza para poco más de un día de producción.
3. Hotel Brisas de Gazcue pasó su límite de crédito y tiene facturas con más de 60 días de atraso.
4. La mantequilla y la crema subieron hace 6 semanas y el precio de los bizcochos no se ajustó: el
   margen de "Bizcochos y tortas" cayó.
5. Hay productos del menú sin ventas en 90 días (pan de centeno con semillas y bizcocho de
   zanahoria sin azúcar).

## Publicar en Netlify

1. En Netlify: **Add new project → Import an existing project → GitHub** y elegir
   `Trust-AI-Solutions/demo-webinar-bhd`. Netlify lee `netlify.toml` (publica `public/`, función en
   `netlify/functions/`). No hace falta comando de build.
2. En **Project configuration → Environment variables**, agregar (alcance: Functions):
   - `ANTHROPIC_API_KEY`: la clave del equipo. Está en LastPass; no se escribe en ningún otro lugar.
   - `CLAVE_DEMO` (opcional, recomendado): una palabra que la demo pide antes de usar la IA, para
     que quien encuentre el enlace no gaste la clave. Guardarla también en LastPass.
3. Volver a desplegar (**Deploys → Trigger deploy**) para que la función lea las variables.
4. Abrir el sitio, probar una pregunta en el panel y una en WhatsApp.

Protecciones incluidas: límite de 40 consultas por minuto por visitante (`rateLimit` en la
función), conversaciones de hasta 90 mensajes, y `noindex` para que los buscadores no lo listen.

## Intro animada de la portada

La portada abre con una animación de unos 15 segundos (encargo de un bizcocho por WhatsApp → panel → pregunta sobre insumos y respuesta), hecha con el kit de stageshow (React). El código está en `intro/` y se compila a `public/intro/` con:

```bash
npm install
npm run intro
```

El resultado compilado se sube al repo, así que Netlify no compila nada. "Comenzar" muestra la portada; al volver desde otra vista se va directo a la portada, y "Ver la introducción" la repite. Notas del ensayo: `intro/REHEARSAL.md`.

## PDF de ejemplo

`public/ejemplos/` trae cuatro documentos ficticios para la demo (se generan con
`node ejemplos/generar.mjs`):

- `orden-de-compra-meson-del-cafe.pdf`: orden de compra de una cafetería, con un pan de masa madre
  que no está en el menú y un bizcocho para el viernes.
- `reporte-de-entregas-ruta-manana.pdf`: hoja de reparto de la ruta de la mañana, con un número de
  pedido que no existe.
- `reporte-ventas-la-canasta.pdf`: reporte semanal de ventas de Minimarkets La Canasta (cadena
  ficticia donde la panadería deja empacados en consignación). En Naco reportan 32 panes de molde
  vendidos y solo se entregaron 30, y en Piantini aparece una galleta que no es de El Trigal.
- `foto-encargo-escrito-a-mano.jpg`: foto de un encargo escrito a mano, con una torta de
  guanábana que no está en el menú. Sirve para probar la lectura de fotos.
 Los pedidos de esa ruta (P-1302, P-1305, P-1306 y P-1307) son fijos
en `datos.js`, así que el PDF coincide cualquier día.

## Probar sin gastar la clave

```bash
npm install
npm run pruebas                  # datos, herramientas y función (con Anthropic simulado)
node pruebas/navegador.mjs       # punta a punta en Chromium con un "Claude" de guion
```

`pruebas/navegador.mjs` guarda capturas en `pruebas/capturas/` (no se suben al repo).

Para probar con la IA real en local: `npx netlify dev` con `ANTHROPIC_API_KEY` en el entorno de
la terminal (nunca en un archivo del repo).

## Estructura

```
public/                  sitio estático
  index.html             portada (elige la vista)
  panel.html             panel del negocio
  whatsapp.html          asistente de WhatsApp
  en-vivo.html           WhatsApp y panel lado a lado
  js/datos.js            empresa y datos ficticios
  js/negocio.js          consultas (las usan el panel y la IA)
  js/herramientas.js     lo que hace cada herramienta, en el navegador
  js/definiciones.js     herramientas de la IA (nombre, etiqueta, descripción, parámetros)
  js/ia.js               conversación con /api/ia y lectura de documentos
  js/pedidos.js          crear y actualizar pedidos (WhatsApp, formulario y documentos)
  js/pedidos-ui.js       ventanas "Nuevo pedido" e "Importar PDF o foto"
  ejemplos/              PDF ficticios de ejemplo
  vendor/                Chart.js 4.4.1 (licencia MIT), incluido para no depender de un CDN
netlify/functions/ia/    función que llama a Claude (instrucciones en config.mjs)
ejemplos/generar.mjs     genera los PDF de ejemplo
pruebas/                 pruebas automáticas
GUION-DEMO.md            guion sugerido para el webinar
AGENTS.md                mapa y reglas para agentes (y personas) que trabajen en el repo
DESIGN.md                reglas de diseño
```
