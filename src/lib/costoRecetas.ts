import type {
  Articulo,
  Catalogo,
  DetalleCosteo,
  Id,
  ItemReceta,
  MotivoError,
  NecesidadInsumo,
  ResultadoCosteo,
} from "./tipos";
import { convertirCantidad, tipoDeUnidad } from "./unidades";

export const PROFUNDIDAD_MAXIMA = 10;

interface EstadoCosteo {
  catalogo: Catalogo;
  cache: Map<Id, number>;
  enCurso: Set<Id>;
  errores: MotivoError[];
  ciclos: Set<Id>;
  excedioProfundidad: boolean;
}

function nuevoEstado(catalogo: Catalogo): EstadoCosteo {
  return {
    catalogo,
    cache: new Map(),
    enCurso: new Set(),
    errores: [],
    ciclos: new Set(),
    excedioProfundidad: false,
  };
}

/** Convierte una cantidad a la unidad en la que el articulo maneja su stock. */
export function aUnidadBase(
  cantidad: number,
  unidad: ItemReceta["unidad"],
  articulo: Articulo,
): number | null {
  if (cantidad === 0) return 0;
  if (unidad === articulo.unidad) return cantidad;

  if (articulo.unidad === "paquete") {
    const contenido = articulo.contenidoPaquete;
    const unidadContenido = articulo.unidadContenido;
    if (!contenido || contenido <= 0 || !unidadContenido) return null;
    const base = tipoDeUnidad(unidadContenido) === "peso" ? "g" : "ml";
    const contenidoEnBase = convertirCantidad(
      contenido,
      unidadContenido,
      base,
    );
    if (contenidoEnBase === null || contenidoEnBase <= 0) return null;
    return convertirCantidad(cantidad, unidad, base) !== null
      ? (convertirCantidad(cantidad, unidad, base) as number) / contenidoEnBase
      : null;
  }

  return convertirCantidad(cantidad, unidad, articulo.unidad);
}

/**
 * Costo por unidad base de un articulo, resolviendo recetas de recetas.
 * Un preparado descuenta el costo de sus insumos y divide por lo que rinde.
 */
export function costoUnitarioArticulo(
  articulo: Articulo,
  catalogo: Catalogo,
  estado?: EstadoCosteo,
): number {
  const ctx = estado ?? nuevoEstado(catalogo);
  const cacheado = ctx.cache.get(articulo.id);
  if (cacheado !== undefined) return cacheado;

  if (ctx.enCurso.has(articulo.id)) {
    ctx.ciclos.add(articulo.id);
    ctx.errores.push("ciclo-detectado");
    return 0;
  }

  ctx.enCurso.add(articulo.id);

  let resultado: number;

  if (!articulo.esElaborado || articulo.receta.length === 0) {
    resultado = Number.isFinite(articulo.costoPromedio)
      ? Math.max(articulo.costoPromedio, 0)
      : 0;
    if (!Number.isFinite(articulo.costoPromedio)) {
      ctx.errores.push("precio-invalido");
    }
  } else {
    const rendimiento = cantidadRendimiento(articulo);

    if (rendimiento === null || rendimiento <= 0) {
      ctx.errores.push("rendimiento-invalido");
      resultado = 0;
    } else {
      const costeo = costearRecetaConEstado(articulo.receta, ctx);
      const merma = 1 + (articulo.mermaPct || 0) / 100;
      resultado = (costeo.costoTotal / rendimiento) * merma;
    }
  }

  ctx.enCurso.delete(articulo.id);
  ctx.cache.set(articulo.id, resultado);
  return resultado;
}

/** Cuanto rinde una tanda, expresado en la unidad base del articulo. */
export function cantidadRendimiento(articulo: Articulo): number | null {
  if (!articulo.esElaborado) return null;
  const cantidad = articulo.rendimientoCantidad;
  const unidad = articulo.rendimientoUnidad;
  if (!cantidad || cantidad <= 0 || !unidad) return null;

  if (unidad === articulo.unidad) return cantidad;

  const base = tipoDeUnidad(articulo.unidad);
  const destino = base === "peso" ? "g" : base === "volumen" ? "ml" : "unidad";
  return convertirCantidad(cantidad, unidad, destino);
}

function detalleDe(
  item: ItemReceta,
  catalogo: Catalogo,
  ctx: EstadoCosteo,
): DetalleCosteo {
  const hijo = catalogo.get(item.articuloId);

  const base: DetalleCosteo = {
    articuloId: item.articuloId,
    nombre: hijo?.nombre ?? "Articulo eliminado",
    cantidadPedida: item.cantidad,
    unidadPedida: item.unidad,
    cantidadBase: null,
    costoUnitario: null,
    costo: 0,
    error: null,
  };

  if (!hijo) return { ...base, error: "articulo-inexistente" };
  if (!hijo.activo) return { ...base, error: "articulo-inactivo" };
  if (!Number.isFinite(item.cantidad) || item.cantidad < 0) {
    return { ...base, error: "cantidad-invalida" };
  }
  if (item.cantidad === 0) return base;

  const cantidadBase = aUnidadBase(item.cantidad, item.unidad, hijo);
  if (cantidadBase === null) {
    return { ...base, error: "unidad-incompatible" };
  }

  const costoUnitario = costoUnitarioArticulo(hijo, ctx.catalogo, ctx);

  return {
    ...base,
    cantidadBase,
    costoUnitario,
    costo: cantidadBase * costoUnitario,
  };
}

function costearRecetaConEstado(
  receta: ItemReceta[],
  ctx: EstadoCosteo,
): { costoTotal: number; detalles: DetalleCosteo[] } {
  const detalles: DetalleCosteo[] = [];
  let costoTotal = 0;

  for (const item of receta) {
    const detalle = detalleDe(item, ctx.catalogo, ctx);
    detalles.push(detalle);
    if (detalle.error) {
      ctx.errores.push(detalle.error);
      continue;
    }
    costoTotal += detalle.costo;
  }

  return { costoTotal, detalles };
}

/** Costea una receta suelta, sin saber de que articulo es. */
export function costearReceta(
  receta: ItemReceta[],
  catalogo: Catalogo,
): ResultadoCosteo {
  const ctx = nuevoEstado(catalogo);
  const { costoTotal, detalles } = costearRecetaConEstado(receta, ctx);
  const errores = [...new Set(ctx.errores)];

  return {
    articuloId: "",
    costoUnitario: costoTotal,
    costoValido: errores.length === 0,
    errores,
    detalles,
  };
}

/** Costo por unidad base de un articulo, con su detalle. */
export function costearArticulo(
  articulo: Articulo,
  catalogo: Catalogo,
): ResultadoCosteo {
  const ctx = nuevoEstado(catalogo);
  const costoUnitario = costoUnitarioArticulo(articulo, catalogo, ctx);

  const detalles: DetalleCosteo[] = [];
  if (articulo.esElaborado && articulo.receta.length > 0) {
    const ctxNuevo = nuevoEstado(catalogo);
    const costeo = costearRecetaConEstado(articulo.receta, ctxNuevo);
    detalles.push(...costeo.detalles);
  }

  const errores = [...new Set(ctx.errores)];

  return {
    articuloId: articulo.id,
    costoUnitario,
    costoValido: errores.length === 0,
    errores,
    detalles,
  };
}

/**
 * Que insumos de base hacen falta para producir una cantidad.
 * Es lo que permite saber que queda del inventario y que falta.
 */
export function needingInsumos(
  articulo: Articulo,
  cantidadDeseada: number,
  catalogo: Catalogo,
  acumulado?: Map<Id, number>,
  enCurso?: Set<Id>,
): Map<Id, number> {
  const acc = acumulado ?? new Map<Id, number>();
  const curso = enCurso ?? new Set<Id>();

  if (curso.has(articulo.id)) {
    curso.add(articulo.id);
    return acc;
  }

  if (!articulo.esElaborado || articulo.receta.length === 0) {
    acc.set(articulo.id, (acc.get(articulo.id) ?? 0) + cantidadDeseada);
    return acc;
  }

  curso.add(articulo.id);

  const rendimiento = cantidadRendimiento(articulo);
  if (rendimiento === null || rendimiento <= 0 || cantidadDeseada <= 0) {
    curso.delete(articulo.id);
    return acc;
  }

  const tandas = cantidadDeseada / rendimiento;
  const merma = 1 + (articulo.mermaPct || 0) / 100;

  for (const item of articulo.receta) {
    const hijo = catalogo.get(item.articuloId);
    if (!hijo || !hijo.activo) continue;

    const cantidad = item.cantidad * tandas * merma;
    const enBase = aUnidadBase(cantidad, item.unidad, hijo);
    if (enBase === null) continue;

    if (hijo.esElaborado && hijo.receta.length > 0) {
      needingInsumos(hijo, enBase, catalogo, acc, curso);
    } else {
      acc.set(hijo.id, (acc.get(hijo.id) ?? 0) + enBase);
    }
  }

  curso.delete(articulo.id);
  return acc;
}

/** Necesidades de una lista de articulos, con stock y faltante. */
export function revisarFaltantes(
  pedidos: { articulo: Articulo; cantidad: number }[],
  catalogo: Catalogo,
): NecesidadInsumo[] {
  const totales = new Map<Id, number>();

  for (const { articulo, cantidad } of pedidos) {
    needingInsumos(articulo, cantidad, catalogo, totales);
  }

  const resultado: NecesidadInsumo[] = [];

  for (const [articuloId, cantidad] of totales) {
    const articulo = catalogo.get(articuloId);
    if (!articulo) continue;
    const stock = articulo.stock;
    resultado.push({
      articuloId,
      nombre: articulo.nombre,
      unidad: articulo.unidad,
      cantidad,
      stock,
      faltante: Math.max(0, cantidad - stock),
    });
  }

  return resultado.sort((a, b) => b.faltante - a.faltante);
}

export function margenDesdePrecio(
  precio: number,
  costo: number,
): number | null {
  if (!Number.isFinite(precio) || !Number.isFinite(costo) || costo === 0) {
    return null;
  }
  return ((precio - costo) / costo) * 100;
}

export function precioDesdeMargen(
  costo: number,
  margenPorcentaje: number,
): number {
  if (!Number.isFinite(costo) || !Number.isFinite(margenPorcentaje)) {
    return Number.NaN;
  }
  return costo * (1 + margenPorcentaje / 100);
}

export function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
