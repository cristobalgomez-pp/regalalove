import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { agregarItem, eliminarItem, ajustarCantidad } from "./acciones";
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
      .select("id, nombre, monto_meta_centavos, cantidad, orden")
      .eq("evento_id", evento.id)
      .order("orden", { ascending: true }),
    supabase
      .from("catalogo_items")
      .select("id, nombre, categoria, descripcion, precio_centavos, imagen_url")
      .order("categoria", { ascending: true }),
  ]);

  const lista = items ?? [];
  const total = lista.reduce((s, it) => s + it.monto_meta_centavos, 0);

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 1100 }}>
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
          <h1 style={{ fontSize: "1.8rem" }}>Arma tu mesa</h1>
          <p className="muted" style={{ marginTop: "0.25rem" }}>{evento.titulo}</p>
        </div>
        <Link href={`/${slug}`} target="_blank" rel="noopener" className="btn btn-contorno">
          👁 Ver como invitado
        </Link>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(280px, 340px)",
          gap: "1.75rem",
          alignItems: "start",
        }}
      >
        {/* IZQUIERDA: catálogo + ítem propio */}
        <div>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Catálogo de regalos</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Escoge lo que de verdad querrías. Cada regalo representa el dinero a juntar.
          </p>
          <CatalogoSelector slug={slug} catalogo={catalogo ?? []} />

          <details style={{ marginTop: "2rem" }}>
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
        </div>

        {/* DERECHA: tu mesa (sticky) */}
        <aside style={{ position: "sticky", top: "1.5rem" }}>
          <div className="tarjeta">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ fontSize: "1.15rem" }}>En tu mesa</h2>
              <span className="muted" style={{ fontSize: "0.85rem" }}>{lista.length} regalos</span>
            </div>

            {lista.length === 0 ? (
              <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
                Aún no agregas nada. Usa el catálogo de la izquierda. 👈
              </p>
            ) : (
              <>
                <div className="pila" style={{ marginTop: "1rem", gap: "0.6rem" }}>
                  {lista.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.65rem 0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.5rem" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{it.nombre}</strong>
                        <form action={eliminarItem.bind(null, it.id, slug)}>
                          <button type="submit" className="btn btn-fantasma" style={{ padding: "0.1rem 0.4rem" }} title="Quitar">
                            ✕
                          </button>
                        </form>
                      </div>
                      <div className="muted" style={{ fontSize: "0.85rem", margin: "0.2rem 0 0.5rem" }}>
                        {pesos(it.monto_meta_centavos)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <form action={ajustarCantidad.bind(null, it.id, slug, -1)}>
                          <button type="submit" className="btn btn-contorno" style={{ padding: "0.2rem 0.6rem" }} title="Menos">
                            −
                          </button>
                        </form>
                        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}>{it.cantidad}</span>
                        <form action={ajustarCantidad.bind(null, it.id, slug, 1)}>
                          <button type="submit" className="btn btn-contorno" style={{ padding: "0.2rem 0.6rem" }} title="Más">
                            +
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "1rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid var(--border)",
                    fontWeight: 700,
                  }}
                >
                  <span>Total</span>
                  <span>{pesos(total)}</span>
                </div>

                <Link
                  href={`/dashboard/mesa/${slug}/resumen`}
                  className="btn btn-primario btn-bloque"
                  style={{ marginTop: "1rem" }}
                >
                  Continuar →
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
