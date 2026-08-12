import { supabaseClient } from './supabaseClient.js';
import { SERVICE_DESCRIPTIONS, RETIRO_ADICIONAL } from './businessInfo.js';

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

  const baseCards = data
    .map((s) => `
      <div class="service-card">
        <strong>${s.nombre}</strong>
        <div>${SERVICE_DESCRIPTIONS[s.nombre] ?? ''}</div>
        <div>Duración estimada: ${s.duracion_min} min</div>
      </div>
    `)
    .join('');

  const retiroCard = `
    <div class="service-card">
      <strong>${RETIRO_ADICIONAL.nombre} <em>(adicional)</em></strong>
      <div>${RETIRO_ADICIONAL.resena}</div>
      <div>Duración estimada: ${RETIRO_ADICIONAL.duracionTexto}</div>
    </div>
  `;

  container.innerHTML = baseCards + retiroCard;
}

renderServices();
