-- Verificacion en una sola linea.
-- Devuelve 'TODO VERDE' si todo esta bien, o la lista de problemas.
-- Pegar y correr UNA SOLA VEZ, sin mezclarla con otras consultas.

select
  case
    when (select count(*) from pg_tables where schemaname = 'public'
          and rowsecurity) <> (select count(*) from pg_tables
                               where schemaname = 'public')
      then 'FALTA: hay tablas sin RLS'

    when not exists (select 1 from information_schema.tables
                     where table_schema = 'public' and table_name = 'articulos')
      then 'FALTA: no existe la tabla articulos'

    when exists (select 1 from information_schema.tables
                 where table_schema = 'public'
                   and table_name in ('insumos', 'productos'))
      then 'FALLA: siguen existiendo insumos o productos (deberian haberse unificado)'

    when not exists (select 1 from information_schema.tables
                     where table_schema = 'public' and table_name = 'movimientos')
      then 'FALTA: no existe la tabla movimientos'

    when has_table_privilege('anon', 'articulos', 'select')
      then 'FALLO: anon puede leer articulos'

    when has_table_privilege('anon', 'pedidos', 'select')
      then 'FALLO: anon puede leer pedidos'

    when has_table_privilege('anon', 'movimientos', 'insert')
      then 'FALLO: anon puede agregar movimientos'

    when (select count(*) from public.unidades) <> 7
      then 'FALTA: el catalogo de unidades no tiene 7 filas'

    else 'TODO VERDE'
  end as resultado;
