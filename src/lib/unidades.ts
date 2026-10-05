import type { CodigoUnidad, TipoUnidad } from "./tipos";

export interface DefinicionUnidad {
  tipo: TipoUnidad;
  factor: number;
  etiqueta: string;
}

export const UNIDADES: Record<CodigoUnidad, DefinicionUnidad> = {
  g: { tipo: "peso", factor: 1, etiqueta: "Gramos" },
  kg: { tipo: "peso", factor: 1000, etiqueta: "Kilogramos" },
  ml: { tipo: "volumen", factor: 1, etiqueta: "Mililitros" },
  cl: { tipo: "volumen", factor: 10, etiqueta: "Centilitros" },
  l: { tipo: "volumen", factor: 1000, etiqueta: "Litros" },
  unidad: { tipo: "unidad", factor: 1, etiqueta: "Unidad" },
  paquete: { tipo: "unidad", factor: 1, etiqueta: "Paquete" },
};

export const UNIDADES_CONVERTIBLES: CodigoUnidad[] = [
  "g",
  "kg",
  "ml",
  "cl",
  "l",
  "unidad",
];

export const UNIDADES_POR_TIPO: Record<TipoUnidad, CodigoUnidad[]> = {
  peso: ["g", "kg"],
  volumen: ["ml", "cl", "l"],
  unidad: ["unidad"],
};

export function esUnidadValida(unidad: string): unidad is CodigoUnidad {
  return Object.prototype.hasOwnProperty.call(UNIDADES, unidad);
}

export function tipoDeUnidad(unidad: CodigoUnidad): TipoUnidad {
  return UNIDADES[unidad].tipo;
}

export function unidadesCompatibles(unidadBase: CodigoUnidad): CodigoUnidad[] {
  const tipo = tipoDeUnidad(unidadBase);
  return tipo === "unidad" && unidadBase === "paquete"
    ? ["paquete"]
    : UNIDADES_POR_TIPO[tipo];
}

export function factorBase(unidad: CodigoUnidad): number {
  return UNIDADES[unidad].factor;
}

export function convertirCantidad(
  cantidad: number,
  origen: CodigoUnidad,
  destino: CodigoUnidad,
): number | null {
  if (!Number.isFinite(cantidad)) return null;
  if (origen === destino) return cantidad;
  if (!esUnidadValida(origen) || !esUnidadValida(destino)) return null;

  const defOrigen = UNIDADES[origen];
  const defDestino = UNIDADES[destino];

  if (defOrigen.tipo !== defDestino.tipo) return null;
  if (defOrigen.factor === defDestino.factor) return cantidad;

  return (cantidad * defOrigen.factor) / defDestino.factor;
}
