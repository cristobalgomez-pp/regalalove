import { test, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aplicarEventoPagoPersistido, type ContextoCobro } from "./confirmacion";
import type { EventoPago } from "./webhook";

function crearDbFake() {
  const filas: Record<string, unknown>[] = [];
  const db = {
    from() {
      return {
        upsert(reg: Record<string, unknown>, opts: { onConflict: string; ignoreDuplicates?: boolean }) {
          if (!filas.some((f) => f[opts.onConflict] === reg[opts.onConflict])) filas.push({ ...reg });
          return Promise.resolve({ error: null });
        },
        update(cambios: Record<string, unknown>) {
          return {
            eq(col: string, val: unknown) {
              for (const f of filas) if (f[col] === val) Object.assign(f, cambios);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  return { db: db as unknown as SupabaseClient, filas };
}

const ctx: ContextoCobro = {
  eventoId: "mesa_1",
  correoInvitado: "ana@example.com",
  absorbeComision: false,
  comisionCentavos: 0,
};

const confirmado: EventoPago = {
  tipo: "pago.confirmado",
  cobroId: "c1",
  itemId: "vajilla",
  monto: 50000,
  metodoPago: "tarjeta",
  fecha: 1,
  invitado: { nombre: "Ana", mensaje: "¡Felicidades!" },
};

test("un pago confirmado asienta la aportación", async () => {
  const { db, filas } = crearDbFake();
  await aplicarEventoPagoPersistido(db, confirmado, ctx);
  expect(filas).toHaveLength(1);
  expect(filas[0]).toMatchObject({ cobro_id: "c1", evento_id: "mesa_1", estado: "confirmada", monto_centavos: 50000 });
});

test("el mismo pago confirmado dos veces no duplica", async () => {
  const { db, filas } = crearDbFake();
  await aplicarEventoPagoPersistido(db, confirmado, ctx);
  await aplicarEventoPagoPersistido(db, confirmado, ctx);
  expect(filas).toHaveLength(1);
});

test("un pago fallido no asienta nada", async () => {
  const { db, filas } = crearDbFake();
  await aplicarEventoPagoPersistido(db, { ...confirmado, tipo: "pago.fallido" }, ctx);
  expect(filas).toHaveLength(0);
});

test("un contracargo revierte la aportación de ese cobro", async () => {
  const { db, filas } = crearDbFake();
  await aplicarEventoPagoPersistido(db, confirmado, ctx);
  await aplicarEventoPagoPersistido(db, { ...confirmado, tipo: "contracargo" }, ctx);
  expect(filas[0]).toMatchObject({ cobro_id: "c1", estado: "revertida" });
});
