"use server";

import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";

/** Resuelve un código de 4 dígitos al slug de su mesa, o null si no existe. */
export async function buscarMesaPorCodigo(codigo: string): Promise<string | null> {
  const limpio = codigo.replace(/\D/g, "").slice(0, 4);
  if (limpio.length !== 4) return null;

  const supabase = await crearClienteServidorAuth();
  const { data } = await supabase
    .from("eventos")
    .select("slug")
    .eq("codigo", limpio)
    .maybeSingle();

  return (data?.slug as string) ?? null;
}
