-- Código corto de 4 dígitos para que los invitados encuentren la mesa fácil
-- (más simple de dictar/teclear que el slug). Coexiste con el slug.
alter table eventos add column codigo char(4);

-- Rellena las mesas existentes con códigos únicos (1001, 1002, ...).
with numeradas as (
  select id, lpad((1000 + row_number() over (order by creado_en))::text, 4, '0') as nuevo
  from eventos
)
update eventos e set codigo = n.nuevo from numeradas n where e.id = n.id;

alter table eventos alter column codigo set not null;
alter table eventos add constraint eventos_codigo_key unique (codigo);
