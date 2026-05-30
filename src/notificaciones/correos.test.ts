import { test, expect } from "vitest";
import { correosPorAportacion, correoPorRetiro, correoBienvenida } from "./correos";

const aportacion = {
  invitado: { nombre: "Tía Lucha", correo: "lucha@example.com", mensaje: "¡Felicidades!" },
  monto: 50000,
  itemNombre: "Vajilla",
};

const festejado = { nombre: "Ana", correo: "ana@example.com" };

test("una aportación genera un comprobante por correo para el invitado", () => {
  const correos = correosPorAportacion(aportacion, festejado);

  const comprobante = correos.find((c) => c.plantilla === "comprobante_invitado");
  expect(comprobante).toBeDefined();
  expect(comprobante!.destinatario).toBe("lucha@example.com");
  expect(comprobante!.datos).toMatchObject({
    nombreInvitado: "Tía Lucha",
    monto: 50000,
    itemNombre: "Vajilla",
  });
});

test("una aportación genera un aviso por correo para el festejado", () => {
  const correos = correosPorAportacion(aportacion, festejado);

  const aviso = correos.find((c) => c.plantilla === "aviso_aportacion_festejado");
  expect(aviso).toBeDefined();
  expect(aviso!.destinatario).toBe("ana@example.com");
  expect(aviso!.datos).toMatchObject({
    nombreFestejado: "Ana",
    nombreInvitado: "Tía Lucha",
    monto: 50000,
    itemNombre: "Vajilla",
  });
});

test("un retiro completado genera un aviso por correo para el festejado", () => {
  const correo = correoPorRetiro({ monto: 120000 }, festejado);

  expect(correo.plantilla).toBe("aviso_retiro_festejado");
  expect(correo.destinatario).toBe("ana@example.com");
  expect(correo.datos).toMatchObject({
    nombreFestejado: "Ana",
    monto: 120000,
  });
});

test("la bienvenida va al festejado con su nombre", () => {
  const correo = correoBienvenida({ nombre: "Ana", correo: "ana@example.com" });

  expect(correo.plantilla).toBe("bienvenida");
  expect(correo.destinatario).toBe("ana@example.com");
  expect(correo.datos).toMatchObject({ nombreFestejado: "Ana" });
});
