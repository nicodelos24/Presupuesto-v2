<script lang="ts">
  import Boton from "../components/Boton.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { Boxes, Plus } from "lucide-svelte";
  import { UNIDADES } from "../lib/unidades";
</script>

<div class="space-y-5">
  <header class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
        Inventario
      </h1>
      <p class="mt-1 text-sm text-ink-500">
        Insumos, proveedores y el costo real de cada receta.
      </p>
    </div>
    <Boton>
      <Plus size={18} />
      Insumo
    </Boton>
  </header>

  <EstadoVacio
    titulo="Tu inventario esta vacio"
    descripcion="Carga el primer insumo con la cantidad que compraste, su unidad y lo que pagaste. A partir de ahi se puede costear cualquier receta."
  >
    {#snippet icono()}
      <Boxes size={32} strokeWidth={1.5} />
    {/snippet}
  </EstadoVacio>

  <section class="tarjeta">
    <h2 class="text-base font-semibold text-ink-800">Unidades soportadas</h2>
    <p class="mt-1 text-sm text-ink-500">
      Los calculos solo convierten entre unidades del mismo tipo: nunca se mezclan
      gramos con mililitros.
    </p>

    <ul class="mt-3 divide-y divide-ink-100 text-sm">
      {#each Object.entries(UNIDADES) as [code, definicion] (code)}
        <li class="flex items-center justify-between py-2">
          <span class="capitalize text-ink-700">{definicion.etiqueta}</span>
          <span class="text-ink-400">
            {code} · base 1 {code === "g" || code === "ml" || code === "unidad"
              ? ""
              : `= ${definicion.factor} ${code === "kg" ? "g" : "ml"}`}
          </span>
        </li>
      {/each}
    </ul>
  </section>
</div>
