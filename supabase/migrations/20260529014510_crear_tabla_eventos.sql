-- Mesas/eventos. El tipo es configurable (no se hardcodea "boda").
create table eventos (
  id            uuid primary key default gen_random_uuid(),
  festejado_id  uuid not null references auth.users (id) on delete cascade,
  tipo          text not null default 'boda',
  titulo        text not null,
  slug          text not null unique,
  creado_en     timestamptz not null default now()
);

create index eventos_festejado_id_idx on eventos (festejado_id);

alter table eventos enable row level security;

-- Lectura pública: las mesas son compartibles por su URL.
create policy "lectura publica de eventos"
  on eventos for select
  using (true);

-- Solo el dueño gestiona sus eventos.
create policy "el dueno inserta sus eventos"
  on eventos for insert
  with check (festejado_id = auth.uid());

create policy "el dueno actualiza sus eventos"
  on eventos for update
  using (festejado_id = auth.uid());

create policy "el dueno borra sus eventos"
  on eventos for delete
  using (festejado_id = auth.uid());
