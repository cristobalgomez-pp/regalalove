-- Ítems de la lista de deseos de cada mesa.
create table items_mesa (
  id                   uuid primary key default gen_random_uuid(),
  evento_id            uuid not null references eventos (id) on delete cascade,
  nombre               text not null,
  descripcion          text,
  imagen_url           text,
  monto_meta_centavos  integer not null check (monto_meta_centavos > 0),
  orden                integer not null default 0,
  creado_en            timestamptz not null default now()
);

create index items_mesa_evento_id_idx on items_mesa (evento_id);

alter table items_mesa enable row level security;

-- Lectura pública (la página de la mesa muestra los ítems).
create policy "lectura publica de items"
  on items_mesa for select
  using (true);

-- Gestión solo del dueño del evento padre.
create policy "dueno inserta items"
  on items_mesa for insert
  with check (
    exists (select 1 from eventos e where e.id = evento_id and e.festejado_id = auth.uid())
  );

create policy "dueno actualiza items"
  on items_mesa for update
  using (
    exists (select 1 from eventos e where e.id = evento_id and e.festejado_id = auth.uid())
  );

create policy "dueno borra items"
  on items_mesa for delete
  using (
    exists (select 1 from eventos e where e.id = evento_id and e.festejado_id = auth.uid())
  );
