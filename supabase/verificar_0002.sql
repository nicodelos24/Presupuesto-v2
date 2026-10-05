-- Verificacion de la migracion 0002
-- Ejecutar DESPUES de aplicar 0001 y 0002. Una consulta a la vez: el editor de
-- Supabase solo muestra el resultado de la ultima.

-- 1) Tablas y RLS. Valor esperado: 20 tablas, todas con RLS
select
  (select count(*) from pg_tables where schemaname = 'public') as tablas,
  (select count(*) from pg_tables where schemaname = 'public' and rowsecurity) as con_rls,
  (select count(*) from pg_policies where schemaname = 'public') as politicas;

-- 2) Las tablas que unifican el modelo. Debe existir articulos y no existir insumos ni productos
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 3) Tipos enumerados del dominio
select t.typname, count(e.enumlabel) as valores
from pg_type t
join pg_enum e on e.enumtypid = t.oid
where t.typnamespace = 'public'::regnamespace
group by t.typname
order by t.typname;

-- 4) Seguridad: anon no debe poder nada
select
  has_table_privilege('anon', 'articulos', 'select') as anon_lee_articulos,
  has_table_privilege('anon', 'pedidos', 'select') as anon_lee_pedidos,
  has_table_privilege('anon', 'movimientos', 'insert') as anon_agrega_movimientos;

-- 5) Las funciones de apoyo siguen existiendo
select proname, prosecdef as security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
order by proname;
