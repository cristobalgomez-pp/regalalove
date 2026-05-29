import { test, expect } from "vitest";
import { reconstruirEstadoMesa } from "./reconstruir";
import { progresoItem, saldoFondoGeneral } from "./ledger";

test("reconstruye el progreso de un ítem a partir de sus aportaciones", () => {
  const estado = reconstruirEstadoMesa(
    [{ id: "vajilla", montoMeta: 350000 }],
    [
      { itemId: "vajilla", monto: 30000, metodoPago: "tarjeta", fecha: 1 },
      { itemId: "vajilla", monto: 50000, metodoPago: "spei", fecha: 2 },
    ],
  );

  expect(progresoItem(estado, "vajilla").montoFondeado).toBe(80000);
});

test("una aportación con itemId null va al fondo general", () => {
  const estado = reconstruirEstadoMesa(
    [{ id: "vajilla", montoMeta: 350000 }],
    [{ itemId: null, monto: 25000, metodoPago: "oxxo", fecha: 1 }],
  );

  expect(saldoFondoGeneral(estado)).toBe(25000);
  expect(progresoItem(estado, "vajilla").montoFondeado).toBe(0);
});

test("el sobre-fondeo de un ítem fluye al fondo general (vía el puente)", () => {
  const estado = reconstruirEstadoMesa(
    [{ id: "vajilla", montoMeta: 350000 }],
    [
      { itemId: "vajilla", monto: 300000, metodoPago: "tarjeta", fecha: 1 },
      { itemId: "vajilla", monto: 80000, metodoPago: "tarjeta", fecha: 2 },
    ],
  );

  expect(progresoItem(estado, "vajilla").montoFondeado).toBe(350000);
  expect(saldoFondoGeneral(estado)).toBe(30000);
});
