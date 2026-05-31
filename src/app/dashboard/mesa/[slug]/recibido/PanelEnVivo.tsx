"use client";

import { useEffect, useMemo, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { resumenDashboard } from "@/dashboard/resumen";
import type { DefinicionItem } from "@/ledger/ledger";
import type { AportacionAsentada } from "@/pagos/webhook";
import type { MetodoPago } from "@/dominio/tipos";

export interface AportacionVista {
  id: string;
  nombre: string;
  monto: number; // centavos
  itemId: string | null;
  itemNombre: string | null;
  mensaje: string;
  metodoPago: MetodoPago;
  fecha: number; // epoch ms
  nuevo?: boolean;
}

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const METODO_ETIQUETA: Record<string, string> = {
  tarjeta: "Tarjeta",
  spei: "SPEI",
  oxxo: "OXXO",
  codi: "CoDi",
};

export default function PanelEnVivo({
  eventoId,
  ventanaRetencionDias,
  items,
  itemsMap,
  inicial,
  yaRetirado = 0,
}: {
  eventoId: string;
  ventanaRetencionDias: number;
  items: DefinicionItem[];
  itemsMap: Record<string, string>;
  inicial: AportacionVista[];
  yaRetirado?: number;
}) {
  const [lista, setLista] = useState<AportacionVista[]>(inicial);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    const canal = supabase
      .channel(`aportaciones-${eventoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "aportaciones", filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          if (r.estado !== "confirmada") return;
          const itemId = r.item_id ? String(r.item_id) : null;
          const nueva: AportacionVista = {
            id: String(r.id),
            nombre: String(r.nombre_invitado ?? "Alguien"),
            monto: Number(r.monto_centavos),
            itemId,
            itemNombre: itemId ? itemsMap[itemId] ?? "Un regalo" : null,
            mensaje: String(r.mensaje ?? ""),
            metodoPago: r.metodo_pago as MetodoPago,
            fecha: new Date(String(r.creado_en)).getTime(),
            nuevo: true,
          };
          setLista((prev) => (prev.some((a) => a.id === nueva.id) ? prev : [nueva, ...prev]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [eventoId, itemsMap]);

  // El saldo se calcula con la MISMA función que el panel del servidor
  // (resumenDashboard): el número en vivo no puede divergir del de una recarga.
  const { saldoTotal, retirable, retenido } = useMemo(() => {
    const idsConocidos = new Set(items.map((i) => i.id));
    const asentadas: AportacionAsentada[] = lista.map((a) => ({
      // un ítem borrado se cuenta como fondo general: mismo total, sin romper el replay
      itemId: a.itemId && idsConocidos.has(a.itemId) ? a.itemId : null,
      monto: a.monto,
      metodoPago: a.metodoPago,
      fecha: a.fecha,
      cobroId: a.id,
      nombre: a.nombre,
      mensaje: a.mensaje,
    }));
    const r = resumenDashboard(items, asentadas, Date.now(), { ventanaRetencionDias });
    return {
      saldoTotal: r.saldoTotal,
      retirable: Math.max(0, r.retirable - yaRetirado),
      retenido: r.retenido,
    };
  }, [lista, items, ventanaRetencionDias, yaRetirado]);

  return (
    <div>
      {/* Tarjetas de saldo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="tarjeta">
          <div className="muted" style={{ fontSize: "0.85rem" }}>Saldo total</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{pesos(saldoTotal)}</div>
        </div>
        <div className="tarjeta">
          <div className="muted" style={{ fontSize: "0.85rem" }}>Disponible para retirar</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>{pesos(retirable)}</div>
        </div>
        <div className="tarjeta">
          <div className="muted" style={{ fontSize: "0.85rem" }}>Retenido (temporal)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{pesos(retenido)}</div>
          <div className="muted" style={{ fontSize: "0.75rem" }}>
            Pagos con tarjeta, {ventanaRetencionDias} días
          </div>
        </div>
      </div>

      {/* Feed */}
      <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
        Regalos recibidos <span className="muted">({lista.length})</span>
      </h2>
      {lista.length === 0 ? (
        <div className="tarjeta centro" style={{ padding: "2.5rem 1.5rem" }}>
          <p className="muted" style={{ margin: 0 }}>Aún no recibes regalos. Aparecerán aquí en vivo. ✨</p>
        </div>
      ) : (
        <div className="pila">
          {lista.map((a) => (
            <div
              key={a.id}
              className="tarjeta"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "0.9rem 1.1rem",
                borderColor: a.nuevo ? "var(--accent)" : undefined,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong>{a.nombre}</strong>
                {a.itemNombre ? <span className="muted"> · {a.itemNombre}</span> : <span className="muted"> · Fondo general</span>}
                {a.mensaje ? (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.92rem" }}>“{a.mensaje}”</p>
                ) : null}
                <div className="muted" style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>
                  {METODO_ETIQUETA[a.metodoPago] ?? a.metodoPago}
                  {a.nuevo ? " · ¡nuevo!" : ""}
                </div>
              </div>
              <strong style={{ flexShrink: 0, color: "var(--accent)" }}>{pesos(a.monto)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
