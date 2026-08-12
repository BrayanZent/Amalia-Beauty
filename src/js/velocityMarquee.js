const PASTELES = ['#f0c9d0', '#d9c9e8', '#c9e8d9', '#f0d9c0', '#c9dbf0', '#f0e8c0', '#f0b8b8', '#b8e0e0', '#ddb8e8'];
const CANTIDAD_FRASCOS = 20;

function frascoSVG(color) {
  return `
    <svg class="marquee-bottle" width="46" height="70" viewBox="0 0 34 52" aria-hidden="true">
      <rect x="13" y="0" width="8" height="7" rx="1.5" fill="#b8933f" stroke="#fff" stroke-width="1"></rect>
      <path d="M9 7 h16 a3 3 0 0 1 3 3 v34 a5 5 0 0 1 -5 5 h-12 a5 5 0 0 1 -5 -5 v-34 a3 3 0 0 1 3 -3 z" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.9"></path>
    </svg>
  `;
}

function construirFrascos() {
  let fila = '';
  for (let i = 0; i < CANTIDAD_FRASCOS; i++) {
    fila += frascoSVG(PASTELES[i % PASTELES.length]);
  }
  // Se duplica una vez para que el loop de -50% no tenga cortes visibles.
  return fila + fila;
}

function iniciarCarrusel() {
  const track = document.getElementById('marquee-track');
  if (!track || typeof gsap === 'undefined') return;

  track.innerHTML = construirFrascos();

  const loopBase = gsap.to(track, {
    xPercent: -50,
    duration: 50,
    ease: 'none',
    repeat: -1,
  });

  if (typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocidad = self.getVelocity();
      const impulso = gsap.utils.clamp(-6, 6, velocidad / 300);
      gsap.to(loopBase, {
        timeScale: 1 + Math.abs(impulso),
        duration: 0.3,
        ease: 'power1.out',
        overwrite: true,
      });
    },
  });

  ScrollTrigger.addEventListener('scrollEnd', () => {
    gsap.to(loopBase, {
      timeScale: 1,
      duration: 1,
      ease: 'power2.out',
      overwrite: true,
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarCarrusel);
} else {
  iniciarCarrusel();
}
