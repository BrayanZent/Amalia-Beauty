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
