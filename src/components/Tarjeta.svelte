<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    titulo?: string;
    accion?: Snippet;
    children: Snippet;
  }

  let { titulo, accion, children }: Props = $props();
</script>

<section class="tarjeta">
  {#if titulo || accion}
    <header class="mb-3 flex items-center justify-between gap-3">
      {#if titulo}
        <h2 class="text-base font-semibold text-ink-800">{titulo}</h2>
      {/if}
      {@render accion?.()}
    </header>
  {/if}

  {@render children()}
</section>
