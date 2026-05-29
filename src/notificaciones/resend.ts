import type { CorreoPendiente, PlantillaCorreo } from "./correos.js";
import type { EnviadorCorreo } from "./enviador.js";

function pesos(centavos: unknown): string {
  const n = typeof centavos === "number" ? centavos : 0;
  return (n / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/** Render mínimo de cada plantilla a asunto + cuerpo. Las plantillas ricas
 * (HTML) pueden reemplazar esto sin tocar el resto del flujo. */
function renderizar(plantilla: PlantillaCorreo, datos: Record<string, unknown>): {
  asunto: string;
  html: string;
} {
  switch (plantilla) {
    case "comprobante_invitado":
      return {
        asunto: "Tu regalo fue recibido 🎁",
        html: `<p>Hola ${datos.nombreInvitado}, recibimos tu aportación de <strong>${pesos(datos.monto)}</strong> para ${datos.itemNombre}. ¡Gracias!</p>`,
      };
    case "aviso_aportacion_festejado":
      return {
        asunto: "¡Recibiste un regalo! 🎉",
        html: `<p>Hola ${datos.nombreFestejado}, ${datos.nombreInvitado} aportó <strong>${pesos(datos.monto)}</strong> para ${datos.itemNombre}.</p>`,
      };
    case "aviso_retiro_festejado":
      return {
        asunto: "Tu retiro se completó 💸",
        html: `<p>Hola ${datos.nombreFestejado}, tu retiro de <strong>${pesos(datos.monto)}</strong> fue procesado.</p>`,
      };
  }
}

/**
 * Adaptador del puerto EnviadorCorreo sobre la API REST de Resend.
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
      const { asunto, html } = renderizar(correo.plantilla, correo.datos);

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
