import { test, expect } from "vitest";
import { enviarCorreos } from "./enviador";
import { crearEnviadorFake } from "./enviador.fake";
import type { CorreoPendiente } from "./correos";

const correos: CorreoPendiente[] = [
  { destinatario: "lucha@example.com", plantilla: "comprobante_invitado", datos: { monto: 50000 } },
  { destinatario: "ana@example.com", plantilla: "aviso_aportacion_festejado", datos: { monto: 50000 } },
];

test("enviarCorreos despacha cada correo pendiente por el puerto", async () => {
  const enviador = crearEnviadorFake();

  await enviarCorreos(enviador, correos);

  expect(enviador.enviados).toHaveLength(2);
  expect(enviador.enviados.map((c) => c.destinatario)).toEqual([
    "lucha@example.com",
    "ana@example.com",
  ]);
});
