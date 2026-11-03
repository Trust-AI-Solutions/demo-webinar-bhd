---
name: Panadería El Trigal · Etiquetas de vitrina
description: Business panel, start page and live view of a fictional Dominican bakery, designed as the labels of the bakery display case.
colors:
  carton: "#f3ece1"
  papel: "#ffffff"
  papel-2: "#faf6ef"
  tinta: "#241c17"
  tinta-2: "#54473e"
  tinta-3: "#66574c"
  linea: "#e4d9ca"
  linea-2: "#cdbdaa"
  corteza: "#8a4a1f"
  anil: "#2e4f8f"
  guayaba: "#b0364f"
  menta: "#1b6b5c"
  cereza: "#9e2424"
  mora: "#5f3b78"
  cacao: "#2b1e18"
  trigo: "#ebbb4c"
  harina: "#e9dfd0"
  whatsapp: "#128c4a"
  serie-1: "#2a63ad"
  serie-2: "#c75a2a"
  sube: "#1d6b3f"
  baja: "#a3301f"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(42px, 5.6vw, 80px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  figure:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(19px, 12cqi, 34px)"
    fontWeight: 700
    letterSpacing: "-0.025em"
    lineHeight: 1
    fontFeature: "'tnum'"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "'tnum'"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, SF Pro Display, Inter Sitio, Segoe UI, system-ui, sans-serif"
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
    backgroundColor: "{colors.corteza}"
    textColor: "{colors.papel}"
    rounded: "{rounded.muestra}"
    padding: "16px 14px 18px"
  tag-ficticio:
    backgroundColor: "{colors.trigo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.cuadro}"
    padding: "6px 11px"
  input:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.muestra}"
    padding: "10px 12px"
---

# Design System: Panadería El Trigal · Etiquetas de vitrina

Applies to `public/panel.html`, `public/index.html`, `public/en-vivo.html` (stylesheet `public/css/estilos.css`). The WhatsApp window (`public/whatsapp.html`, `public/css/whatsapp.css`) is deliberately outside this system: it must keep looking like WhatsApp.

## Overview

**Creative North Star: "Las etiquetas de la vitrina"**

The business panel of a bakery, designed as the labels and ribbons of the display case and the cake boxes. Every number is a label: a saturated ribbon of colour carrying the figure, with a white card below naming it. Navigation is a stack of labels, and the active section is pulled out of the row. The start page is three labels tied with twine, fanned open on the knot.

It is built for screen sharing in a webinar: high contrast, large figures, one obvious focal point per view, and colour that always comes with a written label. It refuses the generic SaaS dashboard of identical white cards. The owner should see their own bakery, not software.

History: the system began as "Carta de colores" (a paint fan deck) for a bakery; on 03/11/2026 the fictional company became a bakery and the same skeleton was rethemed. Layout, components and rules did not change; colours, names and the logo did.

**Key Characteristics:**
- Saturated ribbon fields with white cards; no gradients.
- Warm kraft-paper ground; warm near-black ink.
- One typeface: SF Pro on Apple devices, Inter (bundled, near-identical) everywhere else; bold with tightened spacing for titles and figures.
- Small, crisp corners (4px), soft paper shadows.
- Colour identifies sections and states; it is always paired with text.

## Colors

A full palette of named bakery colours on a kraft-paper ground. Each colour is a ribbon with a name, used as a whole field, not as a thin accent.

### Ribbons (section and state colours)
- **Corteza** (#8a4a1f, crust brown): brand and Inicio; "Listo para entrega"; positive results; the AI answer band; single-series charts.
- **Añil** (#2e4f8f): Ventas; "Teléfono" orders; "En preparación"; low-severity alerts.
- **Trigo** (#ebbb4c): Insumos y menú; "Nuevo" orders; "Atender" alerts; the "Datos ficticios" tag; selection and focus ring. Takes ink text, never white.
- **Guayaba** (#b0364f): Clientes y cobros; 31–60 days overdue.
- **Menta** (#1b6b5c): Pedidos.
- **Cereza** (#9e2424): Alertas; "Urgente"; more than 60 days overdue; counters.
- **Mora** (#5f3b78): margin figures; "En ruta"; "Correo" orders.
- **Cacao** (#2b1e18): the AI assistant label and primary buttons.
- **Harina** (#e9dfd0): "Mostrador" orders; delivered; neutral tags. Takes ink text.
- **Verde WhatsApp** (#128c4a): anything that came through WhatsApp.

### Chart series
- **Azul Gazcue** (#2a63ad) and **Naranja Los Prados** (#c75a2a): the two-branch comparison. This pair passes the colour-blindness validator; keep it as the only two-series pair.

### Neutral
- **Estraza** (#f3ece1): page ground (token `--carton`).
- **Papel** (#ffffff) / **Papel 2** (#faf6ef): cards, label cards, drawer ground.
- **Tinta** (#241c17), **Tinta 2** (#54473e), **Tinta 3** (#66574c): text, secondary text, muted text (all at least 5:1 on Estraza).
- **Línea** (#e4d9ca) / **Línea 2** (#cdbdaa): dividers and control borders.

### Named Rules
**The Chip Rule.** Colour lives in whole fields (a chip, a column header, an order band), never as a thin coloured edge on a white box.
**The Label Rule.** Every colour carries a written label next to it (metric name, state word, channel name). Colour never carries meaning alone.
**The Ink-on-Light Rule.** Trigo and Harina take Tinta text; every other ribbon takes white.

## Typography

**Font:** SF Pro, the system font on Mac, iPhone and iPad (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"`). Apple's licence does not allow embedding SF Pro in a website, so it is requested from the system. Everywhere else the page uses **Inter** (variable, with optical sizes, self-hosted at `public/fuentes/inter-variable.woff2`, SIL OFL), which is designed to look very close to SF Pro. Then Segoe UI, then system-ui.

**Character:** Clean and familiar, like a well-made app. Titles and figures are bold (700) with tightened letter-spacing; body text is regular with tabular figures so columns of pesos line up.

### Hierarchy
- **Display** (700, clamp(42px, 5.6vw, 80px), line-height 1, -0.04em): start-page headline only.
- **Headline** (700, 30px, -0.02em): page title in the top bar.
- **Title** (700, 17px, -0.02em): card titles, preceded by a 14px colour square in the section colour.
- **Figure** (700, clamp(15px, 9.5cqi, 34px), -0.025em, tabular): the number inside a chip, sized from the chip's width so it never truncates.
- **Body** (400, 15px, 1.45, tabular figures everywhere).
- **Label** (700, 11px, uppercase, 0.07em tracking): table column headers only.

### Named Rules
**The No-Kicker Rule.** Nothing sits above a figure or a heading: no colour names, codes or eyebrow labels. The figure leads the chip; the label strip below names it.
**The System-Font Rule.** Never embed SF Pro files; ask the system for it and keep Inter as the bundled fallback.

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
- **Primary:** Cacao with white text, 4px corners, 10px/16px padding, weight 700.
- **Secondary:** Papel with a 1px Línea 2 border.
- **Focus:** a 3px Trigo outline with a 2px offset, on every control.

### KPI chip ("muestra")
A colour field (minimum 96px tall) with the white figure at the bottom, above a white label strip holding the metric name (13.5px/700) and a note (12px). Change notes use drawn triangle icons in Sube green or Baja red.

### Navigation ("carta")
White strips with a 16px colour square and a stroke icon. The active strip drops the square, fills with its section colour, takes white text, and moves 16px to the right, pulled out of the row of labels. Hover moves 6px.

### Alerts ("muestras que se sacan")
A row of a 104px colour field holding the state word (Urgente, Atender, Revisar) and a white text block. On hover the row slides 4px.

### Order card
A colour band with the order number and channel (WhatsApp, Teléfono, Mostrador or Correo colour), then the customer, items, and total plus an "Avanzar" button. A new WhatsApp order slides in from a 7° tilt with a green ring; this is the panel's one motion moment.

### Assistant drawer
A Cacao header with a wheat-yellow spark. Suggestions are strips with a colour edge chip. Answers are white cards with a Corteza band ("Respuesta con sus cifras", sentence case). Progress steps are colour squares that fill as each lookup completes.

### Start-page fan
Three chips (WhatsApp, Panel, Los dos a la vez) rotate on a drawn twine knot (an SVG grommet). They open once on load, from closed to −59°, −25° and 0°. The front chip stays straight so its text is sharp over video.

## Do's and Don'ts

### Do:
- **Do** give every new section or state a chip from the palette, and pair it with a written word.
- **Do** size figures from the chip width (12cqi) so peso amounts never truncate, on SF Pro and on Inter.
- **Do** keep "Datos ficticios" visible on every view.
- **Do** keep one motion moment per surface (the fan opening, the new order sliding in) and respect reduced motion.

### Don't:
- **Don't** add labels, codes or colour names above figures or headings.
- **Don't** use a thick coloured bar on the left or right edge of a card, row or tab; colour the whole field or use a colour square.
- **Don't** fake materials with gradients (metal, glass, glow); draw them flat as SVG.
- **Don't** use keyboard characters as icons; use the stroke icon set in `public/js/iconos.js`.
- **Don't** restyle the WhatsApp window with this system.
