"use client";

import { useState } from "react";
import { crearEventoConPaquete } from "../../acciones";

export interface PaqueteVista {
  id: string;
  nombre: string;
  descripcion: string | null;
  totalCentavos: number;
  items: { nombre: string; cantidad: number }[];
}

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

export default function SelectorPaquete({ paquetes }: { paquetes: PaqueteVista[] }) {
  const [idx, setIdx] = useState(0);

  if (paquetes.length === 0) {
    return <p className="muted">Aún no hay paquetes disponibles.</p>;
  }

  const seleccion = paquetes[Math.min(idx, paquetes.length - 1)];
  const minTotal = paquetes[0].totalCentavos;
  const maxTotal = paquetes[paquetes.length - 1].totalCentavos;

  return (
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

      <label htmlFor="monto" style={{ fontWeight: 600, display: "block", marginBottom: "0.75rem" }}>
        ¿Cuánto quieres recaudar?
      </label>
      <input
        id="monto"
        type="range"
        min={0}
        max={paquetes.length - 1}
        step={1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)" }}
        aria-label="Monto a recaudar"
      />
      <div
        className="muted"
        style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "0.25rem" }}
      >
        <span>{pesos(minTotal)}</span>
        <span>{pesos(maxTotal)}</span>
      </div>

      <div className="tarjeta centro" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <strong style={{ fontSize: "1.25rem" }}>{seleccion.nombre}</strong>
        <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--accent)", margin: "0.35rem 0" }}>
          {pesos(seleccion.totalCentavos)}
        </div>
        {seleccion.descripcion && (
          <p className="muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
            {seleccion.descripcion}
          </p>
        )}

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 auto 1.25rem",
            maxWidth: 380,
            textAlign: "left",
            display: "grid",
            gap: "0.4rem",
          }}
        >
          {seleccion.items.map((it, i) => (
            <li
              key={i}
              style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.9rem" }}
            >
              <span>{it.nombre}</span>
              <span className="muted" style={{ flexShrink: 0 }}>×{it.cantidad}</span>
            </li>
          ))}
        </ul>
        <div className="muted" style={{ fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          {seleccion.items.length} regalos · podrás editarlos después
        </div>

        <input type="hidden" name="paquete_id" value={seleccion.id} />
        <button type="submit" className="btn btn-primario btn-bloque">
          Crear mi mesa →
        </button>
      </div>
    </form>
  );
}
