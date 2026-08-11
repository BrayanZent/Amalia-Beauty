export function getFixedSlotsForDate(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay(); // 0=domingo .. 6=sábado
  if (day === 0) return [];
  if (day === 6) return ['09:00', '12:00', '15:00', '18:00'];
  return ['10:00', '15:00', '18:00'];
}

export function computeAvailableSlots(dateStr, allSlots, bookings, blocks) {
  const diaBloqueado = blocks.some((b) => b.fecha === dateStr && b.hora === null);
  if (diaBloqueado) return [];

  const activos = ['pendiente_abono', 'confirmada'];
  const horasTomadas = new Set(
    bookings
      .filter((b) => b.fecha === dateStr && activos.includes(b.estado))
      .map((b) => b.hora)
  );
  const horasBloqueadas = new Set(
    blocks.filter((b) => b.fecha === dateStr && b.hora !== null).map((b) => b.hora)
  );

  return allSlots.filter((h) => !horasTomadas.has(h) && !horasBloqueadas.has(h));
}

export function isExpired(booking, nowMs = Date.now()) {
  if (booking.estado !== 'pendiente_abono') return false;
  return new Date(booking.expira_en).getTime() < nowMs;
}

export function computeExpiryTimestamp(fromDate = new Date(), minutesFromNow = 30) {
  return new Date(fromDate.getTime() + minutesFromNow * 60000).toISOString();
}
