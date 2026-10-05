export type CodigoUnidad =
  | "g"
  | "kg"
  | "ml"
  | "cl"
  | "l"
  | "unidad"
  | "paquete";

export type TipoUnidad = "peso" | "volumen" | "unidad";

export type Id = string;

export interface Insumo {
  id: Id;
  nombre: string;
  unidad: CodigoUnidad;
  cantidadComprada: number;
  precioLote: number;
  contenidoPaquete?: number | null;
  unidadContenido?: CodigoUnidad | null;
  costoActual?: number | null;
  activo?: boolean;
}

export interface ItemReceta {
  insumoId: Id;
  cantidad: number;
  unidad: CodigoUnidad;
}

export interface Producto {
  id: Id;
  nombre: string;
  precioVenta: number;
  costoManual?: number | null;
  receta: ItemReceta[];
  activo?: boolean;
}

export type MotivoError =
  | "insumo-inexistente"
  | "insumo-inactivo"
  | "cantidad-invalida"
  | "unidad-incompatible"
  | "paquete-requiere-contenido"
  | "paquete-sobre-ingrediente-simple"
  | "precio-invalido";

export interface DetalleCosteo {
  insumoId: Id;
  nombre: string;
  cantidadPedida: number;
  unidadPedida: CodigoUnidad;
  cantidadBase: number | null;
  unidadBase: CodigoUnidad | null;
  costo: number;
  error: MotivoError | null;
}

export interface ResultadoCosteo {
  costoTotal: number;
  costoValido: boolean;
  detalles: DetalleCosteo[];
  errores: MotivoError[];
}
