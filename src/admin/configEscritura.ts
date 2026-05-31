import type { FilaConfig } from "@/config/monetizacion";

/** Entrada del formulario admin (precio Premium en pesos, no centavos). */
export interface EntradaConfigMonetizacion {
  comisionBasePct: number;
  comisionPremiumPct: number;
  precioPremiumPesos: number;
  absorcionPreMarcada: boolean;
  ventanaRetencionDias: number;
}

function exigirNoNegativo(clave: string, n: number): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Valor inválido para "${clave}": debe ser un número ≥ 0`);
  }
  return n;
}

/** Valida y serializa la config de monetización a filas clave/valor para upsert
 *  en la tabla `configuracion`. Inverso de interpretarConfigMonetizacion. */
export function aFilasConfig(entrada: EntradaConfigMonetizacion): FilaConfig[] {
  exigirNoNegativo("comision_base_pct", entrada.comisionBasePct);
  exigirNoNegativo("comision_premium_pct", entrada.comisionPremiumPct);
  exigirNoNegativo("precio_premium_pesos", entrada.precioPremiumPesos);
  if (!Number.isInteger(entrada.ventanaRetencionDias) || entrada.ventanaRetencionDias < 0) {
    throw new Error('Valor inválido para "ventana_retencion_dias": debe ser un entero ≥ 0');
  }

  return [
    { clave: "comision_base_pct", valor: String(entrada.comisionBasePct) },
    { clave: "comision_premium_pct", valor: String(entrada.comisionPremiumPct) },
    { clave: "precio_premium_centavos", valor: String(Math.round(entrada.precioPremiumPesos * 100)) },
    { clave: "absorcion_pre_marcada", valor: entrada.absorcionPreMarcada ? "true" : "false" },
    { clave: "ventana_retencion_dias", valor: String(entrada.ventanaRetencionDias) },
  ];
}
