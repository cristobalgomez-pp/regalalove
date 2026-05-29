import { test, expect } from "vitest";
import { aplicarEventoPago } from "./webhook";
import type { EventoPago } from "./webhook";

const eventoConfirmado: EventoPago = {
  tipo: "pago.confirmado",
  cobroId: "cobro_1",
  itemId: "vajilla",
  monto: 50000,
  metodoPago: "tarjeta",
  fecha: 1,
  invitado: { nombre: "Tía Lucha", mensaje: "¡Felicidades!" },
};

test("un webhook de pago confirmado asienta la aportación en el Ledger", () => {
  const aportaciones = aplicarEventoPago([], eventoConfirmado);

  expect(aportaciones).toHaveLength(1);
  expect(aportaciones[0]).toMatchObject({
    cobroId: "cobro_1",
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
    fecha: 1,
    nombre: "Tía Lucha",
    mensaje: "¡Felicidades!",
  });
});

test("el mismo webhook recibido dos veces solo asienta la aportación una vez", () => {
  const unaVez = aplicarEventoPago([], eventoConfirmado);
  const dosVeces = aplicarEventoPago(unaVez, eventoConfirmado);

  expect(dosVeces).toHaveLength(1);
});

test("un webhook de pago fallido no asienta ninguna aportación", () => {
  const evento: EventoPago = { ...eventoConfirmado, tipo: "pago.fallido" };

  const aportaciones = aplicarEventoPago([], evento);

  expect(aportaciones).toHaveLength(0);
});

test("un contracargo revierte la aportación de tarjeta ya asentada", () => {
  const asentada = aplicarEventoPago([], eventoConfirmado);
  const contracargo: EventoPago = {
    ...eventoConfirmado,
    tipo: "contracargo",
    fecha: 2,
  };

  const aportaciones = aplicarEventoPago(asentada, contracargo);

  expect(aportaciones).toHaveLength(0);
});
