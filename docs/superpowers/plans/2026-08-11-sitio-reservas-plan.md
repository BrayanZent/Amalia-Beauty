# Amalia Beauty — Sitio con reservas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el sitio web de Amalia Beauty con sistema de reservas de horas fijas (disponibilidad real vía Supabase), panel admin, chatbot de FAQ, y los subagentes de proyecto para mantenerlo.

**Architecture:** Sitio estático HTML/CSS/JS (sin framework), módulos ES nativos cargados directo en el navegador. Backend serverless con Supabase (Postgres + Auth), llamado directo desde el cliente con RLS. Hosting en Vercel. Lógica de disponibilidad/expiración es pura y testeada con vitest; el resto de la UI se verifica manualmente en navegador.

**Tech Stack:** HTML5, CSS3, JavaScript ES2022 (módulos nativos), Supabase JS SDK v2 (vía CDN), vitest (solo dev, para lógica pura), Vercel (hosting estático).

## Global Constraints

- Mobile-first: toda pantalla se diseña primero para ancho ~375px, luego se adapta a desktop.
- No inventar datos del negocio: usar exactamente los valores de `docs/superpowers/specs/2026-08-11-sitio-reservas-design.md` sección 1.
- Cupos fijos: Lunes-Viernes 10:00/15:00/18:00, Sábado 9:00/12:00/15:00/18:00, Domingo cerrado. No hay reservas en otros horarios.
- Reserva `pendiente_abono` expira a los 30 minutos si no se confirma.
- Formulario de reserva requiere checkbox de consentimiento de datos personales enlazado a `privacidad.html` (Ley 19.628).
- Chatbot: se identifica como asistente automático desde el primer mensaje, siempre debe ofrecer "hablar con Amalia" (WhatsApp), cero consejo médico/legal/financiero, nunca inventa precios/horarios fuera de `businessInfo.js`.
- No pago online real, no verificación automática de comprobantes (fuera de alcance, spec sección 11).

---

## Task 1: Scaffold del proyecto y fundamento visual

**Files:**
- Create: `proyectos/Amalia Beauty/src/index.html`
- Create: `proyectos/Amalia Beauty/src/admin.html`
- Create: `proyectos/Amalia Beauty/src/privacidad.html`
- Create: `proyectos/Amalia Beauty/src/css/styles.css`
- Create: `proyectos/Amalia Beauty/package.json`
- Create: `proyectos/Amalia Beauty/vitest.config.js`
- Create: `proyectos/Amalia Beauty/.gitignore`

**Interfaces:**
- Produces: variables CSS `--color-primary`, `--color-primary-dark`, `--color-gold`, `--color-bg`, `--color-text` usadas por todas las tareas siguientes. Clase `.cta-sticky` para el botón "Reservar" fijo en mobile.

- [ ] **Step 1: Crear estructura de carpetas**

```bash
mkdir -p "proyectos/Amalia Beauty/src/css" "proyectos/Amalia Beauty/src/js" "proyectos/Amalia Beauty/src/tests" "proyectos/Amalia Beauty/src/assets"
cp "proyectos/Amalia Beauty/Amalia nuevos/AB DORADO.png" "proyectos/Amalia Beauty/src/assets/logo.png"
```

- [ ] **Step 2: Crear `package.json`**

```json
{
  "name": "amalia-beauty-sitio",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 3: Crear `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Instalar dependencias**

Run: `cd "proyectos/Amalia Beauty" && npm install`
Expected: se crea `node_modules/` y `package-lock.json` sin errores.

- [ ] **Step 5: Crear `.gitignore`**

```
node_modules/
.vercel/
```

- [ ] **Step 6: Crear `src/css/styles.css` con la paleta de marca**

```css
:root {
  --color-primary: #c98a90;
  --color-primary-dark: #a8646b;
  --color-gold: #b8933f;
  --color-bg: #fff9f7;
  --color-bg-alt: #f5e9e6;
  --color-text: #2b2b2b;
  --radius: 14px;
  --max-width: 480px;
}

* { box-sizing: border-box; }

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

nav.site-nav {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 10px 16px;
  background: var(--color-bg-alt);
  font-size: 14px;
}

nav.site-nav a {
  color: var(--color-primary-dark);
  text-decoration: none;
  white-space: nowrap;
  font-weight: 600;
}

section {
  padding: 28px 16px;
  max-width: 640px;
  margin: 0 auto;
}

h1, h2 { color: var(--color-primary-dark); }

.btn-primary {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
}

.btn-whatsapp {
  background: #25D366;
}

.cta-sticky {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  padding: 10px 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
}

.cta-sticky .btn-primary { width: 100%; }

.service-card, .slot-btn, .booking-item {
  border: 1px solid var(--color-bg-alt);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 10px;
  background: white;
}

.slot-btn {
  display: inline-block;
  margin: 4px;
  padding: 10px 16px;
  cursor: pointer;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-primary);
  color: var(--color-primary-dark);
  font-weight: 600;
}

.slot-btn.selected {
  background: var(--color-primary);
  color: white;
}

.slot-btn[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (min-width: 700px) {
  section { padding: 48px 24px; }
}
```

- [ ] **Step 7: Crear `src/index.html` con esqueleto de navegación y CTA sticky**

```html
<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amalia Beauty — Reserva tu hora</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="site-header">
    <img src="assets/logo.png" alt="Amalia Beauty">
  </header>
  <nav class="site-nav">
    <a href="#inicio">Inicio</a>
    <a href="#servicios">Servicios</a>
    <a href="#galeria">Galería</a>
    <a href="#reservar">Reservar</a>
    <a href="#contacto">Ubicación/Contacto</a>
  </nav>

  <section id="inicio">
    <h1>Reserva tu hora en Amalia Beauty</h1>
    <p>Esmaltado permanente, kapping, extensión polygel y spa de manos en Camino San Ramón, sector Vista Valle.</p>
  </section>

  <section id="servicios">
    <h2>Servicios</h2>
    <div id="services-list">Cargando servicios…</div>
  </section>

  <section id="galeria">
    <h2>Galería</h2>
    <div id="instagram-embed"></div>
  </section>

  <section id="reservar">
    <h2>Reservar hora</h2>
    <div id="booking-flow"></div>
  </section>

  <section id="contacto">
    <h2>Ubicación y contacto</h2>
    <p>Camino San Ramón, sector Vista Valle.</p>
    <p>Lunes a sábado, según cupos disponibles.</p>
    <a class="btn-primary btn-whatsapp" href="https://wa.me/56991569439" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>
    <p><a href="privacidad.html">Política de privacidad</a></p>
  </section>

  <div id="chatbot-root"></div>

  <div class="cta-sticky">
    <a href="#reservar" class="btn-primary">Reservar hora</a>
  </div>
</body>
</html>
```

- [ ] **Step 8: Crear `src/admin.html` con esqueleto**

```html
<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amalia Beauty — Panel admin</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="site-header">
    <img src="assets/logo.png" alt="Amalia Beauty">
  </header>
  <section id="admin-root">
    <div id="admin-login"></div>
    <div id="admin-dashboard" hidden></div>
  </section>
</body>
</html>
```

- [ ] **Step 9: Crear `src/privacidad.html`**

```html
<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amalia Beauty — Política de privacidad</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="site-header">
    <img src="assets/logo.png" alt="Amalia Beauty">
  </header>
  <section>
    <h1>Política de privacidad</h1>
    <p>Amalia Beauty solicita tu nombre y número de teléfono únicamente para gestionar tu reserva de hora y coordinar el pago del abono. No compartimos estos datos con terceros.</p>
    <p>Puedes solicitar la eliminación de tus datos en cualquier momento escribiendo a nuestro WhatsApp: <a href="https://wa.me/56991569439" target="_blank" rel="noopener">+56 9 9156 9439</a>.</p>
  </section>
</body>
</html>
```

- [ ] **Step 10: Verificar en navegador**

Run: abrir `proyectos/Amalia Beauty/src/index.html` directo en el navegador (doble clic).
Expected: se ve el header con logo, el menú de anclas, las 5 secciones vacías/con placeholder, y el botón "Reservar hora" fijo abajo.

- [ ] **Step 11: Commit**

```bash
cd "proyectos/Amalia Beauty"
git init
git add -A
git commit -m "chore: scaffold del sitio, paleta de marca y vitest"
```

---

## Task 2: Esquema de Supabase, config y datos del negocio

**Files:**
- Create: `proyectos/Amalia Beauty/supabase/schema.sql`
- Create: `proyectos/Amalia Beauty/src/js/supabaseConfig.js`
- Create: `proyectos/Amalia Beauty/src/js/supabaseClient.js`
- Create: `proyectos/Amalia Beauty/src/js/businessInfo.js`
- Modify: `proyectos/Amalia Beauty/src/index.html` (agregar script tag del SDK de Supabase)
- Modify: `proyectos/Amalia Beauty/src/admin.html` (idem)

**Interfaces:**
- Produces: `supabaseClient` (export desde `supabaseClient.js`, cliente ya inicializado). `BUSINESS` (export desde `businessInfo.js`) con forma:
  ```
  {
    nombre, instagram, instagramUrl, whatsappPhone, direccion, horarioTexto,
    abonoMonto, datosTransferencia: { titular, rut, tipoCuenta, banco, email }
  }
  ```

- [ ] **Step 1: Crear `supabase/schema.sql`**

```sql
create extension if not exists "pgcrypto";

create table services (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio_desde integer not null,
  duracion_min integer not null,
  es_adicional boolean not null default false
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  nombre_clienta text not null,
  telefono text not null,
  service_id uuid not null references services(id),
  fecha date not null,
  hora text not null,
  estado text not null default 'pendiente_abono'
    check (estado in ('pendiente_abono','confirmada','cancelada','expirada')),
  creada_en timestamptz not null default now(),
  expira_en timestamptz not null
);

create table bloqueos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora text,
  motivo text
);

alter table services enable row level security;
alter table bookings enable row level security;
alter table bloqueos enable row level security;

create policy "servicios lectura publica" on services for select using (true);
create policy "bloqueos lectura publica" on bloqueos for select using (true);
create policy "reservas lectura publica" on bookings for select using (true);
create policy "cualquiera crea reserva" on bookings for insert with check (true);
create policy "admin actualiza reservas" on bookings for update using (auth.role() = 'authenticated');
create policy "admin crea bloqueos" on bloqueos for insert with check (auth.role() = 'authenticated');
create policy "admin borra bloqueos" on bloqueos for delete using (auth.role() = 'authenticated');

insert into services (nombre, precio_desde, duracion_min, es_adicional) values
('Esmaltado permanente', 11000, 60, false),
('Kapping (adicional al esmaltado)', 4000, 30, true),
('Extensión Polygel', 18000, 120, false),
('Spa de manos + servicio', 7000, 45, true),
('Solo spa y arreglo de uñas', 10000, 45, false),
('Retiro de trabajo', 4000, 40, false);
```

- [ ] **Step 2: Crear `src/js/supabaseConfig.js` (credenciales a completar por el cliente)**

```js
// 1. Crea un proyecto gratis en https://supabase.com
// 2. Abre el SQL Editor y ejecuta el contenido de supabase/schema.sql
// 3. Ve a Project Settings > API y copia acá el Project URL y el "anon public" key
//    (el anon key es seguro de exponer en el cliente: las políticas RLS del
//    schema.sql son las que controlan qué se puede leer/escribir)
export const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';
```

- [ ] **Step 3: Crear `src/js/supabaseClient.js`**

```js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig.js';

export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- [ ] **Step 4: Crear `src/js/businessInfo.js`**

```js
export const BUSINESS = {
  nombre: 'Amalia Beauty',
  instagram: '@amaliabeauty.cl',
  instagramUrl: 'https://instagram.com/amaliabeauty.cl',
  whatsappPhone: '56991569439',
  direccion: 'Camino San Ramón, sector Vista Valle',
  horarioTexto: 'Lunes a sábado, según cupos disponibles',
  abonoMonto: 3000,
  datosTransferencia: {
    titular: 'Daniela Álvarez Mardones',
    rut: '21.340.588-8',
    tipoCuenta: 'Cuenta RUT',
    banco: 'BancoEstado',
    email: 'Damii.alvarez11@gmail.com',
  },
};
```

- [ ] **Step 5: Agregar el SDK de Supabase a `index.html` y `admin.html`**

En ambos archivos, agregar justo antes del cierre de `</head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

Este script debe cargar **antes** que cualquier `<script type="module">` que use `supabaseClient.js` (se agregan en tareas siguientes).

- [ ] **Step 6: Verificar manualmente**

Run: crear el proyecto real en supabase.com, ejecutar `supabase/schema.sql` en el SQL Editor, reemplazar los valores en `supabaseConfig.js`.
Expected: la tabla `services` en el dashboard de Supabase muestra los 6 servicios insertados.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: esquema de Supabase, config y datos del negocio"
```

---

## Task 3: Lógica de disponibilidad (pura, con tests)

**Files:**
- Create: `proyectos/Amalia Beauty/src/js/availability.js`
- Test: `proyectos/Amalia Beauty/src/tests/availability.test.js`

**Interfaces:**
- Consumes: nada (módulo puro, sin dependencias externas).
- Produces:
  - `getFixedSlotsForDate(dateStr: 'YYYY-MM-DD') -> string[]`
  - `computeAvailableSlots(dateStr, allSlots: string[], bookings: {fecha, hora, estado}[], blocks: {fecha, hora: string|null}[]) -> string[]`
  - `isExpired(booking: {estado, expira_en}, nowMs?: number) -> boolean`
  - `computeExpiryTimestamp(fromDate?: Date, minutesFromNow?: number) -> string` (ISO)

- [ ] **Step 1: Escribir los tests que fallan**

```js
// src/tests/availability.test.js
import { describe, it, expect } from 'vitest';
import {
  getFixedSlotsForDate,
  computeAvailableSlots,
  isExpired,
  computeExpiryTimestamp,
} from '../js/availability.js';

describe('getFixedSlotsForDate', () => {
  it('devuelve 3 cupos para un día de semana (martes 2026-08-11)', () => {
    expect(getFixedSlotsForDate('2026-08-11')).toEqual(['10:00', '15:00', '18:00']);
  });
  it('devuelve 4 cupos para sábado (2026-08-15)', () => {
    expect(getFixedSlotsForDate('2026-08-15')).toEqual(['09:00', '12:00', '15:00', '18:00']);
  });
  it('devuelve vacío para domingo (2026-08-16)', () => {
    expect(getFixedSlotsForDate('2026-08-16')).toEqual([]);
  });
});

describe('computeAvailableSlots', () => {
  const allSlots = ['10:00', '15:00', '18:00'];

  it('excluye horas con reserva pendiente_abono o confirmada', () => {
    const bookings = [{ fecha: '2026-08-11', hora: '15:00', estado: 'confirmada' }];
    expect(computeAvailableSlots('2026-08-11', allSlots, bookings, [])).toEqual(['10:00', '18:00']);
  });

  it('ignora reservas expiradas o canceladas', () => {
    const bookings = [{ fecha: '2026-08-11', hora: '15:00', estado: 'expirada' }];
    expect(computeAvailableSlots('2026-08-11', allSlots, bookings, [])).toEqual(allSlots);
  });

  it('excluye horas bloqueadas manualmente', () => {
    const blocks = [{ fecha: '2026-08-11', hora: '10:00' }];
    expect(computeAvailableSlots('2026-08-11', allSlots, [], blocks)).toEqual(['15:00', '18:00']);
  });

  it('devuelve vacío si el día completo está bloqueado (hora null)', () => {
    const blocks = [{ fecha: '2026-08-11', hora: null }];
    expect(computeAvailableSlots('2026-08-11', allSlots, [], blocks)).toEqual([]);
  });
});

describe('isExpired', () => {
  it('es true cuando está pendiente_abono y expira_en ya pasó', () => {
    const booking = { estado: 'pendiente_abono', expira_en: '2026-01-01T00:00:00.000Z' };
    expect(isExpired(booking, Date.parse('2026-01-01T00:30:00.000Z'))).toBe(true);
  });
  it('es false cuando ya está confirmada, aunque expira_en haya pasado', () => {
    const booking = { estado: 'confirmada', expira_en: '2026-01-01T00:00:00.000Z' };
    expect(isExpired(booking, Date.parse('2026-01-01T00:30:00.000Z'))).toBe(false);
  });
});

describe('computeExpiryTimestamp', () => {
  it('suma 30 minutos por defecto', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(computeExpiryTimestamp(from)).toBe('2026-01-01T00:30:00.000Z');
  });
});
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

Run: `cd "proyectos/Amalia Beauty" && npm test`
Expected: FAIL — `Cannot find module '../js/availability.js'`.

- [ ] **Step 3: Implementar `src/js/availability.js`**

```js
export function getFixedSlotsForDate(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay(); // 0=domingo .. 6=sábado
  if (day === 0) return [];
  if (day === 6) return ['09:00', '12:00', '15:00', '18:00'];
  return ['10:00', '15:00', '18:00'];
}

export function computeAvailableSlots(dateStr, allSlots, bookings, blocks) {
  const diaBloqueado = blocks.some((b) => b.fecha === dateStr && b.hora === null);
  if (diaBloqueado) return [];

  const activos = ['pendiente_abono', 'confirmada'];
  const horasTomadas = new Set(
    bookings
      .filter((b) => b.fecha === dateStr && activos.includes(b.estado))
      .map((b) => b.hora)
  );
  const horasBloqueadas = new Set(
    blocks.filter((b) => b.fecha === dateStr && b.hora !== null).map((b) => b.hora)
  );

  return allSlots.filter((h) => !horasTomadas.has(h) && !horasBloqueadas.has(h));
}

export function isExpired(booking, nowMs = Date.now()) {
  if (booking.estado !== 'pendiente_abono') return false;
  return new Date(booking.expira_en).getTime() < nowMs;
}

export function computeExpiryTimestamp(fromDate = new Date(), minutesFromNow = 30) {
  return new Date(fromDate.getTime() + minutesFromNow * 60000).toISOString();
}
```

- [ ] **Step 4: Correr los tests y confirmar que pasan**

Run: `npm test`
Expected: PASS — 8 tests, 0 fallos.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: lógica de disponibilidad de cupos fijos con tests"
```

---

## Task 4: Enlace de WhatsApp para el comprobante (pura, con tests)

**Files:**
- Create: `proyectos/Amalia Beauty/src/js/whatsapp.js`
- Test: `proyectos/Amalia Beauty/src/tests/whatsapp.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `buildWhatsAppMessage(booking: {servicioNombre, fecha, hora, nombre}) -> string`
  - `buildWhatsAppUrl(phone: string, booking) -> string`

- [ ] **Step 1: Escribir el test que falla**

```js
// src/tests/whatsapp.test.js
import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../js/whatsapp.js';

describe('buildWhatsAppMessage', () => {
  it('incluye servicio, fecha, hora y nombre', () => {
    const msg = buildWhatsAppMessage({
      servicioNombre: 'Esmaltado permanente',
      fecha: '2026-08-11',
      hora: '15:00',
      nombre: 'Javiera',
    });
    expect(msg).toContain('Esmaltado permanente');
    expect(msg).toContain('2026-08-11');
    expect(msg).toContain('15:00');
    expect(msg).toContain('Javiera');
  });
});

describe('buildWhatsAppUrl', () => {
  it('arma una URL wa.me con el mensaje codificado', () => {
    const url = buildWhatsAppUrl('56991569439', {
      servicioNombre: 'Retiro de trabajo',
      fecha: '2026-08-12',
      hora: '10:00',
      nombre: 'Camila',
    });
    expect(url.startsWith('https://wa.me/56991569439?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Retiro de trabajo');
  });
});
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/whatsapp.js'`.

- [ ] **Step 3: Implementar `src/js/whatsapp.js`**

```js
export function buildWhatsAppMessage(booking) {
  return [
    'Hola! Quiero confirmar mi reserva en Amalia Beauty.',
    `Servicio: ${booking.servicioNombre}`,
    `Fecha: ${booking.fecha}`,
    `Hora: ${booking.hora}`,
    `Nombre: ${booking.nombre}`,
    'Adjunto el comprobante del abono.',
  ].join('\n');
}

export function buildWhatsAppUrl(phone, booking) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(booking))}`;
}
```

- [ ] **Step 4: Correr los tests y confirmar que pasan**

Run: `npm test`
Expected: PASS — 10 tests en total, 0 fallos.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: generador de enlace de WhatsApp para comprobante de abono"
```

---

## Task 5: Sección de Servicios

**Files:**
- Create: `proyectos/Amalia Beauty/src/js/services.js`
- Modify: `proyectos/Amalia Beauty/src/index.html` (agregar `<script type="module" src="js/services.js"></script>` antes de `</body>`)

**Interfaces:**
- Consumes: `supabaseClient` de `supabaseClient.js`.
- Produces: renderiza `#services-list` en `index.html`. No exporta funciones (script de página).

- [ ] **Step 1: Implementar `src/js/services.js`**

```js
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
```

- [ ] **Step 2: Agregar el script a `index.html`**

Justo antes de `</body>`:

```html
<script type="module" src="js/services.js"></script>
```

- [ ] **Step 3: Verificar en navegador**

Run: servir la carpeta `src/` con un servidor local (ej. `npx serve proyectos/"Amalia Beauty"/src`, ya que `fetch`/módulos ES no funcionan bien con `file://`), abrir `/index.html` y bajar hasta "Servicios".
Expected: se ven las 6 tarjetas de servicio con nombre, precio formateado en CLP y duración, cargadas desde Supabase.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: sección de servicios cargada desde Supabase"
```

---

## Task 6: Flujo de reserva — fecha y cupos disponibles

**Files:**
- Create: `proyectos/Amalia Beauty/src/js/booking.js`
- Modify: `proyectos/Amalia Beauty/src/index.html` (agregar script antes de `</body>`)

**Interfaces:**
- Consumes: `supabaseClient`, `getFixedSlotsForDate`, `computeAvailableSlots` (de `availability.js`), `BUSINESS` (de `businessInfo.js`).
- Produces: renderiza selector de fecha + cupos en `#booking-flow`. Expone `window.__bookingState` (objeto interno con `service`, `fecha`, `hora` seleccionados) para que la Tarea 7 lo consuma.

- [ ] **Step 1: Implementar la primera mitad de `src/js/booking.js`**

```js
import { supabaseClient } from './supabaseClient.js';
import { getFixedSlotsForDate, computeAvailableSlots } from './availability.js';

const state = { service: null, services: [], fecha: null, hora: null };
window.__bookingState = state;

function nextSixDays() {
  const days = [];
  const hoy = new Date();
  for (let i = 0; i < 14 && days.length < 6; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    if (d.getDay() === 0) continue; // domingo cerrado
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function fetchServices() {
  const { data } = await supabaseClient.from('services').select('*').order('precio_desde');
  return data || [];
}

async function fetchAvailability(fecha) {
  const allSlots = getFixedSlotsForDate(fecha);
  const [{ data: bookings }, { data: blocks }] = await Promise.all([
    supabaseClient.from('bookings').select('fecha,hora,estado').eq('fecha', fecha),
    supabaseClient.from('bloqueos').select('fecha,hora').eq('fecha', fecha),
  ]);
  return computeAvailableSlots(fecha, allSlots, bookings || [], blocks || []);
}

async function renderStep1() {
  const root = document.getElementById('booking-flow');
  state.services = await fetchServices();

  root.innerHTML = `
    <label for="service-select">Elige un servicio</label>
    <select id="service-select">
      <option value="">Selecciona…</option>
      ${state.services.map((s) => `<option value="${s.id}">${s.nombre} — desde $${s.precio_desde.toLocaleString('es-CL')}</option>`).join('')}
    </select>

    <div id="date-picker" hidden>
      <label>Elige un día</label>
      <div id="date-buttons"></div>
    </div>

    <div id="slots-container"></div>
    <div id="client-form-container"></div>
  `;

  document.getElementById('service-select').addEventListener('change', (e) => {
    state.service = state.services.find((s) => s.id === e.target.value) || null;
    document.getElementById('date-picker').hidden = !state.service;
    if (state.service) renderDateButtons();
  });
}

function renderDateButtons() {
  const container = document.getElementById('date-buttons');
  container.innerHTML = nextSixDays()
    .map((fecha) => `<button type="button" class="slot-btn" data-fecha="${fecha}">${fecha}</button>`)
    .join('');
  container.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.fecha = btn.dataset.fecha;
      state.hora = null;
      await renderSlots();
    });
  });
}

async function renderSlots() {
  const slotsContainer = document.getElementById('slots-container');
  slotsContainer.innerHTML = 'Buscando cupos…';
  const disponibles = await fetchAvailability(state.fecha);

  if (disponibles.length === 0) {
    const whatsappUrl = `https://wa.me/56991569439?text=${encodeURIComponent(`Hola! Quiero consultar disponibilidad para el ${state.fecha}.`)}`;
    slotsContainer.innerHTML = `
      <p>Sin cupos disponibles ese día.</p>
      <a class="btn-primary btn-whatsapp" href="${whatsappUrl}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
    `;
    return;
  }

  slotsContainer.innerHTML = disponibles
    .map((hora) => `<button type="button" class="slot-btn" data-hora="${hora}">${hora}</button>`)
    .join('');
  slotsContainer.querySelectorAll('.slot-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      slotsContainer.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.hora = btn.dataset.hora;
      document.dispatchEvent(new CustomEvent('slot-selected'));
    });
  });
}

renderStep1();
```

- [ ] **Step 2: Agregar el script a `index.html`**

Justo antes de `</body>`, después del script de `services.js`:

```html
<script type="module" src="js/booking.js"></script>
```

- [ ] **Step 3: Verificar en navegador**

Run: con el servidor local corriendo, ir a "Reservar", elegir un servicio, elegir un día de la semana (ej. sábado) y confirmar que aparecen 4 cupos, y para un día de semana aparecen 3.
Expected: los cupos mostrados coinciden con `getFixedSlotsForDate` y desaparecen los ya tomados (probar reservando uno manualmente desde el SQL Editor de Supabase y recargar).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: selector de servicio, fecha y cupos disponibles"
```

---

## Task 7: Flujo de reserva — formulario de clienta y creación de la reserva

**Files:**
- Modify: `proyectos/Amalia Beauty/src/js/booking.js`

**Interfaces:**
- Consumes: `computeExpiryTimestamp` (de `availability.js`), `state` interno de la Tarea 6, evento `slot-selected`.
- Produces: evento `booking-created` con `detail: { booking, servicioNombre }` consumido por la Tarea 8.

- [ ] **Step 1: Agregar el formulario y la creación de reserva a `booking.js`**

Agregar al inicio del archivo:

```js
import { computeExpiryTimestamp } from './availability.js';
```

Agregar al final del archivo (reemplaza la línea `renderStep1();` por lo siguiente, manteniendo esa línea al final):

```js
document.addEventListener('slot-selected', () => {
  const container = document.getElementById('client-form-container');
  container.innerHTML = `
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

      <button type="submit" class="btn-primary">Confirmar reserva</button>
    </form>
    <div id="form-error" style="color:#b00; display:none;"></div>
  `;

  document.getElementById('client-form').addEventListener('submit', handleSubmit);
});

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
  };

  const { data, error } = await supabaseClient
    .from('bookings')
    .insert(nuevaReserva)
    .select()
    .single();

  if (error) {
    errorEl.textContent = 'Ese cupo ya no está disponible. Elige otro horario.';
    errorEl.style.display = 'block';
    return;
  }

  document.dispatchEvent(new CustomEvent('booking-created', {
    detail: { booking: data, servicioNombre: state.service.nombre },
  }));
}
```

- [ ] **Step 2: Verificar en navegador**

Run: completar el flujo hasta el formulario, llenar nombre/teléfono, marcar el checkbox y enviar.
Expected: en el dashboard de Supabase, tabla `bookings`, aparece una nueva fila con `estado = pendiente_abono` y `expira_en` 30 minutos en el futuro. Sin marcar el checkbox, el botón "Confirmar reserva" no envía el formulario (validación HTML `required`).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: formulario de clienta y creación de reserva pendiente de abono"
```

---

## Task 8: Panel de datos de transferencia y envío del comprobante

**Files:**
- Modify: `proyectos/Amalia Beauty/src/js/booking.js`

**Interfaces:**
- Consumes: evento `booking-created` (Tarea 7), `BUSINESS` (de `businessInfo.js`), `buildWhatsAppUrl` (de `whatsapp.js`).
- Produces: ninguna (paso final del flujo de reserva).

- [ ] **Step 1: Agregar los imports al inicio de `booking.js`**

```js
import { BUSINESS } from './businessInfo.js';
import { buildWhatsAppUrl } from './whatsapp.js';
```

- [ ] **Step 2: Agregar el listener al final de `booking.js`**

```js
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

- [ ] **Step 3: Verificar en navegador**

Run: repetir el flujo completo de reserva hasta enviar el formulario.
Expected: aparece la tarjeta con los datos bancarios exactos (Daniela Álvarez Mardones, 21.340.588-8, Cuenta RUT, BancoEstado, Damii.alvarez11@gmail.com) y un botón que abre WhatsApp con el mensaje prellenado (servicio, fecha, hora, nombre).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: panel de datos de transferencia y enlace de WhatsApp tras reservar"
```

---

## Task 9: Expiración automática de reservas sin comprobante

**Files:**
- Create: `proyectos/Amalia Beauty/src/js/expireBookings.js`
- Modify: `proyectos/Amalia Beauty/src/index.html` (agregar script, debe cargar antes que `booking.js`)

**Interfaces:**
- Consumes: `supabaseClient`, `isExpired` (de `availability.js`).
- Produces: ninguna exportada; efecto secundario (actualiza `bookings.estado` en Supabase).

- [ ] **Step 1: Implementar `src/js/expireBookings.js`**

```js
import { supabaseClient } from './supabaseClient.js';
import { isExpired } from './availability.js';

export async function expireStaleBookings() {
  const { data: pendientes } = await supabaseClient
    .from('bookings')
    .select('id,estado,expira_en')
    .eq('estado', 'pendiente_abono');

  const vencidas = (pendientes || []).filter((b) => isExpired(b));
  if (vencidas.length === 0) return;

  await Promise.all(
    vencidas.map((b) =>
      supabaseClient.from('bookings').update({ estado: 'expirada' }).eq('id', b.id)
    )
  );
}

expireStaleBookings();
```

- [ ] **Step 2: Agregar el script a `index.html`**

Antes del script de `booking.js`:

```html
<script type="module" src="js/expireBookings.js"></script>
```

- [ ] **Step 3: Verificar manualmente**

Run: en el SQL Editor de Supabase, insertar una reserva de prueba con `estado='pendiente_abono'` y `expira_en` en el pasado. Recargar `index.html`.
Expected: al recargar, la fila cambia a `estado='expirada'` en el dashboard de Supabase, y ese cupo vuelve a aparecer disponible en el selector de horas.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: expiración automática de reservas sin comprobante a los 30 min"
```

---

## Task 10: Panel admin — login

**Files:**
- Create: `proyectos/Amalia Beauty/src/js/admin.js`
- Modify: `proyectos/Amalia Beauty/src/admin.html` (agregar scripts antes de `</body>`)

**Interfaces:**
- Consumes: `supabaseClient`.
- Produces: muestra `#admin-dashboard` y oculta `#admin-login` tras autenticar. Dispara evento `admin-authenticated`.

- [ ] **Step 1: Implementar el login en `src/js/admin.js`**

```js
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
```

- [ ] **Step 2: Agregar los scripts a `admin.html`**

Antes de `</body>`:

```html
<script type="module" src="js/admin.js"></script>
```

- [ ] **Step 3: Crear el usuario de Amalia en Supabase**

Run: en el dashboard de Supabase, ir a Authentication > Users > Add user, crear el usuario con el email y contraseña que usará Amalia.
Expected: el usuario queda creado y puede iniciar sesión.

- [ ] **Step 4: Verificar en navegador**

Run: abrir `admin.html`, ingresar con credenciales incorrectas, luego con las correctas.
Expected: con credenciales incorrectas se ve el mensaje de error; con las correctas se oculta el login y se muestra el dashboard (vacío por ahora).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: login del panel admin con Supabase Auth"
```

---

## Task 11: Panel admin — listado de reservas y confirmación

**Files:**
- Modify: `proyectos/Amalia Beauty/src/js/admin.js`

**Interfaces:**
- Consumes: evento `admin-authenticated` (Tarea 10), `supabaseClient`.
- Produces: ninguna exportada.

- [ ] **Step 1: Agregar el dashboard de reservas a `admin.js`**

Agregar al final del archivo:

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Run: crear una reserva de prueba desde `index.html`, luego entrar al panel admin.
Expected: la reserva aparece en la lista con estado `pendiente_abono` y un botón "Confirmar pago". Al hacer clic, el estado cambia a `confirmada` en pantalla y en Supabase, y el botón desaparece.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: listado de reservas y confirmación manual de pago en panel admin"
```

---

## Task 12: Panel admin — bloqueo de días y horarios

**Files:**
- Modify: `proyectos/Amalia Beauty/src/js/admin.js`

**Interfaces:**
- Consumes: `supabaseClient`.
- Produces: ninguna exportada.

- [ ] **Step 1: Agregar el formulario de bloqueo a `admin.js`**

Reemplazar la función `renderBookings` para que también llame a `renderBloqueos()` al final (agregar la línea `renderBloqueos();` antes del cierre de la función), y agregar al final del archivo:

```js
async function renderBloqueos() {
  const root = document.getElementById('bloqueos-root');
  root.innerHTML = `
    <h2>Bloquear día u horario</h2>
    <form id="bloqueo-form">
      <label for="bloqueo-fecha">Fecha</label>
      <input id="bloqueo-fecha" type="date" required>
      <label for="bloqueo-hora">Hora (vacío = todo el día)</label>
      <input id="bloqueo-hora" type="text" placeholder="ej. 15:00">
      <button type="submit" class="btn-primary">Bloquear</button>
    </form>
    <div id="bloqueos-list"></div>
  `;

  document.getElementById('bloqueo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('bloqueo-fecha').value;
    const hora = document.getElementById('bloqueo-hora').value.trim() || null;
    await supabaseClient.from('bloqueos').insert({ fecha, hora });
    e.target.reset();
    await listBloqueos();
  });

  await listBloqueos();
}

async function listBloqueos() {
  const { data: bloqueos } = await supabaseClient
    .from('bloqueos')
    .select('id,fecha,hora')
    .order('fecha', { ascending: true });

  document.getElementById('bloqueos-list').innerHTML = (bloqueos || [])
    .map((b) => `
      <div class="booking-item" data-id="${b.id}">
        ${b.fecha} ${b.hora ?? '(todo el día)'}
        <button type="button" class="unblock-btn">Quitar bloqueo</button>
      </div>
    `)
    .join('');

  document.querySelectorAll('.unblock-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = btn.closest('.booking-item');
      await supabaseClient.from('bloqueos').delete().eq('id', item.dataset.id);
      item.remove();
    });
  });
}
```

- [ ] **Step 2: Verificar en navegador**

Run: en el panel admin, bloquear un día completo sin indicar hora, luego ir a `index.html` e intentar reservar ese día.
Expected: el sitio público muestra "Sin cupos disponibles" para ese día. Al quitar el bloqueo desde el admin, los cupos vuelven a aparecer.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: bloqueo manual de días y horarios desde el panel admin"
```

---

## Task 13: Galería (Instagram embed), chatbot de FAQ y política de privacidad

**Files:**
- Modify: `proyectos/Amalia Beauty/src/index.html` (sección `#galeria`)
- Create: `proyectos/Amalia Beauty/src/js/chatbot.js`
- Modify: `proyectos/Amalia Beauty/src/index.html` (agregar script de chatbot)

**Interfaces:**
- Consumes: `BUSINESS` (de `businessInfo.js`).
- Produces: ninguna exportada.

- [ ] **Step 1: Reemplazar el contenido de `#instagram-embed` en `index.html`**

```html
<div id="instagram-embed">
  <p>Mira nuestros trabajos más recientes en Instagram:</p>
  <iframe
    src="https://www.instagram.com/amaliabeauty.cl/embed"
    width="100%"
    height="480"
    frameborder="0"
    scrolling="no"
    loading="lazy"
    title="Feed de Instagram de Amalia Beauty">
  </iframe>
  <p><a href="https://instagram.com/amaliabeauty.cl" target="_blank" rel="noopener">Ver más en @amaliabeauty.cl</a></p>
</div>
```

Nota: si el embed nativo de Instagram no carga bien en producción, reemplazar el `<iframe>` por un widget de Elfsight/LightWidget (plan gratuito) usando el mismo contenedor `#instagram-embed`.

- [ ] **Step 2: Implementar `src/js/chatbot.js`**

```js
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
    respuesta: 'Elige tu servicio y horario en la sección "Reservar" de esta página, y transfiere el abono de $3.000 para confirmar tu cupo.',
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
```

- [ ] **Step 3: Agregar el script a `index.html`**

Antes de `</body>`, después del resto de scripts:

```html
<script type="module" src="js/chatbot.js"></script>
```

- [ ] **Step 4: Verificar en navegador**

Run: abrir `index.html`, revisar que el feed de Instagram cargue en "Galería", y hacer clic en el botón flotante 💬.
Expected: se abre el panel con las 4 preguntas frecuentes; al hacer clic en cada una aparece la respuesta correspondiente, y el botón "Hablar con Amalia" abre WhatsApp.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: galería con feed de Instagram y chatbot de preguntas frecuentes"
```

---

## Task 14: Subagentes específicos del proyecto y CLAUDE.md del cliente

**Files:**
- Create: `proyectos/Amalia Beauty/.claude/agents/amalia-reservas.md`
- Create: `proyectos/Amalia Beauty/.claude/agents/amalia-contenido.md`
- Create: `proyectos/Amalia Beauty/CLAUDE.md`

**Interfaces:**
- Ninguna (archivos de configuración de Claude Code, no código de la app).

- [ ] **Step 1: Crear `amalia-reservas.md`**

```markdown
---
name: amalia-reservas
description: Construcción y mantención del sitio y sistema de reservas de Amalia Beauty (Supabase, flujo de abono, panel admin). Úsalo para cualquier cambio técnico en proyectos/Amalia Beauty/src o proyectos/Amalia Beauty/supabase.
tools: Read, Grep, Glob, Write, Edit, Bash
model: sonnet
---

# ROL
Eres el desarrollador responsable del sitio y sistema de reservas de Amalia Beauty (negocio de uñas: esmaltado permanente, kapping, extensión polygel, spa de manos), dentro de Agencia Saturno.

# CONTEXTO OBLIGATORIO
Revisa antes de trabajar:
- `proyectos/Amalia Beauty/CLAUDE.md` (datos del negocio: horarios, precios, contacto, datos bancarios).
- `proyectos/Amalia Beauty/docs/superpowers/specs/2026-08-11-sitio-reservas-design.md` (diseño aprobado).
- `manual-interno-agencia.md` sección 4 (stack) y sección 6 (checklist de QA).

# DATOS FIJOS DE ESTE NEGOCIO (no inventar, no cambiar sin que el cliente lo confirme)
- Horarios: Lunes-Viernes 10:00/15:00/18:00. Sábado 9:00/12:00/15:00/18:00. Domingo cerrado.
- Abono para reservar: $3.000, expira a los 30 minutos sin comprobante.
- Datos de transferencia: Daniela Álvarez Mardones, RUT 21.340.588-8, Cuenta RUT, BancoEstado, Damii.alvarez11@gmail.com.
- WhatsApp: +56 9 9156 9439. Instagram: @amaliabeauty.cl.

# TAREAS QUE MANEJAS
1. Cambios en `src/js/availability.js`, `booking.js`, `admin.js`, `expireBookings.js`.
2. Cambios de esquema en `supabase/schema.sql` (siempre coordinados con las políticas RLS existentes).
3. Ajustes de estilo mobile-first en `src/css/styles.css`.
4. Debugging del flujo de reserva y del panel admin.
5. Configuración de deploy en Vercel.

# LÍMITES
- No inventes precios, horarios ni datos bancarios: usa exactamente los de este archivo y de `businessInfo.js`.
- Cualquier cambio a las políticas RLS de Supabase debe mantener: lectura pública de `services`/`bloqueos`/`bookings`, inserción pública solo en `bookings`, escritura/borrado solo para usuarios autenticados.
- Antes de dar por lista una entrega, corre `npm test` (vitest) y pasa el checklist del agente `qa-tecnico`.
- Sistema guarda datos personales (nombre, teléfono): mantener siempre el checkbox de consentimiento y el enlace a `privacidad.html`.

# FORMATO
Código completo y funcional, comentado en español solo cuando el motivo no sea obvio. Señala siempre los supuestos que hiciste.
```

- [ ] **Step 2: Crear `amalia-contenido.md`**

```markdown
---
name: amalia-contenido
description: Contenido de Instagram, respuestas a comentarios/reseñas y textos del chatbot de FAQ de Amalia Beauty. Úsalo para cualquier pieza de comunicación dirigida a clientas de este negocio.
tools: Read, Grep, Glob, Write
model: sonnet
---

# ROL
Eres el community manager de Amalia Beauty (negocio de uñas), dentro de Agencia Saturno.

# CONTEXTO OBLIGATORIO
Revisa antes de escribir:
- `proyectos/Amalia Beauty/CLAUDE.md` (catálogo de servicios, precios, horarios, contacto).
- `proyectos/Amalia Beauty/Amalia nuevos/AB DORADO.png` (logo y paleta: rosa palo #c98a90 + dorado).
- `.claude/agents/community-manager.md` de la agencia — esta especialización hereda todas sus reglas, mezcla de contenido y manejo de reseñas negativas.

# CATÁLOGO ACTUAL (no inventar otros servicios o precios)
Esmaltado permanente desde $11.000 · Kapping +$4.000 · Extensión Polygel desde $18.000 · Spa de manos + servicio $7.000 · Solo spa y arreglo de uñas $10.000 · Retiro de trabajo $4.000.
Horario: Lunes a viernes 10:00/15:00/18:00 hrs, sábado 9:00/12:00/15:00/18:00 hrs.

# TONO DE MARCA
Cercano, femenino sin ser infantil, aspiracional pero accesible — el público son mujeres de barrio/sector Vista Valle que buscan un lujo cotidiano, no un salón de alta gama. Emojis con moderación (💅✨🌸). Siempre el llamado a la acción es "reserva tu hora" con enlace al sitio.

# TAREAS QUE MANEJAS
1. Calendario editorial y textos para Instagram (@amaliabeauty.cl).
2. Redacción y actualización de las respuestas del chatbot de FAQ (`src/js/chatbot.js`), manteniéndolas alineadas al catálogo vigente.
3. Respuestas a comentarios y reseñas, incluidas negativas (siguiendo el protocolo del agente `community-manager` de la agencia).

# LÍMITES
- No prometas resultados estéticos ni de duración del esmaltado más allá de lo que Amalia confirme explícitamente.
- No inventes promociones ni descuentos que no te hayan confirmado.
- Cualquier cambio de precio u horario en el chatbot debe venir primero confirmado por Amalia — no lo actualices solo porque "suena razonable".

# FORMATO
Igual al agente `community-manager` de la agencia: calendarios en tabla, cada publicación con fecha, canal, formato, gancho, texto completo, llamado a la acción, hashtags y descripción del recurso visual.
```

- [ ] **Step 3: Crear `proyectos/Amalia Beauty/CLAUDE.md`**

```markdown
# Amalia Beauty — Uñas, esmaltado y spa de manos

> Este CLAUDE.md es específico de este proyecto. Se suma al CLAUDE.md raíz de la agencia (reglas generales, límites, agentes) — no lo reemplaza.

## Datos del cliente
- **Nombre del negocio:** Amalia Beauty
- **Rubro:** uñas — esmaltado permanente, kapping, extensión polygel, spa de manos.
- **Entregable contratado:** sitio web + sistema de reservas de horas con disponibilidad real.
- **Ubicación:** Camino San Ramón, sector Vista Valle.
- **Horario:** Lunes a viernes 10:00/15:00/18:00 hrs · Sábado 9:00/12:00/15:00/18:00 hrs · Domingo cerrado.
- **WhatsApp:** +56 9 9156 9439
- **Instagram:** @amaliabeauty.cl
- **Stack técnico elegido:** HTML/CSS/JS estático + Supabase (Postgres + Auth) + hosting en Vercel.

### Servicios y precios
| Servicio | Precio | Duración |
|---|---|---|
| Esmaltado permanente | desde $11.000 | 45-60 min |
| Kapping (adicional) | +$4.000 | +30 min |
| Extensión Polygel | desde $18.000 | ~2 h |
| Spa de manos + servicio | $7.000 | 30-45 min |
| Solo spa y arreglo de uñas | $10.000 | ~45 min |
| Retiro de trabajo | $4.000 | 30-40 min |

### Abono para reservar
$3.000 por transferencia, cupo se libera si no llega comprobante en 30 min.
Datos: Daniela Álvarez Mardones — RUT 21.340.588-8 — Cuenta RUT — BancoEstado — Damii.alvarez11@gmail.com.

## Convenciones de este proyecto
- Código fuente en `src/` (sitio) y `supabase/` (esquema de base de datos).
- Diseño y specs en `docs/superpowers/specs/`, planes en `docs/superpowers/plans/`.
- El agente `amalia-reservas` es responsable de la arquitectura técnica y el sistema de reservas.
- El agente `amalia-contenido` es responsable de redes sociales y textos del chatbot.
- Antes de dar por lista cualquier entrega, pasar el checklist del agente `qa-tecnico` de la agencia.

## Límites específicos de este cliente
- Nunca mostrar cupos fuera de los horarios fijos definidos arriba: la demanda extra se deriva a WhatsApp.
- Nunca cambiar precios, horarios o datos bancarios en el código sin confirmación explícita de Amalia.
- Los datos de transferencia son de una persona natural (Daniela Álvarez Mardones): tratarlos con el mismo cuidado que cualquier dato sensible, aunque se muestren públicamente en el flujo de reserva.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: subagentes de proyecto y CLAUDE.md de Amalia Beauty"
```

---

## Task 15: Config de deploy en Vercel y documentación de lanzamiento

**Files:**
- Create: `proyectos/Amalia Beauty/vercel.json`
- Create: `proyectos/Amalia Beauty/README.md`

**Interfaces:**
- Ninguna (configuración de despliegue).

- [ ] **Step 1: Crear `vercel.json`**

```json
{
  "cleanUrls": true,
  "outputDirectory": "src"
}
```

- [ ] **Step 2: Crear `README.md`**

```markdown
# Amalia Beauty — Sitio y sistema de reservas

## Requisitos previos (pendientes del lado del cliente)
1. Crear un proyecto en https://supabase.com, ejecutar `supabase/schema.sql` en el SQL Editor,
   y completar `src/js/supabaseConfig.js` con el Project URL y el anon key.
2. Crear el usuario admin de Amalia en Supabase (Authentication > Users).
3. Tener una cuenta en https://vercel.com para conectar el repositorio.

## Deploy en Vercel
1. Subir este proyecto a un repositorio git (ej. GitHub).
2. En Vercel: "Add New Project" → importar el repositorio.
3. Framework preset: "Other". Output directory: `src` (ya configurado en `vercel.json`).
4. Deploy. Vercel entrega una URL `https://<proyecto>.vercel.app` lista para usar; el dominio propio se agrega después en Project Settings > Domains.

## Desarrollo local
```bash
npm install
npm test              # corre los tests de lógica pura (vitest)
npx serve src         # sirve el sitio localmente para probar en navegador
```
```

- [ ] **Step 3: Verificar checklist de QA**

Run: invocar al agente `qa-tecnico` de la agencia sobre `proyectos/Amalia Beauty/src` antes de considerar el sitio listo para lanzar.
Expected: checklist de QA sin bloqueantes (o lista de pendientes clara si algo falta, ej. reemplazar `supabaseConfig.js` con credenciales reales).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: config de deploy en Vercel y documentación de lanzamiento"
```

---

## Self-Review

**Cobertura del spec:** secciones 1 (datos del negocio) → Tasks 2, 14; sección 3 (arquitectura) → Tasks 1, 2, 15; sección 4 (estructura del sitio) → Tasks 1, 5, 13; sección 5 (flujo de reserva) → Tasks 6, 7, 8, 9; sección 6 (modelo de datos) → Task 2; sección 7 (panel admin) → Tasks 10, 11, 12; sección 8 (chatbot) → Task 13; sección 9 (privacidad) → Tasks 1, 7; sección 10 (subagentes) → Task 14. Sin gaps detectados.

**Placeholders:** el único valor no definitivo es `supabaseConfig.js` (URL/anon key), que es una credencial externa que el cliente debe generar — está documentado exactamente cómo obtenerla, no es un placeholder de lógica.

**Consistencia de tipos:** `computeAvailableSlots`, `isExpired`, `computeExpiryTimestamp`, `buildWhatsAppUrl` se usan con la misma firma en todas las tareas que los consumen (6, 7, 8, 9).
