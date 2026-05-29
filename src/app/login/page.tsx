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
    <main style={{ maxWidth: 360, margin: "4rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={manejarSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={cargando}>
          {cargando ? "Entrando…" : "Entrar"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>
      <p style={{ marginTop: "1rem" }}>
        ¿No tienes cuenta? <Link href="/registro">Crea una</Link>
      </p>
    </main>
  );
}
