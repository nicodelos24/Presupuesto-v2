<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    titulo: string;
    descripcion: string;
    icono?: Snippet;
    accion?: Snippet;
  }

  let { titulo, descripcion, icono, accion }: Props = $props();
</script>

<div
  class="animate-subir flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-gradient-to-b from-white to-ink-50/60 px-6 py-10 text-center"
>
  {#if icono}
    <div
      class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-brand-100"
    >
      {@render icono()}
    </div>
  {/if}

  <div class="space-y-1.5">
    <p class="font-semibold text-ink-800">{titulo}</p>
    <p class="mx-auto max-w-xs text-sm leading-relaxed text-ink-500">
      {descripcion}
    </p>
  </div>

  {#if accion}
    <div class="pt-1">{@render accion()}</div>
  {/if}
</div>
