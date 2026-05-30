import { test, expect } from "vitest";
import { renderizar } from "./resend";

test("comprobante_invitado: asunto, datos y marca en el html", () => {
  const { asunto, html } = renderizar("comprobante_invitado", {
    nombreInvitado: "Tía Lucha",
    monto: 50000,
    itemNombre: "Vajilla",
  });
  expect(asunto).toBe("Tu regalo fue recibido 🎁");
  expect(html).toContain("Tía Lucha");
  expect(html).toContain("Vajilla");
  expect(html).toContain("$500.00");
  expect(html).toContain("Love");
});

test("aviso_aportacion_festejado: invitado, monto, item y CTA al panel", () => {
  const { asunto, html } = renderizar("aviso_aportacion_festejado", {
    nombreFestejado: "Ana",
    nombreInvitado: "Tía Lucha",
    monto: 50000,
    itemNombre: "Vajilla",
  });
  expect(asunto).toContain("regalo");
  expect(html).toContain("Tía Lucha");
  expect(html).toContain("$500.00");
  expect(html).toContain("/dashboard");
});

test("aviso_retiro_festejado: incluye el monto", () => {
  const { html } = renderizar("aviso_retiro_festejado", { nombreFestejado: "Ana", monto: 120000 });
  expect(html).toContain("$1,200.00");
});

test("bienvenida: saluda al festejado y enlaza a crear mesa", () => {
  const { asunto, html } = renderizar("bienvenida", { nombreFestejado: "Ana" });
  expect(asunto).toContain("Bienvenido");
  expect(html).toContain("Ana");
  expect(html).toContain("/dashboard");
});
