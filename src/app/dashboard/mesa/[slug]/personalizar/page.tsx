import Link from "next/link";
import { cargarMesaDelFestejado } from "@/lib/mesa";
import FormularioPersonalizar from "./FormularioPersonalizar";

export default async function PersonalizarMesa({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { evento } = await cargarMesaDelFestejado<{
    titulo: string;
    festejado_id: string;
    mensaje_bienvenida: string | null;
    fecha_evento: string | null;
    portada_url: string | null;
  }>(slug, "titulo, festejado_id, mensaje_bienvenida, fecha_evento, portada_url");

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
