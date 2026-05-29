export type MetodoPago = "tarjeta" | "spei" | "oxxo" | "codi";

export interface Aportacion {
  destino: string; // id de ítem o "general"
  monto: number; // en centavos
  metodoPago: MetodoPago;
}

export interface ItemMesa {
  id: string;
  montoMeta: number; // en centavos
  montoFondeado: number; // en centavos
}

export interface EstadoMesa {
  items: Record<string, ItemMesa>;
  fondoGeneral: number; // en centavos
}

export interface DefinicionItem {
  id: string;
  montoMeta: number;
}

export function crearMesa(items: DefinicionItem[]): EstadoMesa {
  const itemsMap: Record<string, ItemMesa> = {};
  for (const item of items) {
    itemsMap[item.id] = { id: item.id, montoMeta: item.montoMeta, montoFondeado: 0 };
  }
  return { items: itemsMap, fondoGeneral: 0 };
}

export function registrarAportacion(mesa: EstadoMesa, aportacion: Aportacion): EstadoMesa {
  if (aportacion.monto <= 0) {
    throw new Error("El monto de la aportación debe ser positivo");
  }

  if (aportacion.destino === "general") {
    return { ...mesa, fondoGeneral: mesa.fondoGeneral + aportacion.monto };
  }

  const item = mesa.items[aportacion.destino];
  const faltante = Math.max(0, item.montoMeta - item.montoFondeado);
  const haciaItem = Math.min(aportacion.monto, faltante);
  const excedente = aportacion.monto - haciaItem;

  const itemActualizado: ItemMesa = {
    ...item,
    montoFondeado: item.montoFondeado + haciaItem,
  };
  return {
    ...mesa,
    items: { ...mesa.items, [item.id]: itemActualizado },
    fondoGeneral: mesa.fondoGeneral + excedente,
  };
}

export function saldoTotal(mesa: EstadoMesa): number {
  const fondeadoEnItems = Object.values(mesa.items).reduce(
    (suma, item) => suma + item.montoFondeado,
    0,
  );
  return mesa.fondoGeneral + fondeadoEnItems;
}

export interface ProgresoItem {
  montoFondeado: number;
  montoMeta: number;
  porcentaje: number;
}

export function saldoFondoGeneral(mesa: EstadoMesa): number {
  return mesa.fondoGeneral;
}

export function estaCompletado(mesa: EstadoMesa, itemId: string): boolean {
  const item = mesa.items[itemId];
  return item.montoFondeado >= item.montoMeta;
}

export function progresoItem(mesa: EstadoMesa, itemId: string): ProgresoItem {
  const item = mesa.items[itemId];
  return {
    montoFondeado: item.montoFondeado,
    montoMeta: item.montoMeta,
    porcentaje: Math.floor((item.montoFondeado / item.montoMeta) * 100),
  };
}
