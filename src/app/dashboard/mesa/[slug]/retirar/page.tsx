import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { calcularSaldoRetiro } from "./calculo";
import { guardarKyc, solicitarRetiro } from "./acciones";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { dateStyle: "medium" });
}

export default async function RetirarMesa({
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
  if (evento.festejado_id !== user.id) redirect("/dashboard");

  const [{ data: kyc }, { data: retiros }, saldo] = await Promise.all([
    supabase.from("kyc_festejado").select("nombre_completo, clabe").eq("festejado_id", user.id).maybeSingle(),
    supabase
      .from("retiros")
      .select("id, monto_centavos, clabe_destino, estado, creado_en")
      .eq("evento_id", evento.id)
      .order("creado_en", { ascending: false }),
    calcularSaldoRetiro(supabase, evento.id),
  ]);

  const historial = retiros ?? [];

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 560 }}>
      <Link href={`/dashboard/mesa/${slug}/recibido`} className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver a regalos recibidos
      </Link>
      <header style={{ marginTop: "0.75rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Retirar tu dinero</h1>
        <p className="muted" style={{ marginTop: "0.25rem" }}>{evento.titulo}</p>
      </header>

      <div className="tarjeta centro" style={{ marginBottom: "1.5rem" }}>
        <div className="muted" style={{ fontSize: "0.85rem" }}>Disponible para retirar</div>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent)" }}>{pesos(saldo.disponible)}</div>
        {saldo.retirado > 0 ? (
          <div className="muted" style={{ fontSize: "0.8rem" }}>Ya retirado: {pesos(saldo.retirado)}</div>
        ) : null}
      </div>

      {!kyc ? (
        // KYC al primer retiro
        <section className="tarjeta">
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Tus datos para recibir</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: "1.25rem" }}>
            Para tu primer retiro necesitamos a dónde mandar el dinero.
          </p>
          <form action={guardarKyc.bind(null, slug)} className="pila">
            <div className="campo">
              <label htmlFor="nombre_completo">Nombre completo del titular</label>
              <input id="nombre_completo" name="nombre_completo" className="input" required />
            </div>
            <div className="campo">
              <label htmlFor="clabe">CLABE interbancaria (18 dígitos)</label>
              <input id="clabe" name="clabe" className="input" inputMode="numeric" maxLength={18} placeholder="000000000000000000" required />
            </div>
            <button type="submit" className="btn btn-primario btn-bloque">Guardar mis datos</button>
          </form>
        </section>
      ) : (
        // Solicitar retiro
        <section className="tarjeta">
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Solicitar retiro</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: "1.25rem" }}>
            A la CLABE terminada en <strong>{kyc.clabe.slice(-4)}</strong> ({kyc.nombre_completo}).
          </p>
          {saldo.disponible <= 0 ? (
            <p className="muted" style={{ margin: 0 }}>Por ahora no tienes saldo disponible para retirar.</p>
          ) : (
            <form action={solicitarRetiro.bind(null, slug)} className="pila">
              <div className="campo">
                <label htmlFor="monto">Monto a retirar (MXN)</label>
                <input
                  id="monto"
                  name="monto"
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  max={(saldo.disponible / 100).toFixed(2)}
                  defaultValue={(saldo.disponible / 100).toFixed(2)}
                  required
                  style={{ fontSize: "1.2rem", fontWeight: 600 }}
                />
              </div>
              <button type="submit" className="btn btn-primario btn-bloque">Retirar</button>
              <p className="muted centro" style={{ fontSize: "0.8rem", marginTop: "-0.5rem" }}>
                Dispersión simulada (modo prueba) — aún no se transfiere de verdad.
              </p>
            </form>
          )}
        </section>
      )}

      {historial.length > 0 ? (
        <section style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Historial de retiros</h2>
          <div className="pila">
            {historial.map((r) => (
              <div key={r.id} className="tarjeta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1.1rem" }}>
                <div>
                  <strong>{pesos(r.monto_centavos)}</strong>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    {fechaCorta(r.creado_en)} · CLABE ••{r.clabe_destino.slice(-4)}
                  </div>
                </div>
                <span className="muted" style={{ fontSize: "0.85rem", color: r.estado === "completado" ? "var(--accent)" : undefined }}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
