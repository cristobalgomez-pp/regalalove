"use client";

import { eliminarEvento } from "./acciones";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

export default function BotonEliminarMesa({
  eventoId,
  titulo,
  aportaciones,
  totalCentavos,
}: {
  eventoId: string;
  titulo: string;
  aportaciones: number;
  totalCentavos: number;
}) {
  function confirmar(e: React.FormEvent<HTMLFormElement>) {
    const mensaje =
      aportaciones > 0
        ? `La mesa "${titulo}" ya recibió ${aportaciones} ${
            aportaciones === 1 ? "aportación" : "aportaciones"
          } por ${pesos(totalCentavos)}.\n\nSi la eliminas se borrará TODO (regalos y aportaciones) y no se puede deshacer.\n\n¿Continuar?`
        : `¿Eliminar la mesa "${titulo}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(mensaje)) {
      e.preventDefault();
    }
  }

  return (
    <form action={eliminarEvento.bind(null, eventoId)} onSubmit={confirmar}>
      <button
        type="submit"
        className="btn btn-fantasma"
        style={{ color: "var(--accent)", padding: "0.3rem 0.45rem" }}
        title="Eliminar mesa"
        aria-label="Eliminar mesa"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </form>
  );
}
