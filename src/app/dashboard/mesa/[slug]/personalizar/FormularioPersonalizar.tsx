"use client";

import { useState } from "react";
import { guardarPersonalizacion } from "./acciones";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

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
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorSubida(null);
    setSubiendo(true);

    const supabase = crearClienteNavegador();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ruta = `${slug}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("portadas").upload(ruta, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (error) {
      setErrorSubida(`No se pudo subir la foto: ${error.message}`);
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from("portadas").getPublicUrl(ruta);
    setPortada(data.publicUrl);
    setSubiendo(false);
  }

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
        <label htmlFor="portada_archivo">Foto de portada</label>
        <input
          id="portada_archivo"
          type="file"
          accept="image/*"
          onChange={manejarArchivo}
          disabled={subiendo}
        />
        {subiendo ? <small className="muted">Subiendo foto…</small> : null}
        {errorSubida ? <p className="error">{errorSubida}</p> : null}

        {/* La URL pública resultante viaja con el formulario. */}
        <input type="hidden" name="portada_url" value={portada} />

        {portada ? (
          <div style={{ marginTop: "0.5rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portada}
              alt="Vista previa de portada"
              style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: "var(--radius-sm)" }}
            />
            <button
              type="button"
              className="btn btn-fantasma"
              onClick={() => setPortada("")}
              style={{ marginTop: "0.4rem", padding: "0.3rem 0.6rem" }}
            >
              Quitar foto
            </button>
          </div>
        ) : null}
      </div>

      <button type="submit" className="btn btn-primario btn-bloque" disabled={guardando || subiendo}>
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
