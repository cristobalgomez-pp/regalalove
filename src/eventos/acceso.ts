/**
 * Regla de acceso a una mesa: dada una mesa (o su ausencia) y el id del
 * usuario, decide si le pertenece. Es la única definición de "esta mesa es
 * tuya"; el loader de servidor traduce la decisión a notFound()/redirect().
 */
export type AccesoMesa = "propia" | "ajena" | "inexistente";

export function evaluarAccesoMesa(
  evento: { festejado_id: string } | null | undefined,
  userId: string,
): AccesoMesa {
  if (!evento) return "inexistente";
  return evento.festejado_id === userId ? "propia" : "ajena";
}
