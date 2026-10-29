# Demo para el webinar con BHD · Ferretería Los Pinos

Demo en vivo para el webinar "Oportunidad de IA para tu empresa" (BHD, noviembre de 2026).
Muestra dos herramientas conectadas a Claude (Anthropic) sobre una empresa **inventada**:

- **Panel del negocio** (`panel.html`): ventas, inventario, clientes y cobros, pedidos y alertas,
  más "Pregúntale a tu negocio", un asistente que responde preguntas consultando las cifras.
- **Asistente de WhatsApp** (`whatsapp.html`): precios, disponibilidad, cotizaciones y pedidos.
  Pasa a una persona cuando hay descuentos, crédito o reclamos.
- **Los dos a la vez** (`en-vivo.html`): el pedido que hace el cliente por WhatsApp aparece en el
  panel en el momento, con un aviso.

La empresa, sus clientes y sus cifras son ficticios. No hay datos de ninguna empresa del beta ni
de clientes reales. El brief y el contexto del evento viven en el segundo cerebro:
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

- Los datos se generan en el navegador (`public/js/datos.js`) con una semilla fija: 145 productos,
  120 clientes, 2 sucursales, 4 vendedores y unos 2,900 tickets de los últimos 6 meses, siempre
  hasta el día de hoy. No hay base de datos.
- Lo que se crea durante la demo (pedidos, cotizaciones, avisos) se guarda en el navegador y se
  comparte entre las ventanas abiertas. "Restablecer la demo" lo borra.
- La clave de Anthropic solo existe en Netlify. El navegador nunca la ve.
- Modelo: `claude-opus-5-5` con esfuerzo `low` (respuestas rápidas). Se puede cambiar con las
  variables `MODELO_IA` y `ESFUERZO_IA` sin tocar el código.

### Situaciones sembradas en los datos (para que la IA las encuentre)

1. La sucursal Villa Mella vende alrededor de un tercio menos en las últimas 4 semanas.
2. El cemento gris en Herrera alcanza para uno o dos días.
3. Constructora Ozama pasó su límite de crédito y tiene facturas con más de 60 días de atraso.
4. El costo de las pinturas subió 12 % hace 6 semanas y el precio no se ajustó: el margen cayó.
5. Hay inventario sin ventas en 90 días (calentadores de agua de 30 galones, entre otros).

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
  js/herramientas.js     herramientas que la IA puede usar
  js/ia.js               conversación con /api/ia
  vendor/                Chart.js 4.4.1 (licencia MIT), incluido para no depender de un CDN
netlify/functions/ia/    función que llama a Claude (instrucciones y herramientas en config.mjs)
pruebas/                 pruebas automáticas
GUION-DEMO.md            guion sugerido para el webinar
```
