import { describe, expect, it } from "vitest";
import {
  convertirCantidad,
  esUnidadValida,
  factorBase,
  tipoDeUnidad,
  unidadesCompatibles,
} from "./unidades";

describe("tipoDeUnidad", () => {
  it("agrupa las unidades de peso", () => {
    expect(tipoDeUnidad("g")).toBe("peso");
    expect(tipoDeUnidad("kg")).toBe("peso");
  });

  it("agrupa las unidades de volumen", () => {
    expect(tipoDeUnidad("ml")).toBe("volumen");
    expect(tipoDeUnidad("l")).toBe("volumen");
  });

  it("trata unidad y paquete como conteo", () => {
    expect(tipoDeUnidad("unidad")).toBe("unidad");
    expect(tipoDeUnidad("paquete")).toBe("unidad");
  });
});

describe("convertirCantidad", () => {
  it("devuelve la cantidad sin cambios si la unidad es la misma", () => {
    expect(convertirCantidad(500, "g", "g")).toBe(500);
  });

  it("convierte gramos a kilogramos", () => {
    expect(convertirCantidad(500, "g", "kg")).toBeCloseTo(0.5, 10);
  });

  it("convierte kilogramos a gramos", () => {
    expect(convertirCantidad(1.5, "kg", "g")).toBeCloseTo(1500, 10);
  });

  it("convierte mililitros a litros", () => {
    expect(convertirCantidad(250, "ml", "l")).toBeCloseTo(0.25, 10);
  });

  it("convierte litros a centilitros", () => {
    expect(convertirCantidad(2, "l", "cl")).toBeCloseTo(200, 10);
  });

  it("rechaza convertir entre peso y volumen en lugar de inventar un valor", () => {
    expect(convertirCantidad(100, "g", "ml")).toBeNull();
    expect(convertirCantidad(100, "ml", "kg")).toBeNull();
  });

  it("rechaza cantidades no finitas", () => {
    expect(convertirCantidad(Number.NaN, "g", "kg")).toBeNull();
    expect(convertirCantidad(Number.POSITIVE_INFINITY, "g", "kg")).toBeNull();
  });

  it("no convierte paquete porque no es una unidad de medida", () => {
    expect(convertirCantidad(3, "paquete", "g")).toBeNull();
  });

  it("mantiene la cantidad cero", () => {
    expect(convertirCantidad(0, "kg", "g")).toBe(0);
  });
});

describe("factorBase", () => {
  it("usa el gramo, el mililitro y la unidad como base", () => {
    expect(factorBase("g")).toBe(1);
    expect(factorBase("ml")).toBe(1);
    expect(factorBase("unidad")).toBe(1);
  });

  it("usa factores mil para kilo y litro", () => {
    expect(factorBase("kg")).toBe(1000);
    expect(factorBase("l")).toBe(1000);
  });
});

describe("esUnidadValida", () => {
  it("acepta las unidades soportadas", () => {
    expect(esUnidadValida("g")).toBe(true);
    expect(esUnidadValida("paquete")).toBe(true);
  });

  it("rechaza unidades desconocidas", () => {
    expect(esUnidadValida("onza")).toBe(false);
    expect(esUnidadValida("")).toBe(false);
  });
});

describe("unidadesCompatibles", () => {
  it("ofrece solo unidades del mismo tipo", () => {
    expect(unidadesCompatibles("kg")).toEqual(["g", "kg"]);
    expect(unidadesCompatibles("l")).toEqual(["ml", "cl", "l"]);
  });

  it("ofrece solo unidad para un insumo contado por unidades", () => {
    expect(unidadesCompatibles("unidad")).toEqual(["unidad"]);
  });

  it("ofrece solo paquete cuando el insumo se compra en paquete", () => {
    expect(unidadesCompatibles("paquete")).toEqual(["paquete"]);
  });
});
