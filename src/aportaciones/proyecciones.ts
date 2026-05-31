import type { Aportacion } from "../ledger/ledger.js";
import type { AportacionPersistida } from "../ledger/reconstruir.js";
import type { AportacionAsentada } from "../pagos/webhook.js";

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
