<script lang="ts">
  import { onMount } from "svelte";
  import { CircleCheck, CircleAlert, TrendingUp, Package } from "lucide-svelte";
  import Tarjeta from "../components/Tarjeta.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import {
    costearReceta,
    margenDesdePrecio,
    precioDesdeMargen,
  } from "../lib/costing";
  import type { Insumo } from "../lib/tipos";
  import { conexionConfigurada, supabase } from "../lib/supabase";

  const harina: Insumo = {
    id: "ing-harina",
    nombre: "Harina",
    unidad: "kg",
    cantidadComprada: 25,
    precioLote: 1200,
  };

  const azucar: Insumo = {
    id: "ing-azucar",
    nombre: "Azucar",
    unidad: "kg",
    cantidadComprada: 2,
    precioLote: 180,
  };

  const inventario = new Map([
    [harina.id, harina],
    [azucar.id, azucar],
  ]);

  const costeo = costearReceta(
    [
      { insumoId: harina.id, cantidad: 400, unidad: "g" },
      { insumoId: azucar.id, cantidad: 150, unidad: "g" },
    ],
    inventario,
  );

  const margen = 60;
  const precio = precioDesdeMargen(costeo.costoTotal, margen);
  const porcentaje = margenDesdePrecio(precio, costeo.costoTotal);
  const ganancia = precio - costeo.costoTotal;

  let sesionIniciada = $state(false);
  let correo = $state<string | null>(null);
  let cargando = $state(true);

  onMount(async () => {
    if (!supabase) {
      cargando = false;
      return;
    }
    const { data } = await supabase.auth.getUser();
    sesionIniciada = Boolean(data.user);
    correo = data.user?.email ?? null;
    cargando = false;
  });

  const money = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  });
</script>

<div class="space-y-5">
  <section class="encabezado-hero">
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
      Martes, hoy
    </p>
    <h1 class="mt-1.5 text-2xl font-semibold tracking-tight">
      Que hay que hacer hoy
    </h1>
    <p class="mt-1.5 max-w-sm text-sm text-white/70">
      Todo lo que hay que producir y entregar, en un solo lugar.
    </p>

    <dl class="mt-5 grid grid-cols-3 gap-2.5">
      <div class="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
        <dt class="text-[11px] font-medium text-white/60">Pedidos</dt>
        <dd class="numeros mt-0.5 text-2xl font-semibold">0</dd>
      </div>
      <div class="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
        <dt class="text-[11px] font-medium text-white/60">Entregas</dt>
        <dd class="numeros mt-0.5 text-2xl font-semibold">0</dd>
      </div>
      <div class="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
        <dt class="text-[11px] font-medium text-white/60">A cobrar</dt>
        <dd class="numeros mt-0.5 text-2xl font-semibold">$0</dd>
      </div>
    </dl>
  </section>

  <Tarjeta titulo="Estado del sistema">
    {#if cargando}
      <div class="space-y-2.5">
        <div class="esqueleto h-4 w-40"></div>
        <div class="esqueleto h-4 w-56"></div>
      </div>
    {:else}
      <ul class="space-y-2.5 text-sm">
        <li class="flex items-center justify-between gap-3">
          <span class="text-ink-500">Base de datos</span>
          <span
            class="pastilla {conexionConfigurada
              ? 'bg-accent-50 text-accent-700'
              : 'bg-amber-50 text-amber-700'}"
          >
            {#if conexionConfigurada}
              <CircleCheck size={14} /> Conectada
            {:else}
              <CircleAlert size={14} /> Falta el .env
            {/if}
          </span>
        </li>

        <li class="flex items-center justify-between gap-3">
          <span class="text-ink-500">Sesion</span>
          <span
            class="pastilla {sesionIniciada
              ? 'bg-accent-50 text-accent-700'
              : 'bg-amber-50 text-amber-700'}"
          >
            {#if sesionIniciada}
              <CircleCheck size={14} /> {correo}
            {:else}
              <CircleAlert size={14} /> Sin iniciar sesion
            {/if}
          </span>
        </li>
      </ul>
    {/if}
  </Tarjeta>

  <Tarjeta titulo="Ejemplo de costeo real">
    <ul class="space-y-1.5 text-sm">
      {#each costeo.detalles as detalle (detalle.insumoId)}
        <li class="vineta">
          <span class="text-ink-700">
            {detalle.nombre}
            <span class="text-ink-400">
              {detalle.cantidadPedida}
              {detalle.unidadPedida}
            </span>
          </span>
          <span class="numeros ml-auto font-semibold">
            {money.format(detalle.costo)}
          </span>
        </li>
      {/each}
    </ul>

    <dl class="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
      <div class="flex items-center justify-between">
        <dt class="text-ink-500">Costo total</dt>
        <dd class="numeros font-semibold">{money.format(costeo.costoTotal)}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-ink-500">Precio con {margen}% de ganancia</dt>
        <dd class="numeros font-semibold">{money.format(precio)}</dd>
      </div>
      <div
        class="flex items-center justify-between rounded-xl bg-acento-gradiente px-3 py-2.5 text-white"
      >
        <dt class="flex items-center gap-1.5 font-medium">
          <TrendingUp size={16} /> Ganancia por unidad
        </dt>
        <dd class="numeros text-right font-semibold">
          {money.format(ganancia)}
          <span class="ml-1 text-white/70">({porcentaje?.toFixed(0)}%)</span>
        </dd>
      </div>
    </dl>
  </Tarjeta>

  <EstadoVacio
    titulo="Aun no hay pedidos para hoy"
    descripcion="Cuando cargues pedidos van a aparecer aqui los que hay que producir y los que hay que entregar."
  >
    {#snippet icono()}
      <Package size={26} strokeWidth={1.6} />
    {/snippet}
  </EstadoVacio>
</div>
