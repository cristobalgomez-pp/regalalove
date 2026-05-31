// src/admin/eventos.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import { itemsDeMesas, aportacionesConfirmadasDe } from "@/lib/datos-mesa";
import { componerEstadoMesa } from "@/mesa/estado";
import type { ConfigRetencion } from "@/retencion/retencion";

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

/** Agrupa filas por su `evento_id` para repartirlas a cada Mesa en memoria. */
function agruparPorEvento<T extends { evento_id: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const arr = m.get(r.evento_id);
    if (arr) arr.push(r);
    else m.set(r.evento_id, [r]);
  }
  return m;
}

/** Lista TODOS los eventos (cross-festejado) con sus saldos para el panel admin.
 *  Requiere un cliente service_role (salta RLS y puede leer auth.users).
 *  Una sola lectura por tabla (sin N+1); `ahora`/`config` se inyectan en tests. */
export async function listarEventosAdmin(
  db: SupabaseClient,
  opts: { ahora?: number; config?: ConfigRetencion } = {},
): Promise<EventoAdmin[]> {
  const ahora = opts.ahora ?? Date.now();

  const { data } = await db
    .from("eventos")
    .select("id, slug, titulo, festejado_id, sospechoso, nota_admin")
    .order("creado_en", { ascending: false });
  const eventos = (data ?? []) as unknown as EventoRow[];
  if (eventos.length === 0) return [];

  const ids = eventos.map((e) => e.id);
  const config: ConfigRetencion =
    opts.config ?? {
      ventanaRetencionDias: (await obtenerConfigMonetizacion()).ventanaRetencionDias,
    };

  const [{ data: usuarios }, items, aps] = await Promise.all([
    db.auth.admin.listUsers(),
    itemsDeMesas(db, ids),
    aportacionesConfirmadasDe(db, ids),
  ]);

  const emailPorId = new Map((usuarios?.users ?? []).map((u) => [u.id, u.email ?? "—"]));
  const itemsPorEvento = agruparPorEvento(items);
  const apsPorEvento = agruparPorEvento(aps);

  return eventos.map((e) => {
    const estado = componerEstadoMesa(
      itemsPorEvento.get(e.id) ?? [],
      apsPorEvento.get(e.id) ?? [],
      ahora,
      config,
    );
    return {
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      festejadoEmail: emailPorId.get(e.festejado_id) ?? "—",
      saldoTotal: estado.resumen.saldoTotal,
      retirable: estado.resumen.retirable,
      retenido: estado.resumen.retenido,
      nAportaciones: estado.nAportaciones,
      sospechoso: e.sospechoso,
      notaAdmin: e.nota_admin,
    };
  });
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
