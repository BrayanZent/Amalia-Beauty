import { supabaseClient } from './supabaseClient.js';

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
        <strong>${b.fecha} ${b.hora}</strong> — ${b.nombre_clienta} (${b.telefono})<br>
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

document.addEventListener('admin-authenticated', renderBookings);
