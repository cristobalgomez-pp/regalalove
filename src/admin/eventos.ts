// src/admin/eventos.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { itemsDeMesa, aportacionesConfirmadas } from "@/lib/datos-mesa";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import { resumenDashboard } from "@/dashboard/resumen";
import { filaAAsentada } from "@/aportaciones/proyecciones";
import type { DefinicionItem } from "@/ledger/ledger";

interface EventoRow {
  id: string;
  slug: string;
  titulo: string;
  festejado_id: string;
  sospechoso: boolean;
  nota_admin: string | null;
}

export interface EventoAdmin {
  id: string;
  slug: string;
  titulo: string;
  festejadoEmail: string;
  saldoTotal: number; // centavos
  retirable: number; // centavos
  retenido: number; // centavos
  nAportaciones: number;
  sospechoso: boolean;
  notaAdmin: string | null;
}

/** Lista TODOS los eventos (cross-festejado) con sus saldos para el panel admin.
 *  Requiere un cliente service_role (salta RLS y puede leer auth.users). */
export async function listarEventosAdmin(db: SupabaseClient): Promise<EventoAdmin[]> {
  const { data } = await db
    .from("eventos")
    .select("id, slug, titulo, festejado_id, sospechoso, nota_admin")
    .order("creado_en", { ascending: false });
  const eventos = (data ?? []) as unknown as EventoRow[];

  const { data: usuarios } = await db.auth.admin.listUsers();
  const emailPorId = new Map((usuarios?.users ?? []).map((u) => [u.id, u.email ?? "—"]));

  const config = await obtenerConfigMonetizacion();
  const ahora = Date.now();

  const filas: EventoAdmin[] = [];
  for (const e of eventos) {
    const [items, aps] = await Promise.all([
      itemsDeMesa(db, e.id),
      aportacionesConfirmadas(db, e.id),
    ]);

    const definiciones: DefinicionItem[] = items.map((it) => ({
      id: it.id,
      montoMeta: it.monto_meta_centavos,
    }));
    const asentadas = aps.map(filaAAsentada);

    const r = resumenDashboard(definiciones, asentadas, ahora, {
      ventanaRetencionDias: config.ventanaRetencionDias,
    });

    filas.push({
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      festejadoEmail: emailPorId.get(e.festejado_id) ?? "—",
      saldoTotal: r.saldoTotal,
      retirable: r.retirable,
      retenido: r.retenido,
      nAportaciones: asentadas.length,
      sospechoso: e.sospechoso,
      notaAdmin: e.nota_admin,
    });
  }

  return filas;
}

/** Marca o desmarca un evento como sospechoso (fija el valor explícito). */
export async function marcarSospechoso(
  db: SupabaseClient,
  eventoId: string,
  valor: boolean,
): Promise<void> {
  const { error } = await db.from("eventos").update({ sospechoso: valor }).eq("id", eventoId);
  if (error) throw new Error(`No se pudo actualizar el evento: ${error.message}`);
}
