import { notFound } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import FormularioAportacion from "./FormularioAportacion";

export default async function Aportar({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ item?: string; monto?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await crearClienteServidorAuth();
  const { data: evento } = await supabase
    .from("eventos")
    .select("id, titulo")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) notFound();

  // ¿Aporta a un ítem o al fondo general (monto libre)?
  let itemId: string | null = null;
  let itemNombre: string | null = null;
  let montoInicial = sp.monto && Number(sp.monto) > 0 ? Number(sp.monto) : 1000;

  if (sp.item) {
    const { data: it } = await supabase
      .from("items_mesa")
      .select("id, nombre, monto_meta_centavos")
      .eq("id", sp.item)
      .eq("evento_id", evento.id)
      .maybeSingle();
    if (it) {
      const { data: aps } = await supabase
        .from("aportaciones")
        .select("monto_centavos")
        .eq("item_id", it.id)
        .eq("estado", "confirmada");
      const fondeado = (aps ?? []).reduce((s, a) => s + a.monto_centavos, 0);
      const faltante = Math.max(0, it.monto_meta_centavos - fondeado);
      itemId = it.id;
      itemNombre = it.nombre;
      montoInicial = (faltante > 0 ? faltante : it.monto_meta_centavos) / 100;
    }
  }

  const config = await obtenerConfigMonetizacion();

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 480 }}>
      <Link href={`/${slug}`} className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver a la mesa
      </Link>
      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem", marginBottom: "0.25rem" }}>Hacer un regalo</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>{evento.titulo}</p>

      <FormularioAportacion
        slug={slug}
        titulo={evento.titulo}
        itemId={itemId}
        itemNombre={itemNombre}
        montoInicial={montoInicial}
        comisionPct={config.comisionBasePct}
        absorcionPreMarcada={config.absorcionPreMarcada}
      />
    </main>
  );
}
