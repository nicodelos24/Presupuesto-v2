import { describe, expect, it } from "vitest";
import {
  aUnidadBase,
  cantidadRendimiento,
  costearArticulo,
  costearReceta,
  costoUnitarioArticulo,
  needingInsumos,
  precioDesdeMargen,
  revisarFaltantes,
} from "./costoRecetas";
import type { Articulo, Catalogo, ItemReceta } from "./tipos";

function materia(
  id: string,
  nombre: string,
  unidad: Articulo["unidad"],
  stock: number,
  costoPromedio: number,
): Articulo {
  return {
    id,
    nombre,
    tipo: "materia_prima",
    esVendible: false,
    esElaborado: false,
    unidad,
    unidadCompra: unidad,
    contenidoPaquete: null,
    unidadContenido: null,
    stock,
    costoPromedio,
    rendimientoCantidad: null,
    rendimientoUnidad: null,
    mermaPct: 0,
    stockMinimo: null,
    proveedorId: null,
    fotoUrl: null,
    notas: null,
    receta: [],
    activo: true,
  };
}

function preparado(
  id: string,
  nombre: string,
  datos: Partial<Articulo> & { receta: ItemReceta[] },
): Articulo {
  return {
    id,
    nombre,
    tipo: "preparado",
    esVendible: true,
    esElaborado: true,
    unidad: "unidad",
    unidadCompra: null,
    contenidoPaquete: null,
    unidadContenido: null,
    stock: 0,
    costoPromedio: 0,
    rendimientoCantidad: 1,
    rendimientoUnidad: "unidad",
    mermaPct: 0,
    stockMinimo: null,
    proveedorId: null,
    fotoUrl: null,
    notas: null,
    activo: true,
    ...datos,
  };
}

function catalogoDe(...articulos: Articulo[]): Catalogo {
  return new Map(articulos.map((a) => [a.id, a]));
}

const harina = materia("ing-harina", "Harina", "kg", 25, 48);
const leche = materia("ing-leche", "Leche", "l", 10, 80);

describe("aUnidadBase", () => {
  it("devuelve la cantidad sin cambios si ya esta en la unidad base", () => {
    expect(aUnidadBase(2, "kg", harina)).toBe(2);
  });

  it("convierte a la unidad base del articulo", () => {
    expect(aUnidadBase(500, "g", harina)).toBeCloseTo(0.5, 10);
  });

  it("devuelve null cuando las unidades no son del mismo tipo", () => {
    expect(aUnidadBase(200, "g", leche)).toBeNull();
  });
});

describe("costeo de materia prima", () => {
  it("usa el costo promedio del inventario", () => {
    const c = costearReceta(
      [{ articuloId: harina.id, cantidad: 0.5, unidad: "kg" }],
      catalogoDe(harina),
    );
    expect(c.costoUnitario).toBeCloseTo(24, 10);
    expect(c.costoValido).toBe(true);
  });

  it("marca error si el articulo no existe", () => {
    const c = costearReceta(
      [{ articuloId: "fantasma", cantidad: 1, unidad: "kg" }],
      catalogoDe(harina),
    );
    expect(c.costoValido).toBe(false);
    expect(c.errores).toContain("articulo-inexistente");
  });

  it("marca error si el articulo esta inactivo", () => {
    const inactivo = { ...harina, activo: false };
    const c = costearReceta(
      [{ articuloId: inactivo.id, cantidad: 1, unidad: "kg" }],
      catalogoDe(inactivo),
    );
    expect(c.errores).toContain("articulo-inactivo");
  });

  it("rechaza cantidades negativas", () => {
    const c = costearReceta(
      [{ articuloId: harina.id, cantidad: -5, unidad: "kg" }],
      catalogoDe(harina),
    );
    expect(c.errores).toContain("cantidad-invalida");
  });
});

describe("costeo de un preparado", () => {
  const salsa = preparado("pre-salsa", "Salsa de tomate", {
    receta: [
      { articuloId: "ing-tomate", cantidad: 1, unidad: "kg" },
      { articuloId: leche.id, cantidad: 0.2, unidad: "l" },
    ],
    rendimientoCantidad: 800,
    rendimientoUnidad: "ml",
    unidad: "ml",
  });
  const tomate = materia("ing-tomate", "Tomate", "kg", 5, 60);

  const catalogo = catalogoDe(harina, leche, tomate, salsa);

  it("divide el costo de la receta por lo que rinde la tanda", () => {
    const costo = costoUnitarioArticulo(salsa, catalogo);
    const costoReceta = 1 * 60 + 0.2 * 80;
    expect(costo).toBeCloseTo(costoReceta / 800, 10);
  });

  it("suma la merma como costo extra del proceso", () => {
    const conMerma = { ...salsa, mermaPct: 20 };
    const catalogoConMerma = catalogoDe(harina, leche, tomate, conMerma);
    const costo = costoUnitarioArticulo(conMerma, catalogoConMerma);
    const costoReceta = 1 * 60 + 0.2 * 80;
    expect(costo).toBeCloseTo((costoReceta / 800) * 1.2, 10);
  });

  it("avisa cuando el rendimiento no es valido", () => {
    const sinRendimiento = { ...salsa, rendimientoCantidad: 0 };
    const resultado = costearArticulo(
      sinRendimiento,
      catalogoDe(harina, leche, tomate, sinRendimiento),
    );
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("rendimiento-invalido");
  });

  it("calcula el rendimiento en la unidad base", () => {
    expect(cantidadRendimiento(salsa)).toBeCloseTo(800, 10);
    const enGramos = preparado("pre-x", "X", {
      receta: [],
      rendimientoCantidad: 500,
      rendimientoUnidad: "g",
      unidad: "kg",
    });
    expect(cantidadRendimiento(enGramos)).toBeCloseTo(500, 10);
  });
});

describe("recetas de recetas", () => {
  const tortilla = preparado("pre-tortilla", "Tortilla cocida", {
    receta: [
      { articuloId: "ing-masa", cantidad: 250, unidad: "g" },
      { articuloId: "ing-aceite", cantidad: 20, unidad: "ml" },
    ],
    rendimientoCantidad: 6,
    rendimientoUnidad: "unidad",
  });

  const plato = preparado("prod-plato", "Plato con tortillas", {
    receta: [
      { articuloId: tortilla.id, cantidad: 3, unidad: "unidad" },
      { articuloId: leche.id, cantidad: 0.2, unidad: "l" },
    ],
    rendimientoCantidad: 1,
    rendimientoUnidad: "unidad",
  });

  const masa = materia("ing-masa", "Masa", "g", 3000, 2);
  const aceite = materia("ing-aceite", "Aceite", "ml", 500, 6);

  const catalogo = catalogoDe(masa, aceite, leche, tortilla, plato);

  it("descompone el costo hasta la materia prima", () => {
    const costoTortilla = costoUnitarioArticulo(tortilla, catalogo);
    const esperado = (250 * 2 + 20 * 6) / 6;
    expect(costoTortilla).toBeCloseTo(esperado, 10);

    const costoPlato = costoUnitarioArticulo(plato, catalogo);
    expect(costoPlato).toBeCloseTo(costoTortilla * 3 + 0.2 * 80, 10);
  });

  it("detecta un ciclo en lugar de quedar looping", () => {
    const conCiclo: Articulo = {
      ...plato,
      receta: [{ articuloId: plato.id, cantidad: 1, unidad: "unidad" }],
    };
    const resultado = costearArticulo(
      conCiclo,
      catalogoDe(masa, aceite, leche, tortilla, conCiclo),
    );
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("ciclo-detectado");
  });

  it("un preparado que se compra se costea por su costo promedio", () => {
    const comprado = preparado("pre-comprado", "Tortilla comprada", {
      receta: [],
      esElaborado: false,
      tipo: "materia_prima",
      costoPromedio: 90,
      unidad: "unidad",
    });
    expect(costoUnitarioArticulo(comprado, catalogoDe(comprado))).toBe(90);
  });
});

describe("necesidad de insumos y faltantes", () => {
  const tortilla = preparado("pre-tortilla", "Tortilla cocida", {
    receta: [{ articuloId: "ing-masa", cantidad: 250, unidad: "g" }],
    rendimientoCantidad: 6,
    rendimientoUnidad: "unidad",
  });
  const masa = materia("ing-masa", "Masa", "g", 3000, 2);
  const catalogo = catalogoDe(masa, tortilla);

  it("calcula cuanto insumo base hace falta para producir", () => {
    const necesita = needingInsumos(tortilla, 12, catalogo);
    expect(necesita.get("ing-masa")).toBeCloseTo(500, 10);
  });

  it("detecta el faltante contra el stock disponible", () => {
    const faltantes = revisarFaltantes(
      [{ articulo: tortilla, cantidad: 30 }],
      catalogo,
    );
    expect(faltantes[0]?.cantidad).toBeCloseTo(1250, 10);
    expect(faltantes[0]?.faltante).toBeCloseTo(0, 10);
  });

  it("marca el faltante cuando no alcanza el stock", () => {
    const pocoStock = materia("ing-masa", "Masa", "g", 500, 2);
    const faltantes = revisarFaltantes(
      [{ articulo: tortilla, cantidad: 30 }],
      catalogoDe(pocoStock, tortilla),
    );
    expect(faltantes[0]?.faltante).toBeCloseTo(750, 10);
  });

  it("suma las necesidades de varios articulos", () => {
    const leche = materia("ing-leche", "Leche", "l", 10, 80);
    const tortillasConLeche = preparado("pre-antojito", "Antojito", {
      receta: [
        { articuloId: tortilla.id, cantidad: 2, unidad: "unidad" },
        { articuloId: leche.id, cantidad: 0.1, unidad: "l" },
      ],
      rendimientoCantidad: 1,
      rendimientoUnidad: "unidad",
    });

    const necesario = needingInsumos(
      tortillasConLeche,
      2,
      catalogoDe(masa, leche, tortilla, tortillasConLeche),
    );
    // 2 antojitos x 2 tortillas = 4 tortillas; cada tanda de 6 usa 250 g
    expect(necesario.get("ing-masa")).toBeCloseTo(250 / 1.5, 6);
    expect(necesario.get("ing-leche")).toBeCloseTo(0.2, 10);
  });
});

describe("precio y margen", () => {
  it("calcula el precio a partir del margen sobre el costo", () => {
    expect(precioDesdeMargen(200, 50)).toBeCloseTo(300, 10);
  });

  it("devuelve NaN con numeros invalidos", () => {
    expect(Number.isNaN(precioDesdeMargen(Number.NaN, 10))).toBe(true);
  });
});
