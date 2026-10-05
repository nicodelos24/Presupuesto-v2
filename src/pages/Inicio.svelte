<script lang="ts">
  import { onMount } from "svelte";
  import { CircleCheck, CircleAlert, Package } from "lucide-svelte";
  import Tarjeta from "../components/Tarjeta.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { costearReceta, margenDesdePrecio, precioDesdeMargen } from "../lib/costing";
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
  <header>
    <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
      Resumen del dia
    </h1>
    <p class="mt-1 text-sm text-ink-500">
      Todo lo que hay que producir y entregar hoy, en un solo lugar.
    </p>
  </header>

  <Tarjeta titulo="Estado del sistema">
    {#if cargando}
      <p class="text-sm text-ink-400">Consultando la base de datos...</p>
    {:else}
      <ul class="space-y-2.5 text-sm">
        <li class="flex items-center justify-between gap-3">
          <span class="text-ink-500">Base de datos</span>
          <span class="flex items-center gap-1.5 font-medium">
            {#if conexionConfigurada}
              <CircleCheck size={16} class="text-emerald-600" />
              Conectada
            {:else}
              <CircleAlert size={16} class="text-amber-600" />
              Falta configurar .env
            {/if}
          </span>
        </li>

        <li class="flex items-center justify-between gap-3">
          <span class="text-ink-500">Sesion</span>
          <span class="flex items-center gap-1.5 font-medium">
            {#if sesionIniciada}
              <CircleCheck size={16} class="text-emerald-600" />
              {correo}
            {:else}
              <CircleAlert size={16} class="text-amber-600" />
              Sin iniciar sesion
            {/if}
          </span>
        </li>
      </ul>
    {/if}
  </Tarjeta>

  <Tarjeta titulo="Para hoy">
    <EstadoVacio
      titulo="Aun no hay pedidos para hoy"
      descripcion="Cuando cargues pedidos van a aparecer aqui los que hay que producir y los que hay que entregar."
    >
      {#snippet icono()}
        <Package size={32} strokeWidth={1.5} />
      {/snippet}
    </EstadoVacio>
  </Tarjeta>

  <Tarjeta titulo="Ejemplo de costeo real">
    <ul class="space-y-1.5 text-sm">
      {#each costeo.detalles as detalle (detalle.insumoId)}
        <li class="flex justify-between gap-4">
          <span class="text-ink-600">
            {detalle.nombre}
            <span class="text-ink-400">
              {detalle.cantidadPedida}
              {detalle.unidadPedida}
            </span>
          </span>
          <span class="font-medium tabular-nums">
            {money.format(detalle.costo)}
          </span>
        </li>
      {/each}
    </ul>

    <dl class="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-sm">
      <div class="flex justify-between">
        <dt class="text-ink-500">Costo total</dt>
        <dd class="font-semibold tabular-nums">
          {money.format(costeo.costoTotal)}
        </dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-ink-500">Precio con {margen}% de ganancia</dt>
        <dd class="font-semibold tabular-nums">{money.format(precio)}</dd>
      </div>
      <div class="flex justify-between text-ink-400">
        <dt>Margen sobre el costo</dt>
        <dd class="tabular-nums">{porcentaje?.toFixed(1)}%</dd>
      </div>
    </dl>
  </Tarjeta>
</div>
