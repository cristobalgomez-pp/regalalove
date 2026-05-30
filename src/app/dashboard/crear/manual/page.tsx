import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearEvento } from "../../acciones";

export default async function CrearManual() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 480 }}>
      <Link href="/dashboard/crear" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>Crear manual</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Crea la mesa y agrégale los regalos uno a uno.
      </p>

      <section className="tarjeta">
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
    </main>
  );
}
