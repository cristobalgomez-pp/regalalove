"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export default function Login() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password });

    if (error) {
      setError(error.message);
      setCargando(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="contenedor" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="tarjeta" style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.6rem" }}>Iniciar sesión</h1>
        <p className="muted" style={{ marginTop: "0.4rem", marginBottom: "1.5rem" }}>
          Entra para gestionar tu mesa de regalos.
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
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primario btn-bloque" disabled={cargando}>
            {cargando ? "Entrando…" : "Entrar"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
        <p className="muted centro" style={{ marginTop: "1.25rem", fontSize: "0.9rem" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/registro" style={{ color: "var(--accent)" }}>
            Crea una
          </Link>
        </p>
      </div>
    </main>
  );
}
