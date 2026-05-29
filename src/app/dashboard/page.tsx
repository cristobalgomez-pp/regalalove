import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import BotonSalir from "./BotonSalir";

export default async function Dashboard() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensa en profundidad: el middleware ya gatea, pero verificamos aquí también.
  if (!user) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 600, margin: "4rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Tu panel</h1>
      <p>
        Sesión iniciada como <strong>{user.email}</strong>.
      </p>
      <BotonSalir />
    </main>
  );
}
