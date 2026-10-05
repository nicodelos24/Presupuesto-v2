<script lang="ts">
  import { onMount } from "svelte";
  import { CircleCheck, CircleAlert, Package } from "lucide-svelte";
  import Tarjeta from "../components/Tarjeta.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { costearArticulo, redondearMoneda } from "../lib/costoRecetas";
  import { articulos, estado, cargarArticulos } from "../lib/estado.svelte";
  import { conexionConfigurada, supabase } from "../lib/supabase";

  const catalogo = $derived(new Map(articulos.map((a) => [a.id, a])));

  const productos = $derived(
    articulos.filter((a) => a.activo && a.esElaborado),
  );

  const conCosto = $derived(
    productos.map((a) => ({
      articulo: a,
      costo: costearArticulo(a, catalogo).costoUnitario,
    })),
  );

  $effect(() => {
    void cargarArticulos();
  });

  let sesionIniciada = $state(false);
  let correo = $state<string | null>(null);

  onMount(async () => {
    if (!supabase) {
      return;
    }
    const { data } = await supabase.auth.getUser();
    sesionIniciada = Boolean(data.user);
    correo = data.user?.email ?? null;
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
    {#if estado.cargando}
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

  <Tarjeta titulo="Tus productos">
    {#if estado.cargando}
      <div class="space-y-2.5">
        <div class="esqueleto h-4 w-40"></div>
        <div class="esqueleto h-4 w-56"></div>
      </div>
    {:else if conCosto.length === 0}
      <p class="text-sm text-ink-500">
        Todavia no tenes productos en el recetario. Crea el primero y el costo
        se calcula solo.
      </p>
    {:else}
      <ul class="space-y-1.5 text-sm">
        {#each conCosto.slice(0, 4) as fila (fila.articulo.id)}
          <li class="vineta">
            <span class="min-w-0 flex-1 truncate text-ink-700">
              {fila.articulo.nombre}
            </span>
            <span class="numeros font-semibold">
              {money.format(redondearMoneda(fila.costo))}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
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
