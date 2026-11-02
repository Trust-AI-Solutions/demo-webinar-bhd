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

Al abrir el sitio se ve una animación: un cliente pide por WhatsApp, el pedido llega al panel y el dueño le pregunta al panel qué reponer. Dejarla correr una vez mientras se presenta, y pulsar **Comenzar** para ir a la portada. "Ver de nuevo" la repite.

## 1. Presentar la empresa (30 segundos)

"Esta es Ferretería Los Pinos, una empresa inventada para esta demostración: dos sucursales en
Santo Domingo, 145 productos y seis meses de ventas. Todo lo que van a ver funciona de verdad con
inteligencia artificial; lo único ficticio son los datos."

## 2. El cliente escribe por WhatsApp (3 minutos), en `en-vivo.html`

Escribir (o usar los botones de sugerencias):

1. `Buenas, ¿tienen cemento gris? ¿A cómo está?`
2. `Necesito 20 varillas de 3/8 y 10 sacos de cemento, ¿cuánto me sale con envío a Villa Mella?`
   El asistente arma la cotización con ITBIS y envío.
3. `Perfecto, hágame el pedido. Soy Carlos Gómez, 809-555-1234, calle 5 #12, Villa Mella. Pago por transferencia.`
   El asistente resume y pide confirmar.
4. `Sí, confirmo.`
   **Mostrar el panel a la derecha:** el pedido aparece en "Nuevo", resaltado, con el aviso.
5. `¿Me pueden hacer un descuento si compro 100 sacos?`
   El asistente no inventa descuentos: pasa el caso a una persona y aparece el aviso en el panel.

Mensaje clave: atiende a cualquier hora, no inventa precios y sabe cuándo pasar a una persona.

## 3. El dueño le pregunta a su negocio (4 minutos), en `panel.html`

Recorrer rápido la pantalla de inicio (indicadores, gráficos, alertas). Luego abrir
**Pregúntale a tu negocio** (botón ⤢ para ampliar) y preguntar:

1. `¿Cómo van las ventas de este mes comparadas con el mes pasado?`
2. `¿Cómo le va a la sucursal de Villa Mella?`
   Debe notar la caída de alrededor de un tercio en las últimas 4 semanas.
3. `¿Por qué bajó el margen de las pinturas?`
   Debe encontrar que el costo subió y el precio no se ajustó.
4. `¿Qué tengo que reponer esta semana?`
   El cemento gris en Herrera alcanza para uno o dos días.
5. `¿Quiénes me deben más de 30 días?`
   Constructora Ozama pasó su límite de crédito.

Mensaje clave: el dueño pregunta en sus palabras y la respuesta sale de sus propios números,
no de suposiciones.

## 4. Los pedidos que no llegan por WhatsApp (2 minutos), en `panel.html` → Pedidos

1. **Nuevo pedido:** "Así se anota un pedido de mostrador o de teléfono." Escribir `Constructora`
   y escoger un cliente (se llena el teléfono), buscar `cemento`, poner la cantidad. El total con
   ITBIS y envío sale solo. Guardar: aparece en "Nuevo", marcado "a mano".
2. **Importar PDF o foto → Orden de compra → Ver PDF:** mostrar el papel del cliente. Volver y
   pulsar **Leer con IA**. La IA relaciona cada línea con el catálogo y marca la malla
   electrosoldada, que la ferretería no vende. **Crear el pedido**.
3. **Importar PDF o foto → Reporte del chofer → Leer con IA:** la IA pasa los pedidos entregados a
   "Entregado", anota que un cliente no estaba y avisa que el P-1319 no existe. **Aplicar**.
4. Opcional, con foto: llevar una lista de materiales escrita a mano (inventada, sin datos reales
   de nadie), tomarle una foto y subirla con **Arrastre aquí un PDF o una foto**.

Mensaje clave: nadie vuelve a digitar lo que ya está en un papel, y la IA propone pero una persona
aprueba.

## Si algo falla

- **La respuesta tarda:** es normal que tome entre 5 y 20 segundos cuando consulta varias cosas,
  y entre 10 y 40 segundos al leer un PDF.
  Mientras tanto se ven los pasos ("Revisando las ventas…"). Se puede ir comentando lo que hace.
- **Aparece un error:** volver a enviar la misma pregunta. Si sigue, usar "Nueva conversación".
- **"Demasiadas consultas seguidas":** esperar un minuto.
- **Sin internet o sin IA:** las pantallas del panel (gráficos, inventario, cobros, pedidos)
  funcionan igual sin IA. Se pueden mostrar mientras se resuelve.
