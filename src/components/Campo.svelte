<script lang="ts">
  interface Props {
    etiqueta: string;
    id: string;
    nombre?: string;
    valor?: string | number;
    placeholder?: string;
    tipo?: "text" | "number" | "email" | "password" | "tel" | "date";
    requerido?: boolean;
    deshabilitado?: boolean;
    min?: string | number;
    paso?: string | number;
    error?: string;
    descripcion?: string;
    oninput?: (evento: Event) => void;
  }

  let {
    etiqueta,
    id,
    nombre,
    valor = $bindable(""),
    placeholder,
    tipo = "text",
    requerido = false,
    deshabilitado = false,
    min,
    paso,
    error,
    descripcion,
    oninput,
  }: Props = $props();
</script>

<div>
  <label class="etiqueta" for={id}>
    {etiqueta}
    {#if requerido}<span class="text-brand-600">*</span>{/if}
  </label>

  <input
    class="campo"
    class:border-red-400={error}
    {id}
    name={nombre}
    bind:value={valor}
    {placeholder}
    type={tipo}
    required={requerido}
    disabled={deshabilitado}
    {min}
    step={paso}
    {oninput}
  />

  {#if error}
    <p class="error-campo">{error}</p>
  {:else if descripcion}
    <p class="mt-1 text-sm text-ink-400">{descripcion}</p>
  {/if}
</div>
