-- Verificacion de la migracion 0005 (se elimino el porcentaje de merma).
-- Devuelve UNA fila y UNA columna de texto: 'TODO VERDE' o el problema exacto.
-- Pegar y correr UNA SOLA VEZ en el editor SQL del panel de Supabase.

select
  case
    -- La columna tiene que estar ida.
    when exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'articulos'
        and column_name = 'merma_pct'
    )
      then 'FALLA: articulos.merma_pct todavia existe'

    -- La tabla de gastos es la que reemplaza a la merma: tiene que estar.
    when not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'gastos'
        and column_name = 'gasto_por_articulo_id'
    )
      then 'FALTA: gastos.gasto_por_articulo_id no existe (haria falta para atribuir un gasto a un articulo)'

    -- El movimiento tipo merma NO se toca: es la mercaderia que se pudrio.
    when not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = 'tipo_movimiento'
        and e.enumlabel = 'merma'
    )
      then 'FALLA: se elimino el movimiento tipo merma, que si es necesario (mercaderia que se pudrio)'

    else 'TODO VERDE'
  end as resultado;