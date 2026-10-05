<script lang="ts">
  import { Boxes, Plus, Pencil, Trash2, Info, X, Package } from "lucide-svelte";
  import Boton from "../components/Boton.svelte";
  import Campo from "../components/Campo.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import {
    crearRepositorioMemoria,
    validarInsumo,
    type DatosInsumo,
    type RepositorioInventario,
  } from "../lib/datos/inventario";
  import { precioPorUnidadBase, redondearMoneda } from "../lib/costing";
  import { UNIDADES, UNIDADES_POR_TIPO } from "../lib/unidades";
  import type { CodigoUnidad, Insumo } from "../lib/tipos";

  const repositorio: RepositorioInventario = crearRepositorioMemoria();

  let insumos = $state<Insumo[]>([]);
  let cargando = $state(true);
  let guardando = $state(false);
  let busqueda = $state("");
  let errores = $state<Record<string, string>>({});

  let abierto = $state(false);
  let editandoId = $state<string | null>(null);

  let nombre = $state("");
  let unidad = $state<CodigoUnidad>("kg");
  let cantidadComprada = $state<number | null>(null);
  let precioLote = $state<number | null>(null);
  let contenidoPaquete = $state<number | null>(null);
  let unidadContenido = $state<CodigoUnidad>("g");

  const opcionesUnidad = $derived(
    Object.keys(UNIDADES) as CodigoUnidad[],
  );

  const visibles = $derived(
    insumos.filter((i) =>
      i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
    ),
  );

  const valorInventario = $derived(
    redondearMoneda(insumos.reduce((suma, i) => suma + i.precioLote, 0)),
  );

  $effect(() => {
    void cargar();
  });

  async function cargar() {
    cargando = true;
    try {
      insumos = await repositorio.listar();
    } finally {
      cargando = false;
    }
  }

  function abrirNuevo() {
    editandoId = null;
    nombre = "";
    unidad = "kg";
    cantidadComprada = null;
    precioLote = null;
    contenidoPaquete = null;
    unidadContenido = "g";
    errores = {};
    abierto = true;
  }

  function abrirEdicion(insumo: Insumo) {
    editandoId = insumo.id;
    nombre = insumo.nombre;
    unidad = insumo.unidad;
    cantidadComprada = insumo.cantidadComprada;
    precioLote = insumo.precioLote;
    contenidoPaquete = insumo.contenidoPaquete ?? null;
    unidadContenido = insumo.unidadContenido ?? "g";
    errores = {};
    abierto = true;
  }

  function cerrar() {
    abierto = false;
    errores = {};
  }

  async function guardar(evento: SubmitEvent) {
    evento.preventDefault();

    const datos: DatosInsumo = {
      nombre,
      unidad,
      cantidadComprada: cantidadComprada ?? Number.NaN,
      precioLote: precioLote ?? Number.NaN,
      contenidoPaquete: unidad === "paquete" ? contenidoPaquete : null,
      unidadContenido: unidad === "paquete" ? unidadContenido : null,
    };

    const encontrados = validarInsumo(datos);
    errores = encontrados;
    if (Object.keys(encontrados).length > 0) return;

    guardando = true;
    try {
      if (editandoId) {
        await repositorio.actualizar(editandoId, datos);
      } else {
        await repositorio.crear(datos);
      }
      await cargar();
      cerrar();
    } finally {
      guardando = false;
    }
  }

  async function eliminar(insumo: Insumo) {
    if (!confirm(`Quitar "${insumo.nombre}" del inventario?`)) return;
    await repositorio.eliminar(insumo.id);
    await cargar();
  }

  const money = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  });

  function precioUnitario(insumo: Insumo): string {
    const valor = precioPorUnidadBase(insumo);
    if (valor === null) return "sin costo";
    return `${money.format(redondearMoneda(valor))} / ${insumo.unidadContenido ?? insumo.unidad}`;
  }
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
      Todavia no hay inicio de sesion, asi que los datos quedan en la
      memoria del navegador y se pierden al recargar. Al activar las cuentas
      se guardan en tu negocio de verdad.
    </span>
  </p>

  {#if !cargando && insumos.length > 0}
    <dl class="grid grid-cols-2 gap-3">
      <div class="tarjeta">
        <dt class="text-xs font-medium text-ink-500">Insumos</dt>
        <dd class="numeros mt-1 text-2xl font-semibold">{insumos.length}</dd>
      </div>
      <div class="tarjeta">
        <dt class="text-xs font-medium text-ink-500">Valor del ultimo lote</dt>
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

  {#if cargando}
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
      {#each visibles as insumo (insumo.id)}
        <li class="tarjeta flex items-center gap-3.5">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-600"
          >
            {insumo.nombre.slice(0, 2).toUpperCase()}
          </span>

          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-ink-800">{insumo.nombre}</p>
            <p class="numeros truncate text-xs text-ink-500">
              {insumo.cantidadComprada}
              {insumo.unidad} por {money.format(insumo.precioLote)}
            </p>
            <p class="numeros truncate text-xs font-medium text-accent-700">
              {precioUnitario(insumo)}
            </p>
          </div>

          <div class="flex shrink-0 gap-1">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-brand-50 hover:text-brand-600"
              aria-label="Editar {insumo.nombre}"
              onclick={() => abrirEdicion(insumo)}
            >
              <Pencil size={17} />
            </button>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar {insumo.nombre}"
              onclick={() => eliminar(insumo)}
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
      class="fixed inset-0 z-40 flex items-end justify-center bg-ink-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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

          <Campo
            id="cantidad"
            etiqueta="Cuanto compraste"
            tipo="number"
            min={0}
            paso="any"
            valor={cantidadComprada ?? ""}
            requerido
            placeholder="Ej: 25"
            descripcion="La cantidad total de la compra, no la que usas en cada receta."
            error={errores.cantidadComprada}
            oninput={(e) => {
              const bruto = (e.currentTarget as HTMLInputElement).value;
              cantidadComprada = bruto === "" ? null : Number(bruto);
            }}
          />

          <div>
            <label class="etiqueta" for="unidad">Unidad</label>
            <select
              class="campo"
              id="unidad"
              bind:value={unidad}
              onchange={(e) => {
                unidad = (e.currentTarget as HTMLSelectElement)
                  .value as CodigoUnidad;
                const tipo = unidad === "paquete"
                  ? "unidad"
                  : UNIDADES_POR_TIPO[
                      UNIDADES[unidad].tipo
                    ];
                const opciones = tipo as CodigoUnidad[];
                unidadContenido = opciones[0] ?? "g";
              }}
            >
              {#each opcionesUnidad as codigo (codigo)}
                <option value={codigo}>{UNIDADES[codigo].etiqueta}</option>
              {/each}
            </select>
          </div>

          {#if unidad === "paquete"}
            <div class="grid grid-cols-2 gap-3 rounded-2xl bg-ink-50 p-3.5">
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

              <div>
                <label class="etiqueta" for="unidad-contenido">
                  Unidad del contenido
                </label>
                <select
                  class="campo"
                  id="unidad-contenido"
                  bind:value={unidadContenido}
                >
                  {#each opcionesUnidad as codigo (codigo)}
                    <option value={codigo}>
                      {UNIDADES[codigo].etiqueta}
                    </option>
                  {/each}
                </select>
              </div>
            </div>
          {/if}

          <Campo
            id="precio"
            etiqueta="Cuanto pagaste por el lote"
            tipo="number"
            min={0}
            paso="any"
            valor={precioLote ?? ""}
            requerido
            placeholder="Ej: 1200"
            descripcion="El total de la compra, no el precio por unidad."
            error={errores.precioLote}
            oninput={(e) => {
              const bruto = (e.currentTarget as HTMLInputElement).value;
              precioLote = bruto === "" ? null : Number(bruto);
            }}
          />

          <div class="flex gap-3 pt-1">
            <Boton variante="secundario" class="flex-1" onclick={cerrar}>
              Cancelar
            </Boton>
            <Boton tipo="submit" deshabilitado={guardando} class="flex-1">
              {guardando ? "Guardando..." : "Guardar"}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
