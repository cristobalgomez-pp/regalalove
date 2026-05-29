import { notFound } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";

const ETIQUETA_TIPO: Record<string, string> = {
  boda: "Boda",
  xv: "XV años",
  baby_shower: "Baby shower",
  cumpleanos: "Cumpleaños",
};

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

// Montos de dinero rápidos disponibles en toda mesa (en pesos).
const MONTOS_RAPIDOS = [500, 1000, 1500, 2000, 2500, 5000, 10000];

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await crearClienteServidorAuth();
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
    .select("id, nombre, descripcion, imagen_url, monto_meta_centavos, cantidad")
    .eq("evento_id", evento.id)
    .order("orden", { ascending: true });

  const lista = items ?? [];

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 680 }}>
      <header className="centro" style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          {ETIQUETA_TIPO[evento.tipo] ?? evento.tipo}
        </p>
        <h1 style={{ fontSize: "2.75rem", marginTop: "0.5rem" }}>{evento.titulo}</h1>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Elige un regalo de la lista y haz tu aportación.
        </p>
      </header>

      {/* Regalar dinero — montos rápidos disponibles en toda mesa */}
      <section className="tarjeta" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem" }}>Regalar dinero</h2>
        <p className="muted" style={{ marginTop: "0.35rem", marginBottom: "1rem" }}>
          ¿Prefieres dar dinero directo? Elige un monto y va al fondo general.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {MONTOS_RAPIDOS.map((monto) => (
            <button key={monto} className="btn btn-contorno" disabled title="Próximamente">
              ${monto.toLocaleString("es-MX")}
            </button>
          ))}
          <button className="btn btn-fantasma" disabled title="Próximamente">
            Otro monto
          </button>
        </div>
      </section>

      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Lista de deseos</h2>
      {lista.length === 0 ? (
        <div className="tarjeta centro" style={{ padding: "2.5rem 1.5rem" }}>
          <p className="muted" style={{ margin: 0 }}>
            Esta mesa aún no tiene regalos publicados.
          </p>
        </div>
      ) : (
        <div className="pila">
          {lista.map((it) => (
            <div
              key={it.id}
              className="tarjeta"
              style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1rem 1.25rem" }}
            >
              {it.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.imagen_url}
                  alt={it.nombre}
                  width={72}
                  height={72}
                  style={{ objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                />
              ) : null}
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "1.05rem" }}>
                  {it.nombre}
                  {it.cantidad > 1 ? <span className="muted"> × {it.cantidad}</span> : null}
                </strong>
                {it.descripcion ? (
                  <p className="muted" style={{ margin: "0.2rem 0 0.6rem", fontSize: "0.9rem" }}>
                    {it.descripcion}
                  </p>
                ) : null}
                <div
                  style={{
                    background: "var(--border)",
                    borderRadius: 999,
                    height: 8,
                    overflow: "hidden",
                    marginTop: "0.4rem",
                  }}
                >
                  <div style={{ background: "var(--accent)", width: "0%", height: "100%" }} />
                </div>
                <small className="muted">Meta: {pesos(it.monto_meta_centavos)}</small>
              </div>
              <button className="btn btn-primario" style={{ flexShrink: 0 }} disabled title="Próximamente">
                Regalar
              </button>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}
