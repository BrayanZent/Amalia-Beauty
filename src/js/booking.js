import { supabaseClient } from './supabaseClient.js';
import { getFixedSlotsForDate, computeAvailableSlots, computeExpiryTimestamp } from './availability.js';
import { BUSINESS } from './businessInfo.js';
import { buildWhatsAppUrl } from './whatsapp.js';

const state = { service: null, services: [], fecha: null, hora: null };
window.__bookingState = state;

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextSixDays() {
  const days = [];
  const hoy = new Date();
  for (let i = 0; i < 14 && days.length < 6; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    if (d.getDay() === 0) continue; // domingo cerrado
    days.push(toLocalDateString(d));
  }
  return days;
}

async function fetchServices() {
  const { data, error } = await supabaseClient.from('services').select('*').order('precio_desde');
  if (error) return [];
  return data || [];
}

async function fetchAvailability(fecha) {
  const allSlots = getFixedSlotsForDate(fecha);
  const [{ data: bookings, error: bookingsError }, { data: blocks, error: blocksError }] = await Promise.all([
    supabaseClient.from('public_slots').select('fecha,hora,estado').eq('fecha', fecha),
    supabaseClient.from('bloqueos').select('fecha,hora').eq('fecha', fecha),
  ]);
  if (bookingsError || blocksError) return [];
  return computeAvailableSlots(fecha, allSlots, bookings || [], blocks || []);
}

async function renderStep1() {
  const root = document.getElementById('booking-flow');
  state.services = await fetchServices();

  root.innerHTML = `
    <label for="service-select">Elige un servicio</label>
    <select id="service-select">
      <option value="">Selecciona…</option>
      ${state.services.map((s) => `<option value="${s.id}">${s.nombre} — desde $${s.precio_desde.toLocaleString('es-CL')}</option>`).join('')}
    </select>

    <div id="date-picker" hidden>
      <label>Elige un día</label>
      <div id="date-buttons"></div>
    </div>

    <div id="slots-container"></div>
    <div id="client-form-container"></div>
  `;

  document.getElementById('service-select').addEventListener('change', (e) => {
    state.service = state.services.find((s) => s.id === e.target.value) || null;
    document.getElementById('date-picker').hidden = !state.service;
    if (state.service) renderDateButtons();
  });
}

function renderDateButtons() {
  const container = document.getElementById('date-buttons');
  container.innerHTML = nextSixDays()
    .map((fecha) => `<button type="button" class="slot-btn" data-fecha="${fecha}">${fecha}</button>`)
    .join('');
  container.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.fecha = btn.dataset.fecha;
      state.hora = null;
      await renderSlots();
    });
  });
}

async function renderSlots() {
  const slotsContainer = document.getElementById('slots-container');
  slotsContainer.innerHTML = 'Buscando cupos…';
  const disponibles = await fetchAvailability(state.fecha);

  if (disponibles.length === 0) {
    const whatsappUrl = `https://wa.me/${BUSINESS.whatsappPhone}?text=${encodeURIComponent(`Hola! Quiero consultar disponibilidad para el ${state.fecha}.`)}`;
    slotsContainer.innerHTML = `
      <p>Sin cupos disponibles ese día.</p>
      <a class="btn-primary btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
    `;
    return;
  }

  slotsContainer.innerHTML = disponibles
    .map((hora) => `<button type="button" class="slot-btn" data-hora="${hora}">${hora}</button>`)
    .join('');
  slotsContainer.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      slotsContainer.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.hora = btn.dataset.hora;
      document.dispatchEvent(new CustomEvent('slot-selected'));
    });
  });
}

document.addEventListener('slot-selected', () => {
  const container = document.getElementById('client-form-container');
  container.innerHTML = `
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

      <button type="submit" class="btn-primary">Confirmar reserva</button>
    </form>
    <div id="form-error" style="color:#b00; display:none;"></div>
  `;

  document.getElementById('client-form').addEventListener('submit', handleSubmit);
});

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
  };

  const { error } = await supabaseClient
    .from('bookings')
    .insert(nuevaReserva);

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

renderStep1();
