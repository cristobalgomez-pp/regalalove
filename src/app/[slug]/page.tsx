import { notFound } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = crearClienteNavegador();
  const { data: evento } = await supabase
    .from("eventos")
    .select("titulo, tipo")
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) {
    notFound();
  }

  return (
    <main style={{ maxWidth: 600, margin: "4rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <p style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>
        {evento.tipo}
      </p>
      <h1 style={{ fontSize: "2.5rem", margin: "0.5rem 0" }}>{evento.titulo}</h1>
      <p style={{ color: "#666" }}>Mesa de regalos · próximamente</p>
    </main>
  );
}
