import { crearClienteServidor } from "@/lib/supabase/server";
import {
  interpretarConfigMonetizacion,
  type ConfigMonetizacion,
} from "./monetizacion";

/**
 * Lee la configuración de monetización desde la tabla `configuracion` de
 * Supabase y la traduce a config tipada (con defaults). Solo servidor:
 * usa el cliente con service_role porque la tabla tiene RLS sin políticas
 * públicas.
 */
export async function obtenerConfigMonetizacion(): Promise<ConfigMonetizacion> {
  const supabase = crearClienteServidor();
  const { data, error } = await supabase.from("configuracion").select("clave, valor");

  if (error) {
    throw new Error(`No se pudo leer la configuración de monetización: ${error.message}`);
  }

  return interpretarConfigMonetizacion(data ?? []);
}
