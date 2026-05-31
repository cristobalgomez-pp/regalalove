import { test, expect } from "vitest";
import { evaluarAccesoMesa } from "./acceso";

test("una mesa cuyo festejado es el usuario es propia", () => {
  expect(evaluarAccesoMesa({ festejado_id: "u1" }, "u1")).toBe("propia");
});

test("una mesa de otro festejado es ajena", () => {
  expect(evaluarAccesoMesa({ festejado_id: "u2" }, "u1")).toBe("ajena");
});

test("una mesa inexistente no es de nadie", () => {
  expect(evaluarAccesoMesa(null, "u1")).toBe("inexistente");
});
