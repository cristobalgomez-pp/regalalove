import Link from "next/link";
import { obtenerConfigApp } from "@/config/config";

export default function Home() {
  const { nombreMarca } = obtenerConfigApp();

  return (
    <main className="contenedor" style={{ paddingTop: "clamp(2.5rem, 8vw, 3rem)", paddingBottom: "3rem" }}>
      <div className="centro" style={{ maxWidth: 620, margin: "0 auto" }}>
        <span
          style={{
            display: "inline-block",
            background: "var(--accent-soft)",
            color: "var(--accent-hover)",
            fontWeight: 600,
            fontSize: "0.8rem",
            padding: "0.3rem 0.8rem",
            borderRadius: 999,
          }}
        >
          Regalos en dinero, sin complicaciones
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 8vw, 3.25rem)", marginTop: "1.25rem" }}>
          Recibe el regalo perfecto: <span style={{ color: "var(--accent)" }}>dinero</span> para
          lo que de verdad quieren.
        </h1>
        <p className="muted" style={{ fontSize: "1.15rem", marginTop: "1rem" }}>
          Crea tu mesa de regalos en minutos y deja que tus invitados aporten a lo que sueñas.
          O encuentra la mesa de alguien y regálale algo especial.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
          maxWidth: 720,
          margin: "3rem auto 0",
        }}
      >
        <div className="tarjeta">
          <h2 style={{ fontSize: "1.35rem" }}>Crear mi mesa</h2>
          <p className="muted" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            Para festejados: arma tu lista de deseos y comparte tu mesa con todos.
          </p>
          <Link href="/registro" className="btn btn-primario btn-bloque">
            Crear mi mesa
          </Link>
        </div>

        <div className="tarjeta">
          <h2 style={{ fontSize: "1.35rem" }}>Regalar a una mesa</h2>
          <p className="muted" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            Para invitados: encuentra la mesa del festejado y haz tu regalo en segundos.
          </p>
          <Link href="/regalar" className="btn btn-contorno btn-bloque">
            Regalar a una mesa
          </Link>
        </div>
      </div>

      <p className="centro muted" style={{ marginTop: "2.5rem", fontSize: "0.9rem" }}>
        {nombreMarca} · bodas, XV años, baby showers y más
      </p>
    </main>
  );
}
