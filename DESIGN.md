# Diseño

La demo no tiene un sistema propio: cada solución copia el de lo que se construyó para el cliente, para que el dueño lo reconozca. Lo común es mínimo: la barra para cambiar de solución y la portada.

## Lo común

- **Barra para cambiar de solución** (`public/comun/cambiador.js`): 44 px, fija arriba, gris muy oscuro `#161b22` con texto `#e6e9ee`. Al centro, las tres soluciones como pastillas con un punto de su color (Minis `#e02b20`, Rodelo `#f5c542`, Delidom `#16774a`); la actual va en blanco. A la izquierda "Inicio"; a la derecha "Datos ficticios" (naranja Trust) y "Restablecer". Altura en `--alto-cambiador`: los encabezados fijos de cada solución van debajo.
- **Portada** (`public/index.html`): marca The Trust, azul marino `#00246c` y naranja `#f08424`, fondo `#f5f7fb`. Tres tarjetas blancas con una franja del color de cada cliente arriba.
- **Letra:** la del sistema (SF Pro en Mac) con Inter local (`public/fuentes/`) de respaldo. Cifras tabulares.
- **Ventana de la clave** (`public/comun/clave.js`): neutra, la misma en las tres.

## Minis by Mónica (`public/minis/css/minis.css`)

Del panel vigente del piloto (septiembre de 2026, `pymes-rd-agentes/minis-panel`): cabecera vino (`#430A18` → `#77152F`) con "Minis by Mónica 🍒" en Playfair Display, franja cereza y bizcocho de 3 px debajo, y barra lateral fija vino oscuro (`#5B1022` → `#3D0A16`) de 196 px con iconos de línea. Contenido sobre `#F7F5F2`, tarjetas blancas de 9 px de radio, letra Nunito Sans, cifras en 27 px / 800 (en la demo, la letra va más grande: tablas de 14,5 px, notas de 14,5 px, cifras de 32 px, barra lateral de 224 px). Cereza `#74142B`, verde tallo `#3E7C4F`. La hoja del panel va primero y casi sin cambios (solo `nav` → `nav.secciones` y `section` → `main>section`, para no pisar la barra para cambiar de solución); al final, lo propio de la demo: cabecera fija debajo de esa barra, texto más oscuro para la pantalla compartida, el teléfono con WhatsApp del chofer y la revisión de lo que lee la IA. Números en formato dominicano (miles con punto, decimales con coma), como lo pidieron en el piloto.

## Grupo Rodelo (`public/rodelo/css/rodelo.css`)

Del panel de Rodelo Copilot: barra lateral azul marino (`#07162b` → `#10345f`) de 228 px con logo "R" amarillo `#f5c542`, contenido sobre `#f5f7fa`, azul de acción `#1769e0`. Tarjetas blancas de 10 px de radio. Etiquetas de cifras en mayúsculas pequeñas, cifras en 25 px / 800. Severidad: alta `#cf3e45`, media `#c77708`, baja azul. Al final del archivo, un bloque propio de la demo (letra local, espacio para la barra, texto un poco más grande para la pantalla compartida).

## Delidom (`public/delidom/css/delidom.css`)

De la Central de Pedidos: verde `#0b5a38` (oscuro `#063b27`, suave `#eef7f1`), fondo `#f3f6f4`, tinta `#17231e`. Estados: pendiente ámbar `#b97808`, en preparación azul `#2367b5`, despachado verde `#16774a`, anulado rojo `#b83c32`. Tarjetas de 14 px de radio con sombra verdosa, iconos emoji como en el original, títulos en Inter pesada (el original usa Sora). Sin montos en la pizarra de pedidos.
