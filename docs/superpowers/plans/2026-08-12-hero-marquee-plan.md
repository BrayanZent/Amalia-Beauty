# Fondo animado, logo y tipografía del hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un fondo animado de frascos de esmalte (carrusel infinito que acelera con la velocidad de scroll y desacelera suave al detenerse) fijo detrás de toda la página, un solo logo grande y centrado en el header, tipografía Merriweather en títulos/botones, y el tagline del hero corregido.

**Architecture:** Cambio puramente visual/de cabecera sobre el sitio estático existente. GSAP + ScrollTrigger se cargan por CDN (mismo patrón que el SDK de Supabase) — sin build step, sin React. No se toca el sistema de reservas, calendario ni backend.

**Tech Stack:** HTML5, CSS3, JavaScript ES2022 (módulos nativos), GSAP 3.12.5 + ScrollTrigger (CDN), Google Fonts (Merriweather).

## Global Constraints

- No se agrega React, TypeScript ni build step — GSAP se carga por `<script>` clásico antes de los módulos, igual que Supabase.
- El fondo animado va `position: fixed`, visible detrás de TODAS las secciones (no solo el hero), a 40% de opacidad para no afectar la legibilidad.
- Un solo logo (el existente `src/assets/logo.png`, con "AB" + "AMALIA BEAUTY" ya dibujados), agrandado y centrado — no se duplica en el hero.
- Paleta de los 9 cuerpos de frasco (fija): `#f0c9d0` `#d9c9e8` `#c9e8d9` `#f0d9c0` `#c9dbf0` `#f0e8c0` `#f0b8b8` `#b8e0e0` `#ddb8e8`. Tapa dorada `var(--color-gold)`, borde blanco.
- Tagline nuevo del hero (reemplaza el actual, texto exacto): "Esmaltado permanente · Extensión de Polygel · Cuidado de manos · Atención personalizada".
- No se toca el flujo de reserva, panel admin ni backend.

---

## Task 1: Cabecera y contenido del hero en `index.html`

**Files:**
- Modify: `src/index.html`

**Interfaces:**
- Produces: elemento `<div class="marquee-bg" id="marquee-bg"><div class="marquee-track" id="marquee-track"></div></div>` (consumido por la Task 2, que llena `#marquee-track` con los frascos); scripts de GSAP/ScrollTrigger cargados como globales `window.gsap`/`window.ScrollTrigger` antes del script de la Task 2.

- [ ] **Step 1: Agregar la fuente Merriweather y los scripts de GSAP en `<head>`**

En `src/index.html`, dentro de `<head>`, después de la línea `<link rel="stylesheet" href="css/styles.css">` y antes del script de Supabase, agregar:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
```

- [ ] **Step 2: Agregar el contenedor fijo del carrusel como primer elemento de `<body>`**

Justo después de `<body>` y antes de `<header class="site-header">`, agregar:

```html
  <div class="marquee-bg" id="marquee-bg" aria-hidden="true">
    <div class="marquee-track" id="marquee-track"></div>
  </div>
```

- [ ] **Step 3: Actualizar el tagline del hero**

Cambiar:
```html
    <p>Esmaltado permanente, spa de manos y harto cariño, en el sector Vista Valle.</p>
```
por:
```html
    <p class="hero-tagline">Esmaltado permanente · Extensión de Polygel · Cuidado de manos · Atención personalizada</p>
```

- [ ] **Step 4: Agregar el script del carrusel**

Al final de `<body>`, junto a los demás scripts de módulo, agregar (antes de `services.js` para que el fondo aparezca lo antes posible):

```html
  <script type="module" src="js/velocityMarquee.js"></script>
```

- [ ] **Step 5: Verificar en navegador**

Run: servir `src/` localmente, abrir `index.html`.
Expected: no hay errores de carga de los scripts de GSAP en la consola (`window.gsap` y `window.ScrollTrigger` definidos). El div `#marquee-track` existe pero está vacío (la Task 2 lo llena). El párrafo del hero muestra el nuevo texto con el punto medio (·) como separador.

- [ ] **Step 6: Commit**

```bash
git add src/index.html
git commit -m "feat: cargar GSAP/ScrollTrigger, fuente Merriweather y contenedor del carrusel de fondo"
```

---

## Task 2: Componente del carrusel de velocidad (`velocityMarquee.js`)

**Files:**
- Create: `src/js/velocityMarquee.js`

**Interfaces:**
- Consumes: `window.gsap`, `window.ScrollTrigger` (globales de GSAP, cargados por la Task 1); elemento `#marquee-track` del DOM (de la Task 1).
- Produces: ninguna exportación (script de página, se auto-ejecuta).

- [ ] **Step 1: Implementar `src/js/velocityMarquee.js`**

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Run: abrir `index.html`, esperar 1-2 segundos.
Expected: se ven los frascos de colores pasteles moviéndose horizontalmente de forma continua e infinita (sin saltos visibles al reiniciar el loop) detrás del contenido. Al hacer scroll hacia abajo, el movimiento se acelera notoriamente; al dejar de hacer scroll, la velocidad baja de forma suave (no abrupta) hasta volver al ritmo base en ~1 segundo. Confirmar en la consola que no hay errores de GSAP/ScrollTrigger.

- [ ] **Step 3: Commit**

```bash
git add src/js/velocityMarquee.js
git commit -m "feat: carrusel de fondo con velocidad ligada al scroll (GSAP + ScrollTrigger)"
```

---

## Task 3: Estilos — header centrado, fondo fijo del carrusel y tipografía Merriweather

**Files:**
- Modify: `src/css/styles.css`

**Interfaces:**
- Consumes: clases `.marquee-bg`, `.marquee-track`, `.marquee-bottle` (de la Task 1/2); clase `.hero-tagline` (de la Task 1).

- [ ] **Step 1: Quitar el fondo sólido del `body` (se mueve a `.marquee-bg`) y centrar/agrandar el logo del header**

Cambiar:
```css
body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  padding-bottom: 72px; /* espacio para CTA sticky */
}

header.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

header.site-header img { height: 40px; }
```
por:
```css
body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--color-text);
  padding-bottom: 72px; /* espacio para CTA sticky */
}

header.site-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

header.site-header img { height: 96px; }
```

- [ ] **Step 2: Agregar los estilos del carrusel de fondo y la tipografía nueva al final de `src/css/styles.css`**

```css

.marquee-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: var(--color-bg);
  pointer-events: none;
}

.marquee-track {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  height: 100%;
  white-space: nowrap;
  width: max-content;
  opacity: 0.4;
}

.marquee-bottle {
  flex-shrink: 0;
  margin: 0 12px;
}

h1, h2, .hero-tagline, .btn-primary {
  font-family: 'Merriweather', serif;
}
```

- [ ] **Step 3: Verificar en navegador (mobile 375px y desktop)**

Run: servir `src/`, abrir `index.html` en viewport mobile (375px) y luego desktop.
Expected: el logo se ve centrado y notoriamente más grande en el header, con el fondo del header semi-transparente (se alcanza a notar el carrusel detrás si se mira con atención, sin afectar la lectura del logo). Al bajar hasta "Servicios" o "Reservar", el carrusel de frascos se sigue viendo de fondo (no desaparece al hacer scroll). Los títulos (`h1`/`h2`), el tagline del hero y los botones (`Reservar hora`, etc.) usan la tipografía serif Merriweather. En 375px, la fila de frascos no se ve cortada de forma extraña ni genera scroll horizontal en la página.

- [ ] **Step 4: Commit**

```bash
git add src/css/styles.css
git commit -m "feat: header centrado con logo más grande, fondo fijo del carrusel y tipografía Merriweather"
```

---

## Self-Review

**Cobertura del spec:** sección 2 (carrusel: paleta, duplicado, fixed, opacidad, velocidad+damping) → Tasks 1, 2, 3; sección 3 (logo único, centrado, header semi-opaco) → Tasks 1, 3; sección 4 (tagline corregido) → Task 1; sección 5 (Merriweather en títulos/destacados, no en cuerpo) → Task 3. Sin gaps.

**Placeholders:** ninguno — todo el código está completo, sin TODOs.

**Consistencia:** el id `#marquee-track` se usa igual en Task 1 (HTML), Task 2 (JS que lo llena) y Task 3 (CSS que lo estiliza). La paleta de 9 colores es idéntica en el spec y en `velocityMarquee.js`. `.hero-tagline` se crea en Task 1 y se estiliza en Task 3.
