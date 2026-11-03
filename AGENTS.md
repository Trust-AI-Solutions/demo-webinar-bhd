# AGENTS.md · demo-webinar-bhd

Demo en vivo para el webinar de BHD: el panel de negocio y el asistente de WhatsApp de una panadería **inventada** (Panadería El Trigal), conectados a Claude. Claude Code lo lee a través de `CLAUDE.md`.

## Reglas

- Solo datos ficticios. Nada de empresas del beta (Minis, Hulkcell, Engomas, Delidom, Rodelo) ni de clientes reales.
- Ningún secreto en el repo. La clave de Anthropic y `CLAVE_DEMO` viven en Netlify y en LastPass.
- Todo lo que ve el público, en español dominicano, sin jerga técnica.
- La ventana de WhatsApp (`whatsapp.html`, `css/whatsapp.css`) no cambia de aspecto.
- Diseño: seguir `DESIGN.md`. Sin textos de ayuda; color solo cuando significa algo.
- Antes de subir: `npm run pruebas` y `node pruebas/navegador.mjs` en verde.
- Commits pequeños en `main`, con la cuenta de Trust de cada persona.

## Mapa

| Ruta | Qué hay |
|---|---|
| `public/js/datos.js` | La empresa y sus datos, generados con semilla fija y anclados a hoy. Las cinco situaciones sembradas están en el encabezado |
| `public/js/negocio.js` | Consultas sobre los datos (las usan las pantallas y la IA) |
| `public/js/definiciones.js` | Cada herramienta de la IA, una sola vez: nombre, etiqueta, descripción y parámetros |
| `public/js/herramientas.js` | Lo que hace cada herramienta, en el navegador (`EJECUTAR[modo][nombre]`) |
| `public/js/pedidos.js` | Crear y actualizar pedidos y guardar el reporte de consignación (WhatsApp, formulario y documentos usan lo mismo) |
| `public/js/estado.js` | Lo creado durante la demo, en `localStorage`, compartido entre ventanas |
| `public/js/ia.js` | Conversación con `/api/ia` y lectura de documentos |
| `public/js/panel.js`, `pedidos-ui.js`, `whatsapp.js` | Pantallas |
| `netlify/functions/ia/` | La función que llama a Claude (`ia.mjs`) y sus instrucciones por modo (`config.mjs`) |
| `intro/` | La intro animada (React, kit de stageshow). Se compila con `npm run intro` a `public/intro/` |
| `ejemplos/generar.mjs` | Genera los documentos de ejemplo de `public/ejemplos/` |
| `pruebas/` | Pruebas de datos y función (`npm run pruebas`) y del navegador con un "Claude" de guion |

## Cómo se hace

- **Agregar una herramienta de la IA:** definirla en `definiciones.js` (en el modo que toque) y escribir su función en `herramientas.js`. Una prueba revisa que las dos listas coincidan. Si cambia lo que la IA debe hacer, ajustar las instrucciones en `config.mjs`.
- **Cambiar datos:** `datos.js`. Las pruebas de `negocio.prueba.mjs` fijan las situaciones sembradas; si una cambia, cambiar la prueba y el guion (`GUION-DEMO.md`).
- **Cambiar un documento de ejemplo:** editar `ejemplos/generar.mjs` y correr `node ejemplos/generar.mjs`.
- **Probar con la IA real en local:** `npx netlify dev` con `ANTHROPIC_API_KEY` en el entorno de la terminal.
