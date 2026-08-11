import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../js/whatsapp.js';

describe('buildWhatsAppMessage', () => {
  it('incluye servicio, fecha, hora y nombre', () => {
    const msg = buildWhatsAppMessage({
      servicioNombre: 'Esmaltado permanente',
      fecha: '2026-08-11',
      hora: '15:00',
      nombre: 'Javiera',
    });
    expect(msg).toContain('Esmaltado permanente');
    expect(msg).toContain('2026-08-11');
    expect(msg).toContain('15:00');
    expect(msg).toContain('Javiera');
  });
});

describe('buildWhatsAppUrl', () => {
  it('arma una URL wa.me con el mensaje codificado', () => {
    const url = buildWhatsAppUrl('56991569439', {
      servicioNombre: 'Retiro de trabajo',
      fecha: '2026-08-12',
      hora: '10:00',
      nombre: 'Camila',
    });
    expect(url.startsWith('https://wa.me/56991569439?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Retiro de trabajo');
  });
});
