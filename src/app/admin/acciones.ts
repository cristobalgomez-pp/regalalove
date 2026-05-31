// src/app/admin/acciones.ts
"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/admin/exigirAdmin";
import { marcarSospechoso } from "@/admin/eventos";
import { aFilasConfig, type EntradaConfigMonetizacion } from "@/admin/configEscritura";

/** Marca/desmarca un evento como sospechoso (valor explícito, idempotente). */
export async function alternarSospechoso(eventoId: string, valor: boolean) {
  const db = await exigirAdmin();
  await marcarSospechoso(db, eventoId, valor);
  revalidatePath("/admin");
}

/** Guarda la configuración de monetización desde el formulario admin. */
export async function guardarConfig(formData: FormData) {
  const db = await exigirAdmin();

  const entrada: EntradaConfigMonetizacion = {
    comisionBasePct: Number(formData.get("comision_base_pct")),
    comisionPremiumPct: Number(formData.get("comision_premium_pct")),
    precioPremiumPesos: Number(formData.get("precio_premium_pesos")),
    absorcionPreMarcada: formData.get("absorcion_pre_marcada") === "on",
    ventanaRetencionDias: Number(formData.get("ventana_retencion_dias")),
  };

  const filas = aFilasConfig(entrada); // lanza si algo es inválido (no escribe parcial)

  const { error } = await db
    .from("configuracion")
    .upsert(filas.map((f) => ({ clave: f.clave, valor: f.valor })), { onConflict: "clave" });
  if (error) throw new Error(`No se pudo guardar la configuración: ${error.message}`);

  revalidatePath("/admin/config");
}
