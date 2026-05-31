import Link from "next/link";
import { cargarMesaDelFestejado } from "@/lib/mesa";
import { itemsDeMesa, aportacionesConfirmadas } from "@/lib/datos-mesa";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import PanelEnVivo, { type AportacionVista } from "./PanelEnVivo";
import type { MetodoPago } from "@/dominio/tipos";

export default async function RecibidoMesa({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, evento } = await cargarMesaDelFestejado<{
    id: string;
    titulo: string;
    festejado_id: string;
  }>(slug, "id, titulo, festejado_id");

  const [items, aportaciones, { data: retiros }, config] = await Promise.all([
    itemsDeMesa(supabase, evento.id),
    aportacionesConfirmadas(supabase, evento.id),
    supabase.from("retiros").select("monto_centavos").eq("evento_id", evento.id),
    obtenerConfigMonetizacion(),
  ]);

  const yaRetirado = (retiros ?? []).reduce((s, r) => s + r.monto_centavos, 0);

  const itemsMap: Record<string, string> = {};
  for (const it of items) itemsMap[it.id] = it.nombre;

  const inicial: AportacionVista[] = aportaciones.map((a) => ({
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
