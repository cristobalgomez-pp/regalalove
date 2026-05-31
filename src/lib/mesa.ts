import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { evaluarAccesoMesa } from "@/eventos/acceso";

type ClienteAuth = Awaited<ReturnType<typeof crearClienteServidorAuth>>;

/**
 * Carga la mesa identificada por `slug` y garantiza que pertenece al usuario
 * autenticado. Centraliza el guard que antes se repetía en cada página y
 * acción de gestión:
 *   - sin sesión        → redirige a /login
 *   - mesa inexistente  → notFound()
 *   - mesa ajena        → redirige a /dashboard
 * Devuelve la mesa ya validada junto al usuario y el cliente Supabase.
 *
 * `columnas` deja que cada vista pida solo lo que necesita; siempre debe
 * incluir festejado_id para poder verificar la pertenencia.
 */
export async function cargarMesaDelFestejado<E extends { festejado_id: string }>(
  slug: string,
  columnas = "id, titulo, festejado_id",
): Promise<{ supabase: ClienteAuth; user: User; evento: E }> {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: evento } = await supabase
    .from("eventos")
    .select(columnas)
    .eq("slug", slug)
    .maybeSingle();

  const mesa = evento as unknown as E | null;
  const acceso = evaluarAccesoMesa(mesa, user.id);
  if (acceso === "inexistente") notFound();
  if (acceso === "ajena") redirect("/dashboard");

  return { supabase, user, evento: mesa as E };
}
