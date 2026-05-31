import type { MetodoPago } from "../dominio/tipos";
import type { AportacionPersistida } from "../ledger/reconstruir";

/** Eventos que EcartPay (o su simulador) emite hacia nuestro webhook. */
export interface EventoPago {
  tipo: "pago.confirmado" | "pago.fallido" | "contracargo";
  cobroId: string; // identificador del cobro — clave de idempotencia
  itemId: string | null; // null = fondo general
  monto: number; // en centavos
  metodoPago: MetodoPago;
  fecha: number;
  invitado: { nombre: string; mensaje: string };
}

/** Aportación asentada a partir de un cobro confirmado: enriquece la
 * aportación del Ledger con la huella del cobro y los datos del invitado. */
export interface AportacionAsentada extends AportacionPersistida {
  cobroId: string;
  nombre: string;
  mensaje: string;
}

/**
 * Traduce un evento de pago a un nuevo estado de la lista de aportaciones
 * asentadas. El Ledger nunca ve a EcartPay: solo recibe aportaciones.
 */
export function aplicarEventoPago(
  aportaciones: AportacionAsentada[],
  evento: EventoPago,
): AportacionAsentada[] {
  if (evento.tipo === "pago.fallido") {
    return aportaciones;
  }

  // Un contracargo (solo posible en tarjeta, reversible) revierte la
  // aportación asentada con ese cobro.
  if (evento.tipo === "contracargo") {
    return aportaciones.filter((a) => a.cobroId !== evento.cobroId);
  }

  const yaAsentado = aportaciones.some((a) => a.cobroId === evento.cobroId);
  if (yaAsentado) {
    return aportaciones;
  }

  const asentada: AportacionAsentada = {
    cobroId: evento.cobroId,
    itemId: evento.itemId,
    monto: evento.monto,
    metodoPago: evento.metodoPago,
    fecha: evento.fecha,
    nombre: evento.invitado.nombre,
    mensaje: evento.invitado.mensaje,
  };

  return [...aportaciones, asentada];
}
