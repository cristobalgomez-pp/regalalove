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
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 760 }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver al panel
      </Link>

      <header style={{ marginTop: "0.75rem", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Lista de deseos</h1>
        <p className="muted" style={{ marginTop: "0.25rem" }}>
          {evento.titulo} ·{" "}
          <Link href={`/${slug}`} style={{ color: "var(--accent)" }}>
            Ver página pública →
          </Link>
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 340px) 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <section className="tarjeta">
          <h2 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Agregar ítem</h2>
          <form action={agregarItem.bind(null, slug)} className="pila">
            <div className="campo">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" name="nombre" className="input" placeholder="ej. Vajilla" required />
            </div>
            <div className="campo">
              <label htmlFor="descripcion">Descripción (opcional)</label>
              <input id="descripcion" name="descripcion" className="input" placeholder="Detalles del regalo" />
            </div>
            <div className="campo">
              <label htmlFor="imagen_url">URL de imagen (opcional)</label>
              <input id="imagen_url" name="imagen_url" className="input" placeholder="https://…" />
            </div>
            <div className="campo">
              <label htmlFor="monto_meta">Precio meta (MXN)</label>
              <input
                id="monto_meta"
                name="monto_meta"
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="ej. 3500"
                required
              />
            </div>
            <button type="submit" className="btn btn-primario btn-bloque">
              Agregar ítem
            </button>
          </form>
        </section>

        <section>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>
            Ítems <span className="muted">({lista.length})</span>
          </h2>
          {lista.length === 0 ? (
            <div className="tarjeta centro" style={{ padding: "2.5rem 1.5rem" }}>
              <p className="muted" style={{ margin: 0 }}>
                Aún no hay ítems. Agrega el primero con el formulario de la izquierda.
              </p>
            </div>
          ) : (
            <div className="pila">
              {lista.map((it, idx) => (
                <div
                  key={it.id}
                  className="tarjeta"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                  }}
                >
                  <div>
                    <strong>{it.nombre}</strong>
                    <div className="muted" style={{ fontSize: "0.9rem" }}>
                      {pesos(it.monto_meta_centavos)}
                      {it.descripcion ? ` · ${it.descripcion}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                    <form action={moverItem.bind(null, it.id, slug, "subir")}>
                      <button type="submit" className="btn btn-contorno" disabled={idx === 0} title="Subir">
                        ↑
                      </button>
                    </form>
                    <form action={moverItem.bind(null, it.id, slug, "bajar")}>
                      <button
                        type="submit"
                        className="btn btn-contorno"
                        disabled={idx === lista.length - 1}
                        title="Bajar"
                      >
                        ↓
                      </button>
                    </form>
                    <form action={eliminarItem.bind(null, it.id, slug)}>
                      <button type="submit" className="btn btn-fantasma" title="Eliminar">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
