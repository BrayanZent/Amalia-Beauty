import { supabaseClient } from './supabaseClient.js';
import { escapeHtml } from './domUtils.js';
import { renderAdminCalendar } from './adminCalendar.js';
import { getFixedSlotsForDate } from './availability.js';

function renderLogin() {
  const root = document.getElementById('admin-login');
  root.innerHTML = `
    <h1>Panel Amalia Beauty</h1>
    <form id="login-form">
      <label for="admin-email">Email</label>
      <input id="admin-email" type="email" required>
      <label for="admin-password">Contraseña</label>
      <input id="admin-password" type="password" required minlength="6">
      <button type="submit" class="btn-primary">Ingresar</button>
    </form>
    <div id="login-error" style="color:#b00; display:none;"></div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    const errorEl = document.getElementById('login-error');
    if (error) {
      errorEl.textContent = 'Email o contraseña incorrectos.';
      errorEl.style.display = 'block';
      return;
    }
    document.getElementById('admin-login').hidden = true;
    document.getElementById('admin-dashboard').hidden = false;
    document.dispatchEvent(new CustomEvent('admin-authenticated'));
  });
}

async function checkExistingSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    document.getElementById('admin-login').hidden = true;
    document.getElementById('admin-dashboard').hidden = false;
    document.dispatchEvent(new CustomEvent('admin-authenticated'));
  } else {
    renderLogin();
  }
}

checkExistingSession();

async function renderBookings() {
  const dashboard = document.getElementById('admin-dashboard');
  dashboard.innerHTML = '<h2>Agenda</h2><div id="admin-calendar-container"></div><div id="bloqueos-root"></div>';

  await renderAdminCalendar(document.getElementById('admin-calendar-container'));
  await renderBloqueos();
}

function actualizarHorasBloqueo(fecha) {
  const select = document.getElementById('bloqueo-hora');
  const horas = fecha ? getFixedSlotsForDate(fecha) : [];
  select.innerHTML = '<option value="">Todo el día</option>' + horas.map((h) => `<option value="${h}">${h}</option>`).join('');
}

async function renderBloqueos() {
  const root = document.getElementById('bloqueos-root');
  root.innerHTML = `
    <h2>Bloquear día u horario</h2>
    <form id="bloqueo-form">
      <label for="bloqueo-fecha">Fecha</label>
      <input id="bloqueo-fecha" type="date" required>
      <label for="bloqueo-hora">Hora (vacío = todo el día)</label>
      <select id="bloqueo-hora">
        <option value="">Todo el día</option>
      </select>
      <button type="submit" class="btn-primary">Bloquear</button>
    </form>
    <div id="bloqueos-list"></div>
  `;

  document.getElementById('bloqueo-fecha').addEventListener('change', (e) => {
    actualizarHorasBloqueo(e.target.value);
  });

  document.getElementById('bloqueo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('bloqueo-fecha').value;
    const hora = document.getElementById('bloqueo-hora').value.trim() || null;
    await supabaseClient.from('bloqueos').insert({ fecha, hora });
    e.target.reset();
    actualizarHorasBloqueo('');
    await listBloqueos();
  });

  await listBloqueos();
}

async function listBloqueos() {
  const { data: bloqueos } = await supabaseClient
    .from('bloqueos')
    .select('id,fecha,hora')
    .order('fecha', { ascending: true });

  document.getElementById('bloqueos-list').innerHTML = (bloqueos || [])
    .map((b) => `
      <div class="booking-item" data-id="${b.id}">
        ${escapeHtml(b.fecha)} ${b.hora ? escapeHtml(b.hora) : '(todo el día)'}
        <button type="button" class="unblock-btn">Quitar bloqueo</button>
      </div>
    `)
    .join('');

  document.querySelectorAll('.unblock-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = btn.closest('.booking-item');
      await supabaseClient.from('bloqueos').delete().eq('id', item.dataset.id);
      item.remove();
    });
  });
}

document.addEventListener('admin-authenticated', renderBookings);
