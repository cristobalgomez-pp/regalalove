import { test, expect } from "vitest";
import { aFilasConfig } from "./configEscritura";

const valida = {
  comisionBasePct: 5,
  comisionPremiumPct: 3,
  precioPremiumPesos: 499,
  absorcionPreMarcada: true,
  ventanaRetencionDias: 7,
};

test("serializa una config válida a filas clave/valor", () => {
  const filas = aFilasConfig(valida);
  const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  expect(mapa).toEqual({
    comision_base_pct: "5",
    comision_premium_pct: "3",
    precio_premium_centavos: "49900", // pesos → centavos
    absorcion_pre_marcada: "true",
    ventana_retencion_dias: "7",
  });
});

test("serializa absorción desmarcada como 'false'", () => {
  const filas = aFilasConfig({ ...valida, absorcionPreMarcada: false });
  const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  expect(mapa.absorcion_pre_marcada).toBe("false");
});

test("rechaza porcentajes negativos", () => {
  expect(() => aFilasConfig({ ...valida, comisionBasePct: -1 })).toThrow();
});

test("rechaza valores no numéricos", () => {
  expect(() => aFilasConfig({ ...valida, precioPremiumPesos: NaN })).toThrow();
});

test("rechaza una ventana de retención no entera", () => {
  expect(() => aFilasConfig({ ...valida, ventanaRetencionDias: 2.5 })).toThrow();
});
