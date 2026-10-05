export type CodigoUnidad =
  | "g"
  | "kg"
  | "ml"
  | "cl"
  | "l"
  | "unidad"
  | "paquete";

export type TipoUnidad = "peso" | "volumen" | "unidad";

export type TipoArticulo = "materia_prima" | "preparado" | "producto";

export type Id = string;

export interface ItemReceta {
  articuloId: Id;
  cantidad: number;
  unidad: CodigoUnidad;
}

export interface Articulo {
  id: Id;
  nombre: string;
  tipo: TipoArticulo;
  esVendible: boolean;
  esElaborado: boolean;

  /** Unidad en la que se maneja el stock y el costo. */
  unidad: CodigoUnidad;

  /** Con que unidad se compra al proveedor. Puede ser un paquete. */
  unidadCompra: CodigoUnidad | null;
  contenidoPaquete: number | null;
  unidadContenido: CodigoUnidad | null;

  /** Nunca se edita a mano: es el resultado de los movimientos. */
  stock: number;
  /** Costo por unidad base. Se recalcula con costo promedio en cada compra. */
  costoPromedio: number;

  /** Cuanto rinde una tanda. Obligatorio si es elaborado. */
  rendimientoCantidad: number | null;
  rendimientoUnidad: CodigoUnidad | null;

  /**
   * Costo extra del proceso (aceite, especias, lo que se rompe).
   * No es la perdida de masa: eso va en el rendimiento.
   */
  mermaPct: number;

  stockMinimo: number | null;
  proveedorId: string | null;
  fotoUrl: string | null;
  notas: string | null;
  receta: ItemReceta[];
  activo: boolean;
}

export type MotivoError =
  | "articulo-inexistente"
  | "articulo-inactivo"
  | "cantidad-invalida"
  | "unidad-incompatible"
  | "paquete-requiere-contenido"
  | "paquete-sobre-articulo-simple"
  | "precio-invalido"
  | "rendimiento-invalido"
  | "receta-vacia"
  | "ciclo-detectado"
  | "profundidad-excedida";

export interface DetalleCosteo {
  articuloId: Id;
  nombre: string;
  cantidadPedida: number;
  unidadPedida: CodigoUnidad;
  cantidadBase: number | null;
  costoUnitario: number | null;
  costo: number;
  error: MotivoError | null;
}

export interface ResultadoCosteo {
  articuloId: Id;
  /** Costo por unidad base del artículo. */
  costoUnitario: number;
  costoValido: boolean;
  errores: MotivoError[];
  detalles: DetalleCosteo[];
}

export type Catalogo = Map<Id, Articulo>;

export interface NecesidadInsumo {
  articuloId: Id;
  nombre: string;
  unidad: CodigoUnidad;
  cantidad: number;
  stock: number;
  faltante: number;
}
