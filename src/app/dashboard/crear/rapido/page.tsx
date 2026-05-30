import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearEventoConPaquete } from "../../acciones";
import { totalPaquete } from "@/paquetes/armar";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

interface ItemPaquete {
  cantidad: number;
  catalogo_items: { nombre: string; precio_centavos: number };
}
interface Paquete {
  id: string;
  nombre: string;
  descripcion: string | null;
  paquete_items: ItemPaquete[];
}

export default async function CrearRapido() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("paquetes")
    .select("id, nombre, descripcion, paquete_items(cantidad, catalogo_items(nombre, precio_centavos))")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const paquetes = (data ?? []) as unknown as Paquete[];

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 1000 }}>
      <Link href="/dashboard/crear" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>Crear rápido</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Ponle nombre a tu mesa y elige un paquete. Podrás editar los regalos después.
      </p>

      <form action={crearEventoConPaquete}>
        <div
          className="tarjeta"
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}
        >
          <div className="campo" style={{ flex: "1 1 220px" }}>
            <label htmlFor="titulo">Título de la mesa</label>
            <input id="titulo" name="titulo" className="input" placeholder="ej. Juan y Ana" required />
          </div>
          <div className="campo" style={{ flex: "0 1 180px" }}>
            <label htmlFor="tipo">Tipo de evento</label>
            <select id="tipo" name="tipo" className="input" defaultValue="boda">
              <option value="boda">Boda</option>
              <option value="xv">XV años</option>
              <option value="baby_shower">Baby shower</option>
              <option value="cumpleanos">Cumpleaños</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {paquetes.map((p) => {
            const items = p.paquete_items ?? [];
            const total = totalPaquete(
              items.map((it) => ({
                precioCentavos: it.catalogo_items.precio_centavos,
                cantidad: it.cantidad,
              })),
            );
            const preview = items.slice(0, 3);
            const restantes = items.length - preview.length;

            return (
              <div
                key={p.id}
                className="tarjeta"
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{p.nombre}</strong>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>{pesos(total)}</span>
                </div>
                {p.descripcion && (
                  <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                    {p.descripcion}
                  </p>
                )}
                <ul className="muted" style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                  {preview.map((it, i) => (
                    <li key={i}>
                      {it.cantidad > 1 ? `${it.cantidad}× ` : ""}
                      {it.catalogo_items.nombre}
                    </li>
                  ))}
                  {restantes > 0 && <li>+{restantes} más</li>}
                </ul>
                <button
                  type="submit"
                  name="paquete_id"
                  value={p.id}
                  className="btn btn-primario btn-bloque"
                  style={{ marginTop: "auto" }}
                >
                  Usar este →
                </button>
              </div>
            );
          })}
        </div>
      </form>
    </main>
  );
}
