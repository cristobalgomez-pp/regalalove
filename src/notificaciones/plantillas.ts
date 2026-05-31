import type { CorreoPendiente } from "./correos";

const MARCA = "RegalaLove";

function urlBase(): string {
  return process.env.URL_BASE ?? "https://regalalove.com";
}

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
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

/**
 * Render de un correo a asunto + HTML con marca. Agnóstico del proveedor de
 * envío: cualquier adaptador (Resend, otro) recibe el resultado ya listo.
 */
export function renderizar(correo: CorreoPendiente): { asunto: string; html: string } {
  switch (correo.plantilla) {
    case "comprobante_invitado": {
      const d = correo.datos;
      return {
        asunto: "Tu regalo fue recibido 🎁",
        html: layout({
          encabezado: `¡Gracias, ${d.nombreInvitado}! 🎁`,
          cuerpoHtml: `<p style="margin:0 0 8px;color:#3f3f46;">Recibimos tu aportación de <strong>${pesos(d.monto)}</strong> para <strong>${d.itemNombre}</strong>.</p><p style="margin:0;color:#6b7280;font-size:14px;">Tu regalo ya cuenta para la mesa. ¡Gracias por participar!</p>`,
        }),
      };
    }
    case "aviso_aportacion_festejado": {
      const d = correo.datos;
      return {
        asunto: "¡Recibiste un regalo! 🎉",
        html: layout({
          encabezado: `¡Recibiste un regalo, ${d.nombreFestejado}! 🎉`,
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;"><strong>${d.nombreInvitado}</strong> aportó <strong>${pesos(d.monto)}</strong> para <strong>${d.itemNombre}</strong>.</p>`,
          cta: { texto: "Ver mi mesa →", url: `${urlBase()}/dashboard` },
        }),
      };
    }
    case "aviso_retiro_festejado": {
      const d = correo.datos;
      return {
        asunto: "Tu retiro se completó 💸",
        html: layout({
          encabezado: "Tu retiro se completó 💸",
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;">Hola ${d.nombreFestejado}, tu retiro de <strong>${pesos(d.monto)}</strong> fue procesado y va en camino a tu cuenta.</p>`,
          cta: { texto: "Ver mi panel →", url: `${urlBase()}/dashboard` },
        }),
      };
    }
    case "bienvenida": {
      const d = correo.datos;
      return {
        asunto: "Bienvenido a RegalaLove ❤️",
        html: layout({
          encabezado: `¡Bienvenido, ${d.nombreFestejado}! ❤️`,
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;">Tu cuenta está lista. Crea tu mesa de regalos en minutos y compártela con tus invitados.</p>`,
          cta: { texto: "Crear mi mesa →", url: `${urlBase()}/dashboard` },
        }),
      };
    }
    default: {
      const desconocida: never = correo;
      throw new Error(`Plantilla de correo desconocida: ${JSON.stringify(desconocida)}`);
    }
  }
}
