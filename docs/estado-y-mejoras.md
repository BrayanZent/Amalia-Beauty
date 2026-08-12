# Amalia Beauty — Estado del sitio y mejoras futuras

**Última actualización:** 2026-08-12

---

## 🌐 Links importantes

| Qué es | Link |
|---|---|
| Sitio web (para clientas) | https://amalia-beauty.vercel.app/ |
| Panel de administración (para Amalia) | https://amalia-beauty.vercel.app/admin.html |
| Base de datos (Supabase) | https://supabase.com/dashboard/project/fzdkknscoabdpgfwprcb |
| Código del proyecto (GitHub) | https://github.com/BrayanZent/Amalia-Beauty |
| Panel de despliegue (Vercel) | https://vercel.com/dashboard |

---

## ✅ Lo que ya tenemos funcionando

### Sitio web
- Página con título, slogan, servicios, galería (feed de Instagram en vivo) y ubicación/contacto.
- **Reserva de hora con calendario mensual**: se ve de un vistazo qué días tienen cupos y cuáles están completos. Al elegir un día, aparecen las horas disponibles y las ya tomadas (marcadas como "Reservado").
- **3 servicios base** para elegir: Extensión de Polygel, Esmaltado permanente, Spa y arreglo de uñas.
- **Adicionales según el servicio elegido**: Kapping (solo con esmaltado), Spa de manos y Retiro de trabajo anterior (según corresponda) — con el precio total actualizándose en vivo.
- **Bloque de políticas** visible antes de reservar: abono no reembolsable, cambio de hora con 5 horas de anticipación, tolerancia de 15 minutos, opción de sobre-cupo.
- Al confirmar una reserva, aparecen los datos bancarios para el abono de $3.000 y un botón directo a WhatsApp para enviar el comprobante.
- Si no llega el comprobante en 30 minutos, el cupo se libera solo para otra clienta.
- Chatbot de preguntas frecuentes (precios, horarios, ubicación, cómo reservar).
- Política de privacidad (qué se hace con los datos de las clientas).

### Panel de administración
- Login privado — Amalia y quien tú autorices pueden entrar **al mismo tiempo desde distintos celulares** sin problema, usando el mismo usuario y contraseña.
- **Calendario mensual** (igual al del sitio público) con la cantidad de reservas de cada día, navegable hacia adelante y atrás sin límite.
- Al hacer clic en un día: se ve el detalle de las reservas (nombre, teléfono, servicio, adicionales elegidos) y el botón para **confirmar el pago** una vez que llega el comprobante.
- Formulario para **bloquear un día completo o una hora específica** (ej. vacaciones, hora médica) — las horas que aparecen para elegir cambian automáticamente según si el día elegido es entre semana o sábado.

### Detrás de escena (para que sepas que está cuidado)
- Los datos de las clientas (nombre, teléfono) están protegidos — nadie externo puede leerlos, solo Amalia autenticada en el panel.
- El sitio se actualiza solo cada vez que se sube un cambio nuevo al código (no hay que hacer nada manual en Vercel).
- Hay 2 asistentes especializados configurados para este proyecto: uno de marketing digital y uno de cuidado de uñas/manos, que ayudan a redactar contenido y estrategias específicas para Amalia Beauty.

---

## 🚧 Mejoras pendientes (para decidir juntos cuándo hacerlas)

Ordenadas por lo que recomendamos hacer primero, pero el orden se puede cambiar.

### Recomendado para partir
1. **Checklist de cuidado después de reservar** — mostrar tips según el servicio elegido (ej. "no mojar las manos 2 horas" para esmaltado permanente) justo en la pantalla de confirmación.
2. **Recordatorio de retoque por WhatsApp** — mensaje automático 2-3 semanas después de la cita, sugiriendo agendar de nuevo.
3. **Programa de referidos** — crédito (ej. $2.000) para la clienta que trae a una amiga nueva.

### Servicio y experiencia de clienta
- Ampliar el chatbot con preguntas reales de clientas (ej. "¿duele el Polygel?").
- Sugerir combos/adicionales al momento de elegir el servicio.
- Reseñas en Google Maps (link directo por WhatsApp después de cada cita).

### Sitio web
- Rediseño visual general (tipografía, íconos, fotos reales) — **ya conversado, pendiente de agendar**.
- Recordatorio automático el día antes de la cita.
- Testimonios/reseñas de clientas en la página.
- Galería de antes/después por tipo de servicio.

### Panel de administración
- Estadísticas simples: reservas de la semana, servicio más pedido, ingresos estimados del mes.
- Exportar reservas a Excel/CSV.
- Buscador de historial de reservas por nombre o teléfono.
- Notificación (WhatsApp o correo) cuando entra una reserva nueva, sin tener que estar revisando el panel.

### Marketing / crecimiento (más a mediano plazo)
- Promociones semanales en Instagram con link directo a reservar.
- Alianzas con negocios vecinos (intercambio de recomendaciones).
- Campaña pagada (Meta Ads) geolocalizada al sector, enfocada en horarios de menor demanda.

### Ideas más grandes, evaluadas y dejadas para más adelante
- **Gift Cards** — ya tienes el diseño gráfico listo (carpeta `Amalia nuevos/amalia fotos/`), falta definir cómo se venden/canjean online.
- Seguridad extra en la base de datos: evitar que dos clientas reserven la misma hora si están mirando el calendario al mismo tiempo (riesgo bajo hoy, pero se puede blindar).

---

## Cómo seguimos

Cuando quieras avanzar con alguna de estas mejoras, solo dime cuál (o cuáles) y las conversamos en detalle antes de tocar el sitio — como hicimos con el calendario y los servicios.
