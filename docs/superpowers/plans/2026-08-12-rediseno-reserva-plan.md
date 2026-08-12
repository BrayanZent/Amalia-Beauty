# Rediseño de reserva — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestructurar los servicios de Amalia Beauty a 3 base + adicionales condicionales, reemplazar el selector de fecha por un calendario mensual interactivo (público y admin) que muestre horas libres y ocupadas, mover la reserva al inicio de la página, agrandar el logo y agregar el bloque de políticas del negocio.

**Architecture:** Mismo stack existente (HTML/CSS/JS estático + Supabase). Se agrega un módulo de lógica pura nueva (`monthCalendar.js`) reutilizado por el sitio público y el panel admin. La migración de base de datos es aditiva/en el lugar (no se recrean tablas) para no perder datos de producción.

**Tech Stack:** HTML5, CSS3, JavaScript ES2022 (módulos nativos), Supabase JS SDK v2, vitest (lógica pura, verificada por el controlador vía navegador — sin Node.js en este entorno).

## Global Constraints

- Mobile-first, verificado explícitamente en viewport de 375px de ancho (estándar del proyecto) antes de dar por buena cualquier tarea visual.
- El sitio está en producción (https://amalia-beauty.vercel.app/, Supabase real conectado) — cualquier cambio de esquema debe ser aditivo/no destructivo para las reservas ya existentes.
- No se toca el flujo de abono/expiración de 30 min/WhatsApp — sigue exactamente igual.
- No inventar datos del negocio: usar exactamente los valores de `docs/superpowers/specs/2026-08-12-rediseno-reserva-design.md`.
- Paleta: `--color-gold` para "disponible", una variante apagada de `--color-primary`/`--color-bg-alt` para "reservado/completo" — sin rojo/verde.
- El calendario mensual público solo navega hacia adelante (no hay mes anterior al actual). El del panel admin navega en ambos sentidos.

---

## Task 1: Migración de base de datos

**Files:**
- Create: `supabase/migration-2026-08-12-servicios-calendario.sql`

**Interfaces:**
- Produces: tabla `services` con exactamente 3 filas (Extensión de Polygel, Esmaltado permanente, Spa y arreglo de uñas) manteniendo sus `id` originales; tabla `bookings` con 3 columnas nuevas: `incluye_kapping`, `incluye_spa`, `incluye_retiro` (boolean, default false).

Esta tarea NO se ejecuta con `psql`/`supabase` CLI (no hay conexión a la base de datos real desde este entorno) — se prepara el script SQL y lo ejecuta el usuario en el SQL Editor de Supabase, igual que el `schema.sql` original.

- [ ] **Step 1: Crear `supabase/migration-2026-08-12-servicios-calendario.sql`**

```sql
-- 1. Verificación previa: ¿hay reservas que dependan de un servicio "adicional"
--    (Kapping, Spa de manos, Retiro de trabajo) que se va a eliminar de `services`?
--    Ejecuta este SELECT primero. Si devuelve filas, avisa antes de continuar
--    con el resto del script — hay que decidir qué hacer con esas reservas
--    (ej. reasignarlas a un servicio base, o eliminarlas si son de prueba).
select b.id, b.nombre_clienta, b.fecha, b.hora, s.nombre as servicio_a_eliminar
from bookings b
join services s on s.id = b.service_id
where s.es_adicional = true;

-- 2. Actualiza los 3 servicios base EN EL MISMO id (no rompe las reservas
--    existentes, que referencian estos ids por FK).
update services set nombre = 'Extensión de Polygel', precio_desde = 18000, duracion_min = 120
  where nombre = 'Extensión Polygel';
update services set nombre = 'Esmaltado permanente', precio_desde = 11000, duracion_min = 60
  where nombre = 'Esmaltado permanente';
update services set nombre = 'Spa y arreglo de uñas', precio_desde = 10000, duracion_min = 45
  where nombre = 'Solo spa y arreglo de uñas';

-- 3. Elimina los servicios que ahora son adicionales (dejan de ser filas de
--    `services`; la compatibilidad adicional-por-base vive en el código).
--    Solo corre esto después de resolver cualquier fila que haya aparecido
--    en el paso 1.
delete from services where es_adicional = true;

-- 4. Agrega las columnas de adicionales a `bookings` (aditivo, default false
--    para las reservas que ya existen).
alter table bookings
  add column incluye_kapping boolean not null default false,
  add column incluye_spa boolean not null default false,
  add column incluye_retiro boolean not null default false;
```

- [ ] **Step 2: Verificar el contenido del archivo**

Run: leer el archivo de vuelta y confirmar que las 4 secciones (verificación, updates, delete, alter) están completas y sin placeholders.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-2026-08-12-servicios-calendario.sql
git commit -m "feat: script de migración a servicios base + columnas de adicionales"
```

**Nota para el controlador (no para el implementador):** después de que este script se escriba y se revise, el usuario debe ejecutar el Step 1 (SELECT) en su Supabase real y reportar el resultado antes de correr el resto — esto no lo puede validar el implementador ni el reviewer automático, ya que no hay acceso a la base de datos de producción desde este entorno.

---

## Task 2: Datos de negocio — adicionales y reseñas del catálogo

**Files:**
- Modify: `src/js/businessInfo.js`

**Interfaces:**
- Produces:
  - `ADDONS: { id: string, nombre: string, precio: number, aplicaA: string[] }[]` — `aplicaA` contiene los valores exactos de `services.nombre` post-migración a los que aplica cada adicional.
  - `SERVICE_DESCRIPTIONS: Record<string, string>` — reseña breve por `nombre` de servicio base.
  - `RETIRO_ADICIONAL: { nombre: string, resena: string, duracionTexto: string }` — para la 4ª tarjeta informativa del catálogo.

- [ ] **Step 1: Agregar las 3 constantes nuevas a `src/js/businessInfo.js`**

Agregar al final del archivo (después del cierre de `BUSINESS`):

```js

export const ADDONS = [
  { id: 'kapping', nombre: 'Kapping', precio: 4000, aplicaA: ['Esmaltado permanente'] },
  { id: 'spa', nombre: 'Spa de manos', precio: 7000, aplicaA: ['Esmaltado permanente', 'Extensión de Polygel'] },
  { id: 'retiro', nombre: 'Retiro de trabajo anterior', precio: 4000, aplicaA: ['Esmaltado permanente', 'Extensión de Polygel', 'Spa y arreglo de uñas'] },
];

export const SERVICE_DESCRIPTIONS = {
  'Extensión de Polygel': 'Extensión con Polygel para largo y forma a medida, terminación pulida y resistente al uso diario.',
  'Esmaltado permanente': 'Esmaltado de larga duración, sin descascararse ni perder brillo. Suma Kapping como adicional para reforzar la uña.',
  'Spa y arreglo de uñas': 'Ritual de higienizante, exfoliante de perlas de jojoba, mascarilla de karité, loción con aloe vera y vitamina E, y aceite de cutículas. Productos cruelty free y veganos.',
};

export const RETIRO_ADICIONAL = {
  nombre: 'Retiro de trabajo',
  resena: 'Retiramos tu esmaltado permanente o extensión de Polygel anterior de forma segura, cuidando la uña natural. No lo hagas tú misma en casa: un retiro incorrecto puede dañar y debilitar la uña.',
  duracionTexto: '30-40 min',
};
```

- [ ] **Step 2: Verificar que los `nombre` en `ADDONS`/`SERVICE_DESCRIPTIONS` coincidan exactamente con los de la migración (Task 1)**

Run: comparar contra `supabase/migration-2026-08-12-servicios-calendario.sql` — los 3 `update ... set nombre = '...'` deben coincidir carácter por carácter con las claves usadas acá (`'Extensión de Polygel'`, `'Esmaltado permanente'`, `'Spa y arreglo de uñas'`).
Expected: coinciden exactamente (mayúsculas, tildes, espacios).

- [ ] **Step 3: Commit**

```bash
git add src/js/businessInfo.js
git commit -m "feat: adicionales condicionales y reseñas del catálogo en businessInfo.js"
```

---

## Task 3: Lógica pura del calendario mensual

**Files:**
- Create: `src/js/monthCalendar.js`
- Test: `src/tests/monthCalendar.test.js`

**Interfaces:**
- Consumes: `getFixedSlotsForDate`, `computeAvailableSlots` de `./availability.js` (ya existen, firmas sin cambios).
- Produces:
  - `getCalendarGrid(year: number, month: number) -> (string|null)[][]` — `month` 0-indexado (0=enero). Semanas de lunes a domingo, `null` en casillas de relleno.
  - `computeDaySlots(dateStr: string, bookings, blocks) -> { allSlots: string[], freeSlots: string[], takenSlots: string[] }`
  - `countActiveBookings(dateStr: string, bookings) -> number`

- [ ] **Step 1: Escribir los tests que fallan**

```js
// src/tests/monthCalendar.test.js
import { describe, it, expect } from 'vitest';
import { getCalendarGrid, computeDaySlots, countActiveBookings } from '../js/monthCalendar.js';

describe('getCalendarGrid', () => {
  it('cada semana tiene 7 casillas', () => {
    const weeks = getCalendarGrid(2026, 7); // agosto 2026
    weeks.forEach((w) => expect(w).toHaveLength(7));
  });

  it('el total de días no nulos coincide con los días del mes (febrero 2026, no bisiesto = 28 días)', () => {
    const weeks = getCalendarGrid(2026, 1);
    const nonNull = weeks.flat().filter(Boolean);
    expect(nonNull).toHaveLength(28);
  });

  it('el primer día no nulo es el día 1 del mes, formato YYYY-MM-DD', () => {
    const weeks = getCalendarGrid(2026, 7); // agosto
    const firstDay = weeks.flat().find(Boolean);
    expect(firstDay).toBe('2026-08-01');
  });

  it('el último día no nulo es el último día del mes (agosto = 31)', () => {
    const weeks = getCalendarGrid(2026, 7);
    const nonNull = weeks.flat().filter(Boolean);
    expect(nonNull[nonNull.length - 1]).toBe('2026-08-31');
  });
});

describe('computeDaySlots', () => {
  it('separa horas libres y tomadas de un martes (10:00/15:00/18:00)', () => {
    const bookings = [{ fecha: '2026-08-11', hora: '15:00', estado: 'confirmada' }];
    const result = computeDaySlots('2026-08-11', bookings, []);
    expect(result.allSlots).toEqual(['10:00', '15:00', '18:00']);
    expect(result.freeSlots).toEqual(['10:00', '18:00']);
    expect(result.takenSlots).toEqual(['15:00']);
  });

  it('domingo no tiene horas', () => {
    const result = computeDaySlots('2026-08-16', [], []);
    expect(result.allSlots).toEqual([]);
    expect(result.freeSlots).toEqual([]);
    expect(result.takenSlots).toEqual([]);
  });

  it('un bloqueo de todo el día deja takenSlots igual a allSlots', () => {
    const blocks = [{ fecha: '2026-08-11', hora: null }];
    const result = computeDaySlots('2026-08-11', [], blocks);
    expect(result.freeSlots).toEqual([]);
    expect(result.takenSlots).toEqual(['10:00', '15:00', '18:00']);
  });
});

describe('countActiveBookings', () => {
  it('cuenta solo reservas activas (pendiente_abono/confirmada) de esa fecha', () => {
    const bookings = [
      { fecha: '2026-08-11', estado: 'confirmada' },
      { fecha: '2026-08-11', estado: 'pendiente_abono' },
      { fecha: '2026-08-11', estado: 'expirada' },
      { fecha: '2026-08-12', estado: 'confirmada' },
    ];
    expect(countActiveBookings('2026-08-11', bookings)).toBe(2);
  });

  it('devuelve 0 si no hay reservas ese día', () => {
    expect(countActiveBookings('2026-08-20', [])).toBe(0);
  });
});
```

- [ ] **Step 2: Confirmar que no hay Node.js/npm en este entorno (ya verificado en sesiones anteriores)**

Run: `npm test` (se espera que falle con "npm: command not found" — esperado en este sandbox).
Este archivo de test queda listo para cuando el cliente tenga Node.js o para CI. La verificación real en este entorno se hace ejecutando las mismas aserciones en un navegador real (el controlador lo hace después de este task, no el implementador).

- [ ] **Step 3: Implementar `src/js/monthCalendar.js`**

```js
import { getFixedSlotsForDate, computeAvailableSlots } from './availability.js';

export function getCalendarGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=lunes .. 6=domingo

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function computeDaySlots(dateStr, bookings, blocks) {
  const allSlots = getFixedSlotsForDate(dateStr);
  const freeSlots = computeAvailableSlots(dateStr, allSlots, bookings, blocks);
  const freeSet = new Set(freeSlots);
  const takenSlots = allSlots.filter((h) => !freeSet.has(h));
  return { allSlots, freeSlots, takenSlots };
}

export function countActiveBookings(dateStr, bookings) {
  const activos = ['pendiente_abono', 'confirmada'];
  return bookings.filter((b) => b.fecha === dateStr && activos.includes(b.estado)).length;
}
```

- [ ] **Step 4: Trazar manualmente cada test contra la implementación**

Escribe en tu reporte, para cada uno de los 9 tests: el input, el recorrido paso a paso de la lógica, y el resultado, confirmando que coincide con lo esperado. Presta especial atención a `getCalendarGrid`: `(firstOfMonth.getDay() + 6) % 7` convierte domingo=0 a domingo=6 y lunes=1 a lunes=0 (para que la semana empiece en lunes).

- [ ] **Step 5: Commit**

```bash
git add src/js/monthCalendar.js src/tests/monthCalendar.test.js
git commit -m "feat: lógica pura del calendario mensual con tests"
```

---

## Task 4: Logo más grande y estilos del calendario, adicionales y políticas

**Files:**
- Modify: `src/css/styles.css`

**Interfaces:**
- Produces: clases CSS consumidas por las Tasks 5, 6, 7 y 9: `.cal-header`, `.cal-month-label`, `.cal-nav-btn`, `.cal-weekdays`, `.cal-grid`, `.cal-day`, `.cal-day-closed`, `.cal-day-free`, `.cal-day-full`, `.cal-day-selected`, `.cal-dot`, `.cal-count`, `.cal-legend`, `.cal-legend-free`, `.cal-legend-full`, `.slot-btn-taken`, `.service-option`, `.policy-box`.

- [ ] **Step 1: Modificar el tamaño del logo**

En `src/css/styles.css`, cambiar:
```css
header.site-header img { height: 40px; }
```
por:
```css
header.site-header img { height: 72px; }
```

- [ ] **Step 2: Agregar los estilos nuevos al final de `src/css/styles.css`**

```css

.policy-box {
  background: var(--color-bg-alt);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 16px;
  font-size: 14px;
}

.policy-box ul { margin: 8px 0 0; padding-left: 20px; }
.policy-box li { margin-bottom: 6px; }

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cal-month-label {
  font-weight: 700;
  color: var(--color-primary-dark);
  text-transform: capitalize;
}

.cal-nav-btn {
  background: var(--color-gold);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.cal-weekdays, .cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  text-align: center;
}

.cal-weekdays span {
  font-size: 11px;
  color: var(--color-primary-dark);
  font-weight: 600;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  padding: 2px;
  font-family: inherit;
}

.cal-day-closed { color: #c9beb8; cursor: default; }
.cal-day-selected { background: var(--color-bg-alt); font-weight: 700; }

.cal-dot { width: 5px; height: 5px; border-radius: 50%; margin-top: 2px; }
.cal-day-free .cal-dot { background: var(--color-gold); }
.cal-day-full .cal-dot { background: var(--color-primary); opacity: 0.5; }

.cal-count {
  font-size: 10px;
  color: var(--color-primary-dark);
  margin-top: 1px;
}

.cal-legend {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-text);
  margin-top: 8px;
}

.cal-legend-free::before, .cal-legend-full::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.cal-legend-free::before { background: var(--color-gold); }
.cal-legend-full::before { background: var(--color-primary); opacity: 0.5; }

.slot-btn-taken {
  background: var(--color-bg-alt);
  color: #a89a94;
  text-decoration: line-through;
  border-color: var(--color-bg-alt);
  cursor: default;
}

.service-option {
  display: block;
  padding: 10px 0;
  font-size: 15px;
}
```

- [ ] **Step 3: Verificar en navegador**

Run: servir `src/` localmente, abrir `index.html`, confirmar que el logo del header se ve notoriamente más grande que antes.
Expected: logo de 72px de alto (antes 40px), sin romper el layout del header (sigue centrado verticalmente por el `align-items: center` del contenedor).

- [ ] **Step 4: Commit**

```bash
git add src/css/styles.css
git commit -m "feat: logo más grande y estilos de calendario, adicionales y políticas"
```

---

## Task 5: Catálogo informativo actualizado (reseña + duración, sin precio)

**Files:**
- Modify: `src/js/services.js`

**Interfaces:**
- Consumes: `SERVICE_DESCRIPTIONS`, `RETIRO_ADICIONAL` de `./businessInfo.js` (Task 2).
- Produces: renderiza `#services-list` en `index.html` con 4 tarjetas (3 base + Retiro de trabajo), sin precio.

- [ ] **Step 1: Reemplazar el contenido completo de `src/js/services.js`**

```js
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
```

- [ ] **Step 2: Verificar en navegador (con Supabase real ya conectado)**

Run: abrir `index.html`, bajar hasta "Servicios".
Expected: 4 tarjetas — Extensión de Polygel, Esmaltado permanente, Spa y arreglo de uñas (los 3 nombres exactos post-migración) con su reseña y duración, sin precio en ninguna; y una 4ª tarjeta "Retiro de trabajo (adicional)" con el aviso de seguridad y "30-40 min".

- [ ] **Step 3: Commit**

```bash
git add src/js/services.js
git commit -m "feat: catálogo informativo con reseña y duración, sin precio, más tarjeta de retiro"
```

---

## Task 6: Bloque de políticas y reordenar la página

**Files:**
- Modify: `src/index.html`

**Interfaces:**
- Ninguna (solo estructura HTML — el contenido del bloque de políticas es estático, no requiere JS).

- [ ] **Step 1: Reordenar las secciones y agregar el bloque de políticas**

Reemplazar todo el bloque desde `<section id="inicio">` hasta el cierre de `<section id="reservar">` (déjalo tal como sigue — nota que `#reservar` ahora va inmediatamente después de `#inicio`, antes de `#servicios`):

```html
  <section id="inicio">
    <h1>Tus uñas, tu momento</h1>
    <p>Esmaltado permanente, spa de manos y harto cariño, en el sector Vista Valle.</p>
  </section>

  <section id="reservar">
    <h2>Reservar hora</h2>
    <div class="policy-box">
      <strong>Información importante</strong>
      <ul>
        <li>Para agendar la cita debes abonar $3.000; de lo contrario la hora no queda agendada y estará disponible para otra persona.</li>
        <li>El abono no es reembolsable en ningún caso.</li>
        <li>Para cambiar tu hora debes hacerlo mínimo 5 horas antes, o el abono se pierde.</li>
        <li>Esperamos 15 minutos de retraso.</li>
        <li>¿Necesitas una hora fuera de estos horarios? Hay opción de sobre-cupo (tardes/noches o domingo, con costo adicional) — escríbenos por WhatsApp.</li>
      </ul>
    </div>
    <div id="booking-flow"></div>
  </section>

  <section id="servicios">
    <h2>Servicios</h2>
    <div id="services-list">Cargando servicios…</div>
  </section>
```

El resto del archivo (`#galeria`, `#contacto`, scripts, etc.) no cambia — solo se mueve el bloque `#reservar` de su posición actual (después de `#galeria`) a inmediatamente después de `#inicio`, y se elimina de donde estaba antes. La sección `#servicios` queda donde estaba `#reservar` originalmente (entre inicio/reservar y galería).

- [ ] **Step 2: Actualizar el menú de navegación para reflejar el nuevo orden**

Cambiar:
```html
  <nav class="site-nav">
    <a href="#inicio">Inicio</a>
    <a href="#servicios">Servicios</a>
    <a href="#galeria">Galería</a>
    <a href="#reservar">Reservar</a>
    <a href="#contacto">Ubicación/Contacto</a>
  </nav>
```
por:
```html
  <nav class="site-nav">
    <a href="#inicio">Inicio</a>
    <a href="#reservar">Reservar</a>
    <a href="#servicios">Servicios</a>
    <a href="#galeria">Galería</a>
    <a href="#contacto">Ubicación/Contacto</a>
  </nav>
```

- [ ] **Step 3: Verificar en navegador**

Run: abrir `index.html`.
Expected: el orden visual de arriba hacia abajo es Inicio → Reservar (con el bloque de políticas visible arriba del calendario) → Servicios → Galería → Ubicación/Contacto. Los enlaces del menú llevan a la sección correcta.

- [ ] **Step 4: Commit**

```bash
git add src/index.html
git commit -m "feat: mover reserva al inicio de la página y agregar bloque de políticas"
```

---

## Task 7: Calendario público — grilla mensual, navegación y detalle de horas

**Files:**
- Modify: `src/js/booking.js`

**Interfaces:**
- Consumes: `getCalendarGrid`, `computeDaySlots` de `./monthCalendar.js` (Task 3); `BUSINESS` de `./businessInfo.js`.
- Produces: renderiza el calendario mensual y el detalle de horas dentro de `#booking-flow`. Expone `window.__bookingState` con `{ fecha, hora, viewYear, viewMonth, ... }` para que la Task 8 lo consuma y complete.

Esta tarea reemplaza por completo la lógica de `nextSixDays()`/`renderDateButtons()`/`renderSlots()` del archivo actual. La Task 8 completará este archivo agregando la selección de servicio/adicionales y el envío del formulario — por ahora, deja el detalle de horas terminando en un `console.log` de marcador de posición temporal que la Task 8 reemplazará (esto es intencional: la Task 7 se puede verificar de forma independiente sin esperar a la Task 8).

- [ ] **Step 1: Reemplazar el contenido completo de `src/js/booking.js`**

```js
import { supabaseClient } from './supabaseClient.js';
import { getCalendarGrid, computeDaySlots } from './monthCalendar.js';
import { BUSINESS } from './businessInfo.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const state = {
  services: [],
  service: null,
  addons: { kapping: false, spa: false, retiro: false },
  fecha: null,
  hora: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
};
window.__bookingState = state;

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthRange(year, month) {
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { first, last };
}

async function fetchMonthData(year, month) {
  const { first, last } = monthRange(year, month);
  const [{ data: bookings, error: bookingsError }, { data: blocks, error: blocksError }] = await Promise.all([
    supabaseClient.from('public_slots').select('fecha,hora,estado').gte('fecha', first).lte('fecha', last),
    supabaseClient.from('bloqueos').select('fecha,hora').gte('fecha', first).lte('fecha', last),
  ]);
  if (bookingsError || blocksError) return { bookings: [], blocks: [] };
  return { bookings: bookings || [], blocks: blocks || [] };
}

async function renderCalendar() {
  const root = document.getElementById('booking-flow');
  root.innerHTML = `
    <div id="calendar-root"></div>
    <div id="day-detail"></div>
    <div id="booking-form-container"></div>
  `;
  await renderMonth();
}

async function renderMonth() {
  const calRoot = document.getElementById('calendar-root');
  calRoot.innerHTML = '<p>Cargando calendario…</p>';

  const year = state.viewYear;
  const month = state.viewMonth;
  const { bookings, blocks } = await fetchMonthData(year, month);
  const weeks = getCalendarGrid(year, month);
  const hoy = toLocalDateString(new Date());

  const dayCell = (dateStr) => {
    if (!dateStr) return '<div></div>';
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    const isPast = dateStr < hoy;
    const dayNum = Number(dateStr.slice(-2));

    if (dow === 0 || isPast) {
      return `<div class="cal-day cal-day-closed">${dayNum}</div>`;
    }

    const { freeSlots } = computeDaySlots(dateStr, bookings, blocks);
    const status = freeSlots.length > 0 ? 'free' : 'full';
    const selected = dateStr === state.fecha ? ' cal-day-selected' : '';
    return `<button type="button" class="cal-day cal-day-${status}${selected}" data-fecha="${dateStr}">${dayNum}<span class="cal-dot"></span></button>`;
  };

  calRoot.innerHTML = `
    <div class="cal-header">
      <span class="cal-month-label">${MESES[month]} ${year}</span>
      <button type="button" id="cal-next" class="cal-nav-btn" aria-label="Mes siguiente">›</button>
    </div>
    <div class="cal-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
    <div class="cal-grid">
      ${weeks.map((week) => week.map(dayCell).join('')).join('')}
    </div>
    <div class="cal-legend">
      <span class="cal-legend-free">Con cupos</span>
      <span class="cal-legend-full">Completo</span>
    </div>
  `;

  document.getElementById('cal-next').addEventListener('click', () => {
    state.viewMonth += 1;
    if (state.viewMonth > 11) {
      state.viewMonth = 0;
      state.viewYear += 1;
    }
    state.fecha = null;
    state.hora = null;
    document.getElementById('day-detail').innerHTML = '';
    document.getElementById('booking-form-container').innerHTML = '';
    renderMonth();
  });

  calRoot.querySelectorAll('.cal-day-free, .cal-day-full').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.fecha = btn.dataset.fecha;
      state.hora = null;
      document.getElementById('booking-form-container').innerHTML = '';
      renderMonth();
      renderDayDetail(bookings, blocks);
    });
  });
}

function renderDayDetail(bookings, blocks) {
  const root = document.getElementById('day-detail');
  if (!state.fecha) {
    root.innerHTML = '';
    return;
  }

  const { allSlots, freeSlots } = computeDaySlots(state.fecha, bookings, blocks);
  const freeSet = new Set(freeSlots);

  if (allSlots.length === 0) {
    const whatsappUrl = `https://wa.me/${BUSINESS.whatsappPhone}?text=${encodeURIComponent(`Hola! Quiero consultar disponibilidad para el ${state.fecha}.`)}`;
    root.innerHTML = `
      <p>Sin cupos disponibles ese día.</p>
      <a class="btn-primary btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
    `;
    return;
  }

  root.innerHTML = `
    <p class="label">Horas del ${state.fecha}</p>
    ${allSlots
      .map((h) => {
        const isFree = freeSet.has(h);
        const selected = h === state.hora ? ' selected' : '';
        return isFree
          ? `<button type="button" class="slot-btn${selected}" data-hora="${h}">${h}</button>`
          : `<span class="slot-btn slot-btn-taken">${h} · Reservado</span>`;
      })
      .join('')}
  `;

  root.querySelectorAll('.slot-btn:not(.slot-btn-taken)').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.hora = btn.dataset.hora;
      root.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      // NOTA: la Task 8 reemplaza esta línea por la llamada real a renderBookingForm().
      console.log('slot seleccionado, listo para Task 8:', state.fecha, state.hora);
    });
  });
}

renderCalendar();
```

- [ ] **Step 2: Actualizar el script tag en `src/index.html` (si hace falta) y verificar en navegador**

El `<script type="module" src="js/booking.js"></script>` ya existe en `index.html` desde antes — no requiere cambios.

Run: servir `src/` localmente, abrir `index.html`, ir a "Reservar".
Expected: se ve el calendario del mes actual con los días habilitados mostrando un punto (dorado si quedan cupos, rosado apagado si está completo — con Supabase real conectado, la mayoría de los días deberían mostrar "con cupos" salvo que haya reservas de prueba ocupando algún día). Domingos y días pasados aparecen apagados y no clickeables. Al hacer clic en un día habilitado, aparecen las horas de ese día — las libres como botones normales, las tomadas (si las hay) tachadas con "Reservado". Al hacer clic en el botón "›" cambia al mes siguiente y se limpia cualquier selección previa. Confirmar además, en viewport de 375px, que la grilla de 7 columnas no corta los números de día.

- [ ] **Step 3: Commit**

```bash
git add src/js/booking.js
git commit -m "feat: calendario mensual público con navegación y detalle de horas"
```

---

## Task 8: Selección de servicio, adicionales, precio total y formulario

**Files:**
- Modify: `src/js/booking.js`

**Interfaces:**
- Consumes: `ADDONS` de `./businessInfo.js` (Task 2); `computeExpiryTimestamp` de `./availability.js`; `buildWhatsAppUrl` de `./whatsapp.js`; `state.fecha`/`state.hora` establecidos por la Task 7.
- Produces: crea la reserva en Supabase con las 3 columnas de adicionales (`incluye_kapping`, `incluye_spa`, `incluye_retiro`) y dispara `booking-created` — reutiliza exactamente el mismo evento y panel de confirmación que ya existía (sin cambios en esa parte).

- [ ] **Step 1: Agregar los imports que faltan al inicio de `src/js/booking.js`**

Cambiar la línea:
```js
import { BUSINESS } from './businessInfo.js';
```
por:
```js
import { computeExpiryTimestamp } from './availability.js';
import { BUSINESS, ADDONS } from './businessInfo.js';
import { buildWhatsAppUrl } from './whatsapp.js';
```

- [ ] **Step 2: Reemplazar la línea de marcador de posición de la Task 7**

Buscar (dentro de `renderDayDetail`, en el listener de clic de los botones de hora libre):
```js
      state.hora = btn.dataset.hora;
      root.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      // NOTA: la Task 8 reemplaza esta línea por la llamada real a renderBookingForm().
      console.log('slot seleccionado, listo para Task 8:', state.fecha, state.hora);
```
por:
```js
      state.hora = btn.dataset.hora;
      root.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      renderBookingForm();
```

- [ ] **Step 3: Agregar las funciones nuevas al final de `src/js/booking.js` (antes de la línea `renderCalendar();`)**

```js
async function fetchServices() {
  const { data, error } = await supabaseClient.from('services').select('*').order('precio_desde');
  if (error) return [];
  return data || [];
}

async function renderBookingForm() {
  const root = document.getElementById('booking-form-container');
  if (state.services.length === 0) state.services = await fetchServices();

  root.innerHTML = `
    <p class="label">Elige tu servicio</p>
    <div id="service-options">
      ${state.services
        .map(
          (s) => `
        <label class="service-option">
          <input type="radio" name="service" value="${s.id}">
          ${s.nombre} — desde $${s.precio_desde.toLocaleString('es-CL')}
        </label>
      `
        )
        .join('')}
    </div>
    <div id="addon-options"></div>
    <p id="total-price"></p>
    <form id="client-form">
      <label for="nombre-clienta">Nombre</label>
      <input id="nombre-clienta" name="nombre" required minlength="2">

      <label for="telefono-clienta">Teléfono</label>
      <input id="telefono-clienta" name="telefono" required minlength="8" placeholder="9 1234 5678">

      <label>
        <input type="checkbox" id="consentimiento" required>
        Acepto que Amalia Beauty use estos datos para gestionar mi reserva
        (<a href="privacidad.html" target="_blank">política de privacidad</a>).
      </label>

      <button type="submit" class="btn-primary" id="submit-btn" disabled>Confirmar reserva</button>
    </form>
    <div id="form-error" style="color:#b00; display:none;"></div>
  `;

  root.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.service = state.services.find((s) => s.id === radio.value) || null;
      state.addons = { kapping: false, spa: false, retiro: false };
      renderAddonOptions();
      updateTotalPrice();
      document.getElementById('submit-btn').disabled = !state.service;
    });
  });

  document.getElementById('client-form').addEventListener('submit', handleSubmit);
}

function renderAddonOptions() {
  const root = document.getElementById('addon-options');
  if (!state.service) {
    root.innerHTML = '';
    return;
  }

  const disponibles = ADDONS.filter((a) => a.aplicaA.includes(state.service.nombre));
  if (disponibles.length === 0) {
    root.innerHTML = '';
    return;
  }

  root.innerHTML = `
    <p class="label">Adicionales</p>
    ${disponibles
      .map(
        (a) => `
      <label class="service-option">
        <input type="checkbox" data-addon="${a.id}">
        ${a.nombre} (+$${a.precio.toLocaleString('es-CL')})
      </label>
    `
      )
      .join('')}
  `;

  root.querySelectorAll('input[data-addon]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      state.addons[checkbox.dataset.addon] = checkbox.checked;
      updateTotalPrice();
    });
  });
}

function updateTotalPrice() {
  const el = document.getElementById('total-price');
  if (!state.service) {
    el.textContent = '';
    return;
  }
  let total = state.service.precio_desde;
  ADDONS.forEach((a) => {
    if (state.addons[a.id]) total += a.precio;
  });
  el.textContent = `Total: $${total.toLocaleString('es-CL')}`;
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const nombre = form.nombre.value.trim();
  const telefono = form.telefono.value.trim();
  const errorEl = document.getElementById('form-error');
  errorEl.style.display = 'none';

  const nuevaReserva = {
    nombre_clienta: nombre,
    telefono,
    service_id: state.service.id,
    fecha: state.fecha,
    hora: state.hora,
    estado: 'pendiente_abono',
    expira_en: computeExpiryTimestamp(),
    incluye_kapping: state.addons.kapping,
    incluye_spa: state.addons.spa,
    incluye_retiro: state.addons.retiro,
  };

  const { error } = await supabaseClient.from('bookings').insert(nuevaReserva);

  if (error) {
    errorEl.textContent = 'Ese cupo ya no está disponible. Elige otro horario.';
    errorEl.style.display = 'block';
    return;
  }

  document.dispatchEvent(new CustomEvent('booking-created', {
    detail: { booking: nuevaReserva, servicioNombre: state.service.nombre },
  }));
}

document.addEventListener('booking-created', (e) => {
  const { booking, servicioNombre } = e.detail;
  const { datosTransferencia, abonoMonto, whatsappPhone } = BUSINESS;
  const container = document.getElementById('booking-flow');

  const whatsappUrl = buildWhatsAppUrl(whatsappPhone, {
    servicioNombre,
    fecha: booking.fecha,
    hora: booking.hora,
    nombre: booking.nombre_clienta,
  });

  container.innerHTML = `
    <div class="service-card">
      <h3>¡Ya casi! Reserva tu cupo con un abono de $${abonoMonto.toLocaleString('es-CL')}</h3>
      <p>Tienes 30 minutos para transferir y enviar el comprobante, o el cupo se libera.</p>
      <p>
        <strong>${datosTransferencia.titular}</strong><br>
        RUT: ${datosTransferencia.rut}<br>
        ${datosTransferencia.tipoCuenta} — ${datosTransferencia.banco}<br>
        ${datosTransferencia.email}
      </p>
      <a class="btn-primary btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">
        Enviar comprobante por WhatsApp
      </a>
    </div>
  `;
});
```

- [ ] **Step 4: Verificar en navegador (con Supabase real conectado)**

Run: ir a "Reservar", elegir un día con cupos, elegir una hora libre.
Expected: aparece el paso de "Elige tu servicio" con los 3 servicios base (radio buttons). Al elegir "Esmaltado permanente" aparecen 3 adicionales (Kapping, Spa de manos, Retiro de trabajo anterior); al elegir "Extensión de Polygel" aparecen 2 (Spa de manos, Retiro); al elegir "Spa y arreglo de uñas" aparece solo 1 (Retiro). El precio total se actualiza en vivo al marcar/desmarcar adicionales. El botón "Confirmar reserva" está deshabilitado hasta elegir un servicio. Al completar el formulario y enviarlo, se crea la reserva y aparece el panel de datos bancarios + botón de WhatsApp (verificar en el Table Editor de Supabase que la fila nueva en `bookings` tiene las columnas `incluye_*` correctas según lo marcado).

- [ ] **Step 5: Commit**

```bash
git add src/js/booking.js
git commit -m "feat: selección de servicio, adicionales, precio total y envío de reserva"
```

---

## Task 9: Calendario mensual y detalle de reservas en el panel admin

**Files:**
- Create: `src/js/domUtils.js`
- Create: `src/js/adminCalendar.js`
- Modify: `src/js/admin.js`

**Interfaces:**
- Consumes: `getCalendarGrid`, `countActiveBookings` de `./monthCalendar.js` (Task 3); `supabaseClient` de `./supabaseClient.js`.
- Produces: `escapeHtml(str: string) -> string` (exportado desde `domUtils.js`, usado por `admin.js` y `adminCalendar.js`); `renderAdminCalendar(container: HTMLElement) -> Promise<void>` (exportado desde `adminCalendar.js`, llamado por `admin.js` en vez de la antigua `renderBookings()`).

- [ ] **Step 1: Crear `src/js/domUtils.js`**

```js
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

- [ ] **Step 2: Crear `src/js/adminCalendar.js`**

```js
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
  if (bloqueoFecha) bloqueoFecha.value = fecha;
}
```

- [ ] **Step 3: Modificar `src/js/admin.js`**

Reemplazar el import inicial:
```js
import { supabaseClient } from './supabaseClient.js';
```
por:
```js
import { supabaseClient } from './supabaseClient.js';
import { escapeHtml } from './domUtils.js';
import { renderAdminCalendar } from './adminCalendar.js';
```

Eliminar la función `escapeHtml` local (ya no hace falta, ahora se importa):
```js
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

Reemplazar toda la función `renderBookings` (desde `async function renderBookings() {` hasta su cierre `}`, incluyendo el `renderBloqueos();` que tenía adentro) por:
```js
async function renderBookings() {
  const dashboard = document.getElementById('admin-dashboard');
  dashboard.innerHTML = '<h2>Agenda</h2><div id="admin-calendar-container"></div><div id="bloqueos-root"></div>';

  await renderAdminCalendar(document.getElementById('admin-calendar-container'));
  await renderBloqueos();
}
```

El resto del archivo (`renderLogin`, `checkExistingSession`, `renderBloqueos`, `listBloqueos`, y el listener final `document.addEventListener('admin-authenticated', renderBookings);`) no cambia.

- [ ] **Step 4: Verificar en navegador**

Run: entrar a `admin.html`, iniciar sesión (o simular el estado autenticado si no hay sesión real a mano).
Expected: se ve el calendario mensual con flechas de mes anterior/siguiente en ambos sentidos, y cada día muestra un número pequeño con la cantidad de reservas activas (si hay alguna). Al hacer clic en un día se abre el detalle: lista de reservas de ese día con sus adicionales (ej. "Esmaltado permanente + Kapping, Spa de manos") y el botón "Confirmar pago" para las pendientes. El campo de fecha del formulario "Bloquear día u horario" (más abajo en la página) queda pre-cargado con la fecha del día que se clickeó.

- [ ] **Step 5: Commit**

```bash
git add src/js/domUtils.js src/js/adminCalendar.js src/js/admin.js
git commit -m "feat: calendario mensual y detalle de reservas con adicionales en panel admin"
```

---

## Self-Review

**Cobertura del spec:** sección 2 (servicios base+adicionales) → Tasks 1, 2, 8; sección 2 catálogo informativo → Task 5; sección 3 (calendario público) → Tasks 3, 4, 7; sección 4 (calendario admin) → Tasks 3, 4, 9; sección 5 (logo y paleta) → Task 4; sección 6 (políticas) → Task 6; sección 7 (orden de página) → Task 6; sección 9 (verificación mobile) → pasos de verificación explícitos en Tasks 4, 7. Sin gaps detectados.

**Placeholders:** ninguno — el único paso con contenido "pendiente" es el `console.log` de marcador de posición en la Task 7, que es intencional (documentado como tal) y se reemplaza explícitamente en la Task 8 Step 2 con el código real, no un TODO sin resolver.

**Consistencia de tipos:** `getCalendarGrid`, `computeDaySlots`, `countActiveBookings` se usan con la misma firma en las Tasks 7, 8 y 9. `ADDONS`/`SERVICE_DESCRIPTIONS`/`RETIRO_ADICIONAL` se consumen con los mismos nombres de propiedad en todas las tareas que los usan. Los nombres de servicio (`'Extensión de Polygel'`, `'Esmaltado permanente'`, `'Spa y arreglo de uñas'`) son idénticos entre la migración (Task 1), `businessInfo.js` (Task 2) y las referencias en `booking.js` (Task 8, vía `state.service.nombre`).
