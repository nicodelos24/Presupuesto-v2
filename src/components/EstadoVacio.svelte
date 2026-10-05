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
  class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center"
>
  {#if icono}
    <div class="text-ink-300">{@render icono()}</div>
  {/if}

  <div class="space-y-1">
    <p class="font-medium text-ink-700">{titulo}</p>
    <p class="mx-auto max-w-xs text-sm text-ink-400">{descripcion}</p>
  </div>

  {#if accion}
    <div class="pt-1">{@render accion()}</div>
  {/if}
</div>
