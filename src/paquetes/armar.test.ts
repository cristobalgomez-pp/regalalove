import { test, expect } from "vitest";
import { armarItemsDesdePaquete, totalPaquete } from "./armar";

const entradas = [
  {
    nombre: "Refrigerador",
    descripcion: "Dos puertas",
    imagenUrl: "https://img/refri",
    precioCentavos: 1800000,
    cantidad: 2,
    catalogoItemId: "cat-refri",
  },
  {
    nombre: "Vajilla de 12 piezas",
    descripcion: null,
    imagenUrl: null,
    precioCentavos: 350000,
    cantidad: 3,
    catalogoItemId: "cat-vajilla",
  },
];

test("totalPaquete suma precio × cantidad de cada ítem", () => {
  expect(totalPaquete(entradas)).toBe(1800000 * 2 + 350000 * 3); // 4650000
});

test("totalPaquete de lista vacía es 0", () => {
  expect(totalPaquete([])).toBe(0);
});

test("armarItemsDesdePaquete calcula monto = precio × cantidad y orden secuencial", () => {
  const filas = armarItemsDesdePaquete(entradas);

  expect(filas).toEqual([
    {
      nombre: "Refrigerador",
      descripcion: "Dos puertas",
      imagen_url: "https://img/refri",
      monto_meta_centavos: 3600000,
      cantidad: 2,
      catalogo_item_id: "cat-refri",
      orden: 0,
    },
    {
      nombre: "Vajilla de 12 piezas",
      descripcion: null,
      imagen_url: null,
      monto_meta_centavos: 1050000,
      cantidad: 3,
      catalogo_item_id: "cat-vajilla",
      orden: 1,
    },
  ]);
});

test("armarItemsDesdePaquete normaliza descripcion/imagen ausentes a null", () => {
  const [fila] = armarItemsDesdePaquete([
    { nombre: "Licuadora", precioCentavos: 130000, cantidad: 1, catalogoItemId: "cat-lic" },
  ]);
  expect(fila.descripcion).toBeNull();
  expect(fila.imagen_url).toBeNull();
});
