# Ensayo de la intro animada (stageshow)

- **Ejemplo de referencia copiado:** `device-pair` (ventana + teléfono) para el encuadre; movimiento tomado de `subscriptions` (la muestra que viaja con `Fly` y la cifra que sube con `Count`), `messages` (burbujas y puntos de "escribiendo") y `ai-chat` (respuesta en `Stream`).
- **Qué cambié:** el mundo "Etiquetas de vitrina" (cintas de color con tarjeta blanca, SF Pro / Inter; antes "Carta de colores"), WhatsApp con sus colores, la historia de Panadería El Trigal (encargo de un bizcocho por WhatsApp → panel → pregunta sobre insumos y respuesta), la respuesta abre en su lugar y empuja el contenido (no lo tapa), versión angosta rediseñada (teléfono arriba, tarjeta de pedidos abajo, sin la pregunta).
- **Revisado:** póster (movimiento reducido), hoja de contacto a 1440 y 390, primeros planos del campo mientras se escribe, la puerta `film.mjs --gate` (`rehearsal passed`), consola sin errores en el sitio, "Comenzar", "Ver de nuevo" y "Ver la introducción".
- **Avisos del filmador aceptados a propósito:**
  - `settle snap` / `jump` en el campo de la pregunta: es el texto creciendo letra a letra al escribirse; revisado cuadro a cuadro, no salta.
  - `vanishes with no exit` del chip que vuela: el valor real aparece debajo en el mismo cuadro (igual que el ejemplo de referencia `subscriptions`).
- **No revisado:** la letra SF Pro real (este equipo no la tiene; se vio con Inter), y una revisión de ojo fresco por otra persona.
- **Cómo regenerar:** `npm run intro` compila `intro/` a `public/intro/` (el sitio no compila nada al publicarse).
