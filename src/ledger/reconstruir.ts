import {
  crearMesa,
  registrarAportacion,
  type EstadoMesa,
  type DefinicionItem,
  type MetodoPago,
} from "./ledger";

export interface AportacionPersistida {
  itemId: string | null; // null = fondo general
  monto: number;
  metodoPago: MetodoPago;
  fecha: number; // para ordenar el replay
}

/**
 * Puente entre la DB y el Ledger: arma la mesa con sus ítems y replaya las
 * aportaciones (en orden cronológico) para derivar el estado actual.
 */
export function reconstruirEstadoMesa(
  items: DefinicionItem[],
  aportaciones: AportacionPersistida[],
): EstadoMesa {
  let estado = crearMesa(items);

  for (const a of aportaciones) {
    estado = registrarAportacion(estado, {
      destino: a.itemId ?? "general",
      monto: a.monto,
      metodoPago: a.metodoPago,
    });
  }

  return estado;
}
