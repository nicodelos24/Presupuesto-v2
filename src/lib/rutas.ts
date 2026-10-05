export type IdRuta = "inicio" | "pedidos" | "agenda" | "inventario" | "mas";

export interface DefinicionRuta {
  id: IdRuta;
  ruta: string;
  etiqueta: string;
  etiquetaCorta: string;
  titulo: string;
}

export const RUTAS: DefinicionRuta[] = [
  {
    id: "inicio",
    ruta: "/",
    etiqueta: "Inicio",
    etiquetaCorta: "Inicio",
    titulo: "Resumen del dia",
  },
  {
    id: "pedidos",
    ruta: "/pedidos",
    etiqueta: "Pedidos",
    etiquetaCorta: "Pedidos",
    titulo: "Pedidos",
  },
  {
    id: "agenda",
    ruta: "/agenda",
    etiqueta: "Agenda",
    etiquetaCorta: "Agenda",
    titulo: "Agenda y entregas",
  },
  {
    id: "inventario",
    ruta: "/inventario",
    etiqueta: "Inventario",
    etiquetaCorta: "Inventario",
    titulo: "Inventario y costos",
  },
  {
    id: "mas",
    ruta: "/mas",
    etiqueta: "Mas",
    etiquetaCorta: "Mas",
    titulo: "Negocio y ajustes",
  },
];

export function rutaDesdeHash(hash: string): DefinicionRuta {
  const limpio = hash.replace(/^#/, "") || "/";
  return (
    RUTAS.find((r) => r.ruta === limpio) ??
    RUTAS.find((r) => limpio.startsWith(`${r.ruta}/`)) ??
    RUTAS[0]!
  );
}
