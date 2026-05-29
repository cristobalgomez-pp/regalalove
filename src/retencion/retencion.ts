import type { MetodoPago } from "../dominio/tipos.js";

export type { MetodoPago };

export interface AportacionRetencion {
  monto: number; // en centavos
  metodoPago: MetodoPago;
  fecha: number; // epoch en milisegundos
}

export interface ConfigRetencion {
  ventanaRetencionDias: number;
}

export interface ResultadoRetencion {
  retirable: number; // en centavos
  retenido: number; // en centavos
}

const DIA_MS = 24 * 60 * 60 * 1000;

export function calcularRetencion(
  aportaciones: AportacionRetencion[],
  ahora: number,
  config: ConfigRetencion,
): ResultadoRetencion {
  const ventanaMs = config.ventanaRetencionDias * DIA_MS;
  let retirable = 0;
  let retenido = 0;

  for (const a of aportaciones) {
    const enVentana = a.metodoPago === "tarjeta" && ahora - a.fecha < ventanaMs;
    if (enVentana) {
      retenido += a.monto;
    } else {
      retirable += a.monto;
    }
  }

  return { retirable, retenido };
}
