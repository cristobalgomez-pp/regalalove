import { test, expect } from "vitest";
import { interpretarConfigMonetizacion } from "./monetizacion";

test("filas vacías devuelven todos los valores por defecto", () => {
  const config = interpretarConfigMonetizacion([]);

  expect(config.comisionBasePct).toBe(5);
  expect(config.comisionPremiumPct).toBe(3);
  expect(config.precioPremium).toBe(49900);
  expect(config.absorcionPreMarcada).toBe(true);
});

test("una fila comision_base_pct sobrescribe su default", () => {
  const config = interpretarConfigMonetizacion([
    { clave: "comision_base_pct", valor: "8" },
  ]);

  expect(config.comisionBasePct).toBe(8);
  expect(config.comisionPremiumPct).toBe(3); // los demás siguen en default
});

test("con todas las claves presentes, todos los valores vienen de la DB", () => {
  const config = interpretarConfigMonetizacion([
    { clave: "comision_base_pct", valor: "7" },
    { clave: "comision_premium_pct", valor: "2" },
    { clave: "precio_premium_centavos", valor: "79900" },
    { clave: "absorcion_pre_marcada", valor: "false" },
  ]);

  expect(config.comisionBasePct).toBe(7);
  expect(config.comisionPremiumPct).toBe(2);
  expect(config.precioPremium).toBe(79900);
  expect(config.absorcionPreMarcada).toBe(false);
});

test("absorcion_pre_marcada se interpreta como booleano", () => {
  const verdadero = interpretarConfigMonetizacion([
    { clave: "absorcion_pre_marcada", valor: "true" },
  ]);
  const falso = interpretarConfigMonetizacion([
    { clave: "absorcion_pre_marcada", valor: "false" },
  ]);

  expect(verdadero.absorcionPreMarcada).toBe(true);
  expect(falso.absorcionPreMarcada).toBe(false);
});

test("una clave desconocida se ignora", () => {
  const config = interpretarConfigMonetizacion([
    { clave: "algo_que_no_existe", valor: "123" },
    { clave: "comision_base_pct", valor: "6" },
  ]);

  expect(config.comisionBasePct).toBe(6);
  expect(config.comisionPremiumPct).toBe(3); // sin efectos secundarios
});

test("un valor numérico inválido lanza error", () => {
  expect(() =>
    interpretarConfigMonetizacion([{ clave: "comision_base_pct", valor: "abc" }]),
  ).toThrow();
});
