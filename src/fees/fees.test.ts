import { test, expect } from "vitest";
import { calcularComision } from "./fees";

const config = {
  comisionBasePct: 5,
  comisionPremiumPct: 3,
};

test("plan Gratis sin absorción: comisión 5%, el festejado recibe el neto", () => {
  const resultado = calcularComision(
    100000, // $1,000.00 en centavos
    { plan: "gratis", absorbeInvitado: false },
    config,
  );

  expect(resultado.comision).toBe(5000); // 5% de $1,000 = $50
  expect(resultado.montoInvitado).toBe(100000); // el invitado paga el monto
  expect(resultado.netoFestejado).toBe(95000); // recibe $950
});

test("plan Premium sin absorción: comisión 3%", () => {
  const resultado = calcularComision(
    100000,
    { plan: "premium", absorbeInvitado: false },
    config,
  );

  expect(resultado.comision).toBe(3000); // 3% de $1,000 = $30
  expect(resultado.montoInvitado).toBe(100000);
  expect(resultado.netoFestejado).toBe(97000); // recibe $970
});

test("con absorción (Gratis): el invitado cubre la comisión y el festejado recibe el 100%", () => {
  const resultado = calcularComision(
    100000,
    { plan: "gratis", absorbeInvitado: true },
    config,
  );

  expect(resultado.comision).toBe(5000);
  expect(resultado.montoInvitado).toBe(105000); // paga $1,050
  expect(resultado.netoFestejado).toBe(100000); // recibe $1,000 completo
});

test("con absorción (Premium): comisión 3% y el festejado recibe el 100%", () => {
  const resultado = calcularComision(
    100000,
    { plan: "premium", absorbeInvitado: true },
    config,
  );

  expect(resultado.comision).toBe(3000);
  expect(resultado.montoInvitado).toBe(103000); // paga $1,030
  expect(resultado.netoFestejado).toBe(100000);
});

test("el cálculo es dirigido por la configuración, no hardcodeado", () => {
  const otraConfig = { comisionBasePct: 8, comisionPremiumPct: 4 };
  const resultado = calcularComision(
    100000,
    { plan: "gratis", absorbeInvitado: false },
    otraConfig,
  );

  expect(resultado.comision).toBe(8000); // 8% según la nueva config
  expect(resultado.netoFestejado).toBe(92000);
});

test("la comisión se redondea al centavo más cercano", () => {
  // $333.33 × 5% = $16.6665 -> redondea a $16.67 (1667 centavos)
  const resultado = calcularComision(
    33333,
    { plan: "gratis", absorbeInvitado: false },
    config,
  );

  expect(resultado.comision).toBe(1667);
  expect(resultado.netoFestejado).toBe(31666);
});

test("rechaza un monto no positivo", () => {
  expect(() =>
    calcularComision(0, { plan: "gratis", absorbeInvitado: false }, config),
  ).toThrow();
  expect(() =>
    calcularComision(-500, { plan: "gratis", absorbeInvitado: false }, config),
  ).toThrow();
});
