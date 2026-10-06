-- 0004: vencimientos
--
-- Dos ideas:
-- 1. Un articulo puede tener una DURACION: cuantos dias aguanta una unidad desde que
--    entra al stock. La harina no vence (NULL). Una salsa casera aguanta 4 dias.
-- 2. Un movimiento puede tener una FECHA de vencimiento puntual, para lo que se compra
--    con fecha impresa (un yogurt que dice 12/08).
--
-- Si el movimiento no tiene fecha propia, se deduce de la duracion del articulo.

-- Dias que dura una unidad. NULL = no vence.
alter table public.articulos
  add column if not exists duracion_dias integer
    constraint duracion_dias_positiva check (duracion_dias is null or duracion_dias > 0);

comment on column public.articulos.duracion_dias is
  'Dias que dura una unidad desde que entra al stock. NULL = no vence (harina, pasta). Sirve para avisar antes de que se eche a perder.';

-- Vencimiento de una entrada concreta. NULL = se deduce de articulos.duracion_dias.
alter table public.movimientos
  add column if not exists vence_el date;

comment on column public.movimientos.vence_el is
  'Vencimiento de esta entrada. Si queda NULL se calcula con articulos.duracion_dias a partir de la fecha del movimiento.';

-- Para preguntar "que se esta por vencer" sin escanear la tabla entera.
create index if not exists idx_movimientos_vencimiento
  on public.movimientos (negocio_id, vence_el)
  where vence_el is not null;

-- Los articulos que vencen son pocos: este indice solo los guarda a ellos.
create index if not exists idx_articulos_duracion
  on public.articulos (negocio_id)
  where duracion_dias is not null;