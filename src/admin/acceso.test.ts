import { test, expect } from "vitest";
import { esAdmin } from "./acceso";

test("acepta un correo presente en la allowlist", () => {
  expect(esAdmin("cris@pp.com", "cris@pp.com,otro@pp.com")).toBe(true);
});

test("es case-insensitive y tolera espacios", () => {
  expect(esAdmin("  CRIS@PP.com ", "cris@pp.com")).toBe(true);
  expect(esAdmin("cris@pp.com", " CRIS@PP.COM , otro@pp.com ")).toBe(true);
});

test("rechaza un correo fuera de la allowlist", () => {
  expect(esAdmin("intruso@pp.com", "cris@pp.com")).toBe(false);
});

test("allowlist vacía o correo nulo ⇒ false", () => {
  expect(esAdmin("cris@pp.com", "")).toBe(false);
  expect(esAdmin(null, "cris@pp.com")).toBe(false);
  expect(esAdmin(undefined, "cris@pp.com")).toBe(false);
  expect(esAdmin("", "cris@pp.com")).toBe(false);
});

test("ignora entradas vacías de la lista (comas colgantes)", () => {
  expect(esAdmin("cris@pp.com", "cris@pp.com,,")).toBe(true);
  expect(esAdmin("", "a@pp.com,,b@pp.com")).toBe(false);
});
