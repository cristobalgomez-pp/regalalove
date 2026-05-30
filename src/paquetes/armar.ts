/** Un ítem de un paquete con los datos del catálogo ya resueltos. */
export interface PaqueteItemEntrada {
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  precioCentavos: number;
  cantidad: number;
  catalogoItemId: string;
}

/** Fila lista para insertar en items_mesa (falta solo evento_id, que pone la
 *  server action). Forma en snake_case para mapear directo a la columna. */
export interface FilaItemMesa {
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  monto_meta_centavos: number;
  cantidad: number;
  catalogo_item_id: string;
  orden: number;
}

/** Total del paquete en centavos: Σ(precio × cantidad). */
export function totalPaquete(
  items: Pick<PaqueteItemEntrada, "precioCentavos" | "cantidad">[],
): number {
  return items.reduce((suma, it) => suma + it.precioCentavos * it.cantidad, 0);
}

/** Convierte los ítems de un paquete en filas de items_mesa: el monto meta es
 *  precio unitario × cantidad y el orden es secuencial (0..n) preservando la
 *  posición del paquete. */
export function armarItemsDesdePaquete(items: PaqueteItemEntrada[]): FilaItemMesa[] {
  return items.map((it, i) => ({
    nombre: it.nombre,
    descripcion: it.descripcion ?? null,
    imagen_url: it.imagenUrl ?? null,
    monto_meta_centavos: it.precioCentavos * it.cantidad,
    cantidad: it.cantidad,
    catalogo_item_id: it.catalogoItemId,
    orden: i,
  }));
}
