import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetodoPago } from "../dominio/tipos";

/**
 * Datos que el webhook persiste al confirmar un cobro. Es agnóstico al
 * proveedor de pago: el adaptador traduce su payload a esta forma.
 */
export interface RegistroAportacion {
  eventoId: string;
  itemId: string | null; // null = fondo general
  cobroId: string; // clave de idempotencia
  monto: number; // en centavos
  metodoPago: MetodoPago;
  nombreInvitado: string;
  correoInvitado: string;
  mensaje: string;
  absorbeComision: boolean;
  comisionCentavos: number;
}

/**
 * Asienta una aportación confirmada de forma idempotente: si el cobro_id ya
 * existe (webhook repetido), no inserta de nuevo. La unicidad de cobro_id en
 * la DB respalda la garantía aunque lleguen webhooks concurrentes.
 */
export async function asentarAportacion(
  db: SupabaseClient,
  registro: RegistroAportacion,
): Promise<void> {
  const { error } = await db
    .from("aportaciones")
    .upsert(
      {
        evento_id: registro.eventoId,
        item_id: registro.itemId,
        cobro_id: registro.cobroId,
        monto_centavos: registro.monto,
        metodo_pago: registro.metodoPago,
        nombre_invitado: registro.nombreInvitado,
        correo_invitado: registro.correoInvitado,
        mensaje: registro.mensaje,
        absorbe_comision: registro.absorbeComision,
        comision_centavos: registro.comisionCentavos,
        estado: "confirmada",
      },
      { onConflict: "cobro_id", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`No se pudo asentar la aportación ${registro.cobroId}: ${error.message}`);
  }
}

/** Revierte una aportación tras un contracargo (marca, no borra: auditoría). */
export async function revertirAportacion(db: SupabaseClient, cobroId: string): Promise<void> {
  const { error } = await db
    .from("aportaciones")
    .update({ estado: "revertida" })
    .eq("cobro_id", cobroId);

  if (error) {
    throw new Error(`No se pudo revertir la aportación ${cobroId}: ${error.message}`);
  }
}
