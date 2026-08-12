import { describe, it, expect } from 'vitest';
import { getCalendarGrid, computeDaySlots, countActiveBookings } from '../js/monthCalendar.js';

describe('getCalendarGrid', () => {
  it('cada semana tiene 7 casillas', () => {
    const weeks = getCalendarGrid(2026, 7); // agosto 2026
    weeks.forEach((w) => expect(w).toHaveLength(7));
  });

  it('el total de días no nulos coincide con los días del mes (febrero 2026, no bisiesto = 28 días)', () => {
    const weeks = getCalendarGrid(2026, 1);
    const nonNull = weeks.flat().filter(Boolean);
    expect(nonNull).toHaveLength(28);
  });

  it('el primer día no nulo es el día 1 del mes, formato YYYY-MM-DD', () => {
    const weeks = getCalendarGrid(2026, 7); // agosto
    const firstDay = weeks.flat().find(Boolean);
    expect(firstDay).toBe('2026-08-01');
  });

  it('el último día no nulo es el último día del mes (agosto = 31)', () => {
    const weeks = getCalendarGrid(2026, 7);
    const nonNull = weeks.flat().filter(Boolean);
    expect(nonNull[nonNull.length - 1]).toBe('2026-08-31');
  });
});

describe('computeDaySlots', () => {
  it('separa horas libres y tomadas de un martes (10:00/15:00/18:00)', () => {
    const bookings = [{ fecha: '2026-08-11', hora: '15:00', estado: 'confirmada' }];
    const result = computeDaySlots('2026-08-11', bookings, []);
    expect(result.allSlots).toEqual(['10:00', '15:00', '18:00']);
    expect(result.freeSlots).toEqual(['10:00', '18:00']);
    expect(result.takenSlots).toEqual(['15:00']);
  });

  it('domingo no tiene horas', () => {
    const result = computeDaySlots('2026-08-16', [], []);
    expect(result.allSlots).toEqual([]);
    expect(result.freeSlots).toEqual([]);
    expect(result.takenSlots).toEqual([]);
  });

  it('un bloqueo de todo el día deja takenSlots igual a allSlots', () => {
    const blocks = [{ fecha: '2026-08-11', hora: null }];
    const result = computeDaySlots('2026-08-11', [], blocks);
    expect(result.freeSlots).toEqual([]);
    expect(result.takenSlots).toEqual(['10:00', '15:00', '18:00']);
  });
});

describe('countActiveBookings', () => {
  it('cuenta solo reservas activas (pendiente_abono/confirmada) de esa fecha', () => {
    const bookings = [
      { fecha: '2026-08-11', estado: 'confirmada' },
      { fecha: '2026-08-11', estado: 'pendiente_abono' },
      { fecha: '2026-08-11', estado: 'expirada' },
      { fecha: '2026-08-12', estado: 'confirmada' },
    ];
    expect(countActiveBookings('2026-08-11', bookings)).toBe(2);
  });

  it('devuelve 0 si no hay reservas ese día', () => {
    expect(countActiveBookings('2026-08-20', [])).toBe(0);
  });
});
