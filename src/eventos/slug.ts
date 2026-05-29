export interface OpcionesSlug {
  existentes?: string[];
  reservados?: string[];
}

function normalizar(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita diacríticos (acentos)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // todo lo no alfanumérico -> guion
    .replace(/^-+|-+$/g, ""); // sin guiones al inicio/fin
}

export function generarSlug(titulo: string, opciones: OpcionesSlug = {}): string {
  const base = normalizar(titulo) || "evento";
  const existentes = new Set([...(opciones.existentes ?? []), ...(opciones.reservados ?? [])]);

  if (!existentes.has(base)) {
    return base;
  }

  let n = 2;
  while (existentes.has(`${base}-${n}`)) {
    n++;
  }
  return `${base}-${n}`;
}
