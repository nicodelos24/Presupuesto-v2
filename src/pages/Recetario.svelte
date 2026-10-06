<script lang="ts">
  import {
    Plus,
    ChefHat,
    PackageSearch,
    Trash2,
    Pencil,
    X,
    Info,
    AlertTriangle,
  } from "lucide-svelte";
  import Boton from "../components/Boton.svelte";
  import Campo from "../components/Campo.svelte";
  import EstadoVacio from "../components/EstadoVacio.svelte";
  import { validarArticulo, type DatosArticulo } from "../lib/datos/articulos";
  import {
    actualizarArticulo,
    articulos,
    estado,
    cargarArticulos,
    crearArticulo,
    eliminarArticulo,
  } from "../lib/estado.svelte";
  import {
    costearArticulo,
    margenDesdePrecio,
    precioDesdeMargen,
    redondearMoneda,
  } from "../lib/costoRecetas";
  import { UNIDADES } from "../lib/unidades";
  import type {
    Articulo,
    Catalogo,
    CodigoUnidad,
    ItemReceta,
  } from "../lib/tipos";

  let abierto = $state(false);
  let editandoId = $state<string | null>(null);
  let errores = $state<Record<string, string>>({});

  let nombre = $state("");
  let esVendible = $state(true);

  let duracionDias = $state<number | null>(null);
  let unidad = $state<CodigoUnidad>("unidad");
  let rendimientoCantidad = $state<number | null>(1);
  let rendimientoUnidad = $state<CodigoUnidad>("unidad");
  let mermaPct = $state(0);
  let precioVenta = $state<number | null>(null);
  let margenObjetivo = $state(60);
  let receta = $state<ItemReceta[]>([]);

  let articuloRecetaId = $state("");
  let cantidadReceta = $state<number | null>(null);
  let unidadReceta = $state<CodigoUnidad>("g");

  const catalogo = $derived<Catalogo>(new Map(articulos.map((a) => [a.id, a])));

  const enEdicion = $derived(
    editandoId ? articulos.find((a) => a.id === editandoId) : undefined,
  );

  const borrador = $derived<Articulo>({
    id: editandoId ?? "borrador",
    nombre,
    tipo: "producto",
    esVendible,
    esElaborado: true,
    unidad,
    unidadCompra: null,
    contenidoPaquete: null,
    unidadContenido: null,
    stock: enEdicion?.stock ?? 0,
    costoPromedio: enEdicion?.costoPromedio ?? 0,
    rendimientoCantidad,
    rendimientoUnidad,
    mermaPct,
    stockMinimo: null,
    proveedorId: null,
    fotoUrl: null,
    notas: null,
    duracionDias,
    receta,
    activo: true,
  });

  const costeoBorrador = $derived(costearArticulo(borrador, catalogo));

  const costoUnitarioCalculado = $derived(costeoBorrador?.costoUnitario ?? 0);

  const precioCalculado = $derived(
    precioVenta !== null && precioVenta > 0
      ? precioVenta
      : precioDesdeMargen(costoUnitarioCalculado, margenObjetivo),
  );

  const margenCalculado = $derived(
    margenDesdePrecio(precioCalculado, costoUnitarioCalculado),
  );

  // El recetario es el catalogo de venta: solo lo que se sabe hacer.
  // Lo que se compra y se revende sin receta vive en Inventario.
  const articulosConCosto = $derived(
    articulos
      .filter((a) => a.activo && a.esElaborado)
      .map((a) => ({ articulo: a, costo: costearArticulo(a, catalogo) })),
  );

  // Para armar una receta sirve cualquier artículo activo: tanto una materia prima
  // como un preparado. Si solo se ofrecieran las materias primas, una tortilla no
  // podria ser ingrediente de un plato, que es justamente lo que el motor resuelve.
  const opcionesParaReceta = $derived(
    articulos.filter((a) => a.activo && a.id !== editandoId),
  );

  // Lo que esta en el recetario se vende por definicion. La unica excepcion es
  // un intermedio que solo se usa dentro de otras recetas, como una salsa de la
  // casa que nunca se ofrece sola. Por eso la pregunta no va como una casilla
  // normal, sino al reves: se destapa cuando aplica.
  const soloParaRecetas = $derived(!esVendible);

  const preparedCount = $derived(
    opcionesParaReceta.filter((o) => o.esElaborado).length,
  );

  const insumosCount = $derived(
    opcionesParaReceta.filter((o) => !o.esElaborado).length,
  );

  $effect(() => {
    void cargarArticulos();
  });

  function abrirNuevo() {
    editandoId = null;
    nombre = "";
    esVendible = true;

    duracionDias = null;
    unidad = "unidad";
    rendimientoCantidad = 1;
    rendimientoUnidad = "unidad";
    mermaPct = 0;
    precioVenta = null;
    margenObjetivo = 60;
    receta = [];
    errores = {};
    abierto = true;
  }

  function abrirEdicion(articulo: Articulo) {
    editandoId = articulo.id;
    nombre = articulo.nombre;
    esVendible = articulo.esVendible;

    duracionDias = articulo.duracionDias;
    unidad = articulo.unidad;
    rendimientoCantidad = articulo.rendimientoCantidad;
    rendimientoUnidad = articulo.rendimientoUnidad ?? "unidad";
    mermaPct = articulo.mermaPct;
    precioVenta = null;
    receta = [...articulo.receta];
    errores = {};
    abierto = true;
  }

  function cerrar() {
    abierto = false;
    errores = {};
  }

  function agregarItemReceta() {
    if (!articuloRecetaId || !cantidadReceta || cantidadReceta <= 0) return;
    if (articuloRecetaId === editandoId) return;

    const cantidad = cantidadReceta;
    const yaEsta = receta.some((i) => i.articuloId === articuloRecetaId);
    if (yaEsta) {
      receta = receta.map((i) =>
        i.articuloId === articuloRecetaId ? { ...i, cantidad } : i,
      );
    } else {
      receta = [
        ...receta,
        { articuloId: articuloRecetaId, cantidad, unidad: unidadReceta },
      ];
    }
    articuloRecetaId = "";
    cantidadReceta = null;
  }

  function quitarItemReceta(articuloId: string) {
    receta = receta.filter((i) => i.articuloId !== articuloId);
  }

  function cambiarCantidadItem(articuloId: string, cantidad: number) {
    receta = receta.map((i) =>
      i.articuloId === articuloId ? { ...i, cantidad } : i,
    );
  }

  async function guardar(evento: SubmitEvent) {
    evento.preventDefault();

    const datos: DatosArticulo = {
      nombre,
      // Todo lo que se crea aca se elabora y se vende. Lo que se compra y se
      // revende sin receta se da de alta en Inventario.
      tipo: "producto",
      esVendible,
      esElaborado: true,
      unidad,
      unidadCompra: null,
      contenidoPaquete: null,
      unidadContenido: null,
      stock: enEdicion?.stock ?? 0,
      costoPromedio: enEdicion?.costoPromedio ?? 0,
      rendimientoCantidad,
      rendimientoUnidad,
      mermaPct,
      stockMinimo: null,
      proveedorId: null,
      fotoUrl: enEdicion?.fotoUrl ?? null,
      notas: null,
      duracionDias,
      receta,
    };

    const encontrados = validarArticulo(datos);
    errores = encontrados;
    if (Object.keys(encontrados).length > 0) return;

    if (editandoId) {
      await actualizarArticulo(editandoId, datos);
    } else {
      await crearArticulo(datos);
    }
    cerrar();
  }

  async function eliminar(articulo: Articulo) {
    if (!confirm(`Quitar "${articulo.nombre}"?`)) return;
    await eliminarArticulo(articulo.id);
  }

  const money = new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
  });

  function nombreDe(id: string): string {
    return articulos.find((a) => a.id === id)?.nombre ?? "eliminado";
  }
</script>

<div class="space-y-5">
  <header class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
        Recetario
      </h1>
      <p class="mt-1 text-sm text-ink-500">
        Que te cuesta cada cosa y a cuanto lo vendes.
      </p>
    </div>
    <Boton onclick={abrirNuevo}>
      <Plus size={18} />
      Producto
    </Boton>
  </header>

  <p
    class="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/70 p-3.5 text-sm text-brand-800"
  >
    <Info size={17} class="mt-0.5 shrink-0 text-brand-500" />
    <span>
      Los datos quedan en memoria hasta que activemos las cuentas. El precio de
      los productos se esta agregando al recetario, todavia no hay pantalla de
      ventas.
    </span>
  </p>

  {#if estado.cargando}
    <div class="space-y-3">
      {#each [1, 2] as fila (fila)}
        <div class="tarjeta flex items-center gap-4">
          <div class="esqueleto h-12 w-12 rounded-xl"></div>
          <div class="flex-1 space-y-2">
            <div class="esqueleto h-3.5 w-1/2"></div>
            <div class="esqueleto h-3 w-1/3"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if articulosConCosto.length === 0}
    <EstadoVacio
      titulo="No hay productos en el recetario"
      descripcion="Carga el primero con su receta de ingredientes. El costo se calcula solo mientras agregas los ingredientes."
    >
      {#snippet icono()}
        <ChefHat size={26} strokeWidth={1.6} />
      {/snippet}
      {#snippet accion()}
        <Boton onclick={abrirNuevo}>
          <Plus size={18} />
          Crear el primero
        </Boton>
      {/snippet}
    </EstadoVacio>
  {:else}
    <ul class="space-y-2.5">
      {#each articulosConCosto as fila (fila.articulo.id)}
        <li class="tarjeta flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-500"
          >
            {#if fila.articulo.fotoUrl}
              <img
                src={fila.articulo.fotoUrl}
                alt={fila.articulo.nombre}
                class="h-full w-full object-cover"
              />
            {:else}
              <ChefHat size={20} />
            {/if}
          </span>

          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-ink-800">
              {fila.articulo.nombre}
            </p>
            <p class="numeros truncate text-xs text-ink-500">
              Costo {money.format(redondearMoneda(fila.costo.costoUnitario))}
              {#if fila.costo.detalles.length > 0}
                · {fila.costo.detalles.length} ingredientes
              {/if}
            </p>
            {#if fila.costo.errores.length > 0}
              <p class="truncate text-xs font-medium text-amber-600">
                Revisar receta
              </p>
            {/if}
          </div>

          <div class="flex shrink-0 gap-1">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-brand-50 hover:text-brand-600"
              aria-label="Editar {fila.articulo.nombre}"
              onclick={() => abrirEdicion(fila.articulo)}
            >
              <Pencil size={17} />
            </button>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar {fila.articulo.nombre}"
              onclick={() => eliminar(fila.articulo)}
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
        aria-label={editandoId ? "Editar producto" : "Nuevo producto"}
      >
        <header class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-ink-900">
            {editandoId ? "Editar producto" : "Nuevo producto"}
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
            id="nombre-producto"
            etiqueta="Nombre del producto"
            valor={nombre}
            requerido
            placeholder="Ej: Torta de chocolate"
            error={errores.nombre}
            oninput={(e) => {
              nombre = (e.currentTarget as HTMLInputElement).value;
            }}
          />

          <p class="text-sm text-ink-500">
            Acá van las cosas que elaborás vos: las que tienen receta. Para
            registrar una materia prima o algo que comprás y revendés, andá a
            Inventario.
          </p>
          <label class="opcion-fila" class:opcion-activa={soloParaRecetas}>
            <input
              type="checkbox"
              checked={soloParaRecetas}
              onchange={(e) => {
                esVendible = !(e.currentTarget as HTMLInputElement).checked;
              }}
            />
            <span>
              <strong>Solo para usar en otras recetas</strong>
              <small>
                Esto se vende: es parte del recetario. Destapalo solo si es un
                intermedio que nunca se ofrece, como una salsa de la casa.
              </small>
            </span>
          </label>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="etiqueta" for="unidad-producto">
                Unidad de venta
              </label>
              <select class="campo" id="unidad-producto" bind:value={unidad}>
                {#each Object.keys(UNIDADES) as codigo (codigo)}
                  <option value={codigo}
                    >{UNIDADES[codigo as CodigoUnidad].etiqueta}</option
                  >
                {/each}
              </select>
            </div>

            <Campo
              id="duracion-dias"
              etiqueta="Dura (días)"
              tipo="number"
              min={1}
              paso="1"
              valor={duracionDias ?? ""}
              placeholder="Vacío = no vence"
              descripcion="Cuánto aguanta una unidad. Vacío si no se echa a perder."
              error={errores.duracionDias}
              oninput={(e) => {
                const bruto = (e.currentTarget as HTMLInputElement).value;
                duracionDias = bruto === "" ? null : Number(bruto);
              }}
            />
          </div>

          <div class="grid grid-cols-2 gap-3 rounded-2xl bg-ink-50 p-3.5">
            <Campo
              id="rendimiento"
              etiqueta="De esta receta salen"
              tipo="number"
              min={1}
              paso="any"
              valor={rendimientoCantidad ?? ""}
              requerido
              placeholder="Ej: 6"
              descripcion="Cuántas vendés de cada tanda. Si hacés una torta y la cortás en 8 porciones, poné 8: el costo y el stock se cuentan por porción."
              error={errores.rendimiento}
              oninput={(e) => {
                const bruto = (e.currentTarget as HTMLInputElement).value;
                rendimientoCantidad = bruto === "" ? null : Number(bruto);
              }}
            />

            <div>
              <label class="etiqueta" for="rendimiento-unidad">
                Se venden como
              </label>
              <select
                class="campo"
                id="rendimiento-unidad"
                bind:value={rendimientoUnidad}
              >
                {#each Object.keys(UNIDADES) as codigo (codigo)}
                  <option value={codigo}>
                    {UNIDADES[codigo as CodigoUnidad].etiqueta}
                  </option>
                {/each}
              </select>
            </div>
          </div>

          <p class="-mt-1 text-xs leading-relaxed text-ink-400">
            Este número va en <strong>lo que vendés</strong>, no en el
            intermedio. Una tanda de tortilla que salen 6 tortillas va 6. Una
            torta que se corta en 8 porciones también va 8.
          </p>

          <div>
            <label class="etiqueta" for="merma">
              Costo extra del proceso (%)
            </label>
            <input
              class="campo"
              id="merma"
              type="number"
              min={0}
              max={99}
              step="any"
              bind:value={mermaPct}
            />
            <p class="mt-1 text-sm text-ink-400">
              Aceite, especias, lo que se rompe. La perdida de masa va en el
              rendimiento, no aca.
            </p>
          </div>

          <div class="space-y-2.5">
            <p class="etiqueta mb-0">Ingredientes de la receta</p>

            {#if receta.length === 0}
              <p
                class="flex items-center gap-2 rounded-xl border border-dashed border-ink-200 px-3 py-3 text-sm text-ink-400"
              >
                <PackageSearch size={16} />
                Agrega el primer ingrediente
              </p>
            {:else}
              <ul class="space-y-2">
                {#each receta as item (item.articuloId)}
                  <li class="flex items-center gap-2 rounded-xl bg-ink-50 p-2">
                    <span class="min-w-0 flex-1 truncate text-sm">
                      {nombreDe(item.articuloId)}
                    </span>
                    <input
                      class="campo numeros !min-h-9 w-20 px-2 text-right text-sm"
                      type="number"
                      min={0}
                      step="any"
                      value={item.cantidad}
                      aria-label="Cantidad de {nombreDe(item.articuloId)}"
                      oninput={(e) =>
                        cambiarCantidadItem(
                          item.articuloId,
                          Number((e.currentTarget as HTMLInputElement).value),
                        )}
                    />
                    <select
                      class="campo !min-h-9 w-24 px-2 text-sm"
                      bind:value={item.unidad}
                      aria-label="Unidad de {nombreDe(item.articuloId)}"
                    >
                      {#each Object.keys(UNIDADES) as codigo (codigo)}
                        <option value={codigo}>
                          {UNIDADES[codigo as CodigoUnidad].etiqueta}
                        </option>
                      {/each}
                    </select>
                    <button
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Quitar {nombreDe(item.articuloId)}"
                      onclick={() => quitarItemReceta(item.articuloId)}
                    >
                      <X size={15} />
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}

            {#if errores.receta}
              <p class="error-campo">{errores.receta}</p>
            {/if}

            <div class="flex items-end gap-2">
              <div class="min-w-0 flex-1">
                <label class="etiqueta" for="agregar-ingrediente">
                  Agregar insumo
                </label>
                <select
                  class="campo"
                  id="agregar-ingrediente"
                  bind:value={articuloRecetaId}
                >
                  <option value="">Elegir insumo o preparado...</option>
                  {#if preparedCount > 0}
                    <optgroup label="Preparados">
                      {#each opcionesParaReceta.filter((o) => o.esElaborado) as preparado (preparado.id)}
                        <option value={preparado.id}>{preparado.nombre}</option>
                      {/each}
                    </optgroup>
                  {/if}
                  {#if insumosCount > 0}
                    <optgroup label="Insumos">
                      {#each opcionesParaReceta.filter((o) => !o.esElaborado) as insumo (insumo.id)}
                        <option value={insumo.id}>{insumo.nombre}</option>
                      {/each}
                    </optgroup>
                  {/if}
                </select>
              </div>
              <input
                class="campo numeros w-20 px-2 text-right"
                type="number"
                min={0}
                step="any"
                placeholder="Cant."
                aria-label="Cantidad"
                bind:value={cantidadReceta}
              />
              <select
                class="campo w-24 px-2"
                aria-label="Unidad"
                bind:value={unidadReceta}
              >
                {#each Object.keys(UNIDADES) as codigo (codigo)}
                  <option value={codigo}>
                    {UNIDADES[codigo as CodigoUnidad].etiqueta}
                  </option>
                {/each}
              </select>
              <button
                type="button"
                class="boton-secundario !px-3"
                onclick={agregarItemReceta}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {#if costeoBorrador?.costoValido && costoUnitarioCalculado > 0}
            <div
              class="flex items-center justify-between rounded-2xl bg-acento-gradiente px-4 py-3 text-white"
            >
              <span class="text-sm font-medium">Costo por unidad</span>
              <span class="numeros text-lg font-semibold">
                {money.format(redondearMoneda(costoUnitarioCalculado))}
              </span>
            </div>
          {:else if costeoBorrador && !costeoBorrador.costoValido && costeoBorrador.errores.length > 0}
            <p
              class="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
            >
              <AlertTriangle size={16} class="mt-0.5 shrink-0" />
              Revisá la receta: {costeoBorrador.errores.length === 1
                ? "falta un dato"
                : "faltan datos"}
            </p>
          {/if}

          <div class="grid grid-cols-2 gap-3">
            <Campo
              id="precio-venta"
              etiqueta="Precio de venta"
              tipo="number"
              min={0}
              paso="any"
              valor={precioVenta ?? ""}
              placeholder={redondearMoneda(
                precioDesdeMargen(costoUnitarioCalculado, margenObjetivo),
              ).toString()}
              descripcion="Opcional: se calcula con el margen."
              oninput={(e) => {
                const bruto = (e.currentTarget as HTMLInputElement).value;
                precioVenta = bruto === "" ? null : Number(bruto);
              }}
            />

            <Campo
              id="margen"
              etiqueta="Margen deseado (%)"
              tipo="number"
              min={0}
              paso="any"
              valor={margenObjetivo}
              oninput={(e) => {
                margenObjetivo = Number(
                  (e.currentTarget as HTMLInputElement).value,
                );
              }}
            />
          </div>

          {#if costoUnitarioCalculado > 0}
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-500">Precio a calcular</span>
              <span class="numeros font-semibold">
                {money.format(redondearMoneda(precioCalculado))}
                {#if precioVenta === null && margenCalculado !== null}
                  <span class="ml-1 font-normal text-ink-400">
                    ({margenCalculado.toFixed(0)}%)
                  </span>
                {/if}
              </span>
            </div>
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
