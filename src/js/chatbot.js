import { BUSINESS } from './businessInfo.js';

const PREGUNTAS = [
  {
    texto: '¿Cuáles son los precios?',
    respuesta: 'Esmaltado permanente desde $11.000, Kapping +$4.000, Extensión Polygel desde $18.000, Spa de manos + servicio $7.000, Solo spa y arreglo de uñas $10.000, Retiro de trabajo $4.000.',
  },
  {
    texto: '¿Cuál es el horario?',
    respuesta: 'Lunes a viernes: 10:00, 15:00 y 18:00 hrs. Sábado: 9:00, 12:00, 15:00 y 18:00 hrs. Domingo cerrado.',
  },
  {
    texto: '¿Dónde están ubicadas?',
    respuesta: `Estamos en ${BUSINESS.direccion}.`,
  },
  {
    texto: '¿Cómo reservo?',
    respuesta: `Elige tu servicio y horario en la sección "Reservar" de esta página, y transfiere el abono de $${BUSINESS.abonoMonto.toLocaleString('es-CL')} para confirmar tu cupo.`,
  },
];

function render() {
  const root = document.getElementById('chatbot-root');
  root.innerHTML = `
    <button id="chatbot-toggle" class="btn-primary" style="position:fixed;bottom:80px;right:16px;border-radius:50%;width:56px;height:56px;">💬</button>
    <div id="chatbot-panel" hidden style="position:fixed;bottom:144px;right:16px;left:16px;max-width:340px;margin-left:auto;background:white;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,0.15);padding:16px;">
      <p><strong>Asistente automático de Amalia Beauty</strong></p>
      <p>Soy un bot y respondo preguntas frecuentes. Si necesitas hablar con una persona, usa el botón de WhatsApp.</p>
      <div id="chatbot-preguntas">
        ${PREGUNTAS.map((p, i) => `<button type="button" class="slot-btn" data-i="${i}">${p.texto}</button>`).join('')}
      </div>
      <div id="chatbot-respuesta"></div>
      <a class="btn-primary btn-whatsapp" href="https://wa.me/${BUSINESS.whatsappPhone}" target="_blank" rel="noopener">Hablar con Amalia</a>
    </div>
  `;

  document.getElementById('chatbot-toggle').addEventListener('click', () => {
    const panel = document.getElementById('chatbot-panel');
    panel.hidden = !panel.hidden;
  });

  document.querySelectorAll('#chatbot-preguntas .slot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('chatbot-respuesta').textContent = PREGUNTAS[btn.dataset.i].respuesta;
    });
  });
}

render();
