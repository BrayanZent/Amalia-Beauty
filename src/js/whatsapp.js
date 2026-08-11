export function buildWhatsAppMessage(booking) {
  return [
    'Hola! Quiero confirmar mi reserva en Amalia Beauty.',
    `Servicio: ${booking.servicioNombre}`,
    `Fecha: ${booking.fecha}`,
    `Hora: ${booking.hora}`,
    `Nombre: ${booking.nombre}`,
    'Adjunto el comprobante del abono.',
  ].join('\n');
}

export function buildWhatsAppUrl(phone, booking) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(booking))}`;
}
