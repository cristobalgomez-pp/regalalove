import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import FormularioPersonalizar from "./FormularioPersonalizar";

export default async function PersonalizarMesa({
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
    .select("titulo, festejado_id, mensaje_bienvenida, fecha_evento, portada_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) notFound();
  if (evento.festejado_id !== user.id) redirect("/dashboard");

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 560 }}>
      <Link href={`/dashboard/mesa/${slug}`} className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver a armar la mesa
      </Link>
      <header style={{ marginTop: "0.75rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Personalizar tu página</h1>
        <p className="muted" style={{ marginTop: "0.25rem" }}>
          {evento.titulo} ·{" "}
          <Link href={`/${slug}`} target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>
            Ver como invitado →
          </Link>
        </p>
      </header>

      <FormularioPersonalizar
        slug={slug}
        mensajeInicial={evento.mensaje_bienvenida ?? ""}
        fechaInicial={evento.fecha_evento ?? ""}
        portadaInicial={evento.portada_url ?? ""}
      />
    </main>
  );
}
