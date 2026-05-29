import { test, expect } from "vitest";
import {
  crearMesa,
  registrarAportacion,
  saldoTotal,
  progresoItem,
  estaCompletado,
  saldoFondoGeneral,
} from "./ledger";

test("una aportación al fondo general incrementa el saldo total", () => {
  let mesa = crearMesa([]);
  mesa = registrarAportacion(mesa, {
    destino: "general",
    monto: 50000, // $500.00 en centavos
    metodoPago: "tarjeta",
  });

  expect(saldoTotal(mesa)).toBe(50000);
});

test("una aportación a un ítem incrementa su progreso y el saldo total", () => {
  let mesa = crearMesa([{ id: "vajilla", montoMeta: 350000 }]);
  mesa = registrarAportacion(mesa, {
    destino: "vajilla",
    monto: 30000, // $300.00
    metodoPago: "tarjeta",
  });

  expect(progresoItem(mesa, "vajilla").montoFondeado).toBe(30000);
  expect(saldoTotal(mesa)).toBe(30000);
});

test("varias aportaciones fraccionadas al mismo ítem acumulan progreso", () => {
  let mesa = crearMesa([{ id: "vajilla", montoMeta: 350000 }]);
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 30000, metodoPago: "tarjeta" });
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 100000, metodoPago: "oxxo" });
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 20000, metodoPago: "spei" });

  expect(progresoItem(mesa, "vajilla").montoFondeado).toBe(150000);
  expect(saldoTotal(mesa)).toBe(150000);
});

test("el progreso del ítem reporta monto fondeado, meta y porcentaje", () => {
  let mesa = crearMesa([{ id: "refri", montoMeta: 1200000 }]);
  mesa = registrarAportacion(mesa, { destino: "refri", monto: 300000, metodoPago: "tarjeta" });

  const progreso = progresoItem(mesa, "refri");
  expect(progreso.montoFondeado).toBe(300000);
  expect(progreso.montoMeta).toBe(1200000);
  expect(progreso.porcentaje).toBe(25);
});

test("un ítem queda completado al alcanzar su meta", () => {
  let mesa = crearMesa([{ id: "vajilla", montoMeta: 350000 }]);
  expect(estaCompletado(mesa, "vajilla")).toBe(false);

  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 350000, metodoPago: "spei" });
  expect(estaCompletado(mesa, "vajilla")).toBe(true);
});

test("el excedente de una aportación sobre la meta va al fondo general", () => {
  let mesa = crearMesa([{ id: "vajilla", montoMeta: 350000 }]);
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 300000, metodoPago: "tarjeta" });
  // faltan $500; aporto $800 -> $500 completan el ítem, $300 sobran
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 80000, metodoPago: "tarjeta" });

  expect(progresoItem(mesa, "vajilla").montoFondeado).toBe(350000);
  expect(estaCompletado(mesa, "vajilla")).toBe(true);
  expect(saldoFondoGeneral(mesa)).toBe(30000);
  expect(saldoTotal(mesa)).toBe(380000);
});

test("aportar a un ítem ya completado va íntegro al fondo general", () => {
  let mesa = crearMesa([{ id: "vajilla", montoMeta: 350000 }]);
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 350000, metodoPago: "spei" });
  mesa = registrarAportacion(mesa, { destino: "vajilla", monto: 50000, metodoPago: "tarjeta" });

  expect(progresoItem(mesa, "vajilla").montoFondeado).toBe(350000);
  expect(saldoFondoGeneral(mesa)).toBe(50000);
});

test("rechaza una aportación con monto no positivo", () => {
  const mesa = crearMesa([{ id: "vajilla", montoMeta: 350000 }]);
  expect(() =>
    registrarAportacion(mesa, { destino: "general", monto: 0, metodoPago: "tarjeta" }),
  ).toThrow();
  expect(() =>
    registrarAportacion(mesa, { destino: "vajilla", monto: -100, metodoPago: "tarjeta" }),
  ).toThrow();
});
