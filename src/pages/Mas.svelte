<script lang="ts">
  import Tarjeta from "../components/Tarjeta.svelte";
  import { ChevronRight } from "lucide-svelte";

  const secciones = [
    { titulo: "Mi negocio", detalle: "Nombre, moneda y datos" },
    { titulo: "Usuarios y permisos", detalle: "Duenos y empleados" },
    { titulo: "Proveedores", detalle: "Datos y contacto" },
    { titulo: "Exportar mis datos", detalle: "Siempre disponible" },
    { titulo: "Cerrar sesion", detalle: "" },
  ];
</script>

<div class="space-y-5">
  <header>
    <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
      Negocio y ajustes
    </h1>
    <p class="mt-1 text-sm text-ink-500">
      Todo lo que no es operacion diaria queda aca.
    </p>
  </header>

  <Tarjeta>
    <ul class="divide-y divide-ink-100">
      {#each secciones as seccion (seccion.titulo)}
        <li>
          <button
            class="flex min-h-touch w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span class="block text-sm font-medium text-ink-800">
                {seccion.titulo}
              </span>
              {#if seccion.detalle}
                <span class="block text-xs text-ink-400">{seccion.detalle}</span>
              {/if}
            </span>
            <ChevronRight size={18} class="shrink-0 text-ink-300" />
          </button>
        </li>
      {/each}
    </ul>
  </Tarjeta>
</div>
