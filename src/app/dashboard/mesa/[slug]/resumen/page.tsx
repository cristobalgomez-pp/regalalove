import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import CompartirMesa from "../../../CompartirMesa";

const ETIQUETA_TIPO: Record<string, string> = {
  boda: "Boda",
  xv: "XV años",
  baby_shower: "Baby shower",
  cumpleanos: "Cumpleaños",
};

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function ResumenMesa({
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
    .select("id, titulo, tipo, festejado_id, codigo")
    .eq("slug", slug)
    .maybeSingle();

  if (!evento) notFound();
  if (evento.festejado_id !== user.id) redirect("/dashboard");

  const { data: items } = await supabase
    .from("items_mesa")
    .select("id, nombre, monto_meta_centavos, cantidad, orden")
    .eq("evento_id", evento.id)
    .order("orden", { ascending: true });

  const lista = items ?? [];
  const total = lista.reduce((s, it) => s + it.monto_meta_centavos, 0);

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 760 }}>
      <Link href={`/dashboard/mesa/${slug}`} className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver a armar la mesa
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
          <p style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.78rem", fontWeight: 700 }}>
            {ETIQUETA_TIPO[evento.tipo] ?? evento.tipo}
          </p>
          <h1 style={{ fontSize: "1.8rem" }}>{evento.titulo}</h1>
        </div>
        <Link href={`/${slug}`} target="_blank" rel="noopener" className="btn btn-contorno">
          👁 Ver como invitado
        </Link>
      </header>

      {/* Resumen de regalos */}
      <section className="tarjeta" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.2rem" }}>Resumen de tu mesa</h2>
          <Link href={`/dashboard/mesa/${slug}`} style={{ color: "var(--accent)", fontSize: "0.9rem" }}>
            Hacer ajustes
          </Link>
        </div>

        {lista.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Tu mesa aún no tiene regalos.{" "}
            <Link href={`/dashboard/mesa/${slug}`} style={{ color: "var(--accent)" }}>
              Agrega algunos
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="pila" style={{ gap: "0.5rem" }}>
              {lista.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span>
                    {it.nombre}
                    {it.cantidad > 1 ? <span className="muted"> × {it.cantidad}</span> : null}
                  </span>
                  <span className="muted">{pesos(it.monto_meta_centavos)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontWeight: 700 }}>
              <span>Total de la mesa</span>
              <span>{pesos(total)}</span>
            </div>
          </>
        )}
      </section>

      {/* Compartir */}
      <CompartirMesa slug={slug} titulo={evento.titulo} codigo={evento.codigo} />

      <p className="centro" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
        <Link href={`/dashboard/mesa/${slug}/personalizar`} style={{ color: "var(--accent)" }}>
          Personalizar tu página
        </Link>{" "}
        <span className="muted">· (próximamente: datos para recibir tu dinero)</span>
      </p>
    </main>
  );
}
