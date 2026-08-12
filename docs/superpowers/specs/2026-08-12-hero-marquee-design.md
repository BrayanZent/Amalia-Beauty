# Amalia Beauty — Fondo animado de esmaltes, logo y tipografía del hero

**Fecha:** 2026-08-12
**Estado:** Aprobado en conversación (mockups iterados), listo para plan de implementación.

## 1. Contexto

Sitio en producción (https://amalia-beauty.vercel.app/), HTML/CSS/JS estático sin build step. Este cambio es puramente visual/de cabecera — no toca el sistema de reservas, calendario ni backend. Se descartó explícitamente usar React + framer-motion (incompatible con el stack actual) a favor de **GSAP + ScrollTrigger vía CDN**, que sí encaja (mismo patrón que el SDK de Supabase, ya cargado por `<script src="...">`).

## 2. Carrusel de fondo animado (velocity marquee)

- Franja de "frascos de esmalte" ilustrados como SVG simple (no fotos): forma de frasco con tapa dorada (`--color-gold`) y cuerpo en uno de 9 colores pasteles fijos (ver lista abajo), cada frasco con borde blanco suave (`stroke: #fff; stroke-opacity: 0.9`) para que se distingan del fondo sin ensuciar la lectura.
- Paleta de los 9 cuerpos (fija, ciclo repetido): `#f0c9d0` `#d9c9e8` `#c9e8d9` `#f0d9c0` `#c9dbf0` `#f0e8c0` `#f0b8b8` `#b8e0e0` `#ddb8e8`.
- El contenido se **duplica una vez** (misma fila repetida x2 seguidas) para que el loop horizontal infinito no tenga saltos.
- Posición: `position: fixed; inset: 0; z-index: -1` — queda **detrás de toda la página**, visible en todas las secciones (Inicio, Servicios, Reservar/calendario, Galería, Contacto), no solo en el hero.
- Opacidad: 0.4 (suficiente para notarse, sin afectar la lectura del texto/contenido que va encima).
- Movimiento: velocidad base lenta y constante; al hacer scroll, la velocidad aumenta de forma proporcional y fluida a la velocidad de scroll (vía `ScrollTrigger.getVelocity()`); al dejar de hacer scroll, vuelve suavemente (damping, ~1 segundo con easing) a la velocidad base — nunca se detiene del todo.
- Implementación: GSAP (`gsap.to()` con `repeat: -1, ease: 'none'` para el loop base) + `ScrollTrigger` (para leer la velocidad de scroll y ajustar `timeScale()` del tween en caliente). Librería cargada por CDN (`gsap.min.js` + `ScrollTrigger.min.js`), igual que el SDK de Supabase.

## 3. Header y logo

- **Un solo logo** (elimina la duplicación que se evaluó y se descartó): el logo completo existente (`src/assets/logo.png`, con el monograma "AB" y el texto "AMALIA BEAUTY" ya dibujados en la imagen) se agranda y se centra en el header sticky.
- El header mantiene un fondo blanco semi-opaco (`rgba(255,255,255,0.92)` + `backdrop-filter: blur(2px)`) para que el logo se siga leyendo bien aunque el carrusel se mueva detrás.
- La franja de navegación rosada (`nav.site-nav`) no cambia — mismo lugar, mismos links.

## 4. Contenido del hero (sección Inicio)

- Título: "Tus uñas, tu momento" (sin cambios, ya aprobado antes).
- Pie/tagline nuevo, reemplaza el párrafo actual, centrado, con ortografía y mayúsculas corregidas:
  > Esmaltado permanente · Extensión de Polygel · Cuidado de manos · Atención personalizada

## 5. Tipografía

- Se agrega **Merriweather** (Google Fonts) para títulos (`h1`, `h2`) y textos destacados (tagline del hero, botón "Reservar hora"). El resto del texto de cuerpo mantiene la fuente actual del sistema para no afectar legibilidad en bloques largos (ej. reseñas de servicios, políticas).

## 6. Fuera de alcance

- No se tocan el calendario, el flujo de reserva, el panel admin ni el backend — cambio puramente visual del header/hero y un fondo decorativo global.
- No se usan fotos reales de frascos (se evaluó y se descartó a favor de íconos ilustrados, ver sección 2).
- No se reemplaza la tipografía de cuerpo completa por Merriweather — solo títulos/elementos destacados, para no arriesgar legibilidad en textos largos.

## 7. Supuestos

- GSAP/ScrollTrigger se cargan desde jsDelivr (mismo CDN que ya se usa para Supabase), versión 3.12.5 fijada para evitar cambios de comportamiento inesperados en una actualización automática de "latest".
- El componente vive en `src/js/velocityMarquee.js` (nombrado así en vez de `.tsx`, ya que no hay React/TypeScript en este proyecto) y se importa desde `index.html` igual que los demás scripts (`<script type="module" src="js/velocityMarquee.js"></script>`), no como componente React.
