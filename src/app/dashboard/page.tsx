import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearEvento } from "./acciones";
import BotonSalir from "./BotonSalir";
import BotonCompartir from "./BotonCompartir";

const ETIQUETA_TIPO: Record<string, string> = {
  boda: "Boda",
  xv: "XV años",
  baby_shower: "Baby shower",
  cumpleanos: "Cumpleaños",
};

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
    .select("titulo, tipo, slug, codigo")
    .eq("festejado_id", user.id)
    .order("creado_en", { ascending: false });

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.8rem" }}>Tu panel</h1>
        <BotonSalir />
      </header>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        Sesión iniciada como <strong style={{ color: "var(--ink)" }}>{user.email}</strong>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) 1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <section className="tarjeta">
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Crear una mesa</h2>
          <form action={crearEvento} className="pila">
            <div className="campo">
              <label htmlFor="titulo">Título</label>
              <input id="titulo" name="titulo" className="input" placeholder="ej. Juan y Ana" required />
            </div>
            <div className="campo">
              <label htmlFor="tipo">Tipo de evento</label>
              <select id="tipo" name="tipo" className="input" defaultValue="boda">
                <option value="boda">Boda</option>
                <option value="xv">XV años</option>
                <option value="baby_shower">Baby shower</option>
                <option value="cumpleanos">Cumpleaños</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primario btn-bloque">
              Crear mesa
            </button>
          </form>
        </section>

        <section>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Tus mesas</h2>
          {eventos && eventos.length > 0 ? (
            <div className="pila">
              {eventos.map((e) => (
                <div
                  key={e.slug}
                  className="tarjeta"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "1.05rem" }}>{e.titulo}</strong>
                    <div className="muted" style={{ fontSize: "0.85rem" }}>
                      {ETIQUETA_TIPO[e.tipo] ?? e.tipo}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                    <Link href={`/dashboard/mesa/${e.slug}`} className="btn btn-contorno">
                      Gestionar
                    </Link>
                    <Link href={`/dashboard/mesa/${e.slug}/recibido`} className="btn btn-contorno">
                      Recibido
                    </Link>
                    <BotonCompartir slug={e.slug} titulo={e.titulo} codigo={e.codigo} />
                    <Link href={`/${e.slug}`} className="btn btn-fantasma">
                      Ver pública
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tarjeta centro" style={{ padding: "2.5rem 1.5rem" }}>
              <p className="muted" style={{ margin: 0 }}>
                Aún no tienes mesas. Crea la primera con el formulario de la izquierda.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
