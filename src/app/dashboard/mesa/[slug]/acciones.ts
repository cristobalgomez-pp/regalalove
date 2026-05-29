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

/** Agrega un ítem del catálogo a la mesa con la cantidad indicada. Si ya está,
 * suma esa cantidad (en vez de duplicar la fila); si no, lo inserta. La meta de
 * dinero siempre es precio unitario × cantidad. */
export async function agregarDesdeCatalogo(
  slug: string,
  catalogoItemId: string,
  formData: FormData,
) {
  const supabase = await crearClienteServidorAuth();
  const eventoId = await eventoIdPorSlug(supabase, slug);

  const aAgregar = Math.max(1, Math.round(Number(formData.get("cantidad") ?? 1)));

  const { data: existentes } = await supabase
    .from("items_mesa")
    .select("id, cantidad, monto_meta_centavos")
    .eq("evento_id", eventoId)
    .eq("catalogo_item_id", catalogoItemId)
    .limit(1);
  const existente = existentes?.[0];

  if (existente) {
    const unitario = Math.round(existente.monto_meta_centavos / existente.cantidad);
    const cantidad = existente.cantidad + aAgregar;
    const { error } = await supabase
      .from("items_mesa")
      .update({ cantidad, monto_meta_centavos: unitario * cantidad })
      .eq("id", existente.id);
    if (error) throw new Error(`No se pudo actualizar el ítem: ${error.message}`);
    revalidar(slug);
    return;
  }

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
    monto_meta_centavos: catItem.precio_centavos * aAgregar,
    cantidad: aAgregar,
    orden,
  });
  if (error) throw new Error(`No se pudo agregar el ítem: ${error.message}`);

  revalidar(slug);
}

/** Sube o baja la cantidad de un ítem ya agregado (mínimo 1), recalculando
 * la meta de dinero a partir del precio unitario. */
export async function ajustarCantidad(itemId: string, slug: string, delta: number) {
  const supabase = await crearClienteServidorAuth();

  const { data: item } = await supabase
    .from("items_mesa")
    .select("cantidad, monto_meta_centavos")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  const unitario = Math.round(item.monto_meta_centavos / item.cantidad);
  const cantidad = Math.max(1, item.cantidad + delta);
  const { error } = await supabase
    .from("items_mesa")
    .update({ cantidad, monto_meta_centavos: unitario * cantidad })
    .eq("id", itemId);
  if (error) throw new Error(`No se pudo ajustar la cantidad: ${error.message}`);

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
