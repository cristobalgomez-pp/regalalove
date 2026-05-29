"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buscarMesaPorCodigo } from "./acciones";

/** Entrada para invitados: escriben el código de 4 dígitos de la mesa y los
 * llevamos a su página pública. */
export default function Regalar() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const slug = await buscarMesaPorCodigo(codigo);
    if (!slug) {
      setError("No encontramos una mesa con ese código. Revísalo e intenta de nuevo.");
      setCargando(false);
      return;
    }
    router.push(`/${slug}`);
  }

  return (
    <main className="contenedor" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="tarjeta" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem" }}>Regalar a una mesa</h1>
        <p className="muted" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          Escribe el código de 4 dígitos que te compartió el festejado.
        </p>
        <form onSubmit={manejarSubmit} className="pila">
          <div className="campo">
            <label htmlFor="codigo">Código de la mesa</label>
            <input
              id="codigo"
              className="input"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4))}
              style={{ fontSize: "1.8rem", letterSpacing: "0.5em", textAlign: "center", fontWeight: 700 }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando || codigo.length !== 4}>
            {cargando ? "Buscando…" : "Ir a la mesa"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
        <p className="muted centro" style={{ marginTop: "1.25rem", fontSize: "0.85rem" }}>
          ¿Tienes el enlace o un QR? Ábrelo directo, te lleva a la mesa.
        </p>
      </div>
    </main>
  );
}
