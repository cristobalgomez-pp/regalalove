import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularRetencion } from "@/retencion/retencion";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import type { MetodoPago } from "@/dominio/tipos";

export interface SaldoRetiro {
  retirable: number; // total que ya pasó la retención, en centavos
  retirado: number; // ya retirado en retiros previos, en centavos
  disponible: number; // retirable - retirado, en centavos
}

/** Calcula lo disponible para retirar de una mesa: lo retirable según la
 * retención, menos lo ya retirado. */
export async function calcularSaldoRetiro(
  supabase: SupabaseClient,
  eventoId: string,
): Promise<SaldoRetiro> {
  const [{ data: aps }, { data: rets }, config] = await Promise.all([
    supabase
      .from("aportaciones")
      .select("monto_centavos, metodo_pago, creado_en")
      .eq("evento_id", eventoId)
      .eq("estado", "confirmada"),
    supabase.from("retiros").select("monto_centavos").eq("evento_id", eventoId),
    obtenerConfigMonetizacion(),
  ]);

  const { retirable } = calcularRetencion(
    (aps ?? []).map((a) => ({
      monto: a.monto_centavos,
      metodoPago: a.metodo_pago as MetodoPago,
      fecha: new Date(a.creado_en).getTime(),
    })),
    Date.now(),
    { ventanaRetencionDias: config.ventanaRetencionDias },
  );

  const retirado = (rets ?? []).reduce((s, r) => s + r.monto_centavos, 0);
  return { retirable, retirado, disponible: Math.max(0, retirable - retirado) };
}
