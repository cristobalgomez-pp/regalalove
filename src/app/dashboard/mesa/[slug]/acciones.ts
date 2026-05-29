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

async function siguienteOrden(supabase: Supabase, eventoId: string): Promise<number> {
  const { data: ultimo } = await supabase
    .from("items_mesa")
    .select("orden")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (ultimo?.orden ?? -1) + 1;
}

export async function agregarItem(slug: string, formData: FormData) {
  const supabase = await crearClienteServidorAuth();
  const eventoId = await eventoIdPorSlug(supabase, slug);

  const pesos = Number(formData.get("monto_meta") ?? 0);
  const cantidad = Math.max(1, Math.round(Number(formData.get("cantidad") ?? 1)));
  const item = validarItem({
    nombre: String(formData.get("nombre") ?? ""),
    descripcion: String(formData.get("descripcion") ?? "") || undefined,
    montoMetaCentavos: Math.round(pesos * 100),
  });
  const imagenUrl = String(formData.get("imagen_url") ?? "").trim() || null;
  const orden = await siguienteOrden(supabase, eventoId);

  const { error } = await supabase.from("items_mesa").insert({
    evento_id: eventoId,
    nombre: item.nombre,
    descripcion: item.descripcion ?? null,
    imagen_url: imagenUrl,
    monto_meta_centavos: item.montoMetaCentavos * cantidad,
    cantidad,
    orden,
  });
  if (error) throw new Error(`No se pudo agregar el ítem: ${error.message}`);

  revalidar(slug);
}

/** Agrega a la mesa un ítem escogido del catálogo de Regalove, con cantidad.
 * La meta de dinero = precio del catálogo × cantidad. */
export async function agregarDesdeCatalogo(
  slug: string,
  catalogoItemId: string,
  formData: FormData,
) {
  const supabase = await crearClienteServidorAuth();
  const eventoId = await eventoIdPorSlug(supabase, slug);

  const cantidad = Math.max(1, Math.round(Number(formData.get("cantidad") ?? 1)));

  const { data: catItem } = await supabase
    .from("catalogo_items")
    .select("nombre, descripcion, imagen_url, precio_centavos")
    .eq("id", catalogoItemId)
    .maybeSingle();
  if (!catItem) throw new Error("Ítem de catálogo no encontrado");

  const orden = await siguienteOrden(supabase, eventoId);

  const { error } = await supabase.from("items_mesa").insert({
    evento_id: eventoId,
    catalogo_item_id: catalogoItemId,
    nombre: catItem.nombre,
    descripcion: catItem.descripcion,
    imagen_url: catItem.imagen_url,
    monto_meta_centavos: catItem.precio_centavos * cantidad,
    cantidad,
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
