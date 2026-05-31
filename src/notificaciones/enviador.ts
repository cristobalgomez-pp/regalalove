import type { CorreoPendiente } from "./correos";

/**
 * Puerto de envío de correo. El resto de la app depende de esta interfaz, no
 * del proveedor concreto (Resend, etc.), que se conecta como adaptador.
 */
export interface EnviadorCorreo {
  enviar(correo: CorreoPendiente): Promise<void>;
}

/** Despacha una lista de correos pendientes por el puerto, en orden. */
export async function enviarCorreos(
  enviador: EnviadorCorreo,
  correos: CorreoPendiente[],
): Promise<void> {
  for (const correo of correos) {
    await enviador.enviar(correo);
  }
}
