"use client";

import { useEffect, useState } from "react";

export default function CompartirMesa({
  slug,
  titulo,
  codigo,
}: {
  slug: string;
  titulo: string;
  codigo?: string | null;
}) {
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/${slug}`);
  }, [slug]);

  async function copiar() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const mensaje = `Te invito a mi mesa de regalos "${titulo}" en RegalaLove 🎁`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${mensaje} ${url}`)}`;
  const qr = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`
    : "";

  return (
    <div className="tarjeta">
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Comparte tu mesa</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: "1.25rem" }}>
        Manda este enlace a tus invitados para que te regalen.
      </p>

      {codigo ? (
        <div
          className="centro"
          style={{
            background: "var(--accent-soft)",
            borderRadius: "var(--radius-sm)",
            padding: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          <div className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
            Código de tu mesa
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "0.3em", color: "var(--accent-hover)" }}>
            {codigo}
          </div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            En regalalove.com → “Regalar a una mesa”
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input className="input" readOnly value={url} style={{ flex: "1 1 200px", minWidth: 0 }} />
        <button type="button" className="btn btn-contorno" onClick={copiar}>
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <a href={whatsapp} target="_blank" rel="noopener" className="btn btn-primario">
          Compartir por WhatsApp
        </a>
        <a href={url || "#"} target="_blank" rel="noopener" className="btn btn-fantasma">
          Abrir mi mesa
        </a>
      </div>

      {qr ? (
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR de tu mesa" width={120} height={120} style={{ borderRadius: 8 }} />
          <div className="muted" style={{ fontSize: "0.9rem" }}>
            O comparte este código QR para que lo escaneen e ir directo a tu mesa.
          </div>
        </div>
      ) : null}
    </div>
  );
}
