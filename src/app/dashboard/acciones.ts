"use server";

import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { generarSlug } from "@/eventos/slug";
import { SLUGS_RESERVADOS } from "@/eventos/reservados";

/**
 * Crea una mesa/evento del festejado autenticado y redirige a su página
 * pública. El slug se deriva del título evitando colisiones y reservados.
 */
export async function crearEvento(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "boda").trim() || "boda";

  if (!titulo) {
    throw new Error("El título es obligatorio");
  }

  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: filas } = await supabase.from("eventos").select("slug");
  const existentes = (filas ?? []).map((f) => f.slug as string);
  const slug = generarSlug(titulo, { existentes, reservados: SLUGS_RESERVADOS });

  const { error } = await supabase
    .from("eventos")
    .insert({ festejado_id: user.id, tipo, titulo, slug });

  if (error) {
    throw new Error(`No se pudo crear la mesa: ${error.message}`);
  }

  // Recién creada la mesa, llevamos al festejado a gestionarla (agregar
  // regalos) en vez de a su página pública todavía vacía.
  redirect(`/dashboard/mesa/${slug}`);
}
