-- Datos KYC del festejado (una vez, al primer retiro). En el simulador se
-- marca verificado de inmediato; con EcartPay real iría a validación.
create table kyc_festejado (
  festejado_id    uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  clabe           char(18) not null,
  estado          text not null default 'verificado' check (estado in ('pendiente', 'verificado')),
  creado_en       timestamptz not null default now()
);

alter table kyc_festejado enable row level security;

create policy "kyc: dueño lee" on kyc_festejado for select using (festejado_id = auth.uid());
create policy "kyc: dueño inserta" on kyc_festejado for insert with check (festejado_id = auth.uid());
create policy "kyc: dueño actualiza" on kyc_festejado for update using (festejado_id = auth.uid());

-- Retiros (dispersión al festejado). Simulados como 'completado' por ahora.
create table retiros (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references eventos (id) on delete cascade,
  monto_centavos integer not null check (monto_centavos > 0),
  clabe_destino  char(18) not null,
  estado         text not null default 'completado' check (estado in ('solicitado', 'completado', 'fallido')),
  creado_en      timestamptz not null default now()
);

create index retiros_evento_id_idx on retiros (evento_id);

alter table retiros enable row level security;

create policy "retiros: dueño lee"
  on retiros for select
  using (exists (select 1 from eventos e where e.id = evento_id and e.festejado_id = auth.uid()));

create policy "retiros: dueño inserta"
  on retiros for insert
  with check (exists (select 1 from eventos e where e.id = evento_id and e.festejado_id = auth.uid()));
