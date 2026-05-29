"use client";

import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export default function BotonSalir() {
  const router = useRouter();

  async function salir() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={salir} className="btn btn-contorno">
      Cerrar sesión
    </button>
  );
}
