import type { SupabaseClient } from "@supabase/supabase-js";
import type { CodigoUnidad, Id, Insumo } from "../tipos";
import type {
  DatosInsumo,
  RepositorioInventario,
} from "./inventario";

interface FilaInsumo {
  id: string;
  nombre: string;
  unidad: CodigoUnidad;
  cantidad_comprada: number | string;
  precio_lote: number | string;
  contenido_paquete: number | string | null;
  unidad_contenido: CodigoUnidad | null;
  activo: boolean;
}

function aInsumo(fila: FilaInsumo): Insumo {
  return {
    id: fila.id,
    nombre: fila.nombre,
    unidad: fila.unidad,
    cantidadComprada: Number(fila.cantidad_comprada),
    precioLote: Number(fila.precio_lote),
    contenidoPaquete:
      fila.contenido_paquete === null ? null : Number(fila.contenido_paquete),
    unidadContenido: fila.unidad_contenido,
    activo: fila.activo,
  };
}

function aFila(negocioId: string, datos: DatosInsumo) {
  return {
    negocio_id: negocioId,
    nombre: datos.nombre.trim(),
    unidad: datos.unidad,
    cantidad_comprada: datos.cantidadComprada,
    precio_lote: datos.precioLote,
    contenido_paquete: datos.unidad === "paquete" ? datos.contenidoPaquete : null,
    unidad_contenido:
      datos.unidad === "paquete" ? datos.unidadContenido : null,
  };
}

export function crearRepositorioSupabase(
  cliente: SupabaseClient,
  negocioId: Id,
): RepositorioInventario {
  return {
    modo: "supabase",

    async listar() {
      const { data, error } = await cliente
        .from("insumos")
        .select("*")
        .eq("negocio_id", negocioId)
        .order("nombre");

      if (error) throw error;
      return (data as FilaInsumo[]).map(aInsumo);
    },

    async crear(datos) {
      const { data, error } = await cliente
        .from("insumos")
        .insert(aFila(negocioId, datos))
        .select()
        .single();

      if (error) throw error;
      return aInsumo(data as FilaInsumo);
    },

    async actualizar(id, datos) {
      const { data, error } = await cliente
        .from("insumos")
        .update(aFila(negocioId, datos))
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return aInsumo(data as FilaInsumo);
    },

    async eliminar(id) {
      const { error } = await cliente
        .from("insumos")
        .update({ activo: false })
        .eq("id", id);

      if (error) throw error;
    },
  };
}
