"use client";

import { useState } from "react";
import { guardarPersonalizacion } from "./acciones";

export default function FormularioPersonalizar({
  slug,
  mensajeInicial,
  fechaInicial,
  portadaInicial,
}: {
  slug: string;
  mensajeInicial: string;
  fechaInicial: string;
  portadaInicial: string;
}) {
  const [portada, setPortada] = useState(portadaInicial);
  const [guardando, setGuardando] = useState(false);

  return (
    <form
      action={guardarPersonalizacion.bind(null, slug)}
      onSubmit={() => setGuardando(true)}
      className="tarjeta pila"
      style={{ gap: "1.25rem" }}
    >
      <div className="campo">
        <label htmlFor="mensaje_bienvenida">Mensaje de bienvenida</label>
        <textarea
          id="mensaje_bienvenida"
          name="mensaje_bienvenida"
          className="input"
          rows={3}
          defaultValue={mensajeInicial}
          placeholder="¡Gracias por acompañarnos en este día tan especial!"
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div className="campo">
        <label htmlFor="fecha_evento">Fecha del evento</label>
        <input id="fecha_evento" name="fecha_evento" type="date" className="input" defaultValue={fechaInicial} />
      </div>

      <div className="campo">
        <label htmlFor="portada_url">Foto de portada (URL)</label>
        <input
          id="portada_url"
          name="portada_url"
          type="url"
          className="input"
          value={portada}
          onChange={(e) => setPortada(e.target.value)}
          placeholder="https://…"
        />
        <small className="muted">Pega el enlace de una imagen. (Pronto: subir foto directo.)</small>
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portada}
            alt="Vista previa de portada"
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "var(--radius-sm)", marginTop: "0.5rem" }}
          />
        ) : null}
      </div>

      <button type="submit" className="btn btn-primario btn-bloque" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
