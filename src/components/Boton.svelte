<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    variante?: "primario" | "secundario" | "fantasma" | "peligro";
    tamano?: "md" | "sm";
    tipo?: "button" | "submit";
    deshabilitado?: boolean;
    onclick?: (evento: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variante = "primario",
    tamano = "md",
    tipo = "button",
    deshabilitado = false,
    onclick,
    children,
  }: Props = $props();

  const clases = $derived(
    [
      "boton",
      variante === "primario" && "bg-brand-600 text-white hover:bg-brand-700",
      variante === "secundario" &&
        "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
      variante === "fantasma" && "text-ink-600 hover:bg-ink-100",
      variante === "peligro" && "bg-red-600 text-white hover:bg-red-700",
      tamano === "sm" && "min-h-9 px-3 text-sm",
    ]
      .filter(Boolean)
      .join(" "),
  );
</script>

<button type={tipo} class={clases} disabled={deshabilitado} {onclick}>
  {@render children()}
</button>
