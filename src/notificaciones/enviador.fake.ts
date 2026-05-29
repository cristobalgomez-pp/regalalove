import type { CorreoPendiente } from "./correos.js";
import type { EnviadorCorreo } from "./enviador.js";

/** Enviador simulado para pruebas: registra los correos en vez de mandarlos. */
export interface EnviadorFake extends EnviadorCorreo {
  enviados: CorreoPendiente[];
}

export function crearEnviadorFake(): EnviadorFake {
  const enviados: CorreoPendiente[] = [];

  return {
    enviados,
    async enviar(correo: CorreoPendiente): Promise<void> {
      enviados.push(correo);
    },
  };
}
