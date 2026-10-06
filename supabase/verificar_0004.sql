-- Verificacion de la migracion 0004 (vencimientos).
-- Devuelve UNA fila y UNA columna de texto: 'TODO VERDE' o el problema exacto.
-- Pegar y correr UNA SOLA VEZ en el editor SQL del panel de Supabase.

select
  case
    when not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'articulos'
        and column_name = 'duracion_dias'
        and data_type = 'integer'
    )
      then 'FALTA: articulos.duracion_dias no existe o no es integer'

    when not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'movimientos'
        and column_name = 'vence_el'
        and data_type = 'date'
    )
      then 'FALTA: movimientos.vence_el no existe o no es date'

    when not exists (
      select 1 from pg_indexes
      where schemaname = 'public' and indexname = 'idx_movimientos_vencimiento'
    )
      then 'FALTA: no se creo el indice idx_movimientos_vencimiento'

    when not exists (
      select 1 from pg_indexes
      where schemaname = 'public' and indexname = 'idx_articulos_duracion'
    )
      then 'FALTA: no se creo el indice idx_articulos_duracion'

    -- La restriccion tiene que existir: es la que impide duracion 0 o negativa.
    when not exists (
      select 1 from pg_constraint
      where conname = 'duracion_dias_positiva'
    )
      then 'FALTA: no existe la restriccion duracion_dias_positiva'

    when exists (
      select 1 from public.articulos where duracion_dias <= 0
    )
      then 'FALLO: hay articulos con duracion_dias menor o igual a 0'

    else 'TODO VERDE'
  end as resultado;