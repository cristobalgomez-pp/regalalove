import { test, expect } from "vitest";
import { generarSlug } from "./slug";

test('"Juan y Ana" se convierte en "juan-y-ana"', () => {
  expect(generarSlug("Juan y Ana")).toBe("juan-y-ana");
});

test("quita acentos y pasa a minúsculas", () => {
  expect(generarSlug("Boda de José & María")).toBe("boda-de-jose-maria");
});

test("colapsa símbolos y espacios múltiples a un solo guion, sin extremos", () => {
  expect(generarSlug("  ¡Boda!!!   de    Pedro  ")).toBe("boda-de-pedro");
});

test("ante colisión, agrega un sufijo numérico", () => {
  expect(generarSlug("Juan y Ana", { existentes: ["juan-y-ana"] })).toBe("juan-y-ana-2");
  expect(
    generarSlug("Juan y Ana", { existentes: ["juan-y-ana", "juan-y-ana-2"] }),
  ).toBe("juan-y-ana-3");
});

test("evita palabras reservadas agregando sufijo", () => {
  expect(
    generarSlug("Login", { reservados: ["login", "dashboard", "registro"] }),
  ).toBe("login-2");
});

test("título vacío o solo símbolos genera un slug de respaldo", () => {
  expect(generarSlug("")).toBe("evento");
  expect(generarSlug("¡!!!###")).toBe("evento");
  expect(generarSlug("", { existentes: ["evento"] })).toBe("evento-2");
});
