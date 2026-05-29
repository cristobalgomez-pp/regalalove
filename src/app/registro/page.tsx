"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export default function Registro() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [confirmacionEnviada, setConfirmacionEnviada] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = crearClienteNavegador();
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setCargando(false);
      return;
    }

    // Con confirmación de correo activada, signUp NO devuelve sesión: hay que
    // verificar el correo antes de entrar.
    if (!data.session) {
      setConfirmacionEnviada(true);
      setCargando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (confirmacionEnviada) {
    return (
      <main className="contenedor" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="tarjeta centro" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem" }}>📩</div>
          <h1 style={{ fontSize: "1.5rem", marginTop: "0.5rem" }}>Confirma tu correo</h1>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Te enviamos un enlace a <strong style={{ color: "var(--ink)" }}>{correo}</strong>.
            Ábrelo para activar tu cuenta y empezar a crear tu mesa.
          </p>
          <p className="muted" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            ¿No lo ves? Revisa tu carpeta de spam.
          </p>
          <Link href="/login" className="btn btn-contorno btn-bloque" style={{ marginTop: "1.25rem" }}>
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="contenedor" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="tarjeta" style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem" }}>Crear mi mesa</h1>
        <p className="muted" style={{ marginTop: "0.4rem", marginBottom: "1.5rem" }}>
          Crea tu cuenta para empezar a armar tu mesa de regalos.
        </p>
        <form onSubmit={manejarSubmit} className="pila">
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              className="input"
              type="email"
              placeholder="tu@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando}>
            {cargando ? "Creando…" : "Crear cuenta"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
        <p className="muted centro" style={{ marginTop: "1.25rem", fontSize: "0.9rem" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
