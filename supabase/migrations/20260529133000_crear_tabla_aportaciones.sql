-- Aportaciones (regalos en dinero) que asienta el webhook de pago.
-- El alta la hace el servidor (service role) tras confirmar el cobro; el
-- festejado solo lee las de sus propios eventos.
create table aportaciones (
  id               uuid primary key default gen_random_uuid(),
  evento_id        uuid not null references eventos (id) on delete cascade,
  item_id          uuid references items_mesa (id) on delete set null, -- null = fondo general
  cobro_id         text not null unique, -- clave de idempotencia del proveedor de pago
  monto_centavos   integer not null check (monto_centavos > 0),
  metodo_pago      text not null check (metodo_pago in ('tarjeta', 'spei', 'oxxo', 'codi')),
  nombre_invitado  text not null,
  correo_invitado  text not null,
  mensaje          text not null default '',
  absorbe_comision boolean not null default false,
  comision_centavos integer not null default 0 check (comision_centavos >= 0),
  estado           text not null default 'confirmada' check (estado in ('confirmada', 'revertida')),
  creado_en        timestamptz not null default now()
);

create index aportaciones_evento_id_idx on aportaciones (evento_id);
create index aportaciones_item_id_idx on aportaciones (item_id);

alter table aportaciones enable row level security;

-- El festejado lee las aportaciones de sus propios eventos (habilita también
-- la suscripción Realtime del dashboard, que respeta RLS).
create policy "dueno lee aportaciones de sus eventos"
  on aportaciones for select
  using (
    exists (select 1 from eventos e where e.id = evento_id and e.festejado_id = auth.uid())
  );

-- Sin políticas de insert/update/delete: solo el servidor con service role
-- (que omite RLS) asienta o revierte aportaciones desde el webhook.

-- Feed en vivo: publica la tabla para Supabase Realtime.
alter publication supabase_realtime add table aportaciones;
