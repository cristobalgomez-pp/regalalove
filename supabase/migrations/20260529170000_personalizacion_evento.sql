-- Personalización de la página pública de la mesa.
alter table eventos
  add column mensaje_bienvenida text,
  add column fecha_evento date,
  add column portada_url text;
