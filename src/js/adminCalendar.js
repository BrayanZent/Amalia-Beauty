import { supabaseClient } from './supabaseClient.js';
import { getCalendarGrid, countActiveBookings } from './monthCalendar.js';
import { escapeHtml } from './domUtils.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const adminCalState = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selectedDate: null,
};

function monthRange(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { first, last };
}

export async function renderAdminCalendar(container) {
  container.innerHTML = '<div id="admin-cal-root"></div><div id="admin-day-detail"></div>';
  await renderAdminMonth();
}

async function renderAdminMonth() {
  const root = document.getElementById('admin-cal-root');
  root.innerHTML = '<p>Cargando calendario…</p>';

  const year = adminCalState.viewYear;
  const month = adminCalState.viewMonth;
  const { first, last } = monthRange(year, month);

  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('fecha,estado')
    .gte('fecha', first)
    .lte('fecha', last);

  const weeks = getCalendarGrid(year, month);
  const activeBookings = bookings || [];

  const dayCell = (dateStr) => {
    if (!dateStr) return '<div></div>';
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    const dayNum = Number(dateStr.slice(-2));
    if (dow === 0) return `<div class="cal-day cal-day-closed">${dayNum}</div>`;

    const count = countActiveBookings(dateStr, activeBookings);
    const selected = dateStr === adminCalState.selectedDate ? ' cal-day-selected' : '';
    return `<button type="button" class="cal-day${selected}" data-fecha="${dateStr}">${dayNum}${count > 0 ? `<span class="cal-count">${count}</span>` : ''}</button>`;
  };

  root.innerHTML = `
    <div class="cal-header">
      <button type="button" id="admin-cal-prev" class="cal-nav-btn" aria-label="Mes anterior">‹</button>
      <span class="cal-month-label">${MESES[month]} ${year}</span>
      <button type="button" id="admin-cal-next" class="cal-nav-btn" aria-label="Mes siguiente">›</button>
    </div>
    <div class="cal-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
    <div class="cal-grid">
      ${weeks.map((week) => week.map(dayCell).join('')).join('')}
    </div>
  `;

  document.getElementById('admin-cal-prev').addEventListener('click', () => {
    adminCalState.viewMonth -= 1;
    if (adminCalState.viewMonth < 0) {
      adminCalState.viewMonth = 11;
      adminCalState.viewYear -= 1;
    }
    renderAdminMonth();
  });

  document.getElementById('admin-cal-next').addEventListener('click', () => {
    adminCalState.viewMonth += 1;
    if (adminCalState.viewMonth > 11) {
      adminCalState.viewMonth = 0;
      adminCalState.viewYear += 1;
    }
    renderAdminMonth();
  });

  root.querySelectorAll('.cal-day[data-fecha]').forEach((btn) => {
    btn.addEventListener('click', () => {
      adminCalState.selectedDate = btn.dataset.fecha;
      renderAdminMonth();
      renderAdminDayDetail(adminCalState.selectedDate);
    });
  });
}

async function renderAdminDayDetail(fecha) {
  const root = document.getElementById('admin-day-detail');
  root.innerHTML = '<p>Cargando…</p>';

  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('id,nombre_clienta,telefono,fecha,hora,estado,service_id,incluye_kapping,incluye_spa,incluye_retiro,services(nombre)')
    .eq('fecha', fecha)
    .order('hora', { ascending: true });

  const adicionalesTexto = (b) => {
    const items = [];
    if (b.incluye_kapping) items.push('Kapping');
    if (b.incluye_spa) items.push('Spa de manos');
    if (b.incluye_retiro) items.push('Retiro de trabajo');
    return items.length ? ` + ${items.join(', ')}` : '';
  };

  const listaHtml = bookings && bookings.length > 0
    ? bookings
        .map(
          (b) => `
        <div class="booking-item" data-id="${b.id}">
          <strong>${b.hora}</strong> — ${escapeHtml(b.nombre_clienta)} (${escapeHtml(b.telefono)})<br>
          ${b.services?.nombre ?? ''}${adicionalesTexto(b)} — estado: <span class="estado">${b.estado}</span>
          ${b.estado === 'pendiente_abono' ? '<button type="button" class="btn-primary confirm-btn">Confirmar pago</button>' : ''}
        </div>
      `
        )
        .join('')
    : '<p>Sin reservas ese día.</p>';

  root.innerHTML = `<h3>${fecha}</h3>${listaHtml}`;

  root.querySelectorAll('.confirm-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = btn.closest('.booking-item');
      const id = item.dataset.id;
      await supabaseClient.from('bookings').update({ estado: 'confirmada' }).eq('id', id);
      item.querySelector('.estado').textContent = 'confirmada';
      btn.remove();
    });
  });

  const bloqueoFecha = document.getElementById('bloqueo-fecha');
  if (bloqueoFecha) {
    bloqueoFecha.value = fecha;
    bloqueoFecha.dispatchEvent(new Event('change'));
  }
}
