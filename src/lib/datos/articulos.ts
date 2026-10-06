import type { Articulo, Id } from "../tipos";

export interface DatosArticulo {
  nombre: string;
  tipo: Articulo["tipo"];
  esVendible: boolean;
  esElaborado: boolean;
  unidad: Articulo["unidad"];
  unidadCompra: Articulo["unidadCompra"];
  contenidoPaquete: number | null;
  unidadContenido: Articulo["unidadContenido"];
  stock: number;
  costoPromedio: number;
  rendimientoCantidad: number | null;
  rendimientoUnidad: Articulo["rendimientoUnidad"];
  mermaPct: number;
  stockMinimo: number | null;
  proveedorId: string | null;
  fotoUrl: string | null;
  notas: string | null;
  duracionDias: number | null;
  receta: Articulo["receta"];
}

export interface RepositorioArticulos {
  readonly modo: "memoria" | "supabase";
  listar(): Promise<Articulo[]>;
  crear(datos: DatosArticulo): Promise<Articulo>;
  actualizar(id: Id, datos: DatosArticulo): Promise<Articulo>;
  eliminar(id: Id): Promise<void>;
}

export function validarArticulo(datos: DatosArticulo): Record<string, string> {
  const errores: Record<string, string> = {};

  if (!datos.nombre.trim()) {
    errores.nombre = "Poné un nombre";
  }

  if (!Number.isFinite(datos.stock) || datos.stock < 0) {
    errores.stock = "El stock no puede ser negativo";
  }

  if (!Number.isFinite(datos.costoPromedio) || datos.costoPromedio < 0) {
    errores.costoPromedio = "El costo no puede ser negativo";
  }

  if (datos.mermaPct < 0 || datos.mermaPct >= 100) {
    errores.mermaPct = "La merma va de 0 a 99";
  }

  if (datos.duracionDias !== null) {
    if (!Number.isFinite(datos.duracionDias) || datos.duracionDias <= 0) {
      errores.duracionDias = "La duración tiene que ser más de un día";
    } else if (!Number.isInteger(datos.duracionDias)) {
      errores.duracionDias = "Poné la duración en días enteros";
    }
  }

  // Un articulo que se vende y no se compra ni se elabora no tiene de donde sacar costo.
  if (datos.esVendible && !datos.esElaborado && datos.costoPromedio <= 0) {
    errores.costoPromedio =
      "Si lo vendés y no lo elaborás, poné a cuánto lo comprás";
  }

  if (datos.esElaborado) {
    if (!datos.receta.length) {
      errores.receta = "Un preparado necesita al menos un ingrediente";
    }
    if (
      !datos.rendimientoCantidad ||
      datos.rendimientoCantidad <= 0 ||
      !datos.rendimientoUnidad
    ) {
      errores.rendimiento = "Falta cuanto rinde una tanda";
    }
  }

  if (datos.unidadCompra === "paquete") {
    if (!datos.contenidoPaquete || datos.contenidoPaquete <= 0) {
      errores.contenidoPaquete = "Falta cuanto trae el paquete";
    }
    if (!datos.unidadContenido) {
      errores.unidadContenido = "Falta la unidad del contenido";
    }
  }

  return errores;
}

/**
 * Detecta si un articulo se contiene a si mismo, directa o indirectamente.
 * Sin esto, dos recetas circulares dejan el calculo en loop.
 */
export function detectaCiclo(
  articuloId: Id,
  receta: Articulo["receta"],
  catalogo: Map<Id, Articulo>,
): boolean {
  const visitar = (id: Id, camino: Set<Id>): boolean => {
    if (camino.has(id)) return true;
    camino.add(id);

    const hijo = catalogo.get(id);
    if (!hijo) return false;

    for (const item of hijo.receta) {
      if (visitar(item.articuloId, camino)) return true;
    }
    return false;
  };

  const camino = new Set<Id>([articuloId]);
  for (const item of receta) {
    if (visitar(item.articuloId, camino)) return true;
  }
  return false;
}

function semilla(): Articulo[] {
  const base = {
    tipo: "materia_prima" as const,
    esVendible: false,
    esElaborado: false,
    unidadCompra: null,
    contenidoPaquete: null,
    unidadContenido: null,
    rendimientoCantidad: null,
    rendimientoUnidad: null,
    mermaPct: 0,
    stockMinimo: null,
    proveedorId: null,
    fotoUrl: null,
    notas: null,
    duracionDias: null,
    receta: [] as Articulo["receta"],
    activo: true,
  };

  return [
    {
      ...base,
      id: "art-harina",
      nombre: "Harina",
      unidad: "kg",
      stock: 25,
      costoPromedio: 48,
    },
    {
      ...base,
      id: "art-azucar",
      nombre: "Azucar",
      unidad: "kg",
      stock: 2,
      costoPromedio: 90,
    },
    {
      ...base,
      id: "art-leche",
      nombre: "Leche",
      unidad: "l",
      stock: 10,
      costoPromedio: 80,
      duracionDias: 7,
    },
    {
      ...base,
      id: "art-huevos",
      nombre: "Huevos",
      unidad: "unidad",
      stock: 30,
      costoPromedio: 10,
      duracionDias: 21,
    },
    {
      ...base,
      id: "art-chocolate",
      nombre: "Chocolate",
      unidad: "g",
      stock: 800,
      costoPromedio: 45,
    },
  ];
}

export function crearRepositorioMemoria(
  inicial: Articulo[] = semilla(),
): RepositorioArticulos {
  let datos = [...inicial];

  return {
    modo: "memoria",

    async listar() {
      return [...datos].sort((a, b) => a.nombre.localeCompare(b.nombre));
    },

    async crear(nuevos) {
      const articulo: Articulo = {
        id: crypto.randomUUID(),
        activo: true,
        ...nuevos,
      };
      datos = [...datos, articulo];
      return articulo;
    },

    async actualizar(id, cambios) {
      datos = datos.map((a) => (a.id === id ? { ...a, ...cambios } : a));
      return datos.find((a) => a.id === id) as Articulo;
    },

    async eliminar(id) {
      datos = datos.map((a) => (a.id === id ? { ...a, activo: false } : a));
    },
  };
}
