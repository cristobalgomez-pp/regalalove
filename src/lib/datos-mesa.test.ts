import { test, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { itemsDeMesa, aportacionesConfirmadas } from "./datos-mesa";

/** Doble en memoria de Supabase: aplica select/eq/order sobre datos sembrados. */
function crearDb(seed: Record<string, Record<string, unknown>[]>): SupabaseClient {
  function builder(tabla: string) {
    let rows = [...(seed[tabla] ?? [])];
    const b = {
      select: () => b,
      eq: (col: string, val: unknown) => {
        rows = rows.filter((r) => r[col] === val);
        return b;
      },
      order: (col: string, { ascending }: { ascending: boolean }) => {
        rows = [...rows].sort((a, z) =>
          (a[col] as number | string) < (z[col] as number | string) ? (ascending ? -1 : 1) : (ascending ? 1 : -1),
        );
        return b;
      },
      then: (resolve: (r: { data: unknown[]; error: null }) => void) => resolve({ data: rows, error: null }),
    };
    return b;
  }
  return { from: (t: string) => builder(t) } as unknown as SupabaseClient;
}

test("aportacionesConfirmadas solo devuelve las confirmadas de esa mesa", async () => {
  const db = crearDb({
    aportaciones: [
      { id: "1", evento_id: "m1", estado: "confirmada", creado_en: "2026-01-01" },
      { id: "2", evento_id: "m1", estado: "pendiente", creado_en: "2026-01-02" },
      { id: "3", evento_id: "m2", estado: "confirmada", creado_en: "2026-01-03" },
    ],
  });

  const r = await aportacionesConfirmadas(db, "m1");

  expect(r.map((a) => a.id)).toEqual(["1"]);
});

test("itemsDeMesa devuelve los ítems de la mesa ordenados por orden", async () => {
  const db = crearDb({
    items_mesa: [
      { id: "b", evento_id: "m1", orden: 1 },
      { id: "a", evento_id: "m1", orden: 0 },
      { id: "c", evento_id: "m2", orden: 0 },
    ],
  });

  const r = await itemsDeMesa(db, "m1");

  expect(r.map((i) => i.id)).toEqual(["a", "b"]);
});
