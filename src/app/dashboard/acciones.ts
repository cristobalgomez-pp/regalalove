"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { generarSlug } from "@/eventos/slug";
import { SLUGS_RESERVADOS } from "@/eventos/reservados";
import { armarItemsDesdePaquete } from "@/paquetes/armar";

type Supabase = Awaited<ReturnType<typeof crearClienteServidorAuth>>;

/** Genera un código de 4 dígitos (1000–9999) que no choque con otra mesa. */
async function generarCodigoUnico(supabase: Supabase): Promise<string> {
  for (let intento = 0; intento < 30; intento++) {
    const candidato = String(Math.floor(1000 + Math.random() * 9000));
    const { data } = await supabase
      .from("eventos")
      .select("id")
      .eq("codigo", candidato)
      .maybeSingle();
    if (!data) return candidato;
  }
  throw new Error("No se pudo generar un código único para la mesa");
}

/**
 * Crea el evento del festejado (slug + código únicos) y devuelve su id y slug.
 * Helper compartido por la creación manual y por paquete.
 */
async function crearEventoBase(
  supabase: Supabase,
  userId: string,
  datos: { titulo: string; tipo: string },
): Promise<{ eventoId: string; slug: string }> {
  const titulo = datos.titulo.trim();
  if (!titulo) {
    throw new Error("El título es obligatorio");
  }
  const tipo = datos.tipo.trim() || "boda";

  const { data: filas } = await supabase.from("eventos").select("slug");
  const existentes = (filas ?? []).map((f) => f.slug as string);
  const slug = generarSlug(titulo, { existentes, reservados: SLUGS_RESERVADOS });
  const codigo = await generarCodigoUnico(supabase);

  const { data, error } = await supabase
    .from("eventos")
    .insert({ festejado_id: userId, tipo, titulo, slug, codigo })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la mesa: ${error?.message ?? "sin datos"}`);
  }
  return { eventoId: data.id as string, slug };
}

/** Devuelve el usuario autenticado o redirige a /login. */
async function usuarioOLogin(supabase: Supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Crea una mesa vacía (flujo manual) y lleva a gestionarla.
 */
export async function crearEvento(formData: FormData) {
  const supabase = await crearClienteServidorAuth();
  const user = await usuarioOLogin(supabase);

  const { slug } = await crearEventoBase(supabase, user.id, {
    titulo: String(formData.get("titulo") ?? ""),
    tipo: String(formData.get("tipo") ?? "boda"),
  });

  redirect(`/dashboard/mesa/${slug}`);
}

/**
 * Crea una mesa a partir de un paquete prearmado: copia los regalos del paquete
 * a items_mesa (como ítems normales, editables) y lleva a gestionarla.
 */
export async function crearEventoConPaquete(formData: FormData) {
  const paqueteId = String(formData.get("paquete_id") ?? "").trim();
  if (!paqueteId) {
    throw new Error("Falta el paquete a usar");
  }

  const supabase = await crearClienteServidorAuth();
  const user = await usuarioOLogin(supabase);

  const { eventoId, slug } = await crearEventoBase(supabase, user.id, {
    titulo: String(formData.get("titulo") ?? ""),
    tipo: String(formData.get("tipo") ?? "boda"),
  });

  const { data: paqueteItems } = await supabase
    .from("paquete_items")
    .select("cantidad, catalogo_items(id, nombre, descripcion, imagen_url, precio_centavos)")
    .eq("paquete_id", paqueteId);

  const entradas = (paqueteItems ?? []).flatMap((pi) => {
    const c = pi.catalogo_items as unknown as {
      id: string;
      nombre: string;
      descripcion: string | null;
      imagen_url: string | null;
      precio_centavos: number;
    } | null;
    // El FK es not null + on delete cascade, así que c no debería ser null;
    // la guarda evita crear ítems rotos si la fila quedara huérfana.
    if (!c) return [];
    return [
      {
        nombre: c.nombre,
        descripcion: c.descripcion,
        imagenUrl: c.imagen_url,
        precioCentavos: c.precio_centavos,
        cantidad: pi.cantidad,
        catalogoItemId: c.id,
      },
    ];
  });

  const filas = armarItemsDesdePaquete(entradas).map((f) => ({
    ...f,
    evento_id: eventoId,
  }));

  if (filas.length > 0) {
    const { error } = await supabase.from("items_mesa").insert(filas);
    if (error) {
      throw new Error(`No se pudieron copiar los regalos del paquete: ${error.message}`);
    }
  }

  redirect(`/dashboard/mesa/${slug}`);
}

/**
 * Elimina una mesa del festejado. Por RLS ("el dueno borra sus eventos") solo
 * puede borrar las suyas; los regalos, aportaciones y retiros se borran en
 * cascada. Irreversible. Revalida el panel para que desaparezca de la lista.
 */
export async function eliminarEvento(eventoId: string) {
  const supabase = await crearClienteServidorAuth();
  await usuarioOLogin(supabase);

  const { error } = await supabase.from("eventos").delete().eq("id", eventoId);
  if (error) {
    throw new Error(`No se pudo eliminar la mesa: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
