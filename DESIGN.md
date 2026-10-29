---
name: Ferretería Los Pinos · Carta de colores
description: Business panel, start page and live view of a fictional Dominican hardware store, designed as the paint fan deck from the shop counter.
colors:
  carton: "#efeee9"
  papel: "#ffffff"
  papel-2: "#f8f7f4"
  tinta: "#1c1f1d"
  tinta-2: "#4a524d"
  tinta-3: "#5d655f"
  linea: "#dedcd5"
  linea-2: "#c9c6bd"
  pino: "#1d5c47"
  ozama: "#1d4f8f"
  terracota: "#a8461f"
  turquesa: "#0e6f6c"
  oxido: "#9b2b1f"
  malva: "#6b4c8a"
  carbon: "#1c1f1d"
  cemento: "#f0bf2e"
  perla: "#dcd8cf"
  whatsapp: "#128c4a"
  serie-1: "#2a63ad"
  serie-2: "#c75a2a"
  sube: "#1d6b3f"
  baja: "#a3301f"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(40px, 5.2vw, 72px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 115"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    fontVariation: "'wdth' 112"
  figure:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(20px, 14cqi, 36px)"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 75"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum'"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.07em"
rounded:
  muestra: "4px"
  tarjeta: "6px"
  cuadro: "2px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "22px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.papel}"
    rounded: "{rounded.muestra}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.muestra}"
    padding: "10px 16px"
  kpi-muestra:
    backgroundColor: "{colors.pino}"
    textColor: "{colors.papel}"
    rounded: "{rounded.muestra}"
    padding: "16px 14px 18px"
  tag-ficticio:
    backgroundColor: "{colors.cemento}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.cuadro}"
    padding: "6px 11px"
  input:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.muestra}"
    padding: "10px 12px"
---

# Design System: Ferretería Los Pinos · Carta de colores

Applies to `public/panel.html`, `public/index.html`, `public/en-vivo.html` (stylesheet `public/css/estilos.css`). The WhatsApp window (`public/whatsapp.html`, `public/css/whatsapp.css`) is deliberately outside this system: it must keep looking like WhatsApp.

## Overview

**Creative North Star: "La carta de colores"**

The business panel of a hardware store, designed as the paint fan deck every Dominican hardware owner has fanned open on the counter. Every number is a paint chip: a saturated colour field carrying the figure, with a white label strip below naming it. Navigation is a stack of strips, and the active section is pulled out of the deck. The start page is the deck itself, fanned open on its pivot.

It is built for screen sharing in a webinar: high contrast, large figures, one obvious focal point per view, and colour that always comes with a written label. It refuses the generic SaaS dashboard of identical white cards. The owner should see their own shop, not software.

**Key Characteristics:**
- Saturated chip fields with white label strips; no gradients.
- Warm grey card-stock ground; near-black ink.
- One typeface (Archivo) used at different widths: wide for headings, narrow for figures.
- Small, crisp corners (4px), soft paper shadows.
- Colour identifies sections and states; it is always paired with text.

## Colors

A full palette of named paint chips on a neutral card-stock ground. Each colour is a chip with a name, used as a whole field, not as a thin accent.

### Chips (section and state colours)
- **Verde Pino** (#1d5c47): brand and Inicio; positive results; the AI answer band; single-series charts.
- **Azul Ozama** (#1d4f8f): Ventas; "Teléfono" orders; "En preparación"; low-severity alerts.
- **Amarillo Cemento** (#f0bf2e): Inventario; "Nuevo" orders; "Atender" alerts; the "Datos ficticios" tag; selection and focus ring. Takes ink text, never white.
- **Terracota** (#a8461f): Clientes y cobros; 31–60 days overdue.
- **Turquesa Caribe** (#0e6f6c): Pedidos.
- **Rojo Óxido** (#9b2b1f): Alertas; "Urgente"; more than 60 days overdue; counters.
- **Malva Atardecer** (#6b4c8a): margin figures; "En ruta"; "Correo" orders.
- **Negro Carbón** (#1c1f1d): the AI assistant chip and primary buttons.
- **Gris Perla** (#dcd8cf): "Mostrador" orders; delivered; neutral tags. Takes ink text.
- **Verde WhatsApp** (#128c4a): anything that came through WhatsApp.

### Chart series
- **Azul Herrera** (#2a63ad) and **Terracota Villa Mella** (#c75a2a): the two-branch comparison. This pair passes the colour-blindness validator; keep it as the only two-series pair.

### Neutral
- **Cartón** (#efeee9): page ground.
- **Papel** (#ffffff) / **Papel 2** (#f8f7f4): cards, label strips, drawer ground.
- **Tinta** (#1c1f1d), **Tinta 2** (#4a524d), **Tinta 3** (#5d655f): text, secondary text, muted text (all at least 5:1 on Cartón).
- **Línea** (#dedcd5) / **Línea 2** (#c9c6bd): dividers and control borders.

### Named Rules
**The Chip Rule.** Colour lives in whole fields (a chip, a column header, an order band), never as a thin coloured edge on a white box.
**The Label Rule.** Every colour carries a written label next to it (metric name, state word, channel name). Colour never carries meaning alone.
**The Ink-on-Light Rule.** Amarillo Cemento and Gris Perla take Tinta text; every other chip takes white.

## Typography

**Font:** Archivo variable (self-hosted, `public/fuentes/archivo-variable.woff2`, SIL OFL), with system-ui fallback.

**Character:** One grotesque used like shop signage. Stretched wide and heavy for headings, compressed for figures so long peso amounts fit inside a chip.

### Hierarchy
- **Display** (800, clamp(40px, 5.2vw, 72px), line-height 0.98, width 115%): start-page headline only.
- **Headline** (800, 30px, width 112%): page title in the top bar.
- **Title** (800, 17px, width 112%): card titles, preceded by a 14px colour square in the section colour.
- **Figure** (800, clamp(20px, 14cqi, 36px), width 75%, tabular): the number inside a chip. Sized from the chip's width so it never truncates.
- **Body** (400, 15px, 1.45, tabular figures everywhere).
- **Label** (700, 11px, uppercase, 0.07em tracking): table column headers only.

### Named Rules
**The No-Kicker Rule.** Nothing sits above a figure or a heading: no colour names, codes or eyebrow labels. The figure leads the chip; the label strip below names it.

## Layout

- Panel: a 260px sidebar plus a fluid main column. A sticky top bar (92px) carries the section chip, the title, the date and the "Datos ficticios" tag. Content is padded 26px/32px with 22px gaps.
- KPI row: `repeat(auto-fit, minmax(170px, 1fr))`, gap 14px. Card rows are two columns, or 3fr/2fr where alerts sit beside recent orders.
- Order board: five columns at `minmax(200px, 1fr)`. In the live view (`?incrustado`) the sidebar is hidden and the board shows its four active columns.
- Start page: two columns (headline left, fan right), max width 1240px. Below 900px the fan becomes a vertical stack of chips.
- Below 980px the sidebar becomes a horizontal scrolling row of tabs above the content.

## Elevation & Depth

Paper on card stock: soft, offset shadows, never glows.

### Shadow Vocabulary
- **Muestra** (`0 1px 0 rgba(28,31,29,.06), 0 10px 18px -10px rgba(28,31,29,.35)`): chips, order cards, the active nav strip, the AI chip.
- **Tarjeta** (`0 1px 2px rgba(28,31,29,.05), 0 12px 28px -18px rgba(28,31,29,.3)`): white content cards.

## Shapes

Small, crisp corners: 4px for chips, buttons, inputs and tabs; 6px for cards and board columns; 2px for colour squares and tags. A chip is always split into a colour field and a white label strip, with the strip carrying the 1px Línea border.

## Components

### Buttons
- **Primary:** Negro Carbón with white text, 4px corners, 10px/16px padding, weight 700.
- **Secondary:** Papel with a 1px Línea 2 border.
- **Focus:** a 3px Amarillo Cemento outline with a 2px offset, on every control.

### KPI chip ("muestra")
A colour field (minimum 96px tall) with the white figure at the bottom, above a white label strip holding the metric name (13.5px/700) and a note (12px). Change notes use drawn triangle icons in Sube green or Baja red.

### Navigation ("carta")
White strips with a 16px colour square and a stroke icon. The active strip drops the square, fills with its section colour, takes white text, and moves 16px to the right, pulled out of the deck. Hover moves 6px.

### Alerts ("muestras que se sacan")
A row of a 104px colour field holding the state word (Urgente, Atender, Revisar) and a white text block. On hover the row slides 4px.

### Order card
A colour band with the order number and channel (WhatsApp, Teléfono, Mostrador or Correo colour), then the customer, items, and total plus an "Avanzar" button. A new WhatsApp order slides in from a 7° tilt with a green ring; this is the panel's one motion moment.

### Assistant drawer
A Negro Carbón header with a cement-yellow spark. Suggestions are strips with a colour edge chip. Answers are white cards with a Verde Pino band ("Respuesta con sus cifras", sentence case). Progress steps are colour squares that fill as each lookup completes.

### Start-page fan
Three chips (WhatsApp, Panel, Los dos a la vez) rotate on a drawn pivot (an SVG grommet). They open once on load, from closed to −59°, −25° and 0°. The front chip stays straight so its text is sharp over video.

## Do's and Don'ts

### Do:
- **Do** give every new section or state a chip from the palette, and pair it with a written word.
- **Do** keep figures in Archivo at narrow width (75%) and sized to the chip, so peso amounts never truncate.
- **Do** keep "Datos ficticios" visible on every view.
- **Do** keep one motion moment per surface (the fan opening, the new order sliding in) and respect reduced motion.

### Don't:
- **Don't** add labels, codes or colour names above figures or headings.
- **Don't** use a thick coloured bar on the left or right edge of a card, row or tab; colour the whole field or use a colour square.
- **Don't** fake materials with gradients (metal, glass, glow); draw them flat as SVG.
- **Don't** use keyboard characters as icons; use the stroke icon set in `public/js/iconos.js`.
- **Don't** restyle the WhatsApp window with this system.
