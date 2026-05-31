// src/app/admin/config/page.tsx
import Link from "next/link";
import { exigirAdmin } from "@/admin/exigirAdmin";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import { guardarConfig } from "../acciones";

export default async function ConfigAdmin() {
  await exigirAdmin();
  const config = await obtenerConfigMonetizacion();

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 520 }}>
      <Link href="/admin" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>← Volver al panel</Link>
      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem", marginBottom: "1.5rem" }}>Configuración de monetización</h1>

      <form action={guardarConfig} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Comisión base (%)
          <input type="number" name="comision_base_pct" step="0.1" min="0" defaultValue={config.comisionBasePct} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Comisión Premium (%)
          <input type="number" name="comision_premium_pct" step="0.1" min="0" defaultValue={config.comisionPremiumPct} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Precio Premium (pesos)
          <input type="number" name="precio_premium_pesos" step="1" min="0" defaultValue={config.precioPremium / 100} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Ventana de retención (días)
          <input type="number" name="ventana_retencion_dias" step="1" min="0" defaultValue={config.ventanaRetencionDias} required />
        </label>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" name="absorcion_pre_marcada" defaultChecked={config.absorcionPreMarcada} />
          Casilla de absorción pre-marcada en checkout
        </label>
        <button type="submit" className="btn btn-primario">Guardar</button>
      </form>
    </main>
  );
}
