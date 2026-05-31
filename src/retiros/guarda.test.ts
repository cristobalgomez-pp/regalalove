import { test, expect } from "vitest";
import { puedeRetirar } from "./guarda";

test("permite retirar de un evento no sospechoso", () => {
  expect(puedeRetirar({ sospechoso: false })).toBe(true);
});

test("bloquea el retiro de un evento sospechoso", () => {
  expect(puedeRetirar({ sospechoso: true })).toBe(false);
});
