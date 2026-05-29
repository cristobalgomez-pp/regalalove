import { test, expect } from "vitest";
import { crearEcartPayFake } from "./ecartpay.fake";

test("crearCobro genera un cobro guest capturando nombre y mensaje sin cuenta", async () => {
  const pasarela = crearEcartPayFake();

  const cobro = await pasarela.crearCobro({
    mesaId: "mesa_abc",
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "oxxo",
    invitado: { nombre: "Tía Lucha", mensaje: "¡Felicidades!" },
  });

  expect(cobro.cobroId).toBeTruthy();
  expect(cobro.referencia).toBeTruthy();

  // El fake registra lo que recibió: guest checkout (sin cuenta) con su
  // método de pago intacto hacia el gateway.
  expect(pasarela.cobros[0]).toMatchObject({
    monto: 50000,
    metodoPago: "oxxo",
    invitado: { nombre: "Tía Lucha", mensaje: "¡Felicidades!" },
  });
});
