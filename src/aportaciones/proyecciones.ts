import type { Aportacion } from "../ledger/ledger";
import type { AportacionPersistida } from "../ledger/reconstruir";
import type { AportacionAsentada } from "../pagos/webhook";
import type { MetodoPago } from "../dominio/tipos";
import type { AportacionConfirmadaRow } from "../lib/datos-mesa";

/**
 * Proyecciones del concepto "aportación" hacia las vistas que lo consumen.
 * Son la única traducción tipada entre representaciones: si cambia un campo
 * del origen, estas funciones dejan de compilar (antes los .map() inline lo
 * dejaban pasar y devolvían undefined en runtime).
 */

/** Cómo se ve una aportación en el feed del panel del festejado. */
export interface AportacionFeed {
  nombre: string;
  monto: number; // en centavos
  itemId: string | null;
  mensaje: string;
}

/** Aportación asentada → entrada del feed del panel. */
export function feedDe(a: AportacionAsentada): AportacionFeed {
  return {
    nombre: a.nombre,
    monto: a.monto,
    itemId: a.itemId,
    mensaje: a.mensaje,
  };
}

/** Aportación persistida → entrada que entiende el Ledger (destino + monto). */
export function entradaLedger(a: AportacionPersistida): Aportacion {
  return {
    destino: a.itemId ?? "general",
    monto: a.monto,
    metodoPago: a.metodoPago,
  };
}

/** Fila confirmada de la BD → aportación asentada (lo que entiende el dominio).
 * Única traducción: server (carga inicial) y cliente (realtime) la comparten. */
export function filaAAsentada(row: AportacionConfirmadaRow): AportacionAsentada {
  return {
    cobroId: row.id,
    itemId: row.item_id,
    monto: row.monto_centavos,
    metodoPago: row.metodo_pago as MetodoPago,
    fecha: new Date(row.creado_en).getTime(),
    nombre: row.nombre_invitado,
    mensaje: row.mensaje ?? "",
  };
}

/** Cómo se ve una aportación en el feed del panel en vivo del festejado.
 * Enriquece la asentada con el nombre del ítem para mostrarlo. */
export interface AportacionVista {
  id: string;
  nombre: string;
  monto: number; // centavos
  itemId: string | null;
  itemNombre: string | null;
  mensaje: string;
  metodoPago: MetodoPago;
  fecha: number; // epoch ms
  nuevo?: boolean;
}

/** Aportación asentada + mapa id→nombre de ítems → vista del feed. */
export function vistaDesde(
  a: AportacionAsentada,
  itemsMap: Record<string, string>,
): AportacionVista {
  return {
    id: a.cobroId,
    nombre: a.nombre,
    monto: a.monto,
    itemId: a.itemId,
    itemNombre: a.itemId ? itemsMap[a.itemId] ?? "Un regalo" : null,
    mensaje: a.mensaje,
    metodoPago: a.metodoPago,
    fecha: a.fecha,
  };
}

/** Vista del feed → aportación asentada (inversa de `vistaDesde` en los campos
 * de dominio). La usa el panel en vivo para recomputar el saldo en el cliente. */
export function asentadaDesde(v: AportacionVista): AportacionAsentada {
  return {
    cobroId: v.id,
    itemId: v.itemId,
    monto: v.monto,
    metodoPago: v.metodoPago,
    fecha: v.fecha,
    nombre: v.nombre,
    mensaje: v.mensaje,
  };
}

/** Reasigna al fondo general las aportaciones cuyo ítem ya no existe: mismo
 * saldo total, sin romper el replay del Ledger. No muta la entrada. */
export function redirigirItemsDesconocidos(
  asentadas: AportacionAsentada[],
  idsConocidos: Set<string>,
): AportacionAsentada[] {
  return asentadas.map((a) =>
    a.itemId && !idsConocidos.has(a.itemId) ? { ...a, itemId: null } : a,
  );
}
