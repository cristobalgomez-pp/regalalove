import { resumenDashboard, type ResumenDashboard } from "../dashboard/resumen";
import { filaAAsentada } from "../aportaciones/proyecciones";
import type { ConfigRetencion } from "../retencion/retencion";
import type { ItemMesaRow, AportacionConfirmadaRow } from "../lib/datos-mesa";
import type { DefinicionItem } from "../ledger/ledger";

export interface EstadoMesa {
  resumen: ResumenDashboard;
  itemsMap: Record<string, string>; // id → nombre
  nAportaciones: number;
}

/**
 * Compone el Estado de Mesa (la foto reconstruida que ven los paneles) a partir
 * de las filas crudas de la BD. Es **pura**: recibe `ahora` y `config`, no toca
 * la BD ni lee configuración. La carga la hace el consumidor (ver admin/eventos).
 *
 * Una aportación a un ítem que ya no existe (borrado) se cuenta como fondo
 * general: mismo saldo total, sin romper el replay del Ledger.
 */
export function componerEstadoMesa(
  itemsRows: ItemMesaRow[],
  apsRows: AportacionConfirmadaRow[],
  ahora: number,
  config: ConfigRetencion,
): EstadoMesa {
  const definiciones: DefinicionItem[] = itemsRows.map((it) => ({
    id: it.id,
    montoMeta: it.monto_meta_centavos,
  }));
  const ids = new Set(definiciones.map((d) => d.id));

  const asentadas = apsRows
    .map(filaAAsentada)
    .map((a) => (a.itemId && !ids.has(a.itemId) ? { ...a, itemId: null } : a));

  const itemsMap: Record<string, string> = {};
  for (const it of itemsRows) itemsMap[it.id] = it.nombre;

  return {
    resumen: resumenDashboard(definiciones, asentadas, ahora, config),
    itemsMap,
    nAportaciones: asentadas.length,
  };
}
