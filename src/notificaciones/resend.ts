import type { CorreoPendiente, PlantillaCorreo } from "./correos.js";
import type { EnviadorCorreo } from "./enviador.js";

function pesos(centavos: unknown): string {
  const n = typeof centavos === "number" ? centavos : 0;
  return (n / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const MARCA = "RegalaLove";

function urlBase(): string {
  return process.env.URL_BASE ?? "https://regalalove.com";
}

/** Envuelve el contenido en una plantilla HTML con marca RegalaLove. */
function layout(opts: {
  encabezado: string;
  cuerpoHtml: string;
  cta?: { texto: string; url: string };
}): string {
  const boton = opts.cta
    ? `<a href="${opts.cta.url}" style="display:inline-block;background:#ff5a5f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;margin-top:12px;">${opts.cta.texto}</a>`
    : "";
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#fafafa;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e7ea;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #e7e7ea;">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;">Regala<span style="color:#ff5a5f;">Love</span></span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="font-size:20px;margin:0 0 12px;">${opts.encabezado}</h1>
          ${opts.cuerpoHtml}
          ${boton}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #e7e7ea;color:#6b7280;font-size:12px;">
          ${MARCA} · <a href="${urlBase()}" style="color:#6b7280;">regalalove.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Render de cada plantilla a asunto + HTML con marca. */
export function renderizar(
  plantilla: PlantillaCorreo,
  datos: Record<string, unknown>,
): { asunto: string; html: string } {
  switch (plantilla) {
    case "comprobante_invitado":
      return {
        asunto: "Tu regalo fue recibido 🎁",
        html: layout({
          encabezado: `¡Gracias, ${datos.nombreInvitado}! 🎁`,
          cuerpoHtml: `<p style="margin:0 0 8px;color:#3f3f46;">Recibimos tu aportación de <strong>${pesos(datos.monto)}</strong> para <strong>${datos.itemNombre}</strong>.</p><p style="margin:0;color:#6b7280;font-size:14px;">Tu regalo ya cuenta para la mesa. ¡Gracias por participar!</p>`,
        }),
      };
    case "aviso_aportacion_festejado":
      return {
        asunto: "¡Recibiste un regalo! 🎉",
        html: layout({
          encabezado: `¡Recibiste un regalo, ${datos.nombreFestejado}! 🎉`,
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;"><strong>${datos.nombreInvitado}</strong> aportó <strong>${pesos(datos.monto)}</strong> para <strong>${datos.itemNombre}</strong>.</p>`,
          cta: { texto: "Ver mi mesa →", url: `${urlBase()}/dashboard` },
        }),
      };
    case "aviso_retiro_festejado":
      return {
        asunto: "Tu retiro se completó 💸",
        html: layout({
          encabezado: "Tu retiro se completó 💸",
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;">Hola ${datos.nombreFestejado}, tu retiro de <strong>${pesos(datos.monto)}</strong> fue procesado y va en camino a tu cuenta.</p>`,
          cta: { texto: "Ver mi panel →", url: `${urlBase()}/dashboard` },
        }),
      };
    case "bienvenida":
      return {
        asunto: "Bienvenido a RegalaLove ❤️",
        html: layout({
          encabezado: `¡Bienvenido, ${datos.nombreFestejado}! ❤️`,
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;">Tu cuenta está lista. Crea tu mesa de regalos en minutos y compártela con tus invitados.</p>`,
          cta: { texto: "Crear mi mesa →", url: `${urlBase()}/dashboard` },
        }),
      };
    default: {
      const desconocida: never = plantilla;
      throw new Error(`Plantilla de correo desconocida: ${String(desconocida)}`);
    }
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
