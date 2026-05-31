"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { cargarMesaDelFestejado } from "@/lib/mesa";
import { calcularSaldoRetiro } from "./calculo";
import { correoPorRetiro } from "@/notificaciones/correos";
import { enviarCorreos } from "@/notificaciones/enviador";
import { obtenerEnviador } from "@/notificaciones/enviador.factory";

/** Guarda los datos KYC del festejado (nombre completo + CLABE). */
export async function guardarKyc(slug: string, formData: FormData) {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nombre = String(formData.get("nombre_completo") ?? "").trim();
  const clabe = String(formData.get("clabe") ?? "").replace(/\D/g, "");
  if (!nombre) throw new Error("Falta tu nombre completo");
  if (clabe.length !== 18) throw new Error("La CLABE debe tener 18 dígitos");

  const { error } = await supabase
    .from("kyc_festejado")
    .upsert({ festejado_id: user.id, nombre_completo: nombre, clabe, estado: "verificado" });
  if (error) throw new Error(`No se pudieron guardar tus datos: ${error.message}`);

  revalidatePath(`/dashboard/mesa/${slug}/retirar`);
}

/** Solicita un retiro de la mesa. Dispersión simulada (EcartPay real pendiente);
 * se asienta como 'completado' tras validar contra lo disponible. */
export async function solicitarRetiro(slug: string, formData: FormData) {
  const { supabase, user, evento } = await cargarMesaDelFestejado<{
    id: string;
    festejado_id: string;
  }>(slug, "id, festejado_id");

  const { data: kyc } = await supabase
    .from("kyc_festejado")
    .select("clabe, nombre_completo")
    .eq("festejado_id", user.id)
    .maybeSingle();
  if (!kyc) throw new Error("Primero completa tus datos para recibir el dinero");

  const montoPesos = Number(formData.get("monto"));
  if (!Number.isFinite(montoPesos) || montoPesos <= 0) throw new Error("El monto debe ser positivo");
  const montoCentavos = Math.round(montoPesos * 100);

  const { disponible } = await calcularSaldoRetiro(supabase, evento.id);
  if (montoCentavos > disponible) throw new Error("El monto supera lo disponible para retirar");

  const { error } = await supabase.from("retiros").insert({
    evento_id: evento.id,
    monto_centavos: montoCentavos,
    clabe_destino: kyc.clabe,
    estado: "completado",
  });
  if (error) throw new Error(`No se pudo procesar el retiro: ${error.message}`);

  // Aviso de retiro (no bloqueante). El festejado es el usuario logueado.
  try {
    if (user.email) {
      await enviarCorreos(obtenerEnviador(), [
        correoPorRetiro(
          { monto: montoCentavos },
          { nombre: kyc.nombre_completo ?? user.email, correo: user.email },
        ),
      ]);
    }
  } catch (e) {
    console.error("No se pudo enviar el aviso de retiro:", e);
  }

  revalidatePath(`/dashboard/mesa/${slug}/retirar`);
  revalidatePath(`/dashboard/mesa/${slug}/recibido`);
}
