import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventoPago } from "./webhook";
import { asentarAportacion, revertirAportacion } from "./persistencia";

/**
 * Contexto del checkout que el evento de la pasarela no trae (lo calcula la
 * app al iniciar el cobro): a qué mesa pertenece, el correo del invitado y la
 * comisión acordada.
 */
export interface ContextoCobro {
  eventoId: string;
  correoInvitado: string;
  absorbeComision: boolean;
  comisionCentavos: number;
}

/**
 * Aplica un evento de pago sobre la persistencia. Es el único camino por el
 * que un cobro cambia el saldo de una mesa: lo usan tanto la confirmación
 * simulada del checkout como (en el futuro) el webhook real de EcartPay.
 * Espeja la lógica pura de `aplicarEventoPago` (idempotencia + contracargo)
 * pero contra la base.
 */
export async function aplicarEventoPagoPersistido(
  db: SupabaseClient,
  evento: EventoPago,
  ctx: ContextoCobro,
): Promise<void> {
  if (evento.tipo === "pago.fallido") return;

  if (evento.tipo === "contracargo") {
    await revertirAportacion(db, evento.cobroId);
    return;
  }

  await asentarAportacion(db, {
    eventoId: ctx.eventoId,
    itemId: evento.itemId,
    cobroId: evento.cobroId,
    monto: evento.monto,
    metodoPago: evento.metodoPago,
    nombreInvitado: evento.invitado.nombre,
    correoInvitado: ctx.correoInvitado,
    mensaje: evento.invitado.mensaje,
    absorbeComision: ctx.absorbeComision,
    comisionCentavos: ctx.comisionCentavos,
  });
}
