<script lang="ts">
  import { Boxes, Plus, Pencil, Trash2, Info, X, Package } from "lucide-svelte";
  import Boton from "../components/Boton.svelte";
  import Campo from "../components/Campo.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { UNIDADES } from "../lib/unidades";
  import { redondearMoneda } from "../lib/costoRecetas";
  import {
    actualizarArticulo,
    articulos,
    estado,
    cargarArticulos,
    crearArticulo,
    eliminarArticulo,
  } from "../lib/estado.svelte";
  import type { Articulo, CodigoUnidad } from "../lib/tipos";

  let busqueda = $state("");
  let abierto = $state(false);
  let editandoId = $state<string | null>(null);
  let errores = $state<Record<string, string>>({});

  let nombre = $state("");
  let unidad = $state<CodigoUnidad>("kg");
  let stock = $state<number | null>(null);
  let costoPromedio = $state<number | null>(null);
  let stockMinimo = $state<number | null>(null);
  let unidadCompra = $state<CodigoUnidad | null>(null);
  let contenidoPaquete = $state<number | null>(null);
  let unidadContenido = $state<CodigoUnidad>("g");
  let esVendible = $state(false);
  let duracionDias = $state<number | null>(null);

  // Inventario es lo que se compra y se tiene: las materias primas y lo que se
  // revende sin receta. Lo que se elabora vive en el recetario.
  const visibles = $derived(
    articulos
      .filter((a) => a.activo && !a.esElaborado)
      .filter((a) =>
        a.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
  );

  const totalArticulos = $derived(
    articulos.filter((a) => a.activo && !a.esElaborado).length,
  );

  const valorInventario = $derived(
    redondearMoneda(
      articulos
        .filter((a) => a.activo && !a.esElaborado)
        .reduce((suma, a) => suma + a.stock * a.costoPromedio, 0),
    ),
  );

  const enEdicion = $derived(
    editandoId ? articulos.find((a) => a.id === editandoId) : undefined,
  );

  const enAlerta = $derived(
    articulos.filter(
      (a) =>
        a.activo &&
        !a.esElaborado &&
        a.stockMinimo !== null &&
        a.stock <= a.stockMinimo,
    ),
  );

  $effect(() => {
    void cargarArticulos();
  });

  function abrirNuevo() {
    editandoId = null;
    nombre = "";
    unidad = "kg";
    stock = null;
    costoPromedio = null;
    stockMinimo = null;
    unidadCompra = null;
    contenidoPaquete = null;
    unidadContenido = "g";
    esVendible = false;
    duracionDias = null;
    errores = {};
    abierto = true;
  }

  function abrirEdicion(articulo: Articulo) {
    editandoId = articulo.id;
    nombre = articulo.nombre;
    unidad = articulo.unidad;
    stock = articulo.stock;
    costoPromedio = articulo.costoPromedio;
    stockMinimo = articulo.stockMinimo;
    unidadCompra = articulo.unidadCompra;
    contenidoPaquete = articulo.contenidoPaquete;
    unidadContenido = articulo.unidadContenido ?? "g";
    esVendible = articulo.esVendible;
    duracionDias = articulo.duracionDias;
    errores = {};
    abierto = true;
  }

  function cerrar() {
    abierto = false;
    errores = {};
  }

  async function guardar(evento: SubmitEvent) {
    evento.preventDefault();

    if (!nombre.trim()) {
      errores = { nombre: "Poné un nombre" };
      return;
    }
    if (stock === null || stock < 0) {
      errores = { stock: "El stock no puede ser negativo" };
      return;
    }
    if (costoPromedio === null || costoPromedio < 0) {
      errores = { costoPromedio: "El costo no puede ser negativo" };
      return;
    }
    if (
      unidadCompra === "paquete" &&
      (!contenidoPaquete || contenidoPaquete <= 0)
    ) {
      errores = { contenidoPaquete: "Falta cuanto trae el paquete" };
      return;
    }
    if (
      duracionDias !== null &&
      (!Number.isFinite(duracionDias) || duracionDias <= 0)
    ) {
      errores = { duracionDias: "La duración tiene que ser más de un día" };
      return;
    }

    // Editar desde Inventario no puede pisar lo que un artículo elaborado ya tiene:
    // su receta y su tipo son de otro formulario.
    const datos = {
      nombre,
      tipo: enEdicion?.tipo ?? ("materia_prima" as Articulo["tipo"]),
      esVendible,
      esElaborado: enEdicion?.esElaborado ?? false,
      unidad,
      unidadCompra,
      contenidoPaquete: unidadCompra === "paquete" ? contenidoPaquete : null,
      unidadContenido: unidadCompra === "paquete" ? unidadContenido : null,
      stock,
      costoPromedio,
      rendimientoCantidad: enEdicion?.rendimientoCantidad ?? null,
      rendimientoUnidad: enEdicion?.rendimientoUnidad ?? null,
      stockMinimo,
      proveedorId: null,
      fotoUrl: enEdicion?.fotoUrl ?? null,
      notas: enEdicion?.notas ?? null,
      duracionDias,
      receta: enEdicion?.receta ?? ([] as Articulo["receta"]),
      activo: true,
    };

    if (editandoId) {
      await actualizarArticulo(editandoId, datos);
    } else {
      await crearArticulo(datos);
    }
    cerrar();
  }

  async function eliminar(articulo: Articulo) {
    if (!confirm(`Quitar "${articulo.nombre}" del inventario?`)) return;
    await eliminarArticulo(articulo.id);
  }

  const money = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  });
</script>

<div class="space-y-5">
  <header class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
        Inventario
      </h1>
      <p class="mt-1 text-sm text-ink-500">
        Materias primas, su stock y a cuanto las compro.
      </p>
    </div>
    <Boton onclick={abrirNuevo}>
      <Plus size={18} />
      Insumo
    </Boton>
  </header>

  <p
    class="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/70 p-3.5 text-sm text-brand-800"
  >
    <Info size={17} class="mt-0.5 shrink-0 text-brand-500" />
    <span>
      <strong class="font-semibold">Modo demostración.</strong>
      Los datos quedan en la memoria del navegador y se pierden al recargar. Cuando
      activemos las cuentas se guardan en tu negocio de verdad.
    </span>
  </p>

  {#if enAlerta.length > 0}
    <div
      class="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
    >
      <Package size={17} class="mt-0.5 shrink-0" />
      <span>
        <strong class="font-semibold">Stock bajo:</strong>
        {enAlerta.map((a) => a.nombre).join(", ")}
      </span>
    </div>
  {/if}

  {#if !estado.cargando && totalArticulos > 0}
    <dl class="grid grid-cols-2 gap-3">
      <div class="tarjeta">
        <dt class="text-xs font-medium text-ink-500">Insumos</dt>
        <dd class="numeros mt-1 text-2xl font-semibold">{totalArticulos}</dd>
      </div>
      <div class="tarjeta">
        <dt class="text-xs font-medium text-ink-500">Valor del inventario</dt>
        <dd class="numeros mt-1 text-2xl font-semibold">
          {money.format(valorInventario)}
        </dd>
      </div>
    </dl>

    <label class="campo flex items-center gap-2">
      <Boxes size={18} class="shrink-0 text-ink-300" />
      <input
        class="w-full bg-transparent outline-none placeholder:text-ink-300"
        type="search"
        placeholder="Buscar insumo"
        bind:value={busqueda}
      />
    </label>
  {/if}

  {#if estado.cargando}
    <div class="space-y-3">
      {#each [1, 2, 3] as fila (fila)}
        <div class="tarjeta flex items-center gap-4">
          <div class="esqueleto h-11 w-11 rounded-xl"></div>
          <div class="flex-1 space-y-2">
            <div class="esqueleto h-3.5 w-1/3"></div>
            <div class="esqueleto h-3 w-1/2"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if visibles.length === 0}
    <EstadoVacio
      titulo={busqueda ? "Ningun insumo coincide" : "Tu inventario esta vacio"}
      descripcion={busqueda
        ? "Proba con otro nombre o limpia la busqueda."
        : "Carga el primer insumo con la cantidad que compraste, su unidad y lo que pagaste. A partir de ahi se puede costear cualquier receta."}
    >
      {#snippet icono()}
        <Package size={26} strokeWidth={1.6} />
      {/snippet}
      {#snippet accion()}
        {#if !busqueda}
          <Boton onclick={abrirNuevo}>
            <Plus size={18} />
            Cargar el primero
          </Boton>
        {/if}
      {/snippet}
    </EstadoVacio>
  {:else}
    <ul class="space-y-2.5">
      {#each visibles as articulo (articulo.id)}
        <li class="tarjeta flex items-center gap-3.5">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-600"
          >
            {articulo.nombre.slice(0, 2).toUpperCase()}
          </span>

          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-ink-800">
              {articulo.nombre}
            </p>
            <p class="numeros truncate text-xs text-ink-500">
              {articulo.stock}
              {articulo.unidad} en stock
              {#if articulo.stockMinimo !== null}
                · minimo {articulo.stockMinimo}
              {/if}
            </p>
            <p class="numeros truncate text-xs font-medium text-accent-700">
              {money.format(redondearMoneda(articulo.costoPromedio))} por
              {articulo.unidad}
            </p>
            {#if articulo.duracionDias !== null}
              <p class="truncate text-xs text-ink-400">
                Dura {articulo.duracionDias}
                {articulo.duracionDias === 1 ? "día" : "días"}
              </p>
            {/if}
            {#if articulo.esVendible}
              <p class="truncate text-xs text-brand-600">Se puede vender</p>
            {/if}
          </div>

          <div class="flex shrink-0 gap-1">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-brand-50 hover:text-brand-600"
              aria-label="Editar {articulo.nombre}"
              onclick={() => abrirEdicion(articulo)}
            >
              <Pencil size={17} />
            </button>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar {articulo.nombre}"
              onclick={() => eliminar(articulo)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  {#if abierto}
    <div
      class="fixed inset-0 z-40 flex items-end justify-center bg-ink-950/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onclick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div
        class="animate-subir safe-bottom max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-raised sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label={editandoId ? "Editar insumo" : "Nuevo insumo"}
      >
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-ink-900">
            {editandoId ? "Editar insumo" : "Nuevo insumo"}
          </h2>
          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-ink-100"
            aria-label="Cerrar"
            onclick={cerrar}
          >
            <X size={19} />
          </button>
        </header>

        <form class="space-y-4" onsubmit={guardar} novalidate>
          <Campo
            id="nombre"
            etiqueta="Nombre del insumo"
            valor={nombre}
            requerido
            placeholder="Ej: Harina"
            error={errores.nombre}
            oninput={(e) => {
              nombre = (e.currentTarget as HTMLInputElement).value;
            }}
          />

          <div class="grid grid-cols-2 gap-3">
            <Campo
              id="stock"
              etiqueta="Stock actual"
              tipo="number"
              min={0}
              paso="any"
              valor={stock ?? ""}
              requerido
              placeholder="Ej: 25"
              error={errores.stock}
              oninput={(e) => {
                const bruto = (e.currentTarget as HTMLInputElement).value;
                stock = bruto === "" ? null : Number(bruto);
              }}
            />

            <div>
              <label class="etiqueta" for="unidad">Unidad</label>
              <select class="campo" id="unidad" bind:value={unidad}>
                {#each Object.keys(UNIDADES) as codigo (codigo)}
                  <option value={codigo}>
                    {UNIDADES[codigo as CodigoUnidad].etiqueta}
                  </option>
                {/each}
              </select>
            </div>
          </div>

          <Campo
            id="costo"
            etiqueta="Costo por unidad"
            tipo="number"
            min={0}
            paso="any"
            valor={costoPromedio ?? ""}
            requerido
            placeholder="Ej: 48"
            descripcion="Lo que pagaste dividido por la cantidad comprada. El sistema lo calcula solo cuando cargues una compra."
            error={errores.costoPromedio}
            oninput={(e) => {
              const bruto = (e.currentTarget as HTMLInputElement).value;
              costoPromedio = bruto === "" ? null : Number(bruto);
            }}
          />

          <Campo
            id="stock-minimo"
            etiqueta="Avisarme cuando llegue a"
            tipo="number"
            min={0}
            paso="any"
            valor={stockMinimo ?? ""}
            placeholder="Ej: 2"
            descripcion="Opcional. A partir de este stock el sistema avisa."
            oninput={(e) => {
              const bruto = (e.currentTarget as HTMLInputElement).value;
              stockMinimo = bruto === "" ? null : Number(bruto);
            }}
          />

          <Campo
            id="duracion-dias-inv"
            etiqueta="Cuánto dura"
            tipo="number"
            min={1}
            paso="1"
            valor={duracionDias ?? ""}
            placeholder="Vacío = no vence"
            descripcion="Opcional. Cuántos días aguanta desde que entra: leche, carne. La harina no se echa a perder."
            error={errores.duracionDias}
            oninput={(e) => {
              const bruto = (e.currentTarget as HTMLInputElement).value;
              duracionDias = bruto === "" ? null : Number(bruto);
            }}
          />

          <label class="opcion-fila" class:opcion-activa={esVendible}>
            <input
              type="checkbox"
              checked={esVendible}
              onchange={(e) => {
                esVendible = (e.currentTarget as HTMLInputElement).checked;
              }}
            />
            <span>
              <strong>Esto también se vende</strong>
              <small>
                Para una carnicería, una verdulería o un almacén: comprás y
                revendés, sin receta.
              </small>
            </span>
          </label>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="etiqueta" for="unidad-compra"> Se compra en </label>
              <select
                class="campo"
                id="unidad-compra"
                bind:value={unidadCompra}
              >
                <option value={null}>Misma unidad</option>
                {#each Object.keys(UNIDADES) as codigo (codigo)}
                  <option value={codigo}>
                    {UNIDADES[codigo as CodigoUnidad].etiqueta}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label class="etiqueta" for="unidad-contenido">
                Unidad del contenido
              </label>
              <select
                class="campo"
                id="unidad-contenido"
                bind:value={unidadContenido}
              >
                {#each Object.keys(UNIDADES) as codigo (codigo)}
                  <option value={codigo}>
                    {UNIDADES[codigo as CodigoUnidad].etiqueta}
                  </option>
                {/each}
              </select>
            </div>
          </div>

          {#if unidadCompra === "paquete"}
            <Campo
              id="contenido"
              etiqueta="Trae por paquete"
              tipo="number"
              min={0}
              paso="any"
              valor={contenidoPaquete ?? ""}
              requerido
              placeholder="Ej: 500"
              error={errores.contenidoPaquete}
              oninput={(e) => {
                const bruto = (e.currentTarget as HTMLInputElement).value;
                contenidoPaquete = bruto === "" ? null : Number(bruto);
              }}
            />
          {/if}

          <div class="flex gap-3 pt-1">
            <Boton variante="secundario" class="flex-1" onclick={cerrar}>
              Cancelar
            </Boton>
            <Boton tipo="submit" class="flex-1">Guardar</Boton>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
