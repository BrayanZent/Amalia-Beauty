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
