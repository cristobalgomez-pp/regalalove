import { reconstruirEstadoMesa } from "../ledger/reconstruir";
import { saldoTotal } from "../ledger/ledger";
import type { DefinicionItem } from "../ledger/ledger";
import { calcularRetencion } from "../retencion/retencion";
import type { ConfigRetencion } from "../retencion/retencion";
import type { AportacionAsentada } from "../pagos/webhook";
import { feedDe, type AportacionFeed } from "../aportaciones/proyecciones";

export type { AportacionFeed };

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
    .map(feedDe);

  return {
    saldoTotal: saldoTotal(estado),
    retirable,
    retenido,
    aportaciones,
  };
}
