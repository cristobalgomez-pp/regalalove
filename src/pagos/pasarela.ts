import type { MetodoPago } from "../dominio/tipos";

/** Datos del invitado en guest checkout: sin cuenta, solo nombre y mensaje. */
export interface InvitadoCheckout {
  nombre: string;
  mensaje: string;
}

/** Parámetros para iniciar un cobro hacia la pasarela. */
export interface ParamsCobro {
  mesaId: string;
  itemId: string | null; // null = fondo general
  monto: number; // en centavos
  metodoPago: MetodoPago;
  invitado: InvitadoCheckout;
}

/** Cobro creado por la pasarela: referencia que el invitado usa para pagar. */
export interface Cobro {
  cobroId: string;
  referencia: string;
}

/**
 * Puerto estable de pagos. El resto de la app depende de esta interfaz, nunca
 * de EcartPay directamente: así el adaptador real es intercambiable y testeable.
 */
export interface PasarelaPago {
  crearCobro(params: ParamsCobro): Promise<Cobro>;
}
