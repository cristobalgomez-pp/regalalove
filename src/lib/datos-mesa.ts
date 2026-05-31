import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lectores de datos de una mesa con nombre de dominio. Concentran las consultas
 * que antes estaban escritas a mano (y repetidas) en cada página/acción: la
 * tabla, las columnas y el filtro "confirmada" viven en un solo lugar.
 */

export interface ItemMesaRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  monto_meta_centavos: number;
  cantidad: number;
  orden: number;
}

/** Ítems de una mesa, en orden de presentación. */
export async function itemsDeMesa(db: SupabaseClient, eventoId: string): Promise<ItemMesaRow[]> {
  const { data } = await db
    .from("items_mesa")
    .select("id, nombre, descripcion, imagen_url, monto_meta_centavos, cantidad, orden")
    .eq("evento_id", eventoId)
    .order("orden", { ascending: true });
  return (data ?? []) as unknown as ItemMesaRow[];
}

export interface AportacionConfirmadaRow {
  id: string;
  nombre_invitado: string;
  monto_centavos: number;
  item_id: string | null;
  mensaje: string | null;
  metodo_pago: string;
  creado_en: string;
}

/** Aportaciones confirmadas de una mesa, de la más reciente a la más antigua. */
export async function aportacionesConfirmadas(
  db: SupabaseClient,
  eventoId: string,
): Promise<AportacionConfirmadaRow[]> {
  const { data } = await db
    .from("aportaciones")
    .select("id, nombre_invitado, monto_centavos, item_id, mensaje, metodo_pago, creado_en")
    .eq("evento_id", eventoId)
    .eq("estado", "confirmada")
    .order("creado_en", { ascending: false });
  return (data ?? []) as unknown as AportacionConfirmadaRow[];
}
