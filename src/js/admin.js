import { supabaseClient } from './supabaseClient.js';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

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
  dashboard.innerHTML = '<h2>Reservas</h2><div id="bookings-list">Cargando…</div><div id="bloqueos-root"></div>';

  renderBloqueos();

  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('id,nombre_clienta,telefono,fecha,hora,estado,service_id,services(nombre)')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  const listEl = document.getElementById('bookings-list');
  if (!bookings || bookings.length === 0) {
    listEl.textContent = 'No hay reservas todavía.';
    return;
  }

  listEl.innerHTML = bookings
    .map((b) => `
      <div class="booking-item" data-id="${b.id}">
        <strong>${b.fecha} ${b.hora}</strong> — ${escapeHtml(b.nombre_clienta)} (${escapeHtml(b.telefono)})<br>
        ${b.services?.nombre ?? ''} — estado: <span class="estado">${b.estado}</span>
        ${b.estado === 'pendiente_abono' ? '<button type="button" class="btn-primary confirm-btn">Confirmar pago</button>' : ''}
      </div>
    `)
    .join('');

  listEl.querySelectorAll('.confirm-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = btn.closest('.booking-item');
      const id = item.dataset.id;
      await supabaseClient.from('bookings').update({ estado: 'confirmada' }).eq('id', id);
      item.querySelector('.estado').textContent = 'confirmada';
      btn.remove();
    });
  });
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
        <option value="09:00">09:00</option>
        <option value="10:00">10:00</option>
        <option value="12:00">12:00</option>
        <option value="15:00">15:00</option>
        <option value="18:00">18:00</option>
      </select>
      <button type="submit" class="btn-primary">Bloquear</button>
    </form>
    <div id="bloqueos-list"></div>
  `;

  document.getElementById('bloqueo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('bloqueo-fecha').value;
    const hora = document.getElementById('bloqueo-hora').value.trim() || null;
    await supabaseClient.from('bloqueos').insert({ fecha, hora });
    e.target.reset();
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
