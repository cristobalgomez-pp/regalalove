export type PlanEvento = "gratis" | "premium";

export interface ConfigComisiones {
  comisionBasePct: number;
  comisionPremiumPct: number;
}

export interface OpcionesComision {
  plan: PlanEvento;
  absorbeInvitado: boolean;
}

export interface ResultadoComision {
  montoInvitado: number; // lo que paga el invitado, en centavos
  comision: number; // en centavos
  netoFestejado: number; // lo que recibe el festejado, en centavos
}

export function calcularComision(
  monto: number,
  opciones: OpcionesComision,
  config: ConfigComisiones,
): ResultadoComision {
  if (monto <= 0) {
    throw new Error("El monto debe ser positivo");
  }

  const pct = opciones.plan === "premium" ? config.comisionPremiumPct : config.comisionBasePct;
  const comision = Math.round((monto * pct) / 100);

  if (opciones.absorbeInvitado) {
    return {
      montoInvitado: monto + comision,
      comision,
      netoFestejado: monto,
    };
  }

  return {
    montoInvitado: monto,
    comision,
    netoFestejado: monto - comision,
  };
}
