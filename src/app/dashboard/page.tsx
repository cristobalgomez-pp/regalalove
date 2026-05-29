import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearEvento } from "./acciones";
import BotonSalir from "./BotonSalir";

export default async function Dashboard() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: eventos } = await supabase
    .from("eventos")
    .select("titulo, tipo, slug")
    .eq("festejado_id", user.id)
    .order("creado_en", { ascending: false });

  return (
    <main style={{ maxWidth: 600, margin: "3rem auto", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Tu panel</h1>
        <BotonSalir />
      </header>
      <p>
        Sesión iniciada como <strong>{user.email}</strong>.
      </p>

      <section style={{ marginTop: "2rem" }}>
        <h2>Crear una mesa</h2>
        <form action={crearEvento} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 360 }}>
          <input name="titulo" placeholder="Título (ej. Juan y Ana)" required />
          <select name="tipo" defaultValue="boda">
            <option value="boda">Boda</option>
            <option value="xv">XV años</option>
            <option value="baby_shower">Baby shower</option>
            <option value="cumpleanos">Cumpleaños</option>
          </select>
          <button type="submit">Crear mesa</button>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Tus mesas</h2>
        {eventos && eventos.length > 0 ? (
          <ul>
            {eventos.map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`}>{e.titulo}</Link> — {e.tipo}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#666" }}>Aún no tienes mesas. Crea la primera arriba.</p>
        )}
      </section>
    </main>
  );
}
