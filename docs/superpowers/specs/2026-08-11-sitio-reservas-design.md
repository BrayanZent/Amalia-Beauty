# Amalia Beauty — Sitio web con sistema de reservas

**Fecha:** 2026-08-11
**Estado:** Aprobado por el cliente interno (Bryan) para pasar a plan de implementación.

## 1. Contexto y datos del negocio

Amalia Beauty es un negocio de uñas (esmaltado permanente, kapping, extensión polygel, spa de manos). No tenía presencia web ni sistema de reservas — solo Instagram y agenda manual por WhatsApp.

- **Instagram:** [@amaliabeauty.cl](https://instagram.com/amaliabeauty.cl)
- **WhatsApp / contacto:** +56 9 9156 9439
- **Ubicación:** Camino San Ramón, sector Vista Valle
- **Horario de atención:** Lunes a sábado (domingo cerrado)
- **Titular cuenta para abonos:** Daniela Álvarez Mardones — RUT 21.340.588-8 — Cuenta RUT, BancoEstado — Damii.alvarez11@gmail.com

### Servicios y precios

| Servicio | Precio | Duración estimada |
|---|---|---|
| Esmaltado permanente | desde $11.000 | 45-60 min |
| Kapping (adicional al esmaltado) | +$4.000 | +30 min |
| Extensión Polygel | desde $18.000 | ~2 h |
| Spa de manos + algún servicio | $7.000 | 30-45 min |
| Solo spa y arreglo de uñas (corte, cutícula, limado) | $10.000 | ~45 min |
| Retiro de trabajo | $4.000 | 30-40 min |

### Horarios de atención (cupos fijos, no calendario continuo)

- **Lunes a viernes:** 10:00 · 15:00 · 18:00
- **Sábado:** 9:00 · 12:00 · 15:00 · 18:00
- **Domingo:** cerrado
- Demanda que exceda estos cupos no es reservable en el sitio — se deriva directo a WhatsApp para coordinar manualmente.

## 2. Alcance de este proyecto

Construir un sitio web de una página con sistema de reservas de horas con disponibilidad real (no solo un formulario a WhatsApp), panel de administración para Amalia, chatbot de FAQ, y los subagentes de Claude Code necesarios para mantener este proyecto a futuro.

## 3. Arquitectura técnica

- **Frontend:** HTML/CSS/JS estático (sin framework), diseño **mobile-first** — la mayoría de las clientas van a reservar desde el celular. Interfaz moderna, botones grandes, CTA "Reservar" siempre accesible.
- **Backend:** Supabase (Postgres + Auth). El frontend llama directo a Supabase con la anon key, protegida con Row Level Security. No se necesita servidor propio.
- **Hosting:** Vercel (tier gratuito), deploy conectado al repo git del proyecto. El link real de la cuenta (`vercel login` / `vercel link`) lo hace el cliente desde su propia cuenta de Vercel — la agencia deja el proyecto listo (config y estructura) para ese paso.
- **Dominio:** pendiente de definir en la etapa de lanzamiento — no bloquea el desarrollo.

## 4. Estructura del sitio (una página, `index.html`)

Navegación por anclas: **Inicio · Servicios · Galería · Reservar · Ubicación/Contacto**, más:
- `privacidad.html` — política de privacidad.
- `admin.html` — panel de administración (protegido con login).

### Sección Galería / prueba social
Feed de Instagram de @amaliabeauty.cl embebido vía widget gratuito (Elfsight o LightWidget). Sirve dos propósitos a la vez: mostrar fotos reales de trabajos hechos y transmitir "movimiento" (que hay clientas constantes), sin necesidad de fotos inventadas ni curación manual — se actualiza solo cuando Amalia publica.

## 5. Flujo de reserva

1. Clienta elige un servicio del catálogo (nombre, precio, duración visible).
2. Elige una fecha (solo lunes a sábado habilitados).
3. El sitio consulta Supabase y muestra **solo los cupos fijos de ese día que sigan libres** (ej. martes → 10:00/15:00/18:00 menos los ya tomados o bloqueados).
   - Si no queda ningún cupo ese día → mensaje "Sin cupos disponibles" + botón directo a WhatsApp para consultar sobre-cupo.
4. Ingresa nombre y teléfono, acepta checkbox de tratamiento de datos personales (enlaza a `privacidad.html`).
5. Confirma → se crea la reserva en Supabase con estado `pendiente_abono`, el cupo queda bloqueado para las demás **por 30 minutos** (`expira_en`).
6. Se despliega un panel/acordeón con los datos de transferencia del abono ($3.000): BancoEstado, Cuenta RUT, Daniela Álvarez Mardones, 21.340.588-8, Damii.alvarez11@gmail.com.
7. Botón **"Enviar comprobante por WhatsApp"** → abre `wa.me/56991569439` con mensaje prellenado (nombre, servicio, fecha, hora).
8. Si no llega comprobante dentro de los 30 minutos, la reserva pasa a `expirada` y el cupo se libera automáticamente (chequeo al cargar la página / función programada en Supabase).
9. Amalia revisa el comprobante en WhatsApp y confirma manualmente la reserva en el panel admin (pasa a `confirmada`). No hay verificación automática de pago — el control es humano.

## 6. Modelo de datos (Supabase)

- **`services`**: id, nombre, precio_desde, duracion_min, es_adicional (bool).
- **`slots_fijos`**: plantilla de horarios por día de semana (L-V: 10/15/18; Sáb: 9/12/15/18).
- **`bookings`**: id, nombre_clienta, telefono, service_id, fecha, hora, estado (`pendiente_abono` / `confirmada` / `cancelada` / `expirada`), creada_en, expira_en.
- **`bloqueos`**: fecha (+ hora opcional) que Amalia marca manualmente como no disponible.

## 7. Panel de administración (`admin.html`)

Login privado vía Supabase Auth (un solo usuario: Amalia). Permite:
- Ver reservas del día/semana con su estado.
- Marcar una reserva `pendiente_abono` → `confirmada`.
- Bloquear un día completo u horario puntual (vacaciones, imprevistos).

## 8. Chatbot de atención (en el sitio)

Basado en **reglas**, no IA (costo $0, cero riesgo de inventar respuestas). Botones de preguntas frecuentes: precios, horarios, ubicación, cómo reservar, "hablar con Amalia" (deriva a WhatsApp). Se identifica como asistente automático desde el primer mensaje, con salida a humano siempre visible. Mejora a IA conversacional queda para una fase futura, no en este proyecto.

## 9. Privacidad (Ley 19.628, Chile)

El formulario de reserva guarda nombre y teléfono → checkbox de consentimiento explícito en el formulario + página `privacidad.html` con política simple + vía de eliminación de datos (contacto por WhatsApp).

## 10. Subagentes específicos del proyecto

Ubicados en `proyectos/Amalia Beauty/.claude/agents/`. No duplican a los agentes genéricos de la agencia (`qa-tecnico` y `gestion-proyectos` se usan tal cual, sin necesitar contexto adicional):

- **`amalia-reservas`** — conoce el esquema de Supabase, el flujo de abono/expiración de 30 min y la lógica del panel admin de este proyecto. Se usa para construir y mantener el sitio y el sistema de reservas.
- **`amalia-contenido`** — conoce el catálogo de servicios/precios, tono de marca y paleta visual (rosa palo + dorado, ver `Amalia nuevos/AB DORADO.png`). Se usa para redactar contenido de Instagram, respuestas a comentarios/reseñas y los textos del chatbot de FAQ.

## 11. Fuera de alcance (este proyecto)

Pago online real (Webpay/Flow), verificación automática de comprobantes, chatbot con IA conversacional, múltiples profesionales/agendas paralelas, app móvil nativa.

## 12. Roadmap futuro (mencionado por el cliente, no se construye ahora)

- Catálogo de productos de cuidado de uñas.
- Visualizador 3D interactivo de diseños de uñas creados por Amalia, con cambio de diseño en una mano virtual vía IA.

## 13. Supuestos y datos pendientes

- Dirección exacta (número/referencia adicional a "Camino San Ramón, sector Vista Valle") se puede afinar antes del lanzamiento — no bloquea el desarrollo.
- Dominio del sitio: pendiente de decidir/comprar.
- Fotos de galería: resueltas vía feed de Instagram embebido — no se necesitan fotos sueltas adicionales salvo que Amalia pida lo contrario.
