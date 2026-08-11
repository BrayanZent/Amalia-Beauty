import { supabaseClient } from './supabaseClient.js';

function formatCLP(monto) {
  return monto.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

async function renderServices() {
  const container = document.getElementById('services-list');
  const { data, error } = await supabaseClient
    .from('services')
    .select('*')
    .order('precio_desde', { ascending: true });

  if (error) {
    container.textContent = 'No pudimos cargar los servicios. Escríbenos por WhatsApp.';
    return;
  }

  container.innerHTML = data
    .map((s) => `
      <div class="service-card">
        <strong>${s.nombre}</strong>
        <div>${s.es_adicional ? 'Adicional: ' : 'Desde '}${formatCLP(s.precio_desde)}</div>
        <div>Duración estimada: ${s.duracion_min} min</div>
      </div>
    `)
    .join('');
}

renderServices();
