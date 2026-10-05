<script lang="ts">
  import {
    CalendarDays,
    ClipboardList,
    House,
    Package,
    User,
    Boxes,
  } from "lucide-svelte";
  import type { Snippet } from "svelte";
  import type { IdRuta } from "../lib/rutas";

  interface Props {
    rutaActual: IdRuta;
    onnavegar: (id: IdRuta) => void;
    children: Snippet;
  }

  let { rutaActual, onnavegar, children }: Props = $props();

  const items = [
    { id: "inicio" as const, etiqueta: "Inicio", icono: House },
    { id: "pedidos" as const, etiqueta: "Pedidos", icono: ClipboardList },
    { id: "agenda" as const, etiqueta: "Agenda", icono: CalendarDays },
    { id: "inventario" as const, etiqueta: "Inventario", icono: Boxes },
    { id: "mas" as const, etiqueta: "Mas", icono: User },
  ];
</script>

<div class="min-h-dvh lg:flex">
  <aside
    class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-6 lg:flex"
  >
    <div class="px-2">
      <p class="text-xs font-semibold uppercase tracking-wider text-brand-600">
        Presupuesto
      </p>
      <p class="mt-1 text-lg font-semibold text-ink-900">Mi negocio</p>
    </div>

    <nav class="mt-6 flex-1 space-y-1">
      {#each items as item (item.id)}
        <button
          class="flex min-h-touch w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition {rutaActual ===
          item.id
            ? 'bg-brand-50 text-brand-700'
            : 'text-ink-600 hover:bg-ink-50'}"
          onclick={() => onnavegar(item.id)}
        >
          <item.icono size={20} strokeWidth={2} />
          {item.etiqueta}
        </button>
      {/each}
    </nav>

    <div class="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
      Version de desarrollo
    </div>
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <header
      class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-100 bg-white/90 px-4 backdrop-blur lg:hidden"
    >
      <span class="text-base font-semibold">Presupuesto</span>
      <Package size={20} class="text-ink-400" />
    </header>

    <main class="flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10">
      <div class="mx-auto w-full max-w-3xl">{@render children()}</div>
    </main>

    <nav
      class="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 pb-1 pt-1.5 backdrop-blur lg:hidden"
    >
      <ul class="grid grid-cols-5">
        {#each items as item (item.id)}
          <li>
            <button
              class="flex min-h-touch w-full flex-col items-center justify-center gap-0.5 rounded-lg text-ink-400 transition {rutaActual ===
              item.id
                ? 'text-brand-600'
                : ''}"
              onclick={() => onnavegar(item.id)}
              aria-current={rutaActual === item.id ? "page" : undefined}
            >
              <item.icono size={22} strokeWidth={rutaActual === item.id ? 2.4 : 2} />
              <span class="text-[11px] leading-none font-medium">
                {item.etiqueta}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</div>
