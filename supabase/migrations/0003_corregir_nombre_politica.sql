-- Correccion del nombre de una politica. No cambia el comportamiento:
-- solo el nombre quedo mal escrito al copiar el archivo la primera vez.

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'proveedores'
      and policyname = 'acceso provedores'
  ) then
    execute 'alter policy "acceso provedores" on public.proveedores
             rename to "acceso proveedores"';
  end if;
end
$$;
