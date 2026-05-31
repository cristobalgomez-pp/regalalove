import { test, expect } from "vitest";
import { renderizar } from "./plantillas";
import type { CorreoPendiente } from "./correos";

test("comprobante_invitado: asunto, datos y marca en el html", () => {
  const correo: CorreoPendiente = {
    destinatario: "lucha@example.com",
    plantilla: "comprobante_invitado",
    datos: { nombreInvitado: "Tía Lucha", monto: 50000, itemNombre: "Vajilla" },
  };
  const { asunto, html } = renderizar(correo);
  expect(asunto).toBe("Tu regalo fue recibido 🎁");
  expect(html).toContain("Tía Lucha");
  expect(html).toContain("Vajilla");
  expect(html).toContain("$500.00");
  expect(html).toContain("Love");
});

test("aviso_aportacion_festejado: invitado, monto, item y CTA al panel", () => {
  const correo: CorreoPendiente = {
    destinatario: "ana@example.com",
    plantilla: "aviso_aportacion_festejado",
    datos: { nombreFestejado: "Ana", nombreInvitado: "Tía Lucha", monto: 50000, itemNombre: "Vajilla" },
  };
  const { asunto, html } = renderizar(correo);
  expect(asunto).toContain("regalo");
  expect(html).toContain("Tía Lucha");
  expect(html).toContain("$500.00");
  expect(html).toContain("/dashboard");
});

test("aviso_retiro_festejado: incluye el monto", () => {
  const correo: CorreoPendiente = {
    destinatario: "ana@example.com",
    plantilla: "aviso_retiro_festejado",
    datos: { nombreFestejado: "Ana", monto: 120000 },
  };
  expect(renderizar(correo).html).toContain("$1,200.00");
});

test("bienvenida: saluda al festejado y enlaza a crear mesa", () => {
  const correo: CorreoPendiente = {
    destinatario: "ana@example.com",
    plantilla: "bienvenida",
    datos: { nombreFestejado: "Ana" },
  };
  const { asunto, html } = renderizar(correo);
  expect(asunto).toContain("Bienvenido");
  expect(html).toContain("Ana");
  expect(html).toContain("/dashboard");
});
