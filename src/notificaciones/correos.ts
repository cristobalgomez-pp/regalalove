export type PlantillaCorreo =
  | "comprobante_invitado"
  | "aviso_aportacion_festejado"
  | "aviso_retiro_festejado";

export interface CorreoPendiente {
  destinatario: string;
  plantilla: PlantillaCorreo;
  datos: Record<string, unknown>;
}

export interface DatosAportacion {
  invitado: { nombre: string; correo: string; mensaje: string };
  monto: number; // en centavos
  itemNombre: string;
}

export interface Festejado {
  nombre: string;
  correo: string;
}

/** Arma los correos transaccionales que dispara una aportación confirmada. */
export function correosPorAportacion(
  aportacion: DatosAportacion,
  festejado: Festejado,
): CorreoPendiente[] {
  return [
    {
      destinatario: aportacion.invitado.correo,
      plantilla: "comprobante_invitado",
      datos: {
        nombreInvitado: aportacion.invitado.nombre,
        monto: aportacion.monto,
        itemNombre: aportacion.itemNombre,
      },
    },
    {
      destinatario: festejado.correo,
      plantilla: "aviso_aportacion_festejado",
      datos: {
        nombreFestejado: festejado.nombre,
        nombreInvitado: aportacion.invitado.nombre,
        monto: aportacion.monto,
        itemNombre: aportacion.itemNombre,
      },
    },
  ];
}

export interface DatosRetiro {
  monto: number; // en centavos
}

/** Arma el aviso para el festejado cuando se completa un retiro. */
export function correoPorRetiro(retiro: DatosRetiro, festejado: Festejado): CorreoPendiente {
  return {
    destinatario: festejado.correo,
    plantilla: "aviso_retiro_festejado",
    datos: {
      nombreFestejado: festejado.nombre,
      monto: retiro.monto,
    },
  };
}
