// src/admin/exigirAdmin.ts
import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esAdmin, obtenerAllowlistAdmin } from "./acceso";

/**
 * Exige que el usuario logueado sea admin (allowlist). Defensa en profundidad
 * sobre el middleware: cada page/action admin lo llama. Devuelve un cliente
 * Supabase con service_role listo para operar (salta RLS).
 *   - sin sesión               → redirige a /login
 *   - sesión fuera de allowlist → redirige a /dashboard
 */
export async function exigirAdmin() {
  const auth = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect("/login");
  if (!esAdmin(user.email, obtenerAllowlistAdmin())) redirect("/dashboard");
  return crearClienteServidor();
}
