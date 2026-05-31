export interface EventoRetirable {
  sospechoso: boolean;
}

/** Un evento marcado como sospechoso tiene los retiros bloqueados. */
export function puedeRetirar(evento: EventoRetirable): boolean {
  return !evento.sospechoso;
}
