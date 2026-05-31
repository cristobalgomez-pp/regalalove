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

test("cada cobro recibe un cobroId único, incluso entre pasarelas distintas", async () => {
  // En producción se crea una pasarela nueva por request. El cobroId es la
  // clave de idempotencia, así que dos cobros distintos NO deben colisionar
  // (si colisionaran, asentar el segundo se deduplicaría contra el primero).
  const params = {
    mesaId: "mesa_abc",
    itemId: null,
    monto: 30000,
    metodoPago: "tarjeta" as const,
    invitado: { nombre: "Ana", mensaje: "" },
  };

  const cobroA = await crearEcartPayFake().crearCobro(params);
  const cobroB = await crearEcartPayFake().crearCobro(params);

  expect(cobroA.cobroId).not.toBe(cobroB.cobroId);
});
