import { obtenerConfigApp } from "@/config/config";

export default function Home() {
  const { nombreMarca } = obtenerConfigApp();

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", margin: 0 }}>{nombreMarca}</h1>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        Mesas de regalos para tus eventos
      </p>
    </main>
  );
}
