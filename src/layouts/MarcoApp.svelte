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
    class="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-100 bg-marca-gradiente px-4 py-6 text-white lg:flex"
  >
    <div class="px-2">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
        Presupuesto
      </p>
      <p class="mt-1 text-lg font-semibold">Mi negocio</p>
    </div>

    <nav class="mt-8 flex-1 space-y-1.5">
      {#each items as item (item.id)}
        <button
          class="group flex min-h-touch w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-all duration-200 {rutaActual ===
          item.id
            ? 'bg-white/15 text-white shadow-raised'
            : 'text-white/70 hover:bg-white/10 hover:text-white'}"
          onclick={() => onnavegar(item.id)}
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg transition {rutaActual ===
            item.id
              ? 'bg-white/20'
              : 'group-hover:bg-white/10'}"
          >
            <item.icono size={19} strokeWidth={2} />
          </span>
          {item.etiqueta}
        </button>
      {/each}
    </nav>

    <div class="rounded-xl bg-white/10 px-3 py-2.5 text-xs text-white/70">
      Version de desarrollo
    </div>
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <header
      class="safe-bottom sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-100 bg-vidrio px-4 backdrop-blur-md lg:hidden"
    >
      <span class="flex items-center gap-2 text-base font-semibold">
        <span class="h-2.5 w-2.5 rounded-full bg-accent-500"></span>
        Presupuesto
      </span>
      <Package size={20} class="text-ink-300" />
    </header>

    <main class="flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-12">
      <div class="mx-auto w-full max-w-3xl animate-entrar">
        {@render children()}
      </div>
    </main>

    <nav
      class="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-vidrio pb-1 pt-1.5 backdrop-blur-md lg:hidden"
    >
      <ul class="grid grid-cols-5">
        {#each items as item (item.id)}
          <li>
            <button
              class="flex min-h-touch w-full flex-col items-center justify-center gap-0.5 rounded-xl text-ink-400 transition-all duration-200 {rutaActual ===
              item.id
                ? 'text-brand-600'
                : 'active:scale-95'}"
              onclick={() => onnavegar(item.id)}
              aria-current={rutaActual === item.id ? "page" : undefined}
            >
              <span
                class="flex h-7 w-12 items-center justify-center rounded-lg transition-all duration-200 {rutaActual ===
                item.id
                  ? 'bg-brand-50'
                  : ''}"
              >
                <item.icono size={21} strokeWidth={rutaActual === item.id ? 2.4 : 2} />
              </span>
              <span class="text-[11px] leading-none font-semibold">
                {item.etiqueta}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</div>
