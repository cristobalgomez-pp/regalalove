import { test, expect } from "vitest";
import { resumenDashboard } from "./resumen";
import type { AportacionAsentada } from "../pagos/webhook";

const config = { ventanaRetencionDias: 7 };
const items = [{ id: "vajilla", montoMeta: 350000 }];

function aportacion(p: Partial<AportacionAsentada>): AportacionAsentada {
  return {
    cobroId: "cobro_1",
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "spei",
    fecha: 1,
    nombre: "Tía Lucha",
    mensaje: "¡Felicidades!",
    ...p,
  };
}

test("calcula el saldo total a partir de las aportaciones asentadas", () => {
  const asentadas = [
    aportacion({ cobroId: "c1", monto: 50000 }),
    aportacion({ cobroId: "c2", monto: 30000, itemId: null }),
  ];

  const resumen = resumenDashboard(items, asentadas, 1, config);

  expect(resumen.saldoTotal).toBe(80000);
});

test("expone el saldo retirable y el retenido (vía retención)", () => {
  const DIA_MS = 24 * 60 * 60 * 1000;
  const ahora = 1_700_000_000_000;
  const asentadas = [
    // tarjeta reciente → retenida
    aportacion({ cobroId: "c1", monto: 80000, metodoPago: "tarjeta", fecha: ahora }),
    // spei → retirable de inmediato
    aportacion({ cobroId: "c2", monto: 50000, metodoPago: "spei", fecha: ahora }),
    // tarjeta vieja (fuera de ventana) → retirable
    aportacion({ cobroId: "c3", monto: 40000, metodoPago: "tarjeta", fecha: ahora - 8 * DIA_MS }),
  ];

  const resumen = resumenDashboard(items, asentadas, ahora, config);

  expect(resumen.retenido).toBe(80000);
  expect(resumen.retirable).toBe(90000);
});

test("lista las aportaciones del feed (nombre, monto, ítem, mensaje), de la más reciente a la más antigua", () => {
  const asentadas = [
    aportacion({ cobroId: "c1", monto: 50000, itemId: "vajilla", nombre: "Tía Lucha", mensaje: "¡Felicidades!", fecha: 1 }),
    aportacion({ cobroId: "c2", monto: 30000, itemId: null, nombre: "Primo Beto", mensaje: "Para lo que falte", fecha: 2 }),
  ];

  const resumen = resumenDashboard(items, asentadas, 3, config);

  expect(resumen.aportaciones).toEqual([
    { nombre: "Primo Beto", monto: 30000, itemId: null, mensaje: "Para lo que falte" },
    { nombre: "Tía Lucha", monto: 50000, itemId: "vajilla", mensaje: "¡Felicidades!" },
  ]);
});
