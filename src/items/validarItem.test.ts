import { test, expect } from "vitest";
import { validarItem } from "./validarItem";

test("una entrada válida pasa y devuelve los datos normalizados", () => {
  const item = validarItem({
    nombre: "  Vajilla  ",
    descripcion: "  Set de 12 piezas  ",
    montoMetaCentavos: 350000,
  });

  expect(item.nombre).toBe("Vajilla");
  expect(item.descripcion).toBe("Set de 12 piezas");
  expect(item.montoMetaCentavos).toBe(350000);
});

test("rechaza un nombre vacío", () => {
  expect(() => validarItem({ nombre: "   ", montoMetaCentavos: 1000 })).toThrow();
});

test("rechaza un monto meta menor o igual a cero", () => {
  expect(() => validarItem({ nombre: "Vajilla", montoMetaCentavos: 0 })).toThrow();
  expect(() => validarItem({ nombre: "Vajilla", montoMetaCentavos: -100 })).toThrow();
});

test("rechaza un monto meta no entero (los centavos son enteros)", () => {
  expect(() => validarItem({ nombre: "Vajilla", montoMetaCentavos: 1000.5 })).toThrow();
});
