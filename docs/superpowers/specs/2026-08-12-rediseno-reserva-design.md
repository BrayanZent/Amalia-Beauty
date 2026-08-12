# Amalia Beauty — Rediseño de reserva: servicios con adicionales, calendario mensual y hero

**Fecha:** 2026-08-12
**Estado:** Aprobado, listo para plan de implementación.

## 1. Contexto

El sitio (https://amalia-beauty.vercel.app/) está en producción y funcionando desde 2026-08-12: flujo de reserva, panel admin y pago por transferencia probados de punta a punta con datos reales. Este rediseño mejora tres cosas sin tocar lo que ya funciona (esquema de RLS, expiración de reservas, flujo de WhatsApp):

1. Los servicios pasan de una lista plana de 6 opciones a **3 servicios base + adicionales condicionales**, y el catálogo informativo (sección "Servicios") pasa de mostrar precio a mostrar reseña + duración.
2. El bloque de reserva se mueve al inicio de la página y usa un **calendario mensual interactivo** (en vez de una fila de 6 botones de fecha) que muestra horas libres y ocupadas.
3. El panel admin gana el mismo calendario mensual, con navegación entre meses.
4. El logo del header se agranda.
5. Se agrega un bloque de políticas del negocio ("Información importante") en la sección Reservar, con contenido real que Amalia ya tenía en sus redes pero que el sitio no mostraba.

## 2. Servicios base + adicionales

**Servicios base (la clienta elige exactamente uno):**
1. Extensión de Polygel — desde $18.000
2. Esmaltado permanente — desde $11.000
3. Spa y arreglo de uñas — $10.000

**Adicionales (checkboxes, aparecen según el base elegido):**
- Kapping (+$4.000) — solo si el base es **Esmaltado permanente**.
- Spa de manos (+$7.000) — si el base es **Esmaltado permanente** o **Extensión de Polygel**.
- Retiro de trabajo anterior (+$4.000) — con **cualquiera** de los 3 base.

El precio total (base + adicionales marcados) se muestra antes de confirmar, dentro del flujo de reserva — igual que hoy.

### Catálogo informativo (sección "Servicios")

Esta sección es solo informativa (no es donde se elige el servicio para reservar — eso pasa dentro del bloque de reserva). Deja de mostrar precio y pasa a mostrar reseña breve + duración estimada:

| Servicio | Reseña | Duración |
|---|---|---|
| Extensión de Polygel | Extensión con Polygel para largo y forma a medida, terminación pulida y resistente al uso diario. | ~2 h |
| Esmaltado permanente | Esmaltado de larga duración, sin descascararse ni perder brillo. Suma Kapping como adicional para reforzar la uña. | 45-60 min |
| Spa y arreglo de uñas | Ritual de higienizante, exfoliante de perlas de jojoba, mascarilla de karité, loción con aloe vera y vitamina E, y aceite de cutículas. Productos cruelty free y veganos. | ~45 min |

Redactado con el agente `amalia-manicurista`, basado en contenido real (foto de detalle del spa que Amalia ya tenía en `Amalia nuevos/amalia fotos/`).

### Modelo de datos

- `services`: se reduce a los 3 servicios base (se eliminan las filas de Kapping/Spa/Retiro que hoy existen como filas independientes).
- Los adicionales **no** son filas de `services` — es una lista fija en el código (`src/js/businessInfo.js`), ya que la regla de compatibilidad (qué adicional aplica a qué base) es un dato de negocio pequeño y fijo, no algo que necesite modelarse como relación en la base de datos.
- `bookings` gana 3 columnas nuevas: `incluye_kapping boolean not null default false`, `incluye_spa boolean not null default false`, `incluye_retiro boolean not null default false`. Es una migración aditiva — no rompe las reservas que ya existen (todas quedan con los 3 en `false`).
- El panel admin (`renderBookings`) muestra los adicionales marcados de cada reserva.

## 3. Calendario mensual — sitio público

Reemplaza la fila de 6 botones de fecha (Task 6 original) por una grilla de calendario mensual:

- Encabezado con nombre del mes y flecha para avanzar al mes siguiente (no se permite retroceder antes del mes actual).
- Domingos deshabilitados (visualmente apagados, no clickeables) — el negocio no atiende esos días.
- Cada día muestra un punto de color: **dorado** si quedan cupos, **rosado apagado** si el día está completo. Sin indicador en domingos.
- Al hacer clic en un día habilitado, se despliega la lista de horas de ese día — **todas las horas del día, no solo las libres**: las disponibles se ven con borde dorado y clickeables; las ya tomadas aparecen con texto tachado, fondo rosado apagado y la etiqueta "Reservado", sin ser clickeables.
- El resto del flujo (formulario de clienta, creación de la reserva, panel de transferencia + WhatsApp) sigue exactamente igual a como está hoy — no se toca esa parte.

### Datos que necesita el calendario

Para pintar el mes completo (hasta 31 días) sin hacer 31 consultas, se trae de una sola vez: todas las reservas activas (`pendiente_abono`/`confirmada`) y bloqueos del mes visible, desde `public_slots`/`bloqueos` (ya expuestos sin PII desde el rediseño de seguridad anterior). El cálculo de "cuántos cupos quedan" por día se hace en el cliente con la misma lógica que ya existe en `computeAvailableSlots`/`getFixedSlotsForDate` (`src/js/availability.js`), reutilizada, no reescrita.

## 4. Calendario mensual — panel admin

Mismo componente visual que el público, pero:
- Navegación en ambos sentidos (mes anterior y siguiente, sin límite).
- Cada día muestra la **cantidad** de reservas de ese día (no solo libre/completo).
- Clic en un día abre el detalle de ese día: lista de reservas (igual que `renderBookings` ya muestra hoy) y acceso al formulario de bloqueo (`renderBloqueos`, ya existente) con la fecha pre-cargada.

## 5. Logo y paleta

- El logo del header (`src/assets/logo.png`, que ya es la versión dorada) se agranda (~1.8x el tamaño actual).
- El calendario usa la paleta ya definida en `src/css/styles.css`: `--color-gold` para "disponible", una variante apagada de `--color-primary`/`--color-bg-alt` para "reservado/completo", sin introducir rojo/verde.

## 6. Información importante (políticas)

Contenido real, tomado tal cual de las publicaciones que Amalia ya usa en redes (`Amalia nuevos/amalia fotos/WhatsApp Image 2026-08-12 at 12.05.20 PM.jpeg`). Se agrega como bloque de texto (no una funcionalidad nueva — no se automatiza el cambio de hora ni el sobre-cupo, solo se informa) visible en la parte de arriba de la sección **Reservar**, antes de que la clienta empiece a elegir servicio/fecha:

> **Información importante**
> - Para agendar la cita debes abonar $3.000; de lo contrario la hora no queda agendada y estará disponible para otra persona.
> - El abono no es reembolsable en ningún caso.
> - Para cambiar tu hora debes hacerlo mínimo 5 horas antes, o el abono se pierde.
> - Esperamos 15 minutos de retraso.
> - ¿Necesitas una hora fuera de estos horarios? Hay opción de sobre-cupo (tardes/noches o domingo, con costo adicional) — escríbenos por WhatsApp.

El último punto (sobre-cupo) reutiliza el mismo botón de WhatsApp que ya existe para "sin cupos disponibles" — no se agrega un flujo nuevo, solo se documenta la opción que ya existía de facto.

## 7. Orden de la página

`Inicio` (título + slogan, ya hecho) → **Reservar** (calendario, se mueve aquí) → Servicios → Galería → Ubicación/Contacto. Los servicios siguen visibles como catálogo informativo, pero ya no bloquean el acceso al calendario — de hecho hoy tampoco lo bloqueaban de una forma distinta a elegir el servicio dentro del propio bloque de reserva; ese bloque simplemente se adelanta en la página.

## 8. Fuera de alcance

- Selección de servicio en el mockup de esta spec no valida combinaciones inválidas más allá de la lista de compatibilidad fija (ej. no se contempla que un futuro 4to servicio base tenga reglas distintas — se ajustará si aparece).
- No se agrega un selector de mes hacia atrás en el sitio público (solo hacia adelante) — no tiene sentido reservar en el pasado.
- No se cambia el flujo de abono/WhatsApp/expiración de 30 minutos — sigue igual.
- Gift Cards (encontradas en `Amalia nuevos/amalia fotos/`, fotos de tarjetas físicas de regalo) quedan fuera — es una funcionalidad nueva, se evaluará como proyecto aparte.

## 9. Supuestos

- Las reservas de prueba ya hechas en producción (si quedó alguna `pendiente_abono`/`confirmada` de las pruebas del usuario) van a mostrar `incluye_kapping/spa/retiro = false` por el valor default — no se migran datos históricos de servicios eliminados; si alguna reserva de prueba apuntaba a un `service_id` que se elimina (Kapping/Spa/Retiro como filas propias), esa reserva de prueba debe borrarse antes de aplicar la migración (se verificará como paso previo del plan).
