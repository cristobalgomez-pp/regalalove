import type { CorreoPendiente } from "./correos.js";
import type { EnviadorCorreo } from "./enviador.js";
import { crearEnviadorResend } from "./resend.js";

/** Enviador no-op: loguea en vez de mandar. Para dev/preview sin credenciales. */
function crearEnviadorNoop(): EnviadorCorreo {
  return {
    async enviar(correo: CorreoPendiente): Promise<void> {
      // No logueamos el correo completo (privacidad en logs de preview/dev).
      const dominio = correo.destinatario.split("@")[1] ?? "?";
      console.warn(
        `[correo omitido] falta RESEND_API_KEY — destino=***@${dominio} plantilla=${correo.plantilla}`,
      );
    },
  };
}

/**
 * Elige el enviador según el entorno: Resend si hay credenciales completas,
 * si no un no-op que no rompe el flujo (dev/preview).
 */
export function obtenerEnviador(): EnviadorCorreo {
  if (process.env.RESEND_API_KEY && process.env.CORREO_REMITENTE) {
    return crearEnviadorResend();
  }
  return crearEnviadorNoop();
}
