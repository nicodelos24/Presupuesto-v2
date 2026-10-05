<script lang="ts">
  import { onMount } from "svelte";
  import { costearReceta, precioDesdeMargen } from "./lib/costing";
  import type { Insumo } from "./lib/tipos";
  import { conexionConfigurada, supabase } from "./lib/supabase";

  const harina: Insumo = {
    id: "ing-harina",
    nombre: "Harina",
    unidad: "kg",
    cantidadComprada: 25,
    precioLote: 1200,
  };

  const azucar: Insumo = {
    id: "ing-azucar",
    nombre: "Azucar",
    unidad: "kg",
    cantidadComprada: 2,
    precioLote: 180,
  };

  const inventario = new Map([
    [harina.id, harina],
    [azucar.id, azucar],
  ]);

  const costeo = costearReceta(
    [
      { insumoId: harina.id, cantidad: 400, unidad: "g" },
      { insumoId: azucar.id, cantidad: 150, unidad: "g" },
    ],
    inventario,
  );

  const margen = 60;
  const precio = precioDesdeMargen(costeo.costoTotal, margen);

  let estadoConexion = "sin configurar";
  let correo: string | null = null;

  onMount(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    correo = data.user?.email ?? null;
    estadoConexion = data.user ? "sesion iniciada" : "sin sesion";
  });

  const currency = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  });
</script>

<main class="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-4 pb-10">
  <header class="pt-6">
    <p class="text-sm font-medium text-brand-600">Presupuesto</p>
    <h1 class="mt-1 text-3xl font-semibold tracking-tight">
      Sistema de costos y pedidos
    </h1>
    <p class="mt-2 text-ink-500">
      Base tecnica lista: cuentas por negocio, costos reales y pedidos con agenda.
    </p>
  </header>

  <section class="tarjeta space-y-3">
    <h2 class="text-lg font-semibold">Estado de la conexion</h2>
    <dl class="grid grid-cols-2 gap-y-2 text-sm">
      <dt class="text-ink-500">Base de datos</dt>
      <dd class="text-right font-medium">
        {conexionConfigurada ? "conectada" : "falta .env"}
      </dd>

      <dt class="text-ink-500">Sesion</dt>
      <dd class="text-right font-medium">{estadoConexion}</dd>

      <dt class="text-ink-500">Cuenta</dt>
      <dd class="truncate text-right font-medium">{correo ?? "sin cuenta"}</dd>
    </dl>
  </section>

  <section class="tarjeta space-y-3">
    <h2 class="text-lg font-semibold">Ejemplo de costeo real</h2>
    <ul class="space-y-1 text-sm text-ink-600">
      {#each costeo.detalles as detalle (detalle.insumoId)}
        <li class="flex justify-between gap-4">
          <span>
            {detalle.nombre}
            <span class="text-ink-400">
              {detalle.cantidadPedida}
              {detalle.unidadPedida}
            </span>
          </span>
          <span class="font-medium tabular-nums">
            {currency.format(detalle.costo)}
          </span>
        </li>
      {/each}
    </ul>
    <div class="flex justify-between border-t border-ink-100 pt-3 text-base font-semibold">
      <span>Costo total</span>
      <span class="tabular-nums">{currency.format(costeo.costoTotal)}</span>
    </div>
    <div class="flex justify-between text-sm text-ink-600">
      <span>Precio con {margen}% de ganancia</span>
      <span class="tabular-nums">{currency.format(precio)}</span>
    </div>
  </section>
</main>
