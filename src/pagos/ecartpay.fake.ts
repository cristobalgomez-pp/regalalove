import { randomUUID } from "node:crypto";
import type { Cobro, ParamsCobro, PasarelaPago } from "./pasarela.js";

/** Pasarela simulada para pruebas: implementa el puerto y registra los cobros
 * recibidos, sin tocar la red. El adaptador real contra EcartPay sandbox
 * implementa esta misma interfaz. */
export interface EcartPayFake extends PasarelaPago {
  cobros: ParamsCobro[];
}

export function crearEcartPayFake(): EcartPayFake {
  const cobros: ParamsCobro[] = [];

  return {
    cobros,
    async crearCobro(params: ParamsCobro): Promise<Cobro> {
      cobros.push(params);
      // cobroId único y estable por cobro: es la clave de idempotencia con la
      // que se asienta la aportación. El adaptador real usará el id que asigne
      // EcartPay; aquí lo simulamos con un UUID.
      const cobroId = `cobro_${randomUUID()}`;
      return {
        cobroId,
        referencia: `REF-${cobros.length}`,
      };
    },
  };
}
