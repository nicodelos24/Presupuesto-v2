import { describe, expect, it } from "vitest";
import { costearArticulo, needingInsumos } from "./costoRecetas";
import type { Articulo, Catalogo } from "./tipos";

function materiaDePrueba(id: string, costo: number): Articulo {
  return {
    id,
    nombre: id,
    tipo: "materia_prima",
    esVendible: false,
    esElaborado: false,
    unidad: "g",
    unidadCompra: "g",
    contenidoPaquete: null,
    unidadContenido: null,
    stock: 10000,
    costoPromedio: costo,
    rendimientoCantidad: null,
    rendimientoUnidad: null,
    mermaPct: 0,
    stockMinimo: null,
    proveedorId: null,
    fotoUrl: null,
    notas: null,
    duracionDias: null,
    receta: [],
    activo: true,
  };
}

describe("coherencia entre costear y consumir", () => {
  // Se verifico que la merma NO se cuenta dos veces: el costeo de un plato y
  // los insumos que hace falta gastar para producirlo tienen que dar lo mismo.
  // Se estuvo RULEANDO que si, y no era asi. Este test lo deja fijado para
  // que no se rompa si alguien toca el motor.

  const tomate = materiaDePrueba("tomate", 10);
  const salsa: Articulo = {
    ...tomate,
    id: "salsa",
    nombre: "Salsa",
    tipo: "preparado",
    esVendible: true,
    esElaborado: true,
    unidad: "ml",
    stock: 0,
    costoPromedio: 0,
    mermaPct: 10,
    rendimientoCantidad: 1000,
    rendimientoUnidad: "ml",
    receta: [{ articuloId: "tomate", cantidad: 500, unidad: "g" }],
  };
  const plato: Articulo = {
    ...tomate,
    id: "plato",
    nombre: "Plato con salsa",
    tipo: "producto",
    esVendible: true,
    esElaborado: true,
    unidad: "unidad",
    stock: 0,
    costoPromedio: 0,
    mermaPct: 20,
    rendimientoCantidad: 1,
    rendimientoUnidad: "unidad",
    receta: [{ articuloId: "salsa", cantidad: 200, unidad: "ml" }],
  };

  const catalogo: Catalogo = new Map(
    [tomate, salsa, plato].map((a) => [a.id, a]),
  );

  it("lo que cuesta un plato es lo que valen los insumos que se gastan", () => {
    const costoPorPlato = costearArticulo(plato, catalogo).costoUnitario;
    const insumos = needingInsumos(plato, 100, catalogo);
    const costoDeLosInsumos =
      (insumos.get("tomate") ?? 0) * tomate.costoPromedio;

    expect(costoPorPlato * 100).toBeCloseTo(costoDeLosInsumos, 6);
  });

  it("la merma de cada nivel se aplica una sola vez", () => {
    // Salsa: 500 g de tomate rinden 1000 ml, con 10% de merma.
    // Plato: 200 ml de salsa rinden 1 unidad, con 20% de merma.
    // Si la merma se contara dos veces el numero seria 1.10 x 1.20 en cada via.
    const costo = costearArticulo(plato, catalogo).costoUnitario;
    const esperado = 500 * 10 * 1.1 * (200 / 1000) * 1.2;

    expect(costo).toBeCloseTo(esperado, 6);
  });
});
