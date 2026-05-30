import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import PanelEnVivo, { type AportacionVista } from "./PanelEnVivo";
import type { MetodoPago } from "@/dominio/tipos";

export default async function RecibidoMesa({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await crearClienteServidorAuth();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: evento } = await supabase
    .from("eventos")
    .select("id, titulo, festejado_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) notFound();
  if (evento.festejado_id !== user.id) redirect("/dashboard");

  const [{ data: items }, { data: aportaciones }, { data: retiros }, config] = await Promise.all([
    supabase.from("items_mesa").select("id, nombre").eq("evento_id", evento.id),
    supabase
      .from("aportaciones")
      .select("id, nombre_invitado, monto_centavos, item_id, mensaje, metodo_pago, creado_en")
      .eq("evento_id", evento.id)
      .eq("estado", "confirmada")
      .order("creado_en", { ascending: false }),
    supabase.from("retiros").select("monto_centavos").eq("evento_id", evento.id),
    obtenerConfigMonetizacion(),
  ]);

  const yaRetirado = (retiros ?? []).reduce((s, r) => s + r.monto_centavos, 0);

  const itemsMap: Record<string, string> = {};
  for (const it of items ?? []) itemsMap[it.id] = it.nombre;

  const inicial: AportacionVista[] = (aportaciones ?? []).map((a) => ({
    id: a.id,
    nombre: a.nombre_invitado,
    monto: a.monto_centavos,
    itemNombre: a.item_id ? itemsMap[a.item_id] ?? "Un regalo" : null,
    mensaje: a.mensaje ?? "",
    metodoPago: a.metodo_pago as MetodoPago,
    fecha: new Date(a.creado_en).getTime(),
  }));

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 760 }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver al panel
      </Link>
      <header
        style={{
          marginTop: "0.75rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Regalos recibidos</h1>
          <p className="muted" style={{ marginTop: "0.25rem" }}>{evento.titulo} · se actualiza en vivo</p>
        </div>
        <Link href={`/dashboard/mesa/${slug}/retirar`} className="btn btn-primario">
          Retirar dinero
        </Link>
      </header>

      <PanelEnVivo
        eventoId={evento.id}
        ventanaRetencionDias={config.ventanaRetencionDias}
        itemsMap={itemsMap}
        inicial={inicial}
        yaRetirado={yaRetirado}
      />
    </main>
  );
}
