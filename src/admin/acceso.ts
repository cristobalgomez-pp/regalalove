/** Determina si un correo pertenece a la allowlist de administradores.
 *  La allowlist viene de ADMIN_EMAILS (correos separados por comas). */
export function esAdmin(email: string | null | undefined, allowlist: string): boolean {
  if (!email) return false;
  const objetivo = email.trim().toLowerCase();
  if (!objetivo) return false;
  const permitidos = allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  return permitidos.includes(objetivo);
}

/** Lee la allowlist de administradores del entorno (vacía si no está). */
export function obtenerAllowlistAdmin(): string {
  return process.env.ADMIN_EMAILS ?? "";
}
