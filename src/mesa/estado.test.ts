import { test, expect } from "vitest";
import { componerEstadoMesa } from "./estado";
import type { ItemMesaRow, AportacionConfirmadaRow } from "../lib/datos-mesa";

const config = { ventanaRetencionDias: 7 };

function item(p: Partial<ItemMesaRow> & { id: string }): ItemMesaRow {
  return {
    id: p.id,
    nombre: p.nombre ?? p.id,
    descripcion: null,
    imagen_url: null,
    monto_meta_centavos: p.monto_meta_centavos ?? 350000,
    cantidad: p.cantidad ?? 1,
    orden: p.orden ?? 0,
  };
}

function aporte(
  p: Partial<AportacionConfirmadaRow> & { id: string },
): AportacionConfirmadaRow {
  return {
    id: p.id,
    nombre_invitado: p.nombre_invitado ?? "Tía Lucha",
    monto_centavos: p.monto_centavos ?? 50000,
    item_id: p.item_id ?? null,
    mensaje: p.mensaje ?? null,
    metodo_pago: p.metodo_pago ?? "spei",
    creado_en: p.creado_en ?? "2026-01-01",
  };
}

test("compone el saldo total a partir de ítems y aportaciones", () => {
  const estado = componerEstadoMesa(
    [item({ id: "vajilla" })],
    [
      aporte({ id: "c1", item_id: "vajilla", monto_centavos: 50000 }),
      aporte({ id: "c2", item_id: null, monto_centavos: 30000 }),
    ],
    1,
    config,
  );

  expect(estado.resumen.saldoTotal).toBe(80000);
  expect(estado.nAportaciones).toBe(2);
});

test("expone el itemsMap id→nombre", () => {
  const estado = componerEstadoMesa(
    [
      item({ id: "vajilla", nombre: "Vajilla" }),
      item({ id: "luna", nombre: "Luna de miel" }),
    ],
    [],
    1,
    config,
  );

  expect(estado.itemsMap).toEqual({ vajilla: "Vajilla", luna: "Luna de miel" });
});

test("una aportación a un ítem que ya no existe cuenta como fondo general (no truena)", () => {
  const estado = componerEstadoMesa(
    [item({ id: "vajilla" })],
    [aporte({ id: "c1", item_id: "borrado", monto_centavos: 20000 })],
    1,
    config,
  );

  expect(estado.resumen.saldoTotal).toBe(20000);
});

test("delega retenido/retirable en resumenDashboard (humo)", () => {
  const DIA_MS = 24 * 60 * 60 * 1000;
  const ahora = 1_700_000_000_000;
  const estado = componerEstadoMesa(
    [item({ id: "vajilla" })],
    [
      aporte({ id: "c1", item_id: null, monto_centavos: 80000, metodo_pago: "tarjeta", creado_en: new Date(ahora).toISOString() }),
      aporte({ id: "c2", item_id: null, monto_centavos: 50000, metodo_pago: "spei", creado_en: new Date(ahora).toISOString() }),
    ],
    ahora,
    config,
  );

  expect(estado.resumen.retenido).toBe(80000);
  expect(estado.resumen.retirable).toBe(50000);
  void DIA_MS;
});
