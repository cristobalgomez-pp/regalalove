import { test, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listarEventosAdmin } from "./eventos";

const config = { ventanaRetencionDias: 7 };

/** Doble en memoria de Supabase para el panel admin: extiende el de
 * datos-mesa con `.in()`, `auth.admin.listUsers()` y un contador de lecturas
 * por tabla (para probar que NO hay N+1). */
function crearDb(
  seed: Record<string, Record<string, unknown>[]>,
  usuarios: { id: string; email: string }[] = [],
) {
  const conteoFrom: Record<string, number> = {};

  function builder(tabla: string) {
    conteoFrom[tabla] = (conteoFrom[tabla] ?? 0) + 1;
    let rows = [...(seed[tabla] ?? [])];
    const b = {
      select: () => b,
      eq: (col: string, val: unknown) => {
        rows = rows.filter((r) => r[col] === val);
        return b;
      },
      in: (col: string, vals: unknown[]) => {
        rows = rows.filter((r) => vals.includes(r[col]));
        return b;
      },
      order: (col: string, { ascending }: { ascending: boolean }) => {
        rows = [...rows].sort((a, z) =>
          (a[col] as number | string) < (z[col] as number | string)
            ? ascending ? -1 : 1
            : ascending ? 1 : -1,
        );
        return b;
      },
      then: (resolve: (r: { data: unknown[]; error: null }) => void) =>
        resolve({ data: rows, error: null }),
    };
    return b;
  }

  const db = {
    from: (t: string) => builder(t),
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: usuarios }, error: null }),
      },
    },
  } as unknown as SupabaseClient;

  return { db, conteoFrom };
}

test("lista los eventos (cross-festejado) con su saldo, email y moderación", async () => {
  const { db } = crearDb(
    {
      eventos: [
        { id: "e1", slug: "boda-ana", titulo: "Boda Ana", festejado_id: "u1", sospechoso: false, nota_admin: null, creado_en: "2026-01-02" },
        { id: "e2", slug: "xv-luz", titulo: "XV Luz", festejado_id: "u2", sospechoso: true, nota_admin: "ojo", creado_en: "2026-01-01" },
      ],
      items_mesa: [
        { id: "i1", evento_id: "e1", nombre: "Vajilla", descripcion: null, imagen_url: null, monto_meta_centavos: 350000, cantidad: 1, orden: 0 },
      ],
      aportaciones: [
        { id: "c1", evento_id: "e1", estado: "confirmada", nombre_invitado: "Tía", monto_centavos: 50000, item_id: "i1", mensaje: null, metodo_pago: "spei", creado_en: "2026-01-03" },
        { id: "c2", evento_id: "e2", estado: "confirmada", nombre_invitado: "Primo", monto_centavos: 20000, item_id: null, mensaje: null, metodo_pago: "spei", creado_en: "2026-01-03" },
        { id: "c3", evento_id: "e1", estado: "pendiente", nombre_invitado: "X", monto_centavos: 99999, item_id: null, mensaje: null, metodo_pago: "spei", creado_en: "2026-01-04" },
      ],
    },
    [
      { id: "u1", email: "ana@pp.com" },
      { id: "u2", email: "luz@pp.com" },
    ],
  );

  const filas = await listarEventosAdmin(db, { ahora: 1_700_000_000_000, config });

  // ordenados por creado_en desc
  expect(filas.map((f) => f.id)).toEqual(["e1", "e2"]);

  const e1 = filas.find((f) => f.id === "e1")!;
  expect(e1.saldoTotal).toBe(50000); // ignora la aportación pendiente
  expect(e1.nAportaciones).toBe(1);
  expect(e1.festejadoEmail).toBe("ana@pp.com");

  const e2 = filas.find((f) => f.id === "e2")!;
  expect(e2.saldoTotal).toBe(20000);
  expect(e2.sospechoso).toBe(true);
  expect(e2.notaAdmin).toBe("ojo");
  expect(e2.festejadoEmail).toBe("luz@pp.com");
});

test("no hace N+1: una sola lectura de items_mesa y de aportaciones sin importar cuántos eventos", async () => {
  const eventos = Array.from({ length: 5 }, (_, i) => ({
    id: `e${i}`,
    slug: `s${i}`,
    titulo: `T${i}`,
    festejado_id: "u1",
    sospechoso: false,
    nota_admin: null,
    creado_en: `2026-01-0${i + 1}`,
  }));
  const { db, conteoFrom } = crearDb(
    { eventos, items_mesa: [], aportaciones: [] },
    [{ id: "u1", email: "a@pp.com" }],
  );

  await listarEventosAdmin(db, { ahora: 1, config });

  expect(conteoFrom.items_mesa).toBe(1);
  expect(conteoFrom.aportaciones).toBe(1);
});

test("mesa sin eventos devuelve lista vacía sin leer ítems ni aportaciones", async () => {
  const { db, conteoFrom } = crearDb({ eventos: [] });

  const filas = await listarEventosAdmin(db, { ahora: 1, config });

  expect(filas).toEqual([]);
  expect(conteoFrom.items_mesa).toBeUndefined();
  expect(conteoFrom.aportaciones).toBeUndefined();
});
