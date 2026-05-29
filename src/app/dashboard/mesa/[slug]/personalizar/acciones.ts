"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";

/** Guarda la personalización de la página pública (solo el dueño de la mesa). */
export async function guardarPersonalizacion(slug: string, formData: FormData) {
  const supabase = await crearClienteServidorAuth();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mensaje = String(formData.get("mensaje_bienvenida") ?? "").trim() || null;
  const fecha = String(formData.get("fecha_evento") ?? "").trim() || null;
  const portada = String(formData.get("portada_url") ?? "").trim() || null;

  const { error } = await supabase
    .from("eventos")
    .update({
      mensaje_bienvenida: mensaje,
      fecha_evento: fecha,
      portada_url: portada,
    })
    .eq("slug", slug)
    .eq("festejado_id", user.id); // solo el dueño

  if (error) throw new Error(`No se pudo guardar la personalización: ${error.message}`);

  revalidatePath(`/${slug}`);
  revalidatePath(`/dashboard/mesa/${slug}/personalizar`);
}
