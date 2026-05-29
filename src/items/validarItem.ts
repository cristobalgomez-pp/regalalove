export interface EntradaItem {
  nombre: string;
  descripcion?: string;
  montoMetaCentavos: number;
}

export interface ItemValidado {
  nombre: string;
  descripcion?: string;
  montoMetaCentavos: number;
}

export function validarItem(entrada: EntradaItem): ItemValidado {
  const nombre = entrada.nombre.trim();
  if (nombre === "") {
    throw new Error("El nombre del ítem es obligatorio");
  }

  if (!Number.isInteger(entrada.montoMetaCentavos)) {
    throw new Error("El monto meta debe ser un entero de centavos");
  }
  if (entrada.montoMetaCentavos <= 0) {
    throw new Error("El monto meta debe ser positivo");
  }

  return {
    nombre,
    descripcion: entrada.descripcion?.trim(),
    montoMetaCentavos: entrada.montoMetaCentavos,
  };
}
