# Amalia Beauty — Uñas, esmaltado y spa de manos

> Este CLAUDE.md es específico de este proyecto. Se suma al CLAUDE.md raíz de la agencia (reglas generales, límites, agentes) — no lo reemplaza.

## Datos del cliente
- **Nombre del negocio:** Amalia Beauty
- **Rubro:** uñas — esmaltado permanente, kapping, extensión polygel, spa de manos.
- **Entregable contratado:** sitio web + sistema de reservas de horas con disponibilidad real.
- **Ubicación:** Camino San Ramón, sector Vista Valle.
- **Horario:** Lunes a viernes 10:00/15:00/18:00 hrs · Sábado 9:00/12:00/15:00/18:00 hrs · Domingo cerrado.
- **WhatsApp:** +56 9 9156 9439
- **Instagram:** @amaliabeauty.cl
- **Stack técnico elegido:** HTML/CSS/JS estático + Supabase (Postgres + Auth) + hosting en Vercel.

### Servicios y precios
| Servicio | Precio | Duración |
|---|---|---|
| Esmaltado permanente | desde $11.000 | 45-60 min |
| Kapping (adicional) | +$4.000 | +30 min |
| Extensión Polygel | desde $18.000 | ~2 h |
| Spa de manos + servicio | $7.000 | 30-45 min |
| Solo spa y arreglo de uñas | $10.000 | ~45 min |
| Retiro de trabajo | $4.000 | 30-40 min |

### Abono para reservar
$3.000 por transferencia, cupo se libera si no llega comprobante en 30 min.
Datos: Daniela Álvarez Mardones — RUT 21.340.588-8 — Cuenta RUT — BancoEstado — Damii.alvarez11@gmail.com.

## Convenciones de este proyecto
- Código fuente en `src/` (sitio) y `supabase/` (esquema de base de datos).
- Diseño y specs en `docs/superpowers/specs/`, planes en `docs/superpowers/plans/`.
- El agente `amalia-reservas` es responsable de la arquitectura técnica y el sistema de reservas.
- El agente `amalia-contenido` es responsable de redes sociales y textos del chatbot.
- Antes de dar por lista cualquier entrega, pasar el checklist del agente `qa-tecnico` de la agencia.

## Límites específicos de este cliente
- Nunca mostrar cupos fuera de los horarios fijos definidos arriba: la demanda extra se deriva a WhatsApp.
- Nunca cambiar precios, horarios o datos bancarios en el código sin confirmación explícita de Amalia.
- Los datos de transferencia son de una persona natural (Daniela Álvarez Mardones): tratarlos con el mismo cuidado que cualquier dato sensible, aunque se muestren públicamente en el flujo de reserva.
