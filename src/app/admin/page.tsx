// src/app/admin/page.tsx
import Link from "next/link";
import { exigirAdmin } from "@/admin/exigirAdmin";
import { listarEventosAdmin } from "@/admin/eventos";
import { alternarSospechoso } from "./acciones";

const pesos = (centavos: number) =>
  (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function PanelAdmin() {
  const db = await exigirAdmin();
  const eventos = await listarEventosAdmin(db);

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 980 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Panel admin</h1>
          <p className="muted" style={{ marginTop: "0.25rem" }}>{eventos.length} eventos</p>
        </div>
        <Link href="/admin/config" className="btn btn-primario">Configuración</Link>
      </header>

      {eventos.length === 0 ? (
        <p className="muted">Aún no hay eventos.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "0.5rem" }}>Mesa</th>
                <th style={{ padding: "0.5rem" }}>Festejado</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Total</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Retirable</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Retenido</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Aport.</th>
                <th style={{ padding: "0.5rem" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f0f0f0", background: e.sospechoso ? "#fff5f5" : undefined }}>
                  <td style={{ padding: "0.5rem" }}>
                    <Link href={`/${e.slug}`} target="_blank" rel="noopener">{e.titulo}</Link>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>/{e.slug}</div>
                  </td>
                  <td style={{ padding: "0.5rem" }}>{e.festejadoEmail}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{pesos(e.saldoTotal)}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{pesos(e.retirable)}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{pesos(e.retenido)}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{e.nAportaciones}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <form action={alternarSospechoso.bind(null, e.id, !e.sospechoso)}>
                      <button type="submit" className="btn" style={{ fontSize: "0.8rem" }}>
                        {e.sospechoso ? "🚩 Quitar marca" : "Marcar sospechoso"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
