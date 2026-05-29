/**
 * Capa de configuración de la aplicación.
 *
 * La marca y la URL base viven aquí (leídas del entorno con valores por
 * defecto), nunca hardcodeadas en componentes. Cambiar el dominio definitivo
 * el día de mañana es solo actualizar `URL_BASE`.
 */
export interface ConfigApp {
  nombreMarca: string;
  urlBase: string;
}

export function obtenerConfigApp(): ConfigApp {
  return {
    nombreMarca: process.env.NOMBRE_MARCA ?? "Regalove",
    urlBase: process.env.URL_BASE ?? "http://localhost:3000",
  };
}
