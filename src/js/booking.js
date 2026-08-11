import { supabaseClient } from './supabaseClient.js';
import { getFixedSlotsForDate, computeAvailableSlots } from './availability.js';
import { BUSINESS } from './businessInfo.js';

const state = { service: null, services: [], fecha: null, hora: null };
window.__bookingState = state;

function nextSixDays() {
  const days = [];
  const hoy = new Date();
  for (let i = 0; i < 14 && days.length < 6; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    if (d.getDay() === 0) continue; // domingo cerrado
    days.push(d.toISOString().slice(0, 10));
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
    supabaseClient.from('bookings').select('fecha,hora,estado').eq('fecha', fecha),
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

renderStep1();
