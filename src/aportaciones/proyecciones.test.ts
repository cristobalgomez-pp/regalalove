import { test, expect } from "vitest";
import { feedDe, entradaLedger } from "./proyecciones";
import type { AportacionAsentada } from "../pagos/webhook";
import type { AportacionPersistida } from "../ledger/reconstruir";

const asentada: AportacionAsentada = {
  itemId: "vajilla",
  monto: 50000,
  metodoPago: "tarjeta",
  fecha: 10,
  cobroId: "cobro_1",
  nombre: "Tía Lucha",
  mensaje: "¡Felicidades!",
};

test("feedDe proyecta una aportación asentada al feed del panel", () => {
  expect(feedDe(asentada)).toEqual({
    nombre: "Tía Lucha",
    monto: 50000,
    itemId: "vajilla",
    mensaje: "¡Felicidades!",
  });
});

test("entradaLedger usa el itemId como destino", () => {
  const persistida: AportacionPersistida = {
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
    fecha: 10,
  };
  expect(entradaLedger(persistida)).toEqual({
    destino: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
  });
});

test("entradaLedger manda al fondo general cuando no hay itemId", () => {
  const persistida: AportacionPersistida = {
    itemId: null,
    monto: 30000,
    metodoPago: "spei",
    fecha: 5,
  };
  expect(entradaLedger(persistida).destino).toBe("general");
});
