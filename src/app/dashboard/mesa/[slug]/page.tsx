import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { agregarItem, eliminarItem, moverItem } from "./acciones";
import CatalogoSelector from "./CatalogoSelector";

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

  const [{ data: items }, { data: catalogo }] = await Promise.all([
    supabase
      .from("items_mesa")
      .select("id, nombre, descripcion, monto_meta_centavos, cantidad, orden")
      .eq("evento_id", evento.id)
      .order("orden", { ascending: true }),
    supabase
      .from("catalogo_items")
      .select("id, nombre, categoria, descripcion, precio_centavos, imagen_url")
      .order("categoria", { ascending: true }),
  ]);

  const lista = items ?? [];

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver al panel
      </Link>

      <header style={{ marginTop: "0.75rem", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Arma tu mesa</h1>
        <p className="muted" style={{ marginTop: "0.25rem" }}>
          {evento.titulo} ·{" "}
          <Link href={`/${slug}`} style={{ color: "var(--accent)" }}>
            Ver página pública →
          </Link>
        </p>
      </header>

      {/* Tus ítems */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
          En tu mesa <span className="muted">({lista.length})</span>
        </h2>
        {lista.length === 0 ? (
          <div className="tarjeta centro" style={{ padding: "2rem 1.5rem" }}>
            <p className="muted" style={{ margin: 0 }}>
              Aún no agregas nada. Escoge regalos del catálogo de abajo. 👇
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
                  padding: "0.85rem 1.1rem",
                }}
              >
                <div>
                  <strong>{it.nombre}</strong>
                  {it.cantidad > 1 ? (
                    <span className="muted" style={{ fontSize: "0.85rem" }}> × {it.cantidad}</span>
                  ) : null}
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Meta: {pesos(it.monto_meta_centavos)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                  <form action={moverItem.bind(null, it.id, slug, "subir")}>
                    <button type="submit" className="btn btn-contorno" disabled={idx === 0} title="Subir">↑</button>
                  </form>
                  <form action={moverItem.bind(null, it.id, slug, "bajar")}>
                    <button type="submit" className="btn btn-contorno" disabled={idx === lista.length - 1} title="Bajar">↓</button>
                  </form>
                  <form action={eliminarItem.bind(null, it.id, slug)}>
                    <button type="submit" className="btn btn-fantasma" title="Quitar">Quitar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Catálogo */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Catálogo de regalos</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Escoge lo que de verdad querrías. Cada regalo representa el dinero a juntar.
        </p>
        <CatalogoSelector slug={slug} catalogo={catalogo ?? []} />
      </section>

      {/* Ítem propio (escape) */}
      <section>
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            ¿No lo encuentras? Crea un ítem propio
          </summary>
          <div className="tarjeta" style={{ maxWidth: 420, marginTop: "1rem" }}>
            <form action={agregarItem.bind(null, slug)} className="pila">
              <div className="campo">
                <label htmlFor="nombre">Nombre</label>
                <input id="nombre" name="nombre" className="input" placeholder="ej. Bicicleta" required />
              </div>
              <div className="campo">
                <label htmlFor="descripcion">Descripción (opcional)</label>
                <input id="descripcion" name="descripcion" className="input" placeholder="Detalles" />
              </div>
              <div className="campo">
                <label htmlFor="imagen_url">URL de imagen (opcional)</label>
                <input id="imagen_url" name="imagen_url" className="input" placeholder="https://…" />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="campo" style={{ flex: 1 }}>
                  <label htmlFor="monto_meta">Precio unitario (MXN)</label>
                  <input id="monto_meta" name="monto_meta" className="input" type="number" step="0.01" min="0.01" placeholder="ej. 3500" required />
                </div>
                <div className="campo" style={{ width: 90 }}>
                  <label htmlFor="cantidad">Cantidad</label>
                  <input id="cantidad" name="cantidad" className="input" type="number" min={1} defaultValue={1} />
                </div>
              </div>
              <button type="submit" className="btn btn-primario btn-bloque">
                Agregar ítem propio
              </button>
            </form>
          </div>
        </details>
      </section>
    </main>
  );
}
