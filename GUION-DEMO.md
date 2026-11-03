# Guion sugerido para la demo en vivo (unos 10 minutos)

Para quien presenta. Las preguntas son sugerencias: la IA responde a lo que se le escriba, así
que también se pueden tomar preguntas del público.

## Antes del webinar (el mismo día)

- [ ] Abrir el sitio publicado y pulsar **Restablecer la demo** en la portada.
- [ ] Escribir la clave de la demo (`CLAVE_DEMO`) en la computadora que va a presentar, **antes** de compartir pantalla: se escribe oculta (••••) y queda guardada en ese navegador, así que no se vuelve a pedir durante el webinar.
- [ ] Hacer una pregunta de prueba en el panel y otra en WhatsApp, leer un PDF de ejemplo en
      **Pedidos → Importar PDF o foto**, y luego **Restablecer** de nuevo.
- [ ] Zoom del navegador al 100 % o 110 % y pantalla completa (F11) para compartir.
- [ ] Tener abierta `en-vivo.html` en una pestaña y `panel.html` en otra.

Las cifras cambian cada día porque los 6 meses de ventas terminan siempre "hoy". Las cinco
situaciones de abajo aparecen siempre.

## 0. Intro animada (15 segundos)

Al abrir el sitio se ve una animación: una clienta encarga un bizcocho por WhatsApp, el encargo llega al panel y el dueño le pregunta al panel qué insumos comprar. Dejarla correr una vez mientras se presenta, y pulsar **Comenzar** para ir a la portada. "Ver de nuevo" la repite.

## 1. Presentar la empresa (30 segundos)

"Esta es Panadería El Trigal, una empresa inventada para esta demostración: dos sucursales en
Santo Domingo, unos 60 productos en el menú, reparto de pan a colmados y cafeterías, y seis meses
de ventas. Todo lo que van a ver funciona de verdad con
inteligencia artificial; lo único ficticio son los datos."

## 2. El cliente escribe por WhatsApp (3 minutos), en `en-vivo.html`

Escribir (o usar los botones de sugerencias):

1. `Buenas, ¿a cómo está el bizcocho dominicano de 3 libras?`
   Da el precio y avisa que se encarga con 24 horas.
2. `Lo quiero para el sábado a las 3 de la tarde, y 50 pastelitos de pollo. ¿Cuánto me sale con entrega en Naco?`
   El asistente arma la cotización con ITBIS y entrega.
3. `Perfecto, hágame el pedido. Soy Carlos Gómez, 809-555-1234, calle 5 #12, Naco. Que el bizcocho diga "Feliz cumpleaños, Ana". Pago por transferencia.`
   El asistente resume, recuerda el adelanto del 50 % y pide confirmar.
4. `Sí, confirmo.`
   **Mostrar el panel a la derecha:** el encargo aparece en "Nuevo", resaltado, con la fecha y el aviso.
5. `¿Me pueden hacer el bizcocho con la foto de mi hija impresa encima?`
   El asistente no promete diseños especiales: pasa el caso a una persona y aparece el aviso en el panel.

Mensaje clave: atiende a cualquier hora, no inventa precios y sabe cuándo pasar a una persona.

## 3. El dueño le pregunta a su negocio (4 minutos), en `panel.html`

Recorrer rápido la pantalla de inicio (indicadores, gráficos, alertas). Luego abrir
**Pregúntale a tu negocio** (botón ⤢ para ampliar) y preguntar:

1. `¿Cómo van las ventas de este mes comparadas con el mes pasado?`
2. `¿Cómo le va a la sucursal de Los Prados?`
   Debe notar la caída de alrededor de un tercio en las últimas 4 semanas.
3. `¿Por qué bajó el margen de los bizcochos?`
   Debe encontrar que el costo subió (mantequilla y crema) y el precio no se ajustó.
4. `¿Qué insumos tengo que comprar esta semana?`
   La mantequilla en Gazcue alcanza para poco más de un día.
5. `¿Quiénes me deben más de 30 días?`
   Hotel Brisas de Gazcue pasó su límite de crédito.

Mensaje clave: el dueño pregunta en sus palabras y la respuesta sale de sus propios números,
no de suposiciones.

## 4. Los pedidos y reportes que no llegan por WhatsApp (3 minutos), en `panel.html` → Pedidos

1. **Nuevo pedido:** "Así se anota un pedido de mostrador o de teléfono." Escribir `Colmado`
   y escoger un cliente (se llena el teléfono), buscar `pan de agua`, poner la cantidad. El total
   con ITBIS y entrega sale solo. Guardar: aparece en "Nuevo".
2. **Importar PDF o foto → Orden de compra → Ver:** mostrar el papel de la cafetería. Volver
   y pulsar **Leer con IA**. La IA relaciona cada línea con el menú y marca el pan de masa madre,
   que la panadería no hace. **Crear el pedido**.
3. **Importar PDF o foto → Hoja del repartidor → Leer con IA:** la IA pasa los pedidos entregados
   a "Entregado", anota que una cafetería estaba cerrada y avisa que el P-1319 no existe.
   **Aplicar**.
4. **Importar PDF o foto → Reporte de ventas de La Canasta → Ver:** "Así llega cada semana el
   reporte de la cadena donde dejamos galletas y pan de molde en consignación." **Leer con IA**: la
   IA pasa cada línea a los productos de El Trigal, marca la galleta de coco que no es nuestra y
   pinta en rojo Naco, que reporta 32 panes de molde vendidos cuando se entregaron 30.
   **Guardar el reporte** y abrir **Ventas** (al final): entregado, vendido, lo que queda en cada
   tienda y lo que hay que cobrar, sin digitar nada.
5. Opcional, con foto: subir `foto-encargo-escrito-a-mano.jpg` (está en `public/ejemplos/`) con
   **Arrastre aquí un PDF o una foto**, o tomarle una foto a un encargo escrito a mano (inventado,
   sin datos reales de nadie). La IA arma el encargo y marca la torta de guanábana, que no está en
   el menú.

Mensaje clave: nadie vuelve a digitar lo que ya está en un papel, y la IA propone pero una persona
aprueba.

## Si algo falla

- **La respuesta tarda:** es normal que tome entre 5 y 20 segundos cuando consulta varias cosas,
  y entre 10 y 40 segundos al leer un PDF.
  Mientras tanto se ven los pasos ("Revisando las ventas…"). Se puede ir comentando lo que hace.
- **Aparece un error:** volver a enviar la misma pregunta. Si sigue, usar "Nueva conversación".
- **"Demasiadas consultas seguidas":** esperar un minuto.
- **Sin internet o sin IA:** las pantallas del panel (gráficos, insumos, cobros, pedidos)
  funcionan igual sin IA. Se pueden mostrar mientras se resuelve.
