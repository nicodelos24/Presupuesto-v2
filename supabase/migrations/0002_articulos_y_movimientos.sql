-- Migracion 0002: articulos unificados, libro de movimientos y llegadas previstas
--
-- Motivo: los productos preparados (tortillas, salsas) se venden y tambien se usan
-- en otras recetas. Con dos tablas separadas (insumos y productos) eso no se puede
-- expressar. Se unifica en `articulos`, que guarda el stock como suma de movimientos.
--
-- La base esta vacia a esta altura, por eso se rehacen las tablas en lugar de
-- migrar datos.

drop table if exists public.compra_items;
drop table if exists public.pedido_items;
drop table if exists public.receta_items;
drop table if exists public.recetas;
drop table if exists public.productos;
drop table if exists public.insumos;
drop table if exists public.compras;
drop table if exists public.entregas;
drop table if exists public.pedidos;
drop table if exists public.clientes;

-- Estos tres tipos ya los creo la migracion 0001. Se borran primero porque
-- Postgres no permite recrear un tipo que ya existe, y las tablas que los usan
-- se eliminaron mas arriba.
drop type if exists public.estado_pedido;
drop type if exists public.estado_pago;
drop type if exists public.estado_entrega;

create type public.tipo_articulo as enum ('materia_prima', 'preparado', 'producto');

create table public.articulos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null check (length(btrim(nombre)) > 0),
  tipo public.tipo_articulo not null default 'materia_prima',

  -- se puede vender al cliente
  es_vendible boolean not null default false,
  -- tiene receta y se elabora en el local
  es_elaborado boolean not null default false,

  -- como se mide la unidad base de este articulo (g, ml, unidad)
  unidad text not null references public.unidades (code),

  -- como se compra (puede ser un paquete con contenido)
  unidad_compra text references public.unidades (code),
  contenido_paquete numeric check (contenido_paquete > 0),
  unidad_contenido text references public.unidades (code),

  -- stock actual: NUNCA se edita a mano, se calcula con los movimientos
  stock numeric not null default 0,
  -- costo promedio ponderado, se recalcula solo en las compras
  costo_promedio numeric not null default 0 check (costo_promedio >= 0),

  -- rendimiento de una tanda (obligatorio si es elaborado)
  rendimiento_cantidad numeric check (rendimiento_cantidad > 0),
  rendimiento_unidad text references public.unidades (code),

  -- por ciento que se pierde al elaborar (agua, derrames, roturas)
  merma_pct numeric not null default 0
    check (merma_pct >= 0 and merma_pct < 100),

  -- por debajo de este stock el sistema avisa
  stock_minimo numeric check (stock_minimo >= 0),

  proveedor_id uuid references public.proveedores (id) on delete set null,
  foto_url text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint articulos_elaborados_tienen_rendimiento check (
    not es_elaborado or (rendimiento_cantidad is not null and rendimiento_unidad is not null)
  )
);

create index idx_articulos_negocio on public.articulos (negocio_id);
create index idx_articulos_tipo on public.articulos (negocio_id, tipo);

create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  articulo_id uuid not null references public.articulos (id) on delete cascade,
  descripcion text,
  creado_en timestamptz not null default now(),
  unique (articulo_id)
);

create table public.receta_items (
  id uuid primary key default gen_random_uuid(),
  receta_id uuid not null references public.recetas (id) on delete cascade,
  articulo_id uuid not null references public.articulos (id) on delete restrict,
  cantidad numeric not null check (cantidad > 0),
  -- en que unidad se pide este componente dentro de la receta
  unidad text not null references public.unidades (code),
  unique (receta_id, articulo_id)
);

-- Libro de movimientos: el stock es la suma de esto
create type public.tipo_movimiento as enum (
  'compra',
  'produccion',
  'devolucion_produccion',
  'merma',
  'ajuste_conteo',
  'descarte',
  'venta'
);

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  articulo_id uuid not null references public.articulos (id) on delete restrict,
  tipo public.tipo_movimiento not null,
  -- positivo suma stock, negativo lo resta
  cantidad numeric not null check (cantidad <> 0),
  -- costo unitario con el que se valora este movimiento
  costo_unitario numeric not null default 0 check (costo_unitario >= 0),
  fecha date not null default current_date,
  -- que documento origino el movimiento (compra, pedido, conteo...)
  referencia_tipo text,
  referencia_id uuid,
  nota text,
  usuario_id uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now()
);

create index idx_movimientos_articulo on public.movimientos (articulo_id, fecha);
create index idx_movimientos_negocio on public.movimientos (negocio_id, fecha);

-- Compras: lo que se compro al proveedor
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  proveedor_id uuid references public.proveedores (id) on delete set null,
  fecha date not null default current_date,
  costo_logistica numeric not null default 0 check (costo_logistica >= 0),
  notas text,
  creado_en timestamptz not null default now()
);

create table public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  articulo_id uuid not null references public.articulos (id) on delete restrict,
  cantidad numeric not null check (cantidad > 0),
  unidad text not null references public.unidades (code),
  precio_unitario numeric not null check (precio_unitario >= 0),
  total numeric not null check (total >= 0)
);

-- Llegadas previstas: NO son stock hasta que se reciben
create type public.estado_llegada as enum ('prevista', 'recibida', 'cancelada');

create table public.llegadas_previstas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  proveedor_id uuid references public.proveedores (id) on delete set null,
  articulo_id uuid not null references public.articulos (id) on delete cascade,
  cantidad numeric not null check (cantidad > 0),
  unidad text not null references public.unidades (code),
  fecha_prevista date not null,
  compra_id uuid references public.compras (id) on delete set null,
  estado public.estado_llegada not null default 'prevista',
  notas text,
  creado_en timestamptz not null default now()
);

create index idx_llegadas_fecha on public.llegadas_previstas (negocio_id, fecha_prevista);

-- Agendado: produccion planificada para una fecha.
-- Es una RESERVA de stock, no un consumo.
create table public.producciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  fecha date not null,
  articulo_id uuid not null references public.articulos (id) on delete cascade,
  cantidad numeric not null check (cantidad > 0),
  notas text,
  pedido_id uuid,
  creado_en timestamptz not null default now()
);

create index idx_producciones_fecha on public.producciones (negocio_id, fecha);

-- Clientes, pedidos y entregas
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null check (length(btrim(nombre)) > 0),
  telefono text,
  email text,
  direccion text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create type public.estado_pedido as enum (
  'borrador',
  'confirmado',
  'en_produccion',
  'listo',
  'entregado',
  'cancelado'
);

create type public.estado_pago as enum ('pendiente', 'parcial', 'pagado');
create type public.estado_entrega as enum ('pendiente', 'en_ruta', 'entregada', 'fallida');

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  estado public.estado_pedido not null default 'borrador',
  estado_pago public.estado_pago not null default 'pendiente',
  monto_pagado numeric not null default 0 check (monto_pagado >= 0),
  fecha date not null default current_date,
  fecha_entrega date,
  costo_congelado numeric not null default 0,
  notas text,
  creado_en timestamptz not null default now()
);

create index idx_pedidos_negocio_fecha on public.pedidos (negocio_id, fecha);
create index idx_pedidos_entrega on public.pedidos (negocio_id, fecha_entrega);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  articulo_id uuid not null references public.articulos (id) on delete restrict,
  cantidad numeric not null check (cantidad > 0),
  precio_unitario numeric not null check (precio_unitario >= 0),
  -- costo congelado al confirmar: un pedido viejo debe seguir cuadrando
  costo_unitario_congelado numeric not null default 0,
  subtotal numeric not null check (subtotal >= 0)
);

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  direccion text,
  programada_en timestamptz,
  estado public.estado_entrega not null default 'pendiente',
  repartidor text,
  entregada_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (pedido_id)
);

-- Gastos del negocio: luz, gas, packaging, servicios
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  categoria text not null,
  concepto text not null check (length(btrim(concepto)) > 0),
  monto numeric not null check (monto >= 0),
  fecha date not null default current_date,
  proveedor_id uuid references public.proveedores (id) on delete set null,
  gasto_por_articulo_id uuid references public.articulos (id) on delete set null,
  notas text,
  creado_en timestamptz not null default now()
);

create index idx_gastos_mes on public.gastos (negocio_id, fecha);

-- Preferencias del negocio
alter table public.negocios
  add column stock_minimo_default numeric not null default 0,
  add column aviso_stock_bajo boolean not null default true,
  add column hora_corte_dia time not null default '04:00',
  add column hora_resumen_correo time not null default '07:00',
  add column aviso_conteo_dia integer not null default 1;

-- Row Level Security: se repite el patron para las tablas nuevas
alter table public.articulos enable row level security;
alter table public.recetas enable row level security;
alter table public.receta_items enable row level security;
alter table public.movimientos enable row level security;
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;
alter table public.llegadas_previstas enable row level security;
alter table public.producciones enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.entregas enable row level security;
alter table public.gastos enable row level security;

create policy "acceso articulos" on public.articulos
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso movimientos" on public.movimientos
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso compras" on public.compras
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso compras items" on public.compra_items
  for all to authenticated
  using (
    exists (
      select 1 from public.compras c
      where c.id = compra_id and public.puede_escribir(c.negocio_id)
    )
  )
  with check (
    exists (
      select 1 from public.compras c
      where c.id = compra_id and public.puede_escribir(c.negocio_id)
    )
  );

create policy "acceso llegadas previstas" on public.llegadas_previstas
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso producciones" on public.producciones
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso clientes" on public.clientes
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso pedidos" on public.pedidos
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso pedidos items" on public.pedido_items
  for all to authenticated
  using (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and public.puede_escribir(p.negocio_id)
    )
  )
  with check (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id and public.puede_escribir(p.negocio_id)
    )
  );

create policy "acceso entregas" on public.entregas
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso gastos" on public.gastos
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso recetas" on public.recetas
  for all to authenticated
  using (
    exists (
      select 1 from public.articulos a
      where a.id = articulo_id and public.puede_escribir(a.negocio_id)
    )
  )
  with check (
    exists (
      select 1 from public.articulos a
      where a.id = articulo_id and public.puede_escribir(a.negocio_id)
    )
  );

create policy "acceso receta items" on public.receta_items
  for all to authenticated
  using (
    exists (
      select 1
      from public.recetas r
      join public.articulos a on a.id = r.articulo_id
      where r.id = receta_id and public.puede_escribir(a.negocio_id)
    )
  )
  with check (
    exists (
      select 1
      from public.recetas r
      join public.articulos a on a.id = r.articulo_id
      where r.id = receta_id and public.puede_escribir(a.negocio_id)
    )
  );

-- rol anon: sin permisos, toda la aplicacion exige cuenta
revoke all on all tables in schema public from anon;
