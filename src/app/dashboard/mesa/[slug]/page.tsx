import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { agregarItem, eliminarItem, moverItem } from "./acciones";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function GestionMesa({
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
  if (evento.festejado_id !== user.id) redirect("/dashboard"); // no es tu mesa

  const { data: items } = await supabase
    .from("items_mesa")
    .select("id, nombre, descripcion, monto_meta_centavos, orden")
    .eq("evento_id", evento.id)
    .order("orden", { ascending: true });

  const lista = items ?? [];

  return (
    <main style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <p><Link href="/dashboard">← Volver al panel</Link></p>
      <h1>Lista de deseos · {evento.titulo}</h1>
      <p><Link href={`/${slug}`}>Ver página pública →</Link></p>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Agregar ítem</h2>
        <form action={agregarItem.bind(null, slug)} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 380 }}>
          <input name="nombre" placeholder="Nombre (ej. Vajilla)" required />
          <input name="descripcion" placeholder="Descripción (opcional)" />
          <input name="imagen_url" placeholder="URL de imagen (opcional)" />
          <input name="monto_meta" type="number" step="0.01" min="0.01" placeholder="Precio meta (MXN, ej. 3500)" required />
          <button type="submit">Agregar</button>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Ítems ({lista.length})</h2>
        {lista.length === 0 ? (
          <p style={{ color: "#666" }}>Aún no hay ítems. Agrega el primero arriba.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {lista.map((it, idx) => (
              <li key={it.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <strong>{it.nombre}</strong> — {pesos(it.monto_meta_centavos)}
                  {it.descripcion ? <span style={{ color: "#888" }}> · {it.descripcion}</span> : null}
                </span>
                <span style={{ display: "flex", gap: "0.25rem" }}>
                  <form action={moverItem.bind(null, it.id, slug, "subir")}>
                    <button type="submit" disabled={idx === 0}>↑</button>
                  </form>
                  <form action={moverItem.bind(null, it.id, slug, "bajar")}>
                    <button type="submit" disabled={idx === lista.length - 1}>↓</button>
                  </form>
                  <form action={eliminarItem.bind(null, it.id, slug)}>
                    <button type="submit">Eliminar</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
