export type CodigoUnidad =
  "g" | "kg" | "ml" | "cl" | "l" | "unidad" | "paquete";

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

  /**
   * Solo una etiqueta para clasificar y filtrar. No manda en ningun calculo.
   * Lo que decide el comportamiento son las dos banderas de abajo.
   */
  tipo: TipoArticulo;

  /** Se puede ofrecer al cliente. Una carne, una pizza y una salsa pueden serlo. */
  esVendible: boolean;

  /** Tiene receta y se elabora en el local. */
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
   * No hay porcentaje de merma. El aceite, la luz y el gas son gastos reales
   * y se registran en la tabla `gastos`, no como un porcentaje inventado acá.
   * La perdida de masa ya la cubre el rendimiento.
   */

  stockMinimo: number | null;
  proveedorId: string | null;
  fotoUrl: string | null;
  notas: string | null;

  /**
   * Dias que dura una unidad desde que entra al stock.
   * null = no vence, como la harina o la pasta.
   */
  duracionDias: number | null;

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
