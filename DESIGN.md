---
name: Panadería El Trigal · Demo
description: "Suspiro y chispitas": el panel de una panadería dominicana como un bizcocho de cumpleaños.
colors:
  suspiro: "#f4f8fd"
  superficie: "#ffffff"
  suave: "#e8f0fa"
  tinta: "#3a1f19"
  tinta-2: "#66463d"
  tinta-3: "#7a5a51"
  linea: "#dfe7f2"
  linea-2: "#c5d3e6"
  chocolate: "#4a2419"
  arandano: "#93b7f0"
  tostado: "#e3c79a"
  mora: "#cdb7f0"
  caramelo: "#f6be88"
  vainilla: "#fde5a0"
  pistacho: "#c0e3a1"
  coco: "#f1e9df"
  azul-fuerte: "#2f5fd0"
  rojo: "#b3122b"
  rojo-suave: "#ffdfe4"
  ambar: "#8a4300"
  ambar-suave: "#fff0c9"
  verde: "#22652a"
  verde-suave: "#ddf3cf"
  whatsapp: "#128c4a"
  serie-gazcue: "#6b46c1"
  serie-los-prados: "#b5560f"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(36px, 5.4vw, 72px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  cifra:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(16px, 12cqi, 30px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  control: "999px"
  campo: "12px"
  pedido: "16px"
  tarjeta: "18px"
  caja: "24px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "22px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.chocolate}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "#63332a"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.suave}"
  pill-ficticio:
    backgroundColor: "{colors.vainilla}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "4px 11px"
  badge-urgente:
    backgroundColor: "{colors.rojo-suave}"
    textColor: "{colors.rojo}"
    rounded: "{rounded.control}"
    padding: "2px 9px"
  badge-atender:
    backgroundColor: "{colors.ambar-suave}"
    textColor: "{colors.ambar}"
    rounded: "{rounded.control}"
    padding: "2px 9px"
  badge-ok:
    backgroundColor: "{colors.verde-suave}"
    textColor: "{colors.verde}"
    rounded: "{rounded.control}"
    padding: "2px 9px"
  card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "18px 20px"
  kpi-frosting:
    backgroundColor: "{colors.arandano}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.tarjeta}"
    padding: "30px 16px 14px"
    typography: "{typography.cifra}"
  nav-item-active:
    backgroundColor: "{colors.arandano}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.campo}"
    padding: "7px 11px"
---

# Design System: Panadería El Trigal · Demo

Aplica a `public/index.html`, `public/panel.html` y `public/en-vivo.html` (hoja `public/css/estilos.css`), a las ventanas de `public/js/pedidos-ui.js` y a la intro (`intro/lp.css`).
La ventana de WhatsApp (`whatsapp.html`, `css/whatsapp.css`) queda fuera de este sistema y tiene que seguir pareciendo WhatsApp.

## Overview

**Creative North Star: "Suspiro y chispitas"**

El panel de una panadería dominicana visto como un bizcocho de cumpleaños. Cada cifra es un bloque de glaseado que chorrea sobre su nombre; el fondo es suspiro azul, la tinta es chocolate y las chispitas de colores aparecen en la portada, en el asistente y cuando llega un pedido por WhatsApp. El dueño tiene que reconocer su negocio, no un producto técnico.

La densidad es baja y la letra grande: todo se ve a través de una pantalla compartida y comprimida en un webinar. Los glaseados dan alegría y orientación (cada sección tiene el suyo), pero los estados conservan su significado: rojo urgente, ámbar atender, verde bien. Se rechaza el panel de tarjetas grises iguales.

**Key Characteristics:**
- Fondo suspiro azul, tinta de chocolate, seis glaseados pastel siempre con tinta oscura encima.
- Borde que gotea (máscara SVG `--goteo`) bajo cada bloque de color.
- Todo control es una pastilla redonda.
- Chispitas como textura (portada, botón y cabecera del asistente) y como celebración (pedido de WhatsApp).
- Logo de cupcake sobre una ficha de chocolate inclinada −4°.

## Colors

Pastel de bizcocho sobre suspiro, con chocolate para la tinta y tres colores de estado fuertes que nunca se confunden con los glaseados.

### Primary
- **Chocolate** (chocolate): botón principal, logo, "Pregúntale a tu negocio", cabecera del asistente, avisos flotantes.
- **Azul fuerte** (azul-fuerte): foco del teclado, cursor y casillas, la serie única de los gráficos, el paso activo del asistente.

### Secondary: los glaseados
- **Arándano** (arandano), **Tostado** (tostado), **Mora** (mora), **Caramelo** (caramelo), **Vainilla** (vainilla), **Pistacho** (pistacho): bloques de cifra en ese orden, cajas de la portada (arandano, tostado, pistacho), columnas de pedidos por estado, burbuja del usuario (arandano), cabecera de las ventanas (vainilla).
- Cada sección del panel tiene su glaseado (`--tono`): Inicio arandano, Ventas tostado, Insumos vainilla, Cobros caramelo, Pedidos pistacho, Alertas mora. Pinta el menú activo, la marca del título y los segmentos activos.
- **Coco** (coco): insignia neutra y contadores sin urgencia.

### Tertiary: estados
- **Rojo** sobre **rojo suave**: urgente, no cuadra, contador de alertas.
- **Ámbar** sobre **ámbar suave**: atender, novedades y dudas.
- **Verde** sobre **verde suave**: bien, al día, cifra que sube.
- **Verde WhatsApp** (whatsapp): solo lo que llegó por WhatsApp.

### Neutral
- **Suspiro** (suspiro): fondo de toda página. **Superficie** blanca para tarjetas. **Suave** para hover.
- **Tinta**, **tinta 2** y **tinta 3**: texto principal, secundario y encabezados de tabla.
- **Línea** y **línea 2**: bordes de campos, separadores punteados de filas.

### Named Rules
**The Chocolate Ink Rule.** Sobre un glaseado el texto siempre es tinta de chocolate, nunca blanco.
**The States Keep Their Meaning Rule.** Rojo, ámbar y verde se usan solo para estados; un glaseado nunca dice "urgente".
**The Chart Series Rule.** Una serie: azul fuerte (azul-fuerte). Dos sucursales: mora profunda (serie-gazcue) para Gazcue y caramelo profundo (serie-los-prados) para Los Prados. Los glaseados pastel no son colores de serie.

## Typography

**Display Font:** SF Pro en Apple (`-apple-system`), Inter incluida (`public/fuentes/inter-variable.woff2`, familia "Inter Sitio") en lo demás.
**Body Font:** la misma.

**Character:** una sola familia, pesada en los titulares y las cifras (800) para que se lean como letras de pastelería, tranquila en el cuerpo. Cifras tabulares en todo el sitio.

### Hierarchy
- **Display** (800, clamp 36–72px, 1): titular de la portada.
- **Cifra** (800, clamp 16–30px por ancho del bloque, −0.03em): valor dentro del glaseado; las cajas de la portada usan 24px 800.
- **Headline** (700, 24px; 20px en pantallas angostas): título de la barra del panel.
- **Title** (700, 16px): título de tarjeta; el periodo va en la misma línea, en tinta 3 y peso 500.
- **Body** (400, 15px, 1.45): texto, tablas, burbujas del chat (1.55).
- **Label** (600, 13px): encabezados de tabla, insignias, leyendas, nombres de campo, pasos del asistente.

### Named Rules
**The Shared Screen Rule.** Cuerpo de 15px; ningún texto por debajo de 13px. Se lee en una videollamada comprimida.
**The Brand Typeface Rule.** SF Pro en Apple e Inter incluida en lo demás. No se agrega otra familia.

## Layout

- Panel: menú lateral de 252px (blanco, fijo) y contenido de hasta 1440px con 26px/32px de margen; barra superior de 68px con desenfoque sobre suspiro.
- Cifras en rejilla automática de mínimo 160px; filas de tarjetas de dos columnas (o 3fr/2fr); espacio de 22px entre bloques y 14px entre cifras.
- Pedidos: tablero de cinco columnas por estado (mínimo 190px).
- Portada: máximo 1160px, titular y tres cajas de bizcocho; la vista en vivo pone WhatsApp (400px) junto al panel incrustado, sin menú.
- Bajo 980px el menú pasa arriba en una fila desplazable, las filas se apilan y las cifras van de dos en dos. Bajo 760px las cajas de la portada se apilan; bajo 600px las columnas de pedidos se apilan.

## Elevation & Depth

Sombras cálidas de chocolate, suaves; la profundidad la dan sobre todo los bloques de color sobre blanco.
- **Reposo** (`0 1px 1px rgba(74,36,25,.05), 0 8px 20px -14px rgba(74,36,25,.35)`): tarjetas, cifras, pedidos, logo.
- **Flotante** (`0 22px 48px -18px rgba(74,36,25,.45)`): asistente, ventanas, avisos, caja de la portada en hover.

## Shapes

- Radios generosos: tarjetas y cifras 18px, cajas de la portada y ventanas 24px, pedidos 16px, campos de ventana 12px.
- Todo control (botones, menú, segmentos, filtros, insignias, contadores) es una pastilla de 999px.
- **The Drip Rule.** Un bloque de glaseado termina con el borde que gotea (`--goteo`, 240×28px, repetido en horizontal), no con una línea recta. Se usa en cifras, cajas de la portada (glaseado blanco sobre color) y cabeceras de ventana.
- Marcas de título: una chispita (12×5px, girada −35°) antes de cada título de tarjeta; una barra de 14×30px girada 14° antes del título de la barra.
- Separadores de filas punteados en línea 2.

## Components

### Buttons
- **Principal:** pastilla de chocolate, texto blanco 600 14px; sube 1px en hover.
- **Secundario:** blanco con borde de 2px en línea 2; en hover fondo suave y borde arandano.
- **Pequeño:** 5px 12px, 13px.
- **"Pregúntale a tu negocio":** bloque de chocolate de 16px de radio con chispitas que se desvanecen a la derecha; se inclina −1° en hover.

### Chips
- **Insignia:** una palabra de estado en pastilla (urgente, atender, ok, whatsapp; coco para neutro).
- **Datos ficticios:** pastilla vainilla en la cabecera. Una por página.

### Cards / Containers
- **Tarjeta:** blanca, 18px, sombra de reposo, 18px 20px de relleno; título con su chispita y acción a la derecha.
- **Pedido:** tarjeta de 16px con número, cliente, artículos, nota (suave, o ámbar si es novedad) y total en 800.

### Inputs / Fields
- Borde de 2px en línea; pastilla en filtros, 12px en ventanas, 20px en la caja del chat. Foco: borde azul fuerte. Foco de teclado global: contorno de 3px azul fuerte.

### Navigation
- Menú lateral de pastillas con icono de trazo 18px; activa en el glaseado de la sección y 700; contador en coco, o rojo si es urgente.

### Cifra de glaseado (firma)
- Bloque de color con el valor (cifra) abajo y el borde que gotea sobre el nombre en blanco. La comparación es una pastilla blanca arriba a la derecha con flecha y porcentaje, verde o roja; el detalle va en `title`.

### Ventana (`dialog.hoja`)
- 24px de radio, cabecera vainilla que gotea, cuerpo con 22px de margen, acciones a la derecha. Fondo de atrás en chocolate al 40%.

### Asistente
- Panel lateral de 460px (780px ampliado) sobre suspiro, cabecera de chocolate con chispitas. Burbuja del usuario arandano, de la IA blanca con sombra; los pasos de la IA se marcan con chispitas pistacho y la actual en azul fuerte.

## Do's and Don'ts

### Do:
- **Do** poner el periodo en el título de la tarjeta ("Ventas por día · 30 días") y la unidad en el encabezado de la columna ("Días en Gazcue").
- **Do** mostrar una pastilla "Datos ficticios" por página y no quitarla nunca.
- **Do** usar SF Pro en Apple e Inter incluida en lo demás.
- **Do** mantener el cuerpo en 15px y todo texto pequeño en 13px o más.
- **Do** pintar los gráficos de una serie en azul fuerte y los de dos sucursales en mora profunda (Gazcue) y caramelo profundo (Los Prados).
- **Do** animar solo con salida exponencial (`cubic-bezier(.16, 1, .3, 1)`).
- **Do** apagar todo movimiento con `prefers-reduced-motion`.

### Don't:
- **Don't** agregar textos de ayuda: ni subtítulos, ni notas bajo las cifras, ni lemas, ni pies de página.
- **Don't** usar rebote ni sobrepaso en ninguna animación.
- **Don't** lanzar chispitas por nada que no sea un pedido de WhatsApp que llega.
- **Don't** aplicar este sistema a la ventana de WhatsApp (`whatsapp.html`, `css/whatsapp.css`): sigue pareciendo WhatsApp.
- **Don't** poner texto blanco sobre un glaseado ni usar un glaseado para un estado.
