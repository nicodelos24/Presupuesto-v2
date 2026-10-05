import type { CodigoUnidad, Id, Insumo } from "../tipos";

export interface DatosInsumo {
  nombre: string;
  unidad: CodigoUnidad;
  cantidadComprada: number;
  precioLote: number;
  contenidoPaquete: number | null;
  unidadContenido: CodigoUnidad | null;
}

export interface RepositorioInventario {
  readonly modo: "memoria" | "supabase";
  listar(): Promise<Insumo[]>;
  crear(datos: DatosInsumo): Promise<Insumo>;
  actualizar(id: Id, datos: DatosInsumo): Promise<Insumo>;
  eliminar(id: Id): Promise<void>;
}

export function validarInsumo(datos: DatosInsumo): Record<string, string> {
  const errores: Record<string, string> = {};

  if (!datos.nombre.trim()) {
    errores.nombre = "Poné un nombre para el insumo";
  }

  if (!Number.isFinite(datos.cantidadComprada) || datos.cantidadComprada <= 0) {
    errores.cantidadComprada = "La cantidad tiene que ser mayor a cero";
  }

  if (!Number.isFinite(datos.precioLote) || datos.precioLote < 0) {
    errores.precioLote = "El precio no puede ser negativo";
  }

  if (datos.unidad === "paquete") {
    if (
      datos.contenidoPaquete === null ||
      !Number.isFinite(datos.contenidoPaquete) ||
      datos.contenidoPaquete <= 0
    ) {
      errores.contenidoPaquete = "Falta cuanto trae cada paquete";
    }
    if (!datos.unidadContenido) {
      errores.unidadContenido = "Falta la unidad del contenido";
    }
  }

  return errores;
}

const SEMILLA: Insumo[] = [
  {
    id: "demo-harina",
    nombre: "Harina",
    unidad: "kg",
    cantidadComprada: 25,
    precioLote: 1200,
  },
  {
    id: "demo-azucar",
    nombre: "Azucar",
    unidad: "kg",
    cantidadComprada: 2,
    precioLote: 180,
  },
  {
    id: "demo-huevos",
    nombre: "Huevos",
    unidad: "unidad",
    cantidadComprada: 30,
    precioLote: 300,
  },
];

export function crearRepositorioMemoria(
  inicial: Insumo[] = SEMILLA,
): RepositorioInventario {
  let datos = [...inicial];

  return {
    modo: "memoria",

    async listar() {
      return [...datos].sort((a, b) => a.nombre.localeCompare(b.nombre));
    },

    async crear(nuevo) {
      const insumo: Insumo = {
        id: crypto.randomUUID(),
        ...nuevo,
        activo: true,
      };
      datos = [...datos, insumo];
      return insumo;
    },

    async actualizar(id, cambios) {
      datos = datos.map((i) => (i.id === id ? { ...i, ...cambios } : i));
      return datos.find((i) => i.id === id) as Insumo;
    },

    async eliminar(id) {
      datos = datos.filter((i) => i.id !== id);
    },
  };
}
