"use client";

import { useState } from "react";
import { procesarAportacion } from "./acciones";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const METODOS = [
  { id: "tarjeta", etiqueta: "Tarjeta" },
  { id: "spei", etiqueta: "SPEI" },
  { id: "oxxo", etiqueta: "OXXO" },
  { id: "codi", etiqueta: "CoDi" },
];

export default function FormularioAportacion({
  slug,
  titulo,
  itemId,
  itemNombre,
  montoInicial,
  comisionPct,
  absorcionPreMarcada,
}: {
  slug: string;
  titulo: string;
  itemId: string | null;
  itemNombre: string | null;
  montoInicial: number;
  comisionPct: number;
  absorcionPreMarcada: boolean;
}) {
  const [monto, setMonto] = useState(String(montoInicial));
  const [absorbe, setAbsorbe] = useState(absorcionPreMarcada);
  const [metodo, setMetodo] = useState("tarjeta");
  const [enviando, setEnviando] = useState(false);

  const montoCentavos = Math.max(0, Math.round(Number(monto) * 100) || 0);
  const comision = Math.round((montoCentavos * comisionPct) / 100);
  const total = absorbe ? montoCentavos + comision : montoCentavos;

  return (
    <form
      action={procesarAportacion.bind(null, slug)}
      onSubmit={() => setEnviando(true)}
      className="pila"
      style={{ gap: "1.25rem" }}
    >
      <input type="hidden" name="itemId" value={itemId ?? ""} />

      <div className="tarjeta" style={{ background: "var(--surface)" }}>
        <div className="muted" style={{ fontSize: "0.85rem" }}>Tu regalo</div>
        <strong style={{ fontSize: "1.05rem" }}>
          {itemNombre ? itemNombre : "Aportación al fondo general"}
        </strong>
        <div className="campo" style={{ marginTop: "0.75rem" }}>
          <label htmlFor="monto">Monto a regalar (MXN)</label>
          <input
            id="monto"
            name="monto"
            className="input"
            type="number"
            min="1"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
            style={{ fontSize: "1.2rem", fontWeight: 600 }}
          />
          {itemNombre ? (
            <small className="muted">Puedes aportar una parte; no tienes que cubrir todo.</small>
          ) : null}
        </div>
      </div>

      <div className="campo">
        <label htmlFor="nombre">Tu nombre</label>
        <input id="nombre" name="nombre" className="input" placeholder="Quién regala" required />
      </div>
      <div className="campo">
        <label htmlFor="correo">Tu correo (para tu comprobante)</label>
        <input id="correo" name="correo" type="email" className="input" placeholder="tu@correo.com" required />
      </div>
      <div className="campo">
        <label htmlFor="mensaje">Mensaje para el festejado (opcional)</label>
        <input id="mensaje" name="mensaje" className="input" placeholder="¡Felicidades!" />
      </div>

      <div className="campo">
        <label>Método de pago</label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {METODOS.map((m) => (
            <label
              key={m.id}
              className="btn btn-contorno"
              style={{ cursor: "pointer", borderColor: metodo === m.id ? "var(--accent)" : undefined }}
            >
              <input
                type="radio"
                name="metodoPago"
                value={m.id}
                checked={metodo === m.id}
                onChange={() => setMetodo(m.id)}
                style={{ marginRight: "0.4rem" }}
              />
              {m.etiqueta}
            </label>
          ))}
        </div>
      </div>

      <label
        style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", cursor: "pointer", background: "var(--accent-soft)", padding: "0.85rem", borderRadius: "var(--radius-sm)" }}
      >
        <input type="checkbox" name="absorbe" checked={absorbe} onChange={(e) => setAbsorbe(e.target.checked)} style={{ marginTop: "0.2rem" }} />
        <span style={{ fontSize: "0.92rem" }}>
          Que <strong>{titulo}</strong> reciba el 100%: yo cubro la comisión
          {comision > 0 ? <> (+{pesos(comision)})</> : null}.
        </span>
      </label>

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem" }}>
        <span>Total a pagar</span>
        <span>{pesos(total)}</span>
      </div>

      <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando || montoCentavos <= 0}>
        {enviando ? "Procesando…" : `Pagar ${pesos(total)}`}
      </button>
      <p className="muted centro" style={{ fontSize: "0.8rem", marginTop: "-0.5rem" }}>
        Pago simulado (modo prueba) — aún no se cobra de verdad.
      </p>
    </form>
  );
}
