import { reconstruirEstadoMesa } from "../ledger/reconstruir.js";
import { saldoTotal } from "../ledger/ledger.js";
import type { DefinicionItem } from "../ledger/ledger.js";
import { calcularRetencion } from "../retencion/retencion.js";
import type { ConfigRetencion } from "../retencion/retencion.js";
import type { AportacionAsentada } from "../pagos/webhook.js";

export interface AportacionFeed {
  nombre: string;
  monto: number; // en centavos
  itemId: string | null;
  mensaje: string;
}

export interface ResumenDashboard {
  saldoTotal: number; // en centavos
  retirable: number; // en centavos
  retenido: number; // en centavos
  aportaciones: AportacionFeed[]; // de la más reciente a la más antigua
}

/**
 * Compone el estado que ve el festejado en su panel a partir de las
 * aportaciones asentadas: saldo del Ledger + retención + feed.
 */
export function resumenDashboard(
  items: DefinicionItem[],
  asentadas: AportacionAsentada[],
  ahora: number,
  config: ConfigRetencion,
): ResumenDashboard {
  const estado = reconstruirEstadoMesa(items, asentadas);
  const { retirable, retenido } = calcularRetencion(asentadas, ahora, config);

  const aportaciones: AportacionFeed[] = [...asentadas]
    .sort((a, b) => b.fecha - a.fecha)
    .map((a) => ({
      nombre: a.nombre,
      monto: a.monto,
      itemId: a.itemId,
      mensaje: a.mensaje,
    }));

  return {
    saldoTotal: saldoTotal(estado),
    retirable,
    retenido,
    aportaciones,
  };
}
