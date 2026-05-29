import { calcularComision } from "../fees/fees.js";
import type { PlanEvento } from "../fees/fees.js";
import type { ConfigMonetizacion } from "../config/monetizacion.js";

export interface OpcionesCheckout {
  plan: PlanEvento;
  absorbeInvitado: boolean;
}

export interface EstadoCheckout {
  absorbeInvitado: boolean;
  montoRegalo: number; // lo que aporta al festejado, en centavos
  comision: number; // en centavos
  totalInvitado: number; // lo que paga el invitado, en centavos
  netoFestejado: number; // lo que recibe el festejado, en centavos
}

/** Estado inicial de la casilla de absorción según la config (pre-marcada). */
export function absorcionPorDefecto(config: ConfigMonetizacion): boolean {
  return config.absorcionPreMarcada;
}

/**
 * Prepara el estado del checkout del invitado a partir del monto del regalo,
 * el plan y la config de monetización. Delega el cálculo en el motor de Fees.
 */
export function prepararCheckout(
  montoRegalo: number,
  opciones: OpcionesCheckout,
  config: ConfigMonetizacion,
): EstadoCheckout {
  const { montoInvitado, comision, netoFestejado } = calcularComision(
    montoRegalo,
    { plan: opciones.plan, absorbeInvitado: opciones.absorbeInvitado },
    config,
  );

  return {
    absorbeInvitado: opciones.absorbeInvitado,
    montoRegalo,
    comision,
    totalInvitado: montoInvitado,
    netoFestejado,
  };
}
