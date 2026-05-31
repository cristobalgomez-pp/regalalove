-- Endurece el flag de moderación (#17).
--
-- La política RLS de UPDATE del dueño ("el dueno actualiza sus eventos") es
-- CIEGA A COLUMNAS: permite a un festejado actualizar cualquier columna de su
-- propia mesa. Eso deja que un evento marcado como `sospechoso` limpie su
-- propio flag vía la REST API con su JWT y burle el bloqueo de retiros.
--
-- Lo cerramos con privilegios a nivel de columna: se revoca el UPDATE de tabla
-- a los roles del cliente (anon/authenticated) y se reotorga solo en las
-- columnas que el dueño legítimamente edita. `sospechoso` y `nota_admin` quedan
-- fuera, así solo `service_role` (panel admin server-side, salta RLS y conserva
-- sus privilegios) puede escribirlas.
--
-- NOTA: cualquier columna nueva que el dueño deba poder editar a futuro debe
-- agregarse a este GRANT, o su UPDATE fallará con "permission denied".
revoke update on table eventos from anon, authenticated;

grant update (tipo, titulo, slug, codigo, mensaje_bienvenida, fecha_evento, portada_url)
  on table eventos to anon, authenticated;
