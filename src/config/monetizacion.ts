export interface ConfigMonetizacion {
  comisionBasePct: number;
  comisionPremiumPct: number;
  precioPremium: number; // en centavos
  absorcionPreMarcada: boolean;
}

export interface FilaConfig {
  clave: string;
  valor: string;
}

const DEFAULTS: ConfigMonetizacion = {
  comisionBasePct: 5,
  comisionPremiumPct: 3,
  precioPremium: 49900,
  absorcionPreMarcada: true,
};

function parsearNumero(clave: string, valor: string): number {
  const n = Number(valor);
  if (!Number.isFinite(n)) {
    throw new Error(`Valor de configuración inválido para "${clave}": ${valor}`);
  }
  return n;
}

export function interpretarConfigMonetizacion(filas: FilaConfig[]): ConfigMonetizacion {
  const mapa = new Map(filas.map((f) => [f.clave, f.valor]));
  const config = { ...DEFAULTS };

  if (mapa.has("comision_base_pct")) {
    config.comisionBasePct = parsearNumero("comision_base_pct", mapa.get("comision_base_pct")!);
  }
  if (mapa.has("comision_premium_pct")) {
    config.comisionPremiumPct = parsearNumero(
      "comision_premium_pct",
      mapa.get("comision_premium_pct")!,
    );
  }
  if (mapa.has("precio_premium_centavos")) {
    config.precioPremium = parsearNumero(
      "precio_premium_centavos",
      mapa.get("precio_premium_centavos")!,
    );
  }
  if (mapa.has("absorcion_pre_marcada")) {
    config.absorcionPreMarcada = mapa.get("absorcion_pre_marcada") === "true";
  }

  return config;
}
