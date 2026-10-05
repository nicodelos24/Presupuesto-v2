<script lang="ts">
  import MarcoApp from "./layouts/MarcoApp.svelte";
  import Inicio from "./pages/Inicio.svelte";
  import Recetario from "./pages/Recetario.svelte";
  import Pedidos from "./pages/Pedidos.svelte";
  import Agenda from "./pages/Agenda.svelte";
  import Inventario from "./pages/Inventario.svelte";
  import Mas from "./pages/Mas.svelte";
  import { RUTAS, rutaDesdeHash, type IdRuta } from "./lib/rutas";

  let rutaActual = $state<IdRuta>(rutaDesdeHash(window.location.hash).id);

  function navegar(id: IdRuta) {
    const definicion = RUTAS.find((r) => r.id === id);
    if (!definicion) return;
    window.location.hash = definicion.ruta;
    rutaActual = id;
    window.scrollTo({ top: 0 });
  }

  function alCambiarHash() {
    rutaActual = rutaDesdeHash(window.location.hash).id;
  }

  window.addEventListener("hashchange", alCambiarHash);
</script>

<MarcoApp {rutaActual} onnavegar={navegar}>
  {#if rutaActual === "inicio"}
    <Inicio />
  {:else if rutaActual === "recetario"}
    <Recetario />
  {:else if rutaActual === "pedidos"}
    <Pedidos />
  {:else if rutaActual === "agenda"}
    <Agenda />
  {:else if rutaActual === "inventario"}
    <Inventario />
  {:else}
    <Mas />
  {/if}
</MarcoApp>
