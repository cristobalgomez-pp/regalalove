"use client";

import { useState } from "react";
import CompartirMesa from "./CompartirMesa";

export default function BotonCompartir({
  slug,
  titulo,
  codigo,
}: {
  slug: string;
  titulo: string;
  codigo?: string | null;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-contorno" onClick={() => setAbierto(true)}>
        Compartir
      </button>

      {abierto ? (
        <div
          onClick={() => setAbierto(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460 }}>
            <CompartirMesa slug={slug} titulo={titulo} codigo={codigo} />
            <button
              type="button"
              className="btn btn-fantasma btn-bloque"
              onClick={() => setAbierto(false)}
              style={{ marginTop: "0.5rem", color: "#fff" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
