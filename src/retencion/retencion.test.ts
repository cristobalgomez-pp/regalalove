import { test, expect } from "vitest";
import { calcularRetencion } from "./retencion";

const config = { ventanaRetencionDias: 7 };
const DIA_MS = 24 * 60 * 60 * 1000;
const AHORA = 1_700_000_000_000; // epoch fijo de referencia

test("una aportación por SPEI es retirable de inmediato", () => {
  const aportaciones = [
    { monto: 50000, metodoPago: "spei" as const, fecha: AHORA },
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config);

  expect(resultado.retirable).toBe(50000);
  expect(resultado.retenido).toBe(0);
});

test("una aportación con tarjeta dentro de la ventana está retenida", () => {
  const aportaciones = [
    { monto: 80000, metodoPago: "tarjeta" as const, fecha: AHORA },
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config);

  expect(resultado.retenido).toBe(80000);
  expect(resultado.retirable).toBe(0);
});

test("una aportación con tarjeta cuya ventana ya venció es retirable", () => {
  const aportaciones = [
    { monto: 80000, metodoPago: "tarjeta" as const, fecha: AHORA - 8 * DIA_MS },
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config);

  expect(resultado.retirable).toBe(80000);
  expect(resultado.retenido).toBe(0);
});

test("OXXO y CoDi son retirables de inmediato aunque sean recientes", () => {
  const aportaciones = [
    { monto: 30000, metodoPago: "oxxo" as const, fecha: AHORA },
    { monto: 20000, metodoPago: "codi" as const, fecha: AHORA },
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config);

  expect(resultado.retirable).toBe(50000);
  expect(resultado.retenido).toBe(0);
});

test("mezcla de métodos y fechas: suma correcta de retirable y retenido", () => {
  const aportaciones = [
    { monto: 80000, metodoPago: "tarjeta" as const, fecha: AHORA }, // retenida
    { monto: 40000, metodoPago: "tarjeta" as const, fecha: AHORA - 10 * DIA_MS }, // retirable
    { monto: 50000, metodoPago: "spei" as const, fecha: AHORA }, // retirable
    { monto: 30000, metodoPago: "oxxo" as const, fecha: AHORA - DIA_MS }, // retirable
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config);

  expect(resultado.retenido).toBe(80000);
  expect(resultado.retirable).toBe(120000);
});

test("la ventana de retención es configurable", () => {
  const config14 = { ventanaRetencionDias: 14 };
  const aportaciones = [
    { monto: 80000, metodoPago: "tarjeta" as const, fecha: AHORA - 10 * DIA_MS },
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config14);

  // 10 días < 14 -> sigue retenida (con la config de 7 días sería retirable)
  expect(resultado.retenido).toBe(80000);
  expect(resultado.retirable).toBe(0);
});

test("justo en el límite de la ventana ya es retirable", () => {
  const aportaciones = [
    { monto: 80000, metodoPago: "tarjeta" as const, fecha: AHORA - 7 * DIA_MS },
  ];

  const resultado = calcularRetencion(aportaciones, AHORA, config);

  expect(resultado.retirable).toBe(80000);
  expect(resultado.retenido).toBe(0);
});
