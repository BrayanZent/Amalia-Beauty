import { getFixedSlotsForDate, computeAvailableSlots } from './availability.js';

export function getCalendarGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=lunes .. 6=domingo

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function computeDaySlots(dateStr, bookings, blocks) {
  const allSlots = getFixedSlotsForDate(dateStr);
  const freeSlots = computeAvailableSlots(dateStr, allSlots, bookings, blocks);
  const freeSet = new Set(freeSlots);
  const takenSlots = allSlots.filter((h) => !freeSet.has(h));
  return { allSlots, freeSlots, takenSlots };
}

export function countActiveBookings(dateStr, bookings) {
  const activos = ['pendiente_abono', 'confirmada'];
  return bookings.filter((b) => b.fecha === dateStr && activos.includes(b.estado)).length;
}
