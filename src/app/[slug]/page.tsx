import { notFound } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = crearClienteNavegador();
  const { data: evento } = await supabase
    .from("eventos")
    .select("id, titulo, tipo")
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) {
    notFound();
  }

  const { data: items } = await supabase
    .from("items_mesa")
    .select("id, nombre, descripcion, imagen_url, monto_meta_centavos")
    .eq("evento_id", evento.id)
    .order("orden", { ascending: true });

  const lista = items ?? [];

  return (
    <main style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ textAlign: "center" }}>
        <p style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>
          {evento.tipo}
        </p>
        <h1 style={{ fontSize: "2.5rem", margin: "0.5rem 0" }}>{evento.titulo}</h1>
      </header>

      <section style={{ marginTop: "2rem" }}>
        <h2>Lista de deseos</h2>
        {lista.length === 0 ? (
          <p style={{ color: "#666" }}>Esta mesa aún no tiene ítems.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {lista.map((it) => (
              <li key={it.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                {it.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imagen_url} alt={it.nombre} width={64} height={64} style={{ objectFit: "cover", borderRadius: 6 }} />
                ) : null}
                <div style={{ flex: 1 }}>
                  <strong>{it.nombre}</strong>
                  {it.descripcion ? <p style={{ margin: "0.25rem 0", color: "#888" }}>{it.descripcion}</p> : null}
                  <div style={{ background: "#eee", borderRadius: 4, height: 8, overflow: "hidden" }}>
                    <div style={{ background: "#d6336c", width: "0%", height: "100%" }} />
                  </div>
                  <small style={{ color: "#666" }}>Meta: {pesos(it.monto_meta_centavos)}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: "2rem", border: "1px dashed #ccc", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
        <h2 style={{ margin: 0 }}>Fondo general</h2>
        <p style={{ color: "#666", margin: "0.5rem 0 0" }}>
          ¿Prefieres dar libre? Aporta al fondo general sin elegir un ítem.
        </p>
      </section>
    </main>
  );
}
