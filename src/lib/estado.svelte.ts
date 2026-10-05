import {
  crearRepositorioMemoria,
  type DatosArticulo,
  type RepositorioArticulos,
} from "./datos/articulos";
import type { Articulo, Catalogo, Id } from "./tipos";

export const repositorio: RepositorioArticulos = crearRepositorioMemoria();

export const articulos = $state<Articulo[]>([]);
export const estado = $state({ cargando: false });

let iniciado = false;

export async function cargarArticulos(forzar = false) {
  if (iniciado && !forzar) return;
  estado.cargando = true;
  try {
    for (const a of await repositorio.listar()) {
      articulos.push(a);
    }
    iniciado = true;
  } finally {
    estado.cargando = false;
  }
}

export function catalogo(): Catalogo {
  return new Map(articulos.map((a) => [a.id, a]));
}

export function limpiarArticulos() {
  articulos.length = 0;
  iniciado = false;
}

export async function crearArticulo(datos: DatosArticulo) {
  const creado = await repositorio.crear(datos);
  articulos.push(creado);
  return creado;
}

export async function actualizarArticulo(id: Id, datos: DatosArticulo) {
  const actualizado = await repositorio.actualizar(id, datos);
  const indice = articulos.findIndex((a) => a.id === id);
  if (indice >= 0) articulos[indice] = actualizado;
  return actualizado;
}

export async function eliminarArticulo(id: Id) {
  await repositorio.eliminar(id);
  const indice = articulos.findIndex((a) => a.id === id);
  if (indice >= 0) articulos[indice] = { ...articulos[indice]!, activo: false };
}
