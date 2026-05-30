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
        style={{ color: "var(--danger, #c0392b)" }}
        title="Eliminar mesa"
      >
        🗑 Eliminar
      </button>
    </form>
  );
}
