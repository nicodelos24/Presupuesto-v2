-- Verificacion de la migracion 0001
-- Ejecutar en Supabase > SQL Editor > New query
-- Los valores esperados son: 14 tablas, 14 con RLS, 17 politicas, 7 unidades

select
  (select count(*) from pg_tables where schemaname = 'public') as tablas,
  (select count(*) from pg_tables where schemaname = 'public' and rowsecurity) as con_rls,
  (select count(*) from pg_policies where schemaname = 'public') as politicas,
  (select count(*) from public.unidades) as unidades_cargadas,
  (select count(*) from public.insumos) as insumos,
  (select count(*) from public.negocios) as negocios;

-- Verificacion de seguridad: el rol anon no debe tener ningun permiso
select
  has_table_privilege('anon', 'public.negocios', 'select') as anon_ve_negocios,
  has_table_privilege('anon', 'public.productos', 'insert') as anon_inserta_productos,
  has_table_privilege('anon', 'public.clientes', 'select') as anon_ve_clientes;

-- Las funciones de apoyo de RLS deben existir
select proname, prosecdef as es_security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
order by proname;
