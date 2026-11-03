---
name: Panadería El Trigal · Demo
description: Sistema sobrio para la portada, el panel y la vista en vivo de una panadería ficticia.
colors:
  fondo: "#faf9f7"
  superficie: "#ffffff"
  suave: "#f3f1ed"
  tinta: "#1c1917"
  tinta-2: "#57524c"
  tinta-3: "#736c64"
  linea: "#ebe7e1"
  linea-2: "#d9d3cb"
  marca: "#8a4a1f"
  rojo: "#b42318"
  ambar: "#b54708"
  verde: "#067647"
  whatsapp: "#128c4a"
  serie-1: "#2a63ad"
  serie-2: "#c75a2a"
---

# Diseño

Aplica a `public/index.html`, `public/panel.html` y `public/en-vivo.html` (hoja `public/css/estilos.css`) y a la intro (`intro/lp.css`). La ventana de WhatsApp (`whatsapp.html`, `css/whatsapp.css`) queda fuera a propósito: tiene que parecer WhatsApp.

## Idea

Simple como Linear o Apple Notes: un propósito por pantalla, el contenido manda y la interfaz se aparta. Pensado para compartir pantalla en un webinar: cifras grandes, alto contraste, un foco por vista.

## Reglas

1. **Sin textos de ayuda.** No hay subtítulos, notas bajo las cifras, lemas ni pies de página. Si una pantalla necesita una explicación, se arregla la pantalla: el periodo va en el título de la tarjeta ("Ventas por día · 30 días"), la unidad va en el encabezado de la columna ("Días en Gazcue").
2. **Color solo cuando significa algo.** Rojo: urgente o no cuadra. Ámbar: atender. Verde: bien o al día. Verde WhatsApp: llegó por WhatsApp. La marca (corteza) aparece en el logo, los gráficos de una serie y el foco. Todo lo demás es blanco, gris cálido y tinta.
3. **Siempre "Datos ficticios".** Una sola pastilla gris por página. Es la única etiqueta que nunca se quita.
4. **Una letra.** SF Pro en Apple; Inter (incluida, `public/fuentes/`) en lo demás. Pesos 400, 500 y 600. Cifras tabulares.

## Piezas

- **Cifras** (`.cifras > .cifra`): una franja blanca con divisiones; nombre arriba (13 px, gris) y valor debajo (hasta 26 px, 600). La comparación es una flecha con su porcentaje; el detalle va en el `title`.
- **Tarjeta** (`.tarjeta`): blanca, borde de 1 px, radio 8 px. Título de 14 px; el periodo, en gris, en la misma línea; la acción, a la derecha.
- **Tabla**: encabezados de 12 px en gris, filas separadas por una línea, números a la derecha.
- **Insignia** (`.insignia`): pastilla de una o dos palabras. Variantes `alta` (rojo), `media` (ámbar), `ok` (verde) y `whatsapp`.
- **Alertas** (`.alertas`): un punto de color y el texto.
- **Botones**: principal en tinta; secundario blanco con borde. Radio 6 px.
- **Menú del panel**: lista con icono y nombre; la sección activa con fondo gris claro. El botón "Pregúntale a tu negocio" va abajo, en tinta.
- **Pedidos**: columnas por estado con el nombre y la cuenta; cada pedido es una tarjeta con número, canal, cliente, artículos, total y "Avanzar".
- **Ventanas** (`dialog.hoja`): cabecera blanca con título y cerrar; cuerpo con aire.

## Movimiento

Corto y con propósito: el pedido que llega se marca un momento en verde; los avisos suben desde abajo; el asistente entra desde la derecha. Todo se apaga con `prefers-reduced-motion`.
