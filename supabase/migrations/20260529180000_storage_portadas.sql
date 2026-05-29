-- Bucket público para las fotos de portada de las mesas.
insert into storage.buckets (id, name, public)
values ('portadas', 'portadas', true)
on conflict (id) do nothing;

-- Lectura pública por el bucket público (URL pública). La escritura la hace
-- cualquier usuario autenticado (el festejado al personalizar su mesa).
create policy "portadas: subir (autenticado)"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portadas');

create policy "portadas: actualizar (autenticado)"
  on storage.objects for update to authenticated
  using (bucket_id = 'portadas');

create policy "portadas: borrar (autenticado)"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portadas');
