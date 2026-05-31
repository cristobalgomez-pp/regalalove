import { test, expect } from "vitest";
import {
  feedDe,
  entradaLedger,
  filaAAsentada,
  vistaDesde,
  asentadaDesde,
  redirigirItemsDesconocidos,
} from "./proyecciones";
import type { AportacionAsentada } from "../pagos/webhook";
import type { AportacionPersistida } from "../ledger/reconstruir";
import type { AportacionConfirmadaRow } from "../lib/datos-mesa";

const asentada: AportacionAsentada = {
  itemId: "vajilla",
  monto: 50000,
  metodoPago: "tarjeta",
  fecha: 10,
  cobroId: "cobro_1",
  nombre: "Tía Lucha",
  mensaje: "¡Felicidades!",
};

test("feedDe proyecta una aportación asentada al feed del panel", () => {
  expect(feedDe(asentada)).toEqual({
    nombre: "Tía Lucha",
    monto: 50000,
    itemId: "vajilla",
    mensaje: "¡Felicidades!",
  });
});

test("entradaLedger usa el itemId como destino", () => {
  const persistida: AportacionPersistida = {
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
    fecha: 10,
  };
  expect(entradaLedger(persistida)).toEqual({
    destino: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
  });
});

test("entradaLedger manda al fondo general cuando no hay itemId", () => {
  const persistida: AportacionPersistida = {
    itemId: null,
    monto: 30000,
    metodoPago: "spei",
    fecha: 5,
  };
  expect(entradaLedger(persistida).destino).toBe("general");
});

test("filaAAsentada proyecta una fila de la BD a aportación asentada", () => {
  const row: AportacionConfirmadaRow = {
    id: "cobro_9",
    nombre_invitado: "Tía Lucha",
    monto_centavos: 50000,
    item_id: "vajilla",
    mensaje: "¡Felicidades!",
    metodo_pago: "tarjeta",
    creado_en: "2026-01-01T00:00:00.000Z",
  };

  expect(filaAAsentada(row)).toEqual({
    cobroId: "cobro_9",
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
    fecha: new Date("2026-01-01T00:00:00.000Z").getTime(),
    nombre: "Tía Lucha",
    mensaje: "¡Felicidades!",
  });
});

test("filaAAsentada: mensaje null → '' y item_id null → itemId null", () => {
  const row: AportacionConfirmadaRow = {
    id: "c1",
    nombre_invitado: "Anónimo",
    monto_centavos: 100,
    item_id: null,
    mensaje: null,
    metodo_pago: "spei",
    creado_en: "2026-02-02",
  };

  const a = filaAAsentada(row);

  expect(a.itemId).toBeNull();
  expect(a.mensaje).toBe("");
});

test("vistaDesde arma la vista con el nombre del ítem", () => {
  const a: AportacionAsentada = {
    cobroId: "c1",
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
    fecha: 10,
    nombre: "Tía Lucha",
    mensaje: "hola",
  };

  expect(vistaDesde(a, { vajilla: "Vajilla" })).toEqual({
    id: "c1",
    nombre: "Tía Lucha",
    monto: 50000,
    itemId: "vajilla",
    itemNombre: "Vajilla",
    mensaje: "hola",
    metodoPago: "tarjeta",
    fecha: 10,
  });
});

test("vistaDesde: fondo general → itemNombre null", () => {
  const a: AportacionAsentada = {
    cobroId: "c2",
    itemId: null,
    monto: 30000,
    metodoPago: "spei",
    fecha: 5,
    nombre: "Beto",
    mensaje: "",
  };

  expect(vistaDesde(a, {}).itemNombre).toBeNull();
});

test("vistaDesde: ítem que ya no está en el map → 'Un regalo'", () => {
  const a: AportacionAsentada = {
    cobroId: "c3",
    itemId: "borrado",
    monto: 1,
    metodoPago: "spei",
    fecha: 1,
    nombre: "X",
    mensaje: "",
  };

  expect(vistaDesde(a, {}).itemNombre).toBe("Un regalo");
});

test("asentadaDesde revierte una vista a aportación asentada (vista→asentada)", () => {
  const vista = {
    id: "cobro_7",
    nombre: "Tía Lucha",
    monto: 50000,
    itemId: "vajilla",
    itemNombre: "Vajilla",
    mensaje: "hola",
    metodoPago: "tarjeta" as const,
    fecha: 10,
    nuevo: true,
  };

  expect(asentadaDesde(vista)).toEqual({
    cobroId: "cobro_7",
    itemId: "vajilla",
    monto: 50000,
    metodoPago: "tarjeta",
    fecha: 10,
    nombre: "Tía Lucha",
    mensaje: "hola",
  });
});

test("asentadaDesde y vistaDesde son inversas para los campos del dominio", () => {
  const a: AportacionAsentada = {
    cobroId: "c1",
    itemId: "vajilla",
    monto: 1000,
    metodoPago: "spei",
    fecha: 3,
    nombre: "Beto",
    mensaje: "msg",
  };
  expect(asentadaDesde(vistaDesde(a, { vajilla: "Vajilla" }))).toEqual(a);
});

test("redirigirItemsDesconocidos manda al fondo general las aportaciones a ítems borrados", () => {
  const asentadas: AportacionAsentada[] = [
    { cobroId: "c1", itemId: "vajilla", monto: 100, metodoPago: "spei", fecha: 1, nombre: "A", mensaje: "" },
    { cobroId: "c2", itemId: "borrado", monto: 200, metodoPago: "spei", fecha: 2, nombre: "B", mensaje: "" },
    { cobroId: "c3", itemId: null, monto: 300, metodoPago: "spei", fecha: 3, nombre: "C", mensaje: "" },
  ];

  const r = redirigirItemsDesconocidos(asentadas, new Set(["vajilla"]));

  expect(r.map((a) => a.itemId)).toEqual(["vajilla", null, null]);
  // no muta el arreglo de entrada
  expect(asentadas[1].itemId).toBe("borrado");
});
