"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { validarItem } from "@/items/validarItem";

type Supabase = Awaited<ReturnType<typeof crearClienteServidorAuth>>;

async function eventoIdPorSlug(supabase: Supabase, slug: string): Promise<string> {
  const { data } = await supabase.from("eventos").select("id").eq("slug", slug).maybeSingle();
  if (!data) throw new Error("Mesa no encontrada");
  return data.id as string;
}

function revalidar(slug: string) {
  revalidatePath(`/dashboard/mesa/${slug}`);
  revalidatePath(`/${slug}`);
}

export async function agregarItem(slug: string, formData: FormData) {
  const supabase = await crearClienteServidorAuth();
  const eventoId = await eventoIdPorSlug(supabase, slug);

  const pesos = Number(formData.get("monto_meta") ?? 0);
  const item = validarItem({
    nombre: String(formData.get("nombre") ?? ""),
    descripcion: String(formData.get("descripcion") ?? "") || undefined,
    montoMetaCentavos: Math.round(pesos * 100),
  });
  const imagenUrl = String(formData.get("imagen_url") ?? "").trim() || null;

  const { data: ultimo } = await supabase
    .from("items_mesa")
    .select("orden")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  const orden = (ultimo?.orden ?? -1) + 1;

  const { error } = await supabase.from("items_mesa").insert({
    evento_id: eventoId,
    nombre: item.nombre,
    descripcion: item.descripcion ?? null,
    imagen_url: imagenUrl,
    monto_meta_centavos: item.montoMetaCentavos,
    orden,
  });
  if (error) throw new Error(`No se pudo agregar el ítem: ${error.message}`);

  revalidar(slug);
}

export async function eliminarItem(itemId: string, slug: string) {
  const supabase = await crearClienteServidorAuth();
  const { error } = await supabase.from("items_mesa").delete().eq("id", itemId);
  if (error) throw new Error(`No se pudo eliminar el ítem: ${error.message}`);
  revalidar(slug);
}

export async function moverItem(itemId: string, slug: string, direccion: "subir" | "bajar") {
  const supabase = await crearClienteServidorAuth();
  const eventoId = await eventoIdPorSlug(supabase, slug);

  const { data: items } = await supabase
    .from("items_mesa")
    .select("id, orden")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: true });
  if (!items) return;

  const i = items.findIndex((it) => it.id === itemId);
  const j = direccion === "subir" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= items.length) return; // ya está en el extremo

  // Intercambia los valores de orden de los dos vecinos.
  const a = items[i];
  const b = items[j];
  await supabase.from("items_mesa").update({ orden: b.orden }).eq("id", a.id);
  await supabase.from("items_mesa").update({ orden: a.orden }).eq("id", b.id);

  revalidar(slug);
}
