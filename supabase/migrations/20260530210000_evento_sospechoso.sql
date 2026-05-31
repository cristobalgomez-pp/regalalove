-- Marca de fraude administrada desde el panel interno (#17).
-- La escritura ocurre server-side con service_role (salta RLS); no se
-- agregan políticas nuevas. La lectura pública existente sigue igual.
alter table eventos
  add column sospechoso boolean not null default false,
  add column nota_admin text;
