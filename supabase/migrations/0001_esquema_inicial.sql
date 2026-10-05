-- Migración 0001: esquema inicial
-- Objetivo: cuentas por negocio, aislamiento por Row Level Security,
-- catálogo, compras, clientes, pedidos y entregas.

create extension if not exists "pgcrypto";

create type public.role_miembro as enum ('propietario', 'empleado');
create type public.tipo_unidad as enum ('peso', 'volumen', 'unidad');
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

create table public.unidades (
  code text primary key,
  tipo public.tipo_unidad not null,
  factor numeric not null check (factor > 0),
  etiqueta text not null
);

insert into public.unidades (code, tipo, factor, etiqueta) values
  ('g', 'peso', 1, 'Gramos'),
  ('kg', 'peso', 1000, 'Kilogramos'),
  ('ml', 'volumen', 1, 'Mililitros'),
  ('cl', 'volumen', 10, 'Centilitros'),
  ('l', 'volumen', 1000, 'Litros'),
  ('unidad', 'unidad', 1, 'Unidad'),
  ('paquete', 'unidad', 1, 'Paquete');

create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) > 0),
  moneda text not null default 'UYU',
  creado_en timestamptz not null default now()
);

create table public.miembros (
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  rol public.role_miembro not null default 'empleado',
  creado_en timestamptz not null default now(),
  primary key (negocio_id, usuario_id)
);

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null check (length(btrim(nombre)) > 0),
  contacto text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null check (length(btrim(nombre)) > 0),
  unidad text not null references public.unidades (code),
  cantidad_comprada numeric not null check (cantidad_comprada > 0),
  precio_lote numeric not null check (precio_lote >= 0),
  contenido_paquete numeric check (contenido_paquete > 0),
  unidad_contenido text references public.unidades (code),
  proveedor_id uuid references public.proveedores (id) on delete set null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint contenido_solo_para_paquetes check (
    (unidad = 'paquete' and contenido_paquete is not null and unidad_contenido is not null)
    or (unidad <> 'paquete')
  )
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null check (length(btrim(nombre)) > 0),
  descripcion text,
  precio_venta numeric not null check (precio_venta >= 0),
  costo_manual numeric check (costo_manual >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (producto_id)
);

create table public.receta_items (
  id uuid primary key default gen_random_uuid(),
  receta_id uuid not null references public.recetas (id) on delete cascade,
  insumo_id uuid not null references public.insumos (id) on delete cascade,
  cantidad numeric not null check (cantidad >= 0),
  unidad text not null references public.unidades (code),
  unique (receta_id, insumo_id)
);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  proveedor_id uuid references public.proveedores (id) on delete set null,
  fecha date not null default current_date,
  notas text,
  creado_en timestamptz not null default now()
);

create table public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras (id) on delete cascade,
  insumo_id uuid not null references public.insumos (id) on delete restrict,
  cantidad numeric not null check (cantidad > 0),
  unidad text not null references public.unidades (code),
  precio_unitario numeric not null check (precio_unitario >= 0),
  total numeric not null check (total >= 0)
);

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

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  estado public.estado_pedido not null default 'borrador',
  estado_pago public.estado_pago not null default 'pendiente',
  fecha date not null default current_date,
  fecha_entrega date,
  notas text,
  creado_en timestamptz not null default now()
);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete restrict,
  cantidad numeric not null check (cantidad > 0),
  precio_unitario numeric not null check (precio_unitario >= 0),
  costo_congelado numeric not null default 0,
  subtotal numeric not null check (subtotal >= 0)
);

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  direccion text,
  programada_en timestamptz,
  estado public.estado_entrega not null default 'pendiente',
  entregada_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (pedido_id)
);

create index idx_miembros_usuario on public.miembros (usuario_id);
create index idx_insumos_negocio on public.insumos (negocio_id);
create index idx_productos_negocio on public.productos (negocio_id);
create index idx_pedidos_negocio_fecha on public.pedidos (negocio_id, fecha);
create index idx_pedidos_entrega on public.pedidos (negocio_id, fecha_entrega);
create index idx_compras_negocio on public.compras (negocio_id, fecha);

-- Row Level Security

alter table public.negocios enable row level security;
alter table public.miembros enable row level security;
alter table public.proveedores enable row level security;
alter table public.insumos enable row level security;
alter table public.productos enable row level security;
alter table public.recetas enable row level security;
alter table public.receta_items enable row level security;
alter table public.compras enable row level security;
alter table public.compra_items enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.entregas enable row level security;

create or replace function public.negocios_del_usuario()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select negocio_id from public.miembros where usuario_id = auth.uid()
$$;

create or replace function public.es_propietario(negocio uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros
    where usuario_id = auth.uid() and negocio_id = negocio and rol = 'propietario'
  )
$$;

create or replace function public.puede_escribir(negocio uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros where usuario_id = auth.uid() and negocio_id = negocio
  )
$$;

-- negocios: cada miembro ve solo los suyos
create policy "ver negocios propios" on public.negocios
  for select to authenticated
  using (id in (select public.negocios_del_usuario()));

create policy "crear negocio" on public.negocios
  for insert to authenticated
  with check (true);

create policy "editar negocio propio" on public.negocios
  for update to authenticated
  using (id in (select public.negocios_del_usuario()))
  with check (id in (select public.negocios_del_usuario()));

-- miembros: un propietario administra los miembros de su negocio
create policy "ver miembros del negocio" on public.miembros
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_propietario(negocio_id));

create policy "gestionar miembros" on public.miembros
  for all to authenticated
  using (public.es_propietario(negocio_id))
  with check (public.es_propietario(negocio_id));

-- tablas con negocio_id directo
create policy "acceso insumos" on public.insumos
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso productos" on public.productos
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso proveedores" on public.proveedores
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

create policy "acceso compras" on public.compras
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

create policy "acceso entregas" on public.entregas
  for all to authenticated
  using (public.puede_escribir(negocio_id))
  with check (public.puede_escribir(negocio_id));

-- recetas: el negocio se deduce del producto
create policy "acceso recetas" on public.recetas
  for all to authenticated
  using (
    exists (
      select 1 from public.productos p
      where p.id = producto_id and public.puede_escribir(p.negocio_id)
    )
  )
  with check (
    exists (
      select 1 from public.productos p
      where p.id = producto_id and public.puede_escribir(p.negocio_id)
    )
  );

create policy "acceso receta_items" on public.receta_items
  for all to authenticated
  using (
    exists (
      select 1
      from public.recetas r
      join public.productos p on p.id = r.producto_id
      where r.id = receta_id and public.puede_escribir(p.negocio_id)
    )
  )
  with check (
    exists (
      select 1
      from public.recetas r
      join public.productos p on p.id = r.producto_id
      where r.id = receta_id and public.puede_escribir(p.negocio_id)
    )
  );

create policy "acceso pedido_items" on public.pedido_items
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

create policy "acceso compra_items" on public.compra_items
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

-- unidades es un catalogo global de solo lectura
alter table public.unidades enable row level security;

create policy "leer unidades" on public.unidades
  for select to authenticated
  using (true);

-- anon no necesita nada: toda la aplicacion exige cuenta
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select on public.unidades to authenticated;
