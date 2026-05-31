import { test, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asentarAportacion, type RegistroAportacion } from "./persistencia";

/**
 * Doble en memoria de Supabase que replica la semántica relevante:
 * upsert con onConflict + ignoreDuplicates respeta la unicidad de la clave.
 * Es el contrato del que depende la idempotencia del asentado.
 */
function crearDbFake() {
  const filas: Record<string, unknown>[] = [];
  const cliente = {
    from() {
      return {
        upsert(
          registro: Record<string, unknown>,
          opts: { onConflict: string; ignoreDuplicates?: boolean },
        ) {
          const clave = opts.onConflict;
          const yaExiste = filas.some((f) => f[clave] === registro[clave]);
          if (!yaExiste) filas.push(registro);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { db: cliente as unknown as SupabaseClient, filas };
}

const base: RegistroAportacion = {
  eventoId: "mesa_1",
  itemId: null,
  cobroId: "cobro_abc",
  monto: 50000,
  metodoPago: "tarjeta",
  nombreInvitado: "Ana",
  correoInvitado: "ana@correo.com",
  mensaje: "",
  absorbeComision: false,
  comisionCentavos: 0,
};

test("asentar el mismo cobro dos veces deja una sola aportación", async () => {
  const { db, filas } = crearDbFake();

  await asentarAportacion(db, base);
  await asentarAportacion(db, base);

  expect(filas).toHaveLength(1);
});

test("cobros distintos se asientan como aportaciones separadas", async () => {
  const { db, filas } = crearDbFake();

  await asentarAportacion(db, base);
  await asentarAportacion(db, { ...base, cobroId: "cobro_xyz" });

  expect(filas).toHaveLength(2);
});
