<script lang="ts">
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { CalendarDays } from "lucide-svelte";
</script>

<div class="space-y-5">
  <header>
    <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
      Agenda y entregas
    </h1>
    <p class="mt-1 text-sm text-ink-500">
      Cada pedido ocupa un dia de produccion y otro de entrega.
    </p>
  </header>

  <div class="tarjeta space-y-4">
    <div class="flex gap-1 rounded-xl bg-ink-100 p-1" role="tablist">
      {#each ["Dia", "Semana", "Mes"] as vista, i (vista)}
        <button
          class="min-h-9 flex-1 rounded-lg text-sm font-medium transition {i ===
          1
            ? 'bg-white text-ink-800 shadow-card'
            : 'text-ink-500'}"
          role="tab"
          aria-selected={i === 1}
        >
          {vista}
        </button>
      {/each}
    </div>

    <EstadoVacio
      titulo="Sin pedidos programados"
      descripcion="Cuando existan pedidos con fecha de entrega, van a aparecer aqui agrupados por dia para ver de un vistazo cuanto hay que producir."
    >
      {#snippet icono()}
        <CalendarDays size={32} strokeWidth={1.5} />
      {/snippet}
    </EstadoVacio>
  </div>
</div>
