-- Catálogo global de regalos curado por Regalove. El festejado arma su mesa
-- escogiendo de aquí (cada ítem representa el dinero a juntar para esa cosa).
create table catalogo_items (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  categoria       text not null,
  descripcion     text,
  precio_centavos integer not null check (precio_centavos > 0),
  imagen_url      text,
  creado_en       timestamptz not null default now()
);

create index catalogo_items_categoria_idx on catalogo_items (categoria);

alter table catalogo_items enable row level security;

-- Lectura pública: cualquiera navega el catálogo. La escritura la hace
-- Regalove (service role / migraciones), sin políticas para usuarios.
create policy "lectura publica del catalogo"
  on catalogo_items for select
  using (true);

-- Los ítems de una mesa ahora llevan cantidad y pueden venir del catálogo.
alter table items_mesa
  add column cantidad integer not null default 1 check (cantidad > 0),
  add column catalogo_item_id uuid references catalogo_items (id) on delete set null;

-- Catálogo de ejemplo (imágenes placeholder; se reemplaza por contenido real).
insert into catalogo_items (nombre, categoria, descripcion, precio_centavos, imagen_url) values
  ('Batería de cocina', 'Cocina', 'Set completo de ollas y sartenes antiadherentes', 250000, 'https://picsum.photos/seed/regalove-bateria/400/300'),
  ('Juego de cuchillos', 'Cocina', 'Cuchillos de chef con tabla de madera', 120000, 'https://picsum.photos/seed/regalove-cuchillos/400/300'),
  ('Cafetera espresso', 'Cocina', 'Para los amantes del café en casa', 450000, 'https://picsum.photos/seed/regalove-cafetera/400/300'),
  ('Comedor de 6 sillas', 'Comedor', 'Mesa de madera con seis sillas', 1200000, 'https://picsum.photos/seed/regalove-comedor/400/300'),
  ('Vajilla de 12 piezas', 'Comedor', 'Vajilla de porcelana para 6 personas', 350000, 'https://picsum.photos/seed/regalove-vajilla/400/300'),
  ('Juego de copas', 'Comedor', 'Copas de cristal para vino y agua', 90000, 'https://picsum.photos/seed/regalove-copas/400/300'),
  ('Edredón king size', 'Recámara', 'Edredón acolchado tamaño king', 280000, 'https://picsum.photos/seed/regalove-edredon/400/300'),
  ('Juego de sábanas', 'Recámara', 'Sábanas de algodón de alta densidad', 150000, 'https://picsum.photos/seed/regalove-sabanas/400/300'),
  ('Almohadas (par)', 'Recámara', 'Par de almohadas de soporte medio', 80000, 'https://picsum.photos/seed/regalove-almohadas/400/300'),
  ('Sofá de 3 plazas', 'Sala', 'Sofá cómodo para la sala', 1500000, 'https://picsum.photos/seed/regalove-sofa/400/300'),
  ('Mesa de centro', 'Sala', 'Mesa de centro de diseño', 400000, 'https://picsum.photos/seed/regalove-mesacentro/400/300'),
  ('Lámpara de piso', 'Sala', 'Lámpara de pie con luz cálida', 180000, 'https://picsum.photos/seed/regalove-lampara/400/300'),
  ('Refrigerador', 'Electrodomésticos', 'Refrigerador de dos puertas', 1800000, 'https://picsum.photos/seed/regalove-refri/400/300'),
  ('Licuadora', 'Electrodomésticos', 'Licuadora de alta potencia', 130000, 'https://picsum.photos/seed/regalove-licuadora/400/300'),
  ('Microondas', 'Electrodomésticos', 'Horno de microondas digital', 220000, 'https://picsum.photos/seed/regalove-microondas/400/300'),
  ('Aspiradora', 'Electrodomésticos', 'Aspiradora sin cable', 300000, 'https://picsum.photos/seed/regalove-aspiradora/400/300'),
  ('Noche de hotel', 'Luna de miel', 'Una noche en hotel para la luna de miel', 350000, 'https://picsum.photos/seed/regalove-hotel/400/300'),
  ('Cena romántica', 'Luna de miel', 'Cena para dos en restaurante', 200000, 'https://picsum.photos/seed/regalove-cena/400/300'),
  ('Excursión', 'Luna de miel', 'Tour o experiencia en el destino', 250000, 'https://picsum.photos/seed/regalove-excursion/400/300');
