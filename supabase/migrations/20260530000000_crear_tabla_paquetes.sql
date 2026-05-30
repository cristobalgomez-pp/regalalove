-- Paquetes prearmados de mesa, curados por Regalove. Cada paquete agrupa una
-- lista fija de regalos del catálogo con su cantidad. El total NO se persiste:
-- se calcula al vuelo como Σ(precio_catálogo × cantidad).
create table paquetes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  tipo        text not null default 'boda',
  orden       integer not null default 0,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

create table paquete_items (
  id               uuid primary key default gen_random_uuid(),
  paquete_id       uuid not null references paquetes (id) on delete cascade,
  catalogo_item_id uuid not null references catalogo_items (id) on delete cascade,
  cantidad         integer not null default 1 check (cantidad > 0)
);

create index paquete_items_paquete_id_idx on paquete_items (paquete_id);

alter table paquetes enable row level security;
alter table paquete_items enable row level security;

-- Lectura pública: cualquiera lista los paquetes en el chooser. La escritura la
-- hace Regalove (service role / migraciones), sin políticas para usuarios.
create policy "lectura publica de paquetes"
  on paquetes for select
  using (true);

create policy "lectura publica de paquete_items"
  on paquete_items for select
  using (true);

-- ----------------------------------------------------------------------------
-- Seed: 8 paquetes en escalera con totales en números cerrados ($50k → $500k).
-- Cada bloque inserta el paquete y luego sus ítems, haciendo match por nombre
-- contra catalogo_items (los UUID del catálogo son aleatorios, no se hardcodean).
-- ----------------------------------------------------------------------------

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Mesa Esencial', 'Lo básico para empezar tu hogar', 'boda', 1) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Batería de cocina', 2), ('Cafetera espresso', 2), ('Vajilla de 12 piezas', 2),
  ('Edredón king size', 2), ('Juego de sábanas', 2), ('Juego de copas', 2),
  ('Lámpara de piso', 2), ('Mesa de centro', 1), ('Aspiradora', 1),
  ('Microondas', 1), ('Licuadora', 2), ('Juego de cuchillos', 1),
  ('Cena romántica', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Cocina & Mesa', 'Todo para cocinar y recibir invitados', 'boda', 2) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Comedor de 6 sillas', 3), ('Cafetera espresso', 3), ('Batería de cocina', 4),
  ('Vajilla de 12 piezas', 7), ('Juego de copas', 4), ('Juego de cuchillos', 2),
  ('Licuadora', 2), ('Microondas', 2), ('Aspiradora', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Luna de miel', 'Hotel, cenas y experiencias para celebrar', 'boda', 3) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Noche de hotel', 8), ('Cena romántica', 8), ('Excursión', 8),
  ('Cafetera espresso', 2), ('Vajilla de 12 piezas', 4), ('Batería de cocina', 2),
  ('Edredón king size', 4), ('Juego de sábanas', 4), ('Comedor de 6 sillas', 1),
  ('Mesa de centro', 4), ('Lámpara de piso', 3), ('Microondas', 2),
  ('Aspiradora', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Mesa Completa', 'Una mezcla amplia de todas las áreas del hogar', 'boda', 4) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 2), ('Sofá de 3 plazas', 2), ('Comedor de 6 sillas', 2),
  ('Cafetera espresso', 3), ('Vajilla de 12 piezas', 8), ('Batería de cocina', 4),
  ('Edredón king size', 4), ('Juego de sábanas', 5), ('Mesa de centro', 3),
  ('Lámpara de piso', 4), ('Licuadora', 3), ('Microondas', 3),
  ('Juego de copas', 5), ('Juego de cuchillos', 3), ('Cena romántica', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Hogar Plus', 'La completa más los electrodomésticos grandes', 'boda', 5) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 3), ('Sofá de 3 plazas', 3), ('Comedor de 6 sillas', 3),
  ('Cafetera espresso', 3), ('Vajilla de 12 piezas', 10), ('Batería de cocina', 5),
  ('Edredón king size', 5), ('Juego de sábanas', 6), ('Mesa de centro', 4),
  ('Lámpara de piso', 5), ('Licuadora', 4), ('Almohadas (par)', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Premium', 'Equipa la casa entera con lo esencial y más', 'boda', 6) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 4), ('Sofá de 3 plazas', 4), ('Comedor de 6 sillas', 4),
  ('Cafetera espresso', 4), ('Vajilla de 12 piezas', 12), ('Batería de cocina', 6),
  ('Edredón king size', 6), ('Juego de sábanas', 8), ('Lámpara de piso', 6),
  ('Juego de copas', 6)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Casa Llena', 'Casi todo el catálogo para estrenar casa', 'boda', 7) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 5), ('Sofá de 3 plazas', 5), ('Comedor de 6 sillas', 5),
  ('Cafetera espresso', 5), ('Vajilla de 12 piezas', 14), ('Batería de cocina', 8),
  ('Edredón king size', 8), ('Juego de sábanas', 10), ('Mesa de centro', 5),
  ('Aspiradora', 8), ('Licuadora', 1), ('Almohadas (par)', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Todo Incluido', 'El catálogo completo, sin que falte nada', 'boda', 8) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 6), ('Sofá de 3 plazas', 6), ('Comedor de 6 sillas', 6),
  ('Cafetera espresso', 6), ('Vajilla de 12 piezas', 16), ('Batería de cocina', 10),
  ('Edredón king size', 10), ('Juego de sábanas', 12), ('Mesa de centro', 6),
  ('Lámpara de piso', 8), ('Aspiradora', 6), ('Noche de hotel', 4),
  ('Cena romántica', 2), ('Almohadas (par)', 2)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;
