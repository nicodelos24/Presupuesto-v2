<script lang="ts">
  import type { Snippet } from "svelte";

  type Variante = "primario" | "secundario" | "fantasma" | "peligro";

  interface Props {
    variante?: Variante;
    tamano?: "md" | "sm";
    tipo?: "button" | "submit";
    deshabilitado?: boolean;
    class?: string;
    onclick?: (evento: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variante = "primario",
    tamano = "md",
    tipo = "button",
    deshabilitado = false,
    class: claseExtra = "",
    onclick,
    children,
  }: Props = $props();

  const CLASES_VARIANTE: Record<Variante, string> = {
    primario: "boton-primario",
    secundario: "boton-secundario",
    fantasma: "boton-fantasma",
    peligro: "boton-peligro",
  };

  const clases = $derived(
    [
      CLASES_VARIANTE[variante],
      tamano === "sm" ? "min-h-9 px-3 text-sm" : "",
      claseExtra,
    ]
      .filter(Boolean)
      .join(" "),
  );
</script>

<button type={tipo} class={clases} disabled={deshabilitado} {onclick}>
  {@render children()}
</button>
