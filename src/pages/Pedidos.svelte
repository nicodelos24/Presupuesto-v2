<script lang="ts">
  import Boton from "../components/Boton.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { ClipboardList } from "lucide-svelte";
</script>

<div class="space-y-5">
  <header class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
        Pedidos
      </h1>
      <p class="mt-1 text-sm text-ink-500">
        Quien pidio, cuanto, para cuando y cuanto falta cobrar.
      </p>
    </div>
    <Boton>
      <ClipboardList size={18} />
      Nuevo
    </Boton>
  </header>

  <EstadoVacio
    titulo="Todavia no hay pedidos"
    descripcion="Carga el primer pedido con sus productos y la fecha de entrega. El costo de cada linea se calcula solo con el inventario."
  >
    {#snippet icono()}
      <ClipboardList size={32} strokeWidth={1.5} />
    {/snippet}
  </EstadoVacio>
</div>
