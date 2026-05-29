import { NextResponse } from "next/server";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";

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
      return NextResponse.redirect(`${origin}${destino}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?aviso=confirmacion-invalida`);
}
