import type { CorreoPendiente } from "./correos";
import type { EnviadorCorreo } from "./enviador";
import { renderizar } from "./plantillas";

/**
 * Adaptador del puerto EnviadorCorreo sobre la API REST de Resend. Solo se
 * ocupa del transporte: el contenido (asunto + HTML) llega ya renderizado por
 * `plantillas`, agnóstico del proveedor.
 * Requiere RESEND_API_KEY y un remitente verificado (CORREO_REMITENTE).
 */
export function crearEnviadorResend(): EnviadorCorreo {
  const apiKey = process.env.RESEND_API_KEY;
  const remitente = process.env.CORREO_REMITENTE;

  if (!apiKey || !remitente) {
    throw new Error("Faltan RESEND_API_KEY o CORREO_REMITENTE en el entorno");
  }

  return {
    async enviar(correo: CorreoPendiente): Promise<void> {
      const { asunto, html } = renderizar(correo);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: remitente,
          to: correo.destinatario,
          subject: asunto,
          html,
        }),
      });

      if (!res.ok) {
        const detalle = await res.text();
        throw new Error(`Resend rechazó el correo (${res.status}): ${detalle}`);
      }
    },
  };
}
