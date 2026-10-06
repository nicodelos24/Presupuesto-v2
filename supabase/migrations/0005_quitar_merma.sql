-- 0005: se elimina el porcentaje de merma de las recetas
--
-- Motivo: la merma sedefinedia como "el costo extra del proceso (aceite,
-- especias)" pero se calculaba multiplicando la cantidad de ingredientes por
-- 1 + merma/100. Son dos cosas distintas: una es un gasto real y la otra dice
-- que de la tanda sale menos de lo que declaraste.
--
-- El aceite, la luz, el gas y el agua son gastos reales y se registran en la
-- tabla `gastos`, que ya existe. La perdida de masa ya la cubre el
-- rendimiento, que es el campo correcto para eso.
--
-- Quitar el campo ademas simplifica el motor: el costo de un preparado pasa a
-- ser exactamente costo de la receta / rendimiento.

alter table public.articulos
  drop column if exists merma_pct;

-- El movimiento tipo `merma` sigue existiendo: es otra cosa. ALLi se registra
-- la mercaderia que se pudrio, se vencio o se rompio, y sigue siendo necesario
-- para que el stock cuadre.