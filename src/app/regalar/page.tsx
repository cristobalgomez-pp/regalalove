"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Punto de entrada para invitados: pegan el link o código de la mesa y los
 * llevamos a la página pública. El checkout de regalo se construye después. */
export default function Regalar() {
  const router = useRouter();
  const [valor, setValor] = useState("");

  function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    const limpio = valor.trim();
    if (!limpio) return;
    // Acepta un slug suelto o una URL completa: nos quedamos con el último segmento.
    const slug = limpio.replace(/\/+$/, "").split("/").pop() ?? limpio;
    router.push(`/${slug}`);
  }

  return (
    <main className="contenedor" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="tarjeta" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem" }}>Regalar a una mesa</h1>
        <p className="muted" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
          Pega el enlace o el código de la mesa que te compartieron.
        </p>
        <form onSubmit={manejarSubmit} className="pila">
          <div className="campo">
            <label htmlFor="mesa">Enlace o código de la mesa</label>
            <input
              id="mesa"
              className="input"
              placeholder="ej. juan-y-ana  ·  regalove.com/juan-y-ana"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primario btn-bloque">
            Ir a la mesa
          </button>
        </form>
      </div>
    </main>
  );
}
