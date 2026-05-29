/** Métodos de pago soportados. Las aportaciones por tarjeta son reversibles
 * (riesgo de contracargo); SPEI, OXXO y CoDi son irreversibles. */
export type MetodoPago = "tarjeta" | "spei" | "oxxo" | "codi";
