import { supabaseClient } from './supabaseClient.js';
import { getCalendarGrid, computeDaySlots } from './monthCalendar.js';
import { computeExpiryTimestamp } from './availability.js';
import { BUSINESS, ADDONS } from './businessInfo.js';
import { buildWhatsAppUrl } from './whatsapp.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const state = {
  services: [],
  service: null,
  addons: { kapping: false, spa: false, retiro: false },
  fecha: null,
  hora: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
};
window.__bookingState = state;

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthRange(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { first, last };
}

async function fetchMonthData(year, month) {
  const { first, last } = monthRange(year, month);
  const [{ data: bookings, error: bookingsError }, { data: blocks, error: blocksError }] = await Promise.all([
    supabaseClient.from('public_slots').select('fecha,hora,estado').gte('fecha', first).lte('fecha', last),
    supabaseClient.from('bloqueos').select('fecha,hora').gte('fecha', first).lte('fecha', last),
  ]);
  if (bookingsError || blocksError) return { bookings: [], blocks: [] };
  return { bookings: bookings || [], blocks: blocks || [] };
}

async function fetchServices() {
  const { data, error } = await supabaseClient.from('services').select('*').order('precio_desde');
  if (error) return [];
  return data || [];
}

async function renderCalendar() {
  const root = document.getElementById('booking-flow');
  root.innerHTML = `
    <div id="calendar-root"></div>
    <div id="day-detail"></div>
    <div id="booking-form-container"></div>
  `;
  await renderMonth();
}

async function renderMonth() {
  const calRoot = document.getElementById('calendar-root');
  calRoot.innerHTML = '<p>Cargando calendario…</p>';

  const year = state.viewYear;
  const month = state.viewMonth;
  const { bookings, blocks } = await fetchMonthData(year, month);
  const weeks = getCalendarGrid(year, month);
  const hoy = toLocalDateString(new Date());

  const dayCell = (dateStr) => {
    if (!dateStr) return '<div></div>';
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    const isPast = dateStr < hoy;
    const dayNum = Number(dateStr.slice(-2));

    if (dow === 0 || isPast) {
      return `<div class="cal-day cal-day-closed">${dayNum}</div>`;
    }

    const { freeSlots } = computeDaySlots(dateStr, bookings, blocks);
    const status = freeSlots.length > 0 ? 'free' : 'full';
    const selected = dateStr === state.fecha ? ' cal-day-selected' : '';
    return `<button type="button" class="cal-day cal-day-${status}${selected}" data-fecha="${dateStr}">${dayNum}<span class="cal-dot"></span></button>`;
  };

  calRoot.innerHTML = `
    <div class="cal-header">
      <span class="cal-month-label">${MESES[month]} ${year}</span>
      <button type="button" id="cal-next" class="cal-nav-btn" aria-label="Mes siguiente">›</button>
    </div>
    <div class="cal-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
    <div class="cal-grid">
      ${weeks.map((week) => week.map(dayCell).join('')).join('')}
    </div>
    <div class="cal-legend">
      <span class="cal-legend-free">Con cupos</span>
      <span class="cal-legend-full">Completo</span>
    </div>
  `;

  document.getElementById('cal-next').addEventListener('click', () => {
    state.viewMonth += 1;
    if (state.viewMonth > 11) {
      state.viewMonth = 0;
      state.viewYear += 1;
    }
    state.fecha = null;
    state.hora = null;
    document.getElementById('day-detail').innerHTML = '';
    document.getElementById('booking-form-container').innerHTML = '';
    renderMonth();
  });

  calRoot.querySelectorAll('.cal-day-free, .cal-day-full').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.fecha = btn.dataset.fecha;
      state.hora = null;
      document.getElementById('booking-form-container').innerHTML = '';
      renderMonth();
      renderDayDetail(bookings, blocks);
    });
  });
}

function renderDayDetail(bookings, blocks) {
  const root = document.getElementById('day-detail');
  if (!state.fecha) {
    root.innerHTML = '';
    return;
  }

  const { allSlots, freeSlots } = computeDaySlots(state.fecha, bookings, blocks);
  const freeSet = new Set(freeSlots);

  if (allSlots.length === 0) {
    const whatsappUrl = `https://wa.me/${BUSINESS.whatsappPhone}?text=${encodeURIComponent(`Hola! Quiero consultar disponibilidad para el ${state.fecha}.`)}`;
    root.innerHTML = `
      <p>Sin cupos disponibles ese día.</p>
      <a class="btn-primary btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
    `;
    return;
  }

  root.innerHTML = `
    <p class="label">Horas del ${state.fecha}</p>
    ${allSlots
      .map((h) => {
        const isFree = freeSet.has(h);
        const selected = h === state.hora ? ' selected' : '';
        return isFree
          ? `<button type="button" class="slot-btn${selected}" data-hora="${h}">${h}</button>`
          : `<span class="slot-btn slot-btn-taken">${h} · Reservado</span>`;
      })
      .join('')}
  `;

  root.querySelectorAll('.slot-btn:not(.slot-btn-taken)').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.hora = btn.dataset.hora;
      root.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      renderBookingForm();
    });
  });
}

async function renderBookingForm() {
  const root = document.getElementById('booking-form-container');
  if (state.services.length === 0) state.services = await fetchServices();

  root.innerHTML = `
    <p class="label">Elige tu servicio</p>
    <div id="service-options">
      ${state.services
        .map(
          (s) => `
        <label class="service-option">
          <input type="radio" name="service" value="${s.id}">
          ${s.nombre} — desde $${s.precio_desde.toLocaleString('es-CL')}
        </label>
      `
        )
        .join('')}
    </div>
    <div id="addon-options"></div>
    <p id="total-price"></p>
    <form id="client-form">
      <label for="nombre-clienta">Nombre</label>
      <input id="nombre-clienta" name="nombre" required minlength="2">

      <label for="telefono-clienta">Teléfono</label>
      <input id="telefono-clienta" name="telefono" required minlength="8" placeholder="9 1234 5678">

      <label>
        <input type="checkbox" id="consentimiento" required>
        Acepto que Amalia Beauty use estos datos para gestionar mi reserva
        (<a href="privacidad.html" target="_blank">política de privacidad</a>).
      </label>

      <button type="submit" class="btn-primary" id="submit-btn" disabled>Confirmar reserva</button>
    </form>
    <div id="form-error" style="color:#b00; display:none;"></div>
  `;

  root.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.service = state.services.find((s) => s.id === radio.value) || null;
      state.addons = { kapping: false, spa: false, retiro: false };
      renderAddonOptions();
      updateTotalPrice();
      document.getElementById('submit-btn').disabled = !state.service;
    });
  });

  document.getElementById('client-form').addEventListener('submit', handleSubmit);
}

function renderAddonOptions() {
  const root = document.getElementById('addon-options');
  if (!state.service) {
    root.innerHTML = '';
    return;
  }

  const disponibles = ADDONS.filter((a) => a.aplicaA.includes(state.service.nombre));
  if (disponibles.length === 0) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <p class="label">Adicionales</p>
    ${disponibles
      .map(
        (a) => `
      <label class="service-option">
        <input type="checkbox" data-addon="${a.id}">
        ${a.nombre} (+$${a.precio.toLocaleString('es-CL')})
      </label>
    `
      )
      .join('')}
  `;

  root.querySelectorAll('input[data-addon]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      state.addons[checkbox.dataset.addon] = checkbox.checked;
      updateTotalPrice();
    });
  });
}

function updateTotalPrice() {
  const el = document.getElementById('total-price');
  if (!state.service) {
    el.textContent = '';
    return;
  }
  let total = state.service.precio_desde;
  ADDONS.forEach((a) => {
    if (state.addons[a.id]) total += a.precio;
  });
  el.textContent = `Total: $${total.toLocaleString('es-CL')}`;
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const nombre = form.nombre.value.trim();
  const telefono = form.telefono.value.trim();
  const errorEl = document.getElementById('form-error');
  errorEl.style.display = 'none';

  const nuevaReserva = {
    nombre_clienta: nombre,
    telefono,
    service_id: state.service.id,
    fecha: state.fecha,
    hora: state.hora,
    estado: 'pendiente_abono',
    expira_en: computeExpiryTimestamp(),
    incluye_kapping: state.addons.kapping,
    incluye_spa: state.addons.spa,
    incluye_retiro: state.addons.retiro,
  };

  const { error } = await supabaseClient.from('bookings').insert(nuevaReserva);

  if (error) {
    errorEl.textContent = 'Ese cupo ya no está disponible. Elige otro horario.';
    errorEl.style.display = 'block';
    return;
  }

  document.dispatchEvent(new CustomEvent('booking-created', {
    detail: { booking: nuevaReserva, servicioNombre: state.service.nombre },
  }));
}

document.addEventListener('booking-created', (e) => {
  const { booking, servicioNombre } = e.detail;
  const { datosTransferencia, abonoMonto, whatsappPhone } = BUSINESS;
  const container = document.getElementById('booking-flow');

  const whatsappUrl = buildWhatsAppUrl(whatsappPhone, {
    servicioNombre,
    fecha: booking.fecha,
    hora: booking.hora,
    nombre: booking.nombre_clienta,
  });

  container.innerHTML = `
    <div class="service-card">
      <h3>¡Ya casi! Reserva tu cupo con un abono de $${abonoMonto.toLocaleString('es-CL')}</h3>
      <p>Tienes 30 minutos para transferir y enviar el comprobante, o el cupo se libera.</p>
      <p>
        <strong>${datosTransferencia.titular}</strong><br>
        RUT: ${datosTransferencia.rut}<br>
        ${datosTransferencia.tipoCuenta} — ${datosTransferencia.banco}<br>
        ${datosTransferencia.email}
      </p>
      <a class="btn-primary btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">
        Enviar comprobante por WhatsApp
      </a>
    </div>
  `;
});

renderCalendar();
