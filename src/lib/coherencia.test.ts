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
  // Se verifica que el costeo de un plato y
  // los insumos que hace falta gastar para producirlo dan lo mismo.
  // Se sospecho que si y no era asi. Este test lo deja fijado para
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

  it("el costo se reparte exacto entre las porciones", () => {
    // La receta es de 1000 ml de salsa. Cada ml cuesta lo mismo, sin porcentajes
    // que lo ajusten: 500 g x $10 = 5000, sobre 1000 ml = 5 por ml.
    const costo = costearArticulo(plato, catalogo).costoUnitario;
    const esperado = 500 * 10 * (200 / 1000);

    expect(costo).toBeCloseTo(esperado, 6);
  });
});
