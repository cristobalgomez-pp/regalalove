import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";

export default async function Crear() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 820 }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver al panel
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>¿Cómo quieres crear tu mesa?</h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        Elige un paquete listo o ármala a tu gusto.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <Link href="/dashboard/crear/rapido" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: "2rem" }}>⚡</div>
          <h2 style={{ fontSize: "1.25rem", margin: "0.5rem 0 0.35rem" }}>Crear rápido</h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Escoge un paquete listo por monto. Nosotros ya elegimos los regalos; tú puedes ajustarlos después.
          </p>
          <span className="btn btn-primario btn-bloque">Empezar →</span>
        </Link>

        <Link href="/dashboard/crear/manual" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: "2rem" }}>✏️</div>
          <h2 style={{ fontSize: "1.25rem", margin: "0.5rem 0 0.35rem" }}>Crear manual</h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Arma tu mesa desde cero, regalo a regalo, con control total de precios y cantidades.
          </p>
          <span className="btn btn-contorno btn-bloque">Empezar →</span>
        </Link>
      </div>
    </main>
  );
}
