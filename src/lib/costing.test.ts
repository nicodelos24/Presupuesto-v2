import { describe, expect, it } from "vitest";
import {
  costearReceta,
  costoDeProducto,
  ganancia,
  margenDesdePrecio,
  precioDesdeMargen,
  precioUnitarioBase,
  redondearMoneda,
} from "./costing";
import type { Insumo, ItemReceta, Producto } from "./tipos";

function inventario(...insumos: Insumo[]): Map<string, Insumo> {
  return new Map(insumos.map((i) => [i.id, i]));
}

const harina: Insumo = {
  id: "ing-harina",
  nombre: "Harina",
  unidad: "kg",
  cantidadComprada: 25,
  precioLote: 1200,
};

const azucar: Insumo = {
  id: "ing-azucar",
  nombre: "Azúcar",
  unidad: "kg",
  cantidadComprada: 2,
  precioLote: 180,
};

const harinaEnPaquetes: Insumo = {
  id: "ing-paq",
  nombre: "Harina en paquete",
  unidad: "paquete",
  cantidadComprada: 4,
  precioLote: 900,
  contenidoPaquete: 500,
  unidadContenido: "g",
};

const huevos: Insumo = {
  id: "ing-huevos",
  nombre: "Huevos",
  unidad: "unidad",
  cantidadComprada: 30,
  precioLote: 300,
};

const leche: Insumo = {
  id: "ing-leche",
  nombre: "Leche",
  unidad: "l",
  cantidadComprada: 10,
  precioLote: 800,
};

describe("precioUnitarioBase", () => {
  it("divide el precio del lote por la cantidad comprada", () => {
    expect(precioUnitarioBase(harina)).toBeCloseTo(48, 10);
  });

  it("devuelve null si la cantidad comprada es cero o negativa", () => {
    expect(precioUnitarioBase({ ...harina, cantidadComprada: 0 })).toBeNull();
    expect(precioUnitarioBase({ ...harina, cantidadComprada: -5 })).toBeNull();
  });

  it("devuelve null si el precio no es un numero valido", () => {
    expect(precioUnitarioBase({ ...harina, precioLote: Number.NaN })).toBeNull();
  });
});

describe("costeo de receta con insumos en peso", () => {
  it("costea usando el precio por unidad del insumo", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: 0.5, unidad: "kg" },
      { insumoId: azucar.id, cantidad: 0.2, unidad: "kg" },
    ];
    const r = costearReceta(receta, inventario(harina, azucar));
    expect(r.costoValido).toBe(true);
    expect(r.costoTotal).toBeCloseTo(48 * 0.5 + 90 * 0.2, 10);
    expect(r.costoTotal).toBeCloseTo(42, 10);
  });

  it("convierte la cantidad al peso del insumo antes de costear", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: 250, unidad: "g" },
    ];
    const resultado = costearReceta(receta, inventario(harina));
    expect(resultado.costoTotal).toBeCloseTo(12, 10);
    expect(resultado.detalles[0]?.unidadBase).toBe("kg");
  });

  it("no falla cuando el insumo no existe en el inventario", () => {
    const receta: ItemReceta[] = [
      { insumoId: "ing-fantasma", cantidad: 1, unidad: "kg" },
    ];
    const resultado = costearReceta(receta, inventario(harina));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("insumo-inexistente");
    expect(resultado.costoTotal).toBe(0);
  });

  it("marca como error un insumo desactivado", () => {
    const receta: ItemReceta[] = [
      { insumoId: "ing-harina", cantidad: 1, unidad: "kg" },
    ];
    const resultado = costearReceta(receta, inventario({ ...harina, activo: false }));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("insumo-inactivo");
  });

  it("rechaza cantidades negativas en lugar de restar el costo", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: -2, unidad: "kg" },
    ];
    const resultado = costearReceta(receta, inventario(harina));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("cantidad-invalida");
  });

  it("ignora los items con cantidad cero", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: 0, unidad: "kg" },
    ];
    const resultado = costearReceta(receta, inventario(harina));
    expect(resultado.costoValido).toBe(true);
    expect(resultado.costoTotal).toBe(0);
  });

  it("devuelve un detalle por cada item de la receta", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: 1, unidad: "kg" },
      { insumoId: huevos.id, cantidad: 3, unidad: "unidad" },
    ];
    const resultado = costearReceta(receta, inventario(harina, huevos));
    expect(resultado.detalles).toHaveLength(2);
    expect(resultado.costoTotal).toBeCloseTo(48 + 3 * 10, 10);
  });
});

describe("costeo con insumos comprados en paquete", () => {
  it("prorratea por la fraccion del stock cuando la receta usa otra unidad", () => {
    const receta: ItemReceta[] = [
      { insumoId: harinaEnPaquetes.id, cantidad: 250, unidad: "g" },
    ];
    const resultado = costearReceta(receta, inventario(harinaEnPaquetes));
    expect(resultado.costoValido).toBe(true);
    expect(resultado.costoTotal).toBeCloseTo(112.5, 10);
  });

  it("cuesta lo mismo pedir la receta en gramos que pedir un cuarto del paquete", () => {
    const enGramos: ItemReceta[] = [
      { insumoId: harinaEnPaquetes.id, cantidad: 250, unidad: "g" },
    ];
    const resultadoGramos = costearReceta(enGramos, inventario(harinaEnPaquetes));
    expect(resultadoGramos.costoTotal).toBeCloseTo(112.5, 10);
  });

  it("cuesta lo mismo pedir un paquete entero que pedir todo su contenido", () => {
    const porPaquete: ItemReceta[] = [
      { insumoId: harinaEnPaquetes.id, cantidad: 1, unidad: "paquete" },
    ];
    const porGramos: ItemReceta[] = [
      { insumoId: harinaEnPaquetes.id, cantidad: 500, unidad: "g" },
    ];
    const resultadoPaquete = costearReceta(porPaquete, inventario(harinaEnPaquetes));
    const resultadoGramos = costearReceta(porGramos, inventario(harinaEnPaquetes));
    expect(resultadoPaquete.costoValido).toBe(true);
    expect(resultadoPaquete.costoTotal).toBeCloseTo(225, 10);
    expect(resultadoGramos.costoTotal).toBeCloseTo(resultadoPaquete.costoTotal, 10);
  });

  it("prorratea en volumen cuando el contenido del paquete es un liquido", () => {
    const lecheEnPaquetes: Insumo = {
      id: "ing-leche-paq",
      nombre: "Leche en paquete",
      unidad: "paquete",
      cantidadComprada: 4,
      precioLote: 600,
      contenidoPaquete: 1,
      unidadContenido: "l",
    };
    const receta: ItemReceta[] = [
      { insumoId: lecheEnPaquetes.id, cantidad: 2000, unidad: "ml" },
    ];
    const resultado = costearReceta(receta, inventario(lecheEnPaquetes));
    expect(resultado.costoValido).toBe(true);
    expect(resultado.costoTotal).toBeCloseTo(300, 10);
  });

  it("avisa cuando se pide en unidades un paquete cuyo contenido es en peso", () => {
    const receta: ItemReceta[] = [
      { insumoId: harinaEnPaquetes.id, cantidad: 2, unidad: "unidad" },
    ];
    const resultado = costearReceta(receta, inventario(harinaEnPaquetes));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("unidad-incompatible");
  });

  it("avisa cuando el paquete no tiene contenido declarado", () => {
    const receta: ItemReceta[] = [
      { insumoId: "ing-paq", cantidad: 1, unidad: "paquete" },
    ];
    const sinContenido: Insumo = {
      ...harinaEnPaquetes,
      contenidoPaquete: undefined,
      unidadContenido: undefined,
    };
    const resultado = costearReceta(receta, inventario(sinContenido));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("paquete-requiere-contenido");
  });

  it("no mezcla un insumo en volumen con una receta en peso", () => {
    const receta: ItemReceta[] = [
      { insumoId: leche.id, cantidad: 200, unidad: "g" },
    ];
    const resultado = costearReceta(receta, inventario(leche));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("unidad-incompatible");
  });
});

describe("bug heredado de la v1: pedir paquetes de un insumo simple", () => {
  it("marca el error en lugar de devolver un costo absurdo", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: 3, unidad: "paquete" },
    ];
    const resultado = costearReceta(receta, inventario(harina));
    expect(resultado.costoValido).toBe(false);
    expect(resultado.errores).toContain("paquete-sobre-ingrediente-simple");
  });

  it("no devuelve el costo silencio de la v1 que era miles de veces menor", () => {
    const receta: ItemReceta[] = [
      { insumoId: harina.id, cantidad: 3, unidad: "paquete" },
    ];
    const resultado = costearReceta(receta, inventario(harina));
    const costoV1 = (harina.precioLote / harina.cantidadComprada) * 0.003;
    expect(resultado.costoTotal).not.toBeCloseTo(costoV1, 6);
    expect(resultado.detalles[0]?.costo).toBe(0);
  });
});

describe("costo de producto", () => {
  const receta: ItemReceta[] = [
    { insumoId: harina.id, cantidad: 0.5, unidad: "kg" },
  ];

  it("usa el costo calculado cuando no hay costo manual", () => {
    const producto: Producto = {
      id: "prod-1",
      nombre: "Torta",
      precioVenta: 800,
      receta,
    };
    const resultado = costoDeProducto(producto, inventario(harina));
    expect(resultado.costoTotal).toBeCloseTo(24, 10);
  });

  it("respeta el costo manual cuando existe (bug 9.1 de la v1)", () => {
    const producto: Producto = {
      id: "prod-2",
      nombre: "Curso de repostería",
      precioVenta: 5000,
      costoManual: 1200,
      receta: [],
    };
    const resultado = costoDeProducto(producto, inventario(harina));
    expect(resultado.costoTotal).toBe(1200);
    expect(resultado.costoValido).toBe(true);
  });

  it("el costo manual no borra los errores de la receta", () => {
    const producto: Producto = {
      id: "prod-3",
      nombre: "Torta rota",
      precioVenta: 800,
      costoManual: 100,
      receta: [{ insumoId: "fantasma", cantidad: 1, unidad: "kg" }],
    };
    const resultado = costoDeProducto(producto, inventario(harina));
    expect(resultado.costoTotal).toBe(100);
    expect(resultado.costoValido).toBe(false);
  });
});

describe("margen y ganancia", () => {
  it("calcula el precio a partir del margen sobre el costo", () => {
    expect(precioDesdeMargen(200, 50)).toBeCloseTo(300, 10);
  });

  it("devuelve NaN si los numeros no son validos", () => {
    expect(Number.isNaN(precioDesdeMargen(Number.NaN, 50))).toBe(true);
  });

  it("calcula el margen a partir del precio y el costo", () => {
    expect(margenDesdePrecio(300, 200)).toBeCloseTo(50, 10);
  });

  it("devuelve null cuando el costo es cero porque el margen no existe", () => {
    expect(margenDesdePrecio(300, 0)).toBeNull();
  });

  it("calcula la ganancia en pesos", () => {
    expect(ganancia(300, 200)).toBe(100);
  });
});

describe("redondearMoneda", () => {
  it("redondea a dos decimales", () => {
    expect(redondearMoneda(10.005)).toBe(10.01);
    expect(redondearMoneda(10.004)).toBe(10);
  });

  it("evita el error clasico de los flotantes al redondear", () => {
    expect(redondearMoneda(1.005)).toBe(1.01);
    expect(redondearMoneda(0.145)).toBe(0.15);
  });
});
