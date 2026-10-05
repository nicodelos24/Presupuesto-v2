import type {
  DetalleCosteo,
  Id,
  Insumo,
  ItemReceta,
  MotivoError,
  Producto,
  ResultadoCosteo,
} from "./tipos";
import { convertirCantidad, tipoDeUnidad } from "./unidades";

export type UnidadBase = "g" | "ml" | "unidad";

export function unidadBaseDe(insumo: Insumo): UnidadBase {
  const referencia =
    insumo.unidad === "paquete" ? insumo.unidadContenido : insumo.unidad;
  if (!referencia) return "unidad";
  const tipo = tipoDeUnidad(referencia);
  if (tipo === "peso") return "g";
  if (tipo === "volumen") return "ml";
  return "unidad";
}

function precioDelLote(insumo: Insumo): number | null {
  const precio = insumo.costoActual ?? insumo.precioLote;
  if (!Number.isFinite(precio) || precio < 0) return null;
  return precio;
}

function contenidoTotalEnBase(insumo: Insumo): number | null {
  const base = unidadBaseDe(insumo);
  if (insumo.unidad === "paquete") {
    const contenido = insumo.contenidoPaquete;
    const unidadContenido = insumo.unidadContenido;
    if (!contenido || contenido <= 0 || !unidadContenido) return null;
    return convertirCantidad(
      contenido * insumo.cantidadComprada,
      unidadContenido,
      base,
    );
  }
  if (
    !Number.isFinite(insumo.cantidadComprada) ||
    insumo.cantidadComprada <= 0
  ) {
    return null;
  }
  return convertirCantidad(insumo.cantidadComprada, insumo.unidad, base);
}

export function precioPorUnidadBase(insumo: Insumo): number | null {
  const precio = precioDelLote(insumo);
  const total = contenidoTotalEnBase(insumo);
  if (precio === null || total === null || total <= 0) return null;
  return precio / total;
}

export function precioUnitarioBase(insumo: Insumo): number | null {
  if (
    !Number.isFinite(insumo.cantidadComprada) ||
    insumo.cantidadComprada <= 0
  ) {
    return null;
  }
  const precio = precioDelLote(insumo);
  if (precio === null) return null;
  return precio / insumo.cantidadComprada;
}

function costoDeItem(
  item: ItemReceta,
  insumo: Insumo | undefined,
): DetalleCosteo {
  const base: DetalleCosteo = {
    insumoId: item.insumoId,
    nombre: insumo?.nombre ?? "Insumo eliminado",
    cantidadPedida: item.cantidad,
    unidadPedida: item.unidad,
    cantidadBase: null,
    unidadBase: null,
    costo: 0,
    error: null,
  };

  if (!insumo) return { ...base, error: "insumo-inexistente" };
  if (insumo.activo === false) return { ...base, error: "insumo-inactivo" };
  if (!Number.isFinite(item.cantidad) || item.cantidad < 0) {
    return { ...base, error: "cantidad-invalida" };
  }
  if (item.cantidad === 0) return base;

  const precio = precioDelLote(insumo);
  if (precio === null) return { ...base, error: "precio-invalido" };

  const unidadBase = unidadBaseDe(insumo);

  if (insumo.unidad === "paquete") {
    const contenido = insumo.contenidoPaquete;
    const unidadContenido = insumo.unidadContenido;
    if (!contenido || contenido <= 0 || !unidadContenido) {
      return { ...base, error: "paquete-requiere-contenido" };
    }

    const contenidoEnBase = convertirCantidad(
      contenido,
      unidadContenido,
      unidadBase,
    );
    if (contenidoEnBase === null || contenidoEnBase <= 0) {
      return { ...base, error: "unidad-incompatible" };
    }

    const precioPorBase =
      precio / (contenidoEnBase * insumo.cantidadComprada);

    const cantidadEnBase =
      item.unidad === "paquete"
        ? item.cantidad * contenidoEnBase
        : convertirCantidad(item.cantidad, item.unidad, unidadBase);

    if (cantidadEnBase === null) {
      return { ...base, error: "unidad-incompatible" };
    }

    return {
      ...base,
      cantidadBase: cantidadEnBase,
      unidadBase,
      costo: cantidadEnBase * precioPorBase,
    };
  }

  if (item.unidad === "paquete") {
    return { ...base, error: "paquete-sobre-ingrediente-simple" };
  }

  if (
    !Number.isFinite(insumo.cantidadComprada) ||
    insumo.cantidadComprada <= 0
  ) {
    return { ...base, error: "precio-invalido" };
  }

  const cantidadEnBase = convertirCantidad(
    item.cantidad,
    item.unidad,
    insumo.unidad,
  );
  if (cantidadEnBase === null) {
    return { ...base, error: "unidad-incompatible" };
  }

  return {
    ...base,
    cantidadBase: cantidadEnBase,
    unidadBase: insumo.unidad,
    costo: (precio / insumo.cantidadComprada) * cantidadEnBase,
  };
}

export function costearReceta(
  receta: ItemReceta[],
  inventario: Map<Id, Insumo>,
): ResultadoCosteo {
  const detalles: DetalleCosteo[] = [];
  const errores: MotivoError[] = [];
  let costoTotal = 0;

  for (const item of receta) {
    const detalle = costoDeItem(item, inventario.get(item.insumoId));
    detalles.push(detalle);
    if (detalle.error) {
      errores.push(detalle.error);
      continue;
    }
    costoTotal += detalle.costo;
  }

  return {
    costoTotal,
    costoValido: errores.length === 0,
    detalles,
    errores,
  };
}

export function costoDeProducto(
  producto: Producto,
  inventario: Map<Id, Insumo>,
): ResultadoCosteo {
  const costeo = costearReceta(producto.receta, inventario);
  const manual = producto.costoManual;

  if (manual === null || manual === undefined) return costeo;

  return { ...costeo, costoTotal: manual };
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

export function margenDesdePrecio(
  precio: number,
  costo: number,
): number | null {
  if (!Number.isFinite(precio) || !Number.isFinite(costo) || costo === 0) {
    return null;
  }
  return ((precio - costo) / costo) * 100;
}

export function ganancia(precio: number, costo: number): number {
  return precio - costo;
}

export function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
