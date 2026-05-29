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
      const indice = cobros.length;
      return {
        cobroId: `cobro_fake_${indice}`,
        referencia: `REF-${indice}`,
      };
    },
  };
}
