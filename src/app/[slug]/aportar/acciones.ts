"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import { calcularComision } from "@/fees/fees";
import { crearEcartPayFake } from "@/pagos/ecartpay.fake";
import { asentarAportacion } from "@/pagos/persistencia";
import type { MetodoPago } from "@/dominio/tipos";
import { correosPorAportacion } from "@/notificaciones/correos";
import { enviarCorreos } from "@/notificaciones/enviador";
import { obtenerEnviador } from "@/notificaciones/enviador.factory";

const METODOS: MetodoPago[] = ["tarjeta", "spei", "oxxo", "codi"];

/**
 * Procesa una aportación del invitado. Hoy usa la pasarela simulada (EcartPay
 * real pendiente de credenciales): crea el cobro, simula su confirmación y
 * asienta la aportación en la base (que se refleja en el progreso de la mesa).
 */
export async function procesarAportacion(slug: string, formData: FormData) {
  const supabase = crearClienteServidor();

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, festejado_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) throw new Error("Mesa no encontrada");

  const itemId = String(formData.get("itemId") ?? "").trim() || null;
  const montoPesos = Number(formData.get("monto"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const metodoRaw = String(formData.get("metodoPago") ?? "tarjeta");
  const metodoPago: MetodoPago = METODOS.includes(metodoRaw as MetodoPago)
    ? (metodoRaw as MetodoPago)
    : "tarjeta";
  const absorbe = formData.get("absorbe") === "on";

  if (!Number.isFinite(montoPesos) || montoPesos <= 0) throw new Error("El monto debe ser positivo");
  if (!nombre) throw new Error("Falta tu nombre");
  if (!correo) throw new Error("Falta tu correo");

  const montoCentavos = Math.round(montoPesos * 100);
  const config = await obtenerConfigMonetizacion();
  const { comision } = calcularComision(
    montoCentavos,
    { plan: "gratis", absorbeInvitado: absorbe },
    config,
  );

  // Pasarela simulada — el adaptador real de EcartPay implementa el mismo puerto.
  const pasarela = crearEcartPayFake();
  const cobro = await pasarela.crearCobro({
    mesaId: evento.id,
    itemId,
    monto: montoCentavos,
    metodoPago,
    invitado: { nombre, mensaje },
  });

  // Simulamos la confirmación del pago: asentamos la aportación.
  await asentarAportacion(supabase, {
    eventoId: evento.id,
    itemId,
    cobroId: `${cobro.cobroId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    monto: montoCentavos,
    metodoPago,
    nombreInvitado: nombre,
    correoInvitado: correo,
    mensaje,
    absorbeComision: absorbe,
    comisionCentavos: comision,
  });

  // Correos transaccionales: no deben romper el flujo si Resend falla.
  try {
    let itemNombre = "Fondo general";
    if (itemId) {
      const { data: item } = await supabase
        .from("items_mesa")
        .select("nombre")
        .eq("id", itemId)
        .maybeSingle();
      if (item?.nombre) itemNombre = item.nombre;
    }
    const { data: festejadoUser } = await supabase.auth.admin.getUserById(evento.festejado_id);
    const correoFestejado = festejadoUser?.user?.email;
    if (correoFestejado) {
      const correos = correosPorAportacion(
        { invitado: { nombre, correo, mensaje }, monto: montoCentavos, itemNombre },
        { nombre: correoFestejado, correo: correoFestejado },
      );
      await enviarCorreos(obtenerEnviador(), correos);
    }
  } catch (e) {
    console.error("No se pudieron enviar los correos de la aportación:", e);
  }

  revalidatePath(`/${slug}`);
  redirect(`/${slug}/gracias?monto=${montoPesos}`);
}
