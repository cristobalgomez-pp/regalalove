import { test, expect } from "vitest";
import { prepararCheckout, absorcionPorDefecto } from "./absorcion";

const config = {
  comisionBasePct: 5,
  comisionPremiumPct: 3,
  precioPremium: 49900,
  absorcionPreMarcada: true,
};

test("con la casilla marcada el invitado absorbe la comisión y el festejado recibe el 100%", () => {
  const checkout = prepararCheckout(
    100000,
    { plan: "gratis", absorbeInvitado: true },
    config,
  );

  expect(checkout.comision).toBe(5000); // 5% de 100000
  expect(checkout.totalInvitado).toBe(105000); // regalo + comisión
  expect(checkout.netoFestejado).toBe(100000); // recibe el 100%
});

test("con la casilla desmarcada el invitado paga solo el regalo y la comisión se descuenta al festejado", () => {
  const checkout = prepararCheckout(
    100000,
    { plan: "gratis", absorbeInvitado: false },
    config,
  );

  expect(checkout.comision).toBe(5000); // 5% de 100000
  expect(checkout.totalInvitado).toBe(100000); // solo el regalo
  expect(checkout.netoFestejado).toBe(95000); // se le descuenta la comisión
});

test("el estado inicial de la casilla respeta el default de la config", () => {
  expect(absorcionPorDefecto({ ...config, absorcionPreMarcada: true })).toBe(true);
  expect(absorcionPorDefecto({ ...config, absorcionPreMarcada: false })).toBe(false);
});

test("usa el porcentaje premium cuando el plan es premium", () => {
  const checkout = prepararCheckout(
    100000,
    { plan: "premium", absorbeInvitado: true },
    config,
  );

  expect(checkout.comision).toBe(3000); // 3% premium, no 5% base
  expect(checkout.totalInvitado).toBe(103000);
});
