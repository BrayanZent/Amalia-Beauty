import { describe, it, expect } from 'vitest';
import {
  getFixedSlotsForDate,
  computeAvailableSlots,
  isExpired,
  computeExpiryTimestamp,
} from '../js/availability.js';

describe('getFixedSlotsForDate', () => {
  it('devuelve 3 cupos para un día de semana (martes 2026-08-11)', () => {
    expect(getFixedSlotsForDate('2026-08-11')).toEqual(['10:00', '15:00', '18:00']);
  });
  it('devuelve 4 cupos para sábado (2026-08-15)', () => {
    expect(getFixedSlotsForDate('2026-08-15')).toEqual(['09:00', '12:00', '15:00', '18:00']);
  });
  it('devuelve vacío para domingo (2026-08-16)', () => {
    expect(getFixedSlotsForDate('2026-08-16')).toEqual([]);
  });
});

describe('computeAvailableSlots', () => {
  const allSlots = ['10:00', '15:00', '18:00'];

  it('excluye horas con reserva pendiente_abono o confirmada', () => {
    const bookings = [{ fecha: '2026-08-11', hora: '15:00', estado: 'confirmada' }];
    expect(computeAvailableSlots('2026-08-11', allSlots, bookings, [])).toEqual(['10:00', '18:00']);
  });

  it('ignora reservas expiradas o canceladas', () => {
    const bookings = [{ fecha: '2026-08-11', hora: '15:00', estado: 'expirada' }];
    expect(computeAvailableSlots('2026-08-11', allSlots, bookings, [])).toEqual(allSlots);
  });

  it('excluye horas bloqueadas manualmente', () => {
    const blocks = [{ fecha: '2026-08-11', hora: '10:00' }];
    expect(computeAvailableSlots('2026-08-11', allSlots, [], blocks)).toEqual(['15:00', '18:00']);
  });

  it('devuelve vacío si el día completo está bloqueado (hora null)', () => {
    const blocks = [{ fecha: '2026-08-11', hora: null }];
    expect(computeAvailableSlots('2026-08-11', allSlots, [], blocks)).toEqual([]);
  });
});

describe('isExpired', () => {
  it('es true cuando está pendiente_abono y expira_en ya pasó', () => {
    const booking = { estado: 'pendiente_abono', expira_en: '2026-01-01T00:00:00.000Z' };
    expect(isExpired(booking, Date.parse('2026-01-01T00:30:00.000Z'))).toBe(true);
  });
  it('es false cuando ya está confirmada, aunque expira_en haya pasado', () => {
    const booking = { estado: 'confirmada', expira_en: '2026-01-01T00:00:00.000Z' };
    expect(isExpired(booking, Date.parse('2026-01-01T00:30:00.000Z'))).toBe(false);
  });
});

describe('computeExpiryTimestamp', () => {
  it('suma 30 minutos por defecto', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(computeExpiryTimestamp(from)).toBe('2026-01-01T00:30:00.000Z');
  });
});
