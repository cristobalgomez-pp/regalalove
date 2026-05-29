import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador (rol anónimo).
 * Usa la URL pública y la publishable/anon key. El acceso a datos se rige
 * por las políticas RLS del proyecto.
 */
export function crearClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno",
    );
  }

  return createClient(url, anonKey);
}
