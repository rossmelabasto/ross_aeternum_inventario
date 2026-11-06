-- Rol propio para la API FastAPI (mínimo privilegio): no usa el usuario "postgres".
-- La contraseña NO va en este archivo: se crea el rol y se le asigna la clave aparte
-- (ALTER ROLE aeternum_api PASSWORD '...'), y la cadena de conexión vive solo en backend/.env.

create role aeternum_api login noinherit;

grant usage on schema public to aeternum_api;
grant select, insert, update, delete on public.categorias, public.productos to aeternum_api;
grant select, insert on public.ventas to aeternum_api;
grant usage, select on all sequences in schema public to aeternum_api;

create policy "API: categorias" on public.categorias
  for all to aeternum_api using (true) with check (true);
create policy "API: productos" on public.productos
  for all to aeternum_api using (true) with check (true);
create policy "API: ventas" on public.ventas
  for all to aeternum_api using (true) with check (true);
