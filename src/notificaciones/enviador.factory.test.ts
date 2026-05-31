import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { obtenerEnviador } from "./enviador.factory";

const ORIG = { ...process.env };
beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.CORREO_REMITENTE;
});
afterEach(() => {
  process.env = { ...ORIG };
});

test("sin RESEND_API_KEY devuelve un enviador no-op que no lanza", async () => {
  const enviador = obtenerEnviador();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  await expect(
    enviador.enviar({ destinatario: "a@b.com", plantilla: "bienvenida", datos: { nombreFestejado: "Ana" } }),
  ).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalled();

  warn.mockRestore();
});

test("con credenciales construye el enviador de Resend sin lanzar", () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.CORREO_REMITENTE = "RegalaLove <no-responder@regalalove.com>";

  expect(() => obtenerEnviador()).not.toThrow();
});
