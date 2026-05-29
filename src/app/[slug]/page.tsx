import { notFound } from "next/navigation";
import Link from "next/link";
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

  const [{ data: items }, { data: aportaciones }] = await Promise.all([
    supabase
      .from("items_mesa")
      .select("id, nombre, descripcion, imagen_url, monto_meta_centavos, cantidad")
      .eq("evento_id", evento.id)
      .order("orden", { ascending: true }),
    supabase
      .from("aportaciones")
      .select("item_id, monto_centavos")
      .eq("evento_id", evento.id)
      .eq("estado", "confirmada"),
  ]);

  const lista = items ?? [];

  // Suma lo aportado por ítem y al fondo general.
  const fondeadoPorItem = new Map<string, number>();
  let fondoGeneral = 0;
  for (const a of aportaciones ?? []) {
    if (a.item_id) {
      fondeadoPorItem.set(a.item_id, (fondeadoPorItem.get(a.item_id) ?? 0) + a.monto_centavos);
    } else {
      fondoGeneral += a.monto_centavos;
    }
  }

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 680 }}>
      <header className="centro" style={{ marginBottom: "2.5rem" }}>
        <p style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.8rem", fontWeight: 700 }}>
          {ETIQUETA_TIPO[evento.tipo] ?? evento.tipo}
        </p>
        <h1 style={{ fontSize: "2.75rem", marginTop: "0.5rem" }}>{evento.titulo}</h1>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Elige un regalo de la lista y haz tu aportación.
        </p>
      </header>

      {/* Regalar dinero — montos rápidos */}
      <section className="tarjeta" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontSize: "1.2rem" }}>Regalar dinero</h2>
          {fondoGeneral > 0 ? (
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              Fondo general: <strong style={{ color: "var(--ink)" }}>{pesos(fondoGeneral)}</strong>
            </span>
          ) : null}
        </div>
        <p className="muted" style={{ marginTop: "0.35rem", marginBottom: "1rem" }}>
          ¿Prefieres dar dinero directo? Elige un monto y va al fondo general.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {MONTOS_RAPIDOS.map((monto) => (
            <Link key={monto} href={`/${slug}/aportar?monto=${monto}`} className="btn btn-contorno">
              ${monto.toLocaleString("es-MX")}
            </Link>
          ))}
          <Link href={`/${slug}/aportar`} className="btn btn-fantasma">
            Otro monto
          </Link>
        </div>
      </section>

      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Lista de deseos</h2>
      {lista.length === 0 ? (
        <div className="tarjeta centro" style={{ padding: "2.5rem 1.5rem" }}>
          <p className="muted" style={{ margin: 0 }}>Esta mesa aún no tiene regalos publicados.</p>
        </div>
      ) : (
        <div className="pila">
          {lista.map((it) => {
            const fondeado = fondeadoPorItem.get(it.id) ?? 0;
            const pct = Math.min(100, Math.floor((fondeado / it.monto_meta_centavos) * 100));
            const completado = fondeado >= it.monto_meta_centavos;
            return (
              <div key={it.id} className="tarjeta" style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1rem 1.25rem" }}>
                {it.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imagen_url} alt={it.nombre} width={72} height={72} style={{ objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                ) : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: "1.05rem" }}>
                    {it.nombre}
                    {it.cantidad > 1 ? <span className="muted"> × {it.cantidad}</span> : null}
                  </strong>
                  {it.descripcion ? (
                    <p className="muted" style={{ margin: "0.2rem 0 0.6rem", fontSize: "0.9rem" }}>{it.descripcion}</p>
                  ) : null}
                  <div style={{ background: "var(--border)", borderRadius: 999, height: 8, overflow: "hidden", marginTop: "0.4rem" }}>
                    <div style={{ background: "var(--accent)", width: `${pct}%`, height: "100%" }} />
                  </div>
                  <small className="muted">
                    {pesos(fondeado)} de {pesos(it.monto_meta_centavos)} · {pct}%
                  </small>
                </div>
                {completado ? (
                  <span className="btn btn-fantasma" style={{ flexShrink: 0, color: "var(--accent)" }}>¡Completo! 🎉</span>
                ) : (
                  <Link href={`/${slug}/aportar?item=${it.id}`} className="btn btn-primario" style={{ flexShrink: 0 }}>
                    Regalar
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
