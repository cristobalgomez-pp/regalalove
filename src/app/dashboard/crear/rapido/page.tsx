import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { totalPaquete } from "@/paquetes/armar";
import SelectorPaquete, { type PaqueteVista } from "./SelectorPaquete";

interface ItemPaquete {
  cantidad: number;
  catalogo_items: { nombre: string; precio_centavos: number } | null;
}
interface Paquete {
  id: string;
  nombre: string;
  descripcion: string | null;
  paquete_items: ItemPaquete[];
}

export default async function CrearRapido() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("paquetes")
    .select("id, nombre, descripcion, paquete_items(cantidad, catalogo_items(nombre, precio_centavos))")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const paquetes: PaqueteVista[] = ((data ?? []) as unknown as Paquete[]).map((p) => {
    const items = p.paquete_items ?? [];
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      totalCentavos: totalPaquete(
        items.map((it) => ({
          precioCentavos: it.catalogo_items?.precio_centavos ?? 0,
          cantidad: it.cantidad,
        })),
      ),
      items: items.map((it) => ({
        nombre: it.catalogo_items?.nombre ?? "",
        cantidad: it.cantidad,
      })),
    };
  });

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 640 }}>
      <Link href="/dashboard/crear" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>Crear rápido</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Ponle nombre a tu mesa y elige cuánto quieres juntar. Podrás editar los regalos después.
      </p>

      <SelectorPaquete paquetes={paquetes} />
    </main>
  );
}
