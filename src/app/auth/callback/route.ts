import { NextResponse } from "next/server";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { correoBienvenida } from "@/notificaciones/correos";
import { enviarCorreos } from "@/notificaciones/enviador";
import { obtenerEnviador } from "@/notificaciones/enviador.factory";

/**
 * Procesa el enlace de confirmación de correo: intercambia el código por una
 * sesión (que queda en cookies) y lleva al festejado a su panel. Si algo
 * falla, regresa al login con un aviso.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const destino = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await crearClienteServidorAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Bienvenida (no bloqueante). La app usa login con contraseña, así que
      // este callback se visita esencialmente solo al confirmar el correo.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          await enviarCorreos(obtenerEnviador(), [
            correoBienvenida({ nombre: user.email, correo: user.email }),
          ]);
        }
      } catch (e) {
        console.error("No se pudo enviar la bienvenida:", e);
      }
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?aviso=confirmacion-invalida`);
}
