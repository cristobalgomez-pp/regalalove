-- Tabla key-value de configuración editable (comisiones, precios, flags).
-- El módulo interpretarConfigMonetizacion() la traduce a config tipada.
create table configuracion (
  clave           text primary key,
  valor           text not null,
  actualizado_en  timestamptz not null default now()
);

-- RLS activado sin políticas públicas: solo accesible del lado servidor
-- con service_role (que saltea RLS). El panel admin editará server-side.
alter table configuracion enable row level security;

-- Semilla de defaults de monetización.
insert into configuracion (clave, valor) values
  ('comision_base_pct', '5'),
  ('comision_premium_pct', '3'),
  ('precio_premium_centavos', '49900'),
  ('absorcion_pre_marcada', 'true');
