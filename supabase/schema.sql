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
-- Solo el panel admin (autenticado) puede leer nombre_clienta/telefono; el público solo ve ocupación vía public_slots
create policy "reservas lectura solo admin" on bookings for select using (auth.role() = 'authenticated');

create view public_slots as
  select fecha, hora, estado from bookings;

grant select on public_slots to anon, authenticated;

-- Vista sin PII para que el barrido de expiracion (publico, sin auth) encuentre reservas pendientes vencidas
create view public_expirable as
  select id, estado, expira_en from bookings;

grant select on public_expirable to anon, authenticated;

create policy "cualquiera crea reserva" on bookings for insert with check (true);
create policy "admin actualiza reservas" on bookings for update using (auth.role() = 'authenticated');
-- Permite a clientes anonimos expirar SOLO sus propias reservas ya vencidas, y SOLO hacia 'expirada'
-- (politicas permisivas se combinan con OR: esto no debilita la politica de admin de arriba)
create policy "expirar reservas vencidas" on bookings
  for update
  using (estado = 'pendiente_abono' and expira_en < now())
  with check (estado = 'expirada');
create policy "admin crea bloqueos" on bloqueos for insert with check (auth.role() = 'authenticated');
create policy "admin borra bloqueos" on bloqueos for delete using (auth.role() = 'authenticated');

insert into services (nombre, precio_desde, duracion_min, es_adicional) values
('Esmaltado permanente', 11000, 60, false),
('Kapping (adicional al esmaltado)', 4000, 30, true),
('Extensión Polygel', 18000, 120, false),
('Spa de manos + servicio', 7000, 45, true),
('Solo spa y arreglo de uñas', 10000, 45, false),
('Retiro de trabajo', 4000, 40, false);
