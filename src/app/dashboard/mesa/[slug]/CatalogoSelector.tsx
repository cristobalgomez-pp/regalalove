"use client";

import { useMemo, useState } from "react";
import { agregarDesdeCatalogo } from "./acciones";

export interface CatalogoItem {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  precio_centavos: number;
  imagen_url: string | null;
}

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function CatalogoSelector({
  slug,
  catalogo,
}: {
  slug: string;
  catalogo: CatalogoItem[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(catalogo.map((c) => c.categoria)))],
    [catalogo],
  );

  const filtrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return catalogo.filter((c) => {
      const coincideCat = categoria === "Todas" || c.categoria === categoria;
      const coincideBusqueda =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.descripcion?.toLowerCase().includes(q) ?? false);
      return coincideCat && coincideBusqueda;
    });
  }, [catalogo, busqueda, categoria]);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          className="input"
          placeholder="Buscar regalo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: "1 1 220px" }}
        />
        <select
          className="input"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          style={{ flex: "0 0 200px" }}
        >
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtrado.length === 0 ? (
        <p className="muted">No hay regalos que coincidan con tu búsqueda.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {filtrado.map((item) => (
            <div key={item.id} className="tarjeta" style={{ padding: "0.75rem" }}>
              {item.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imagen_url}
                  alt={item.nombre}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: "0.6rem",
                  }}
                />
              ) : null}
              <div style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.categoria}
              </div>
              <strong style={{ display: "block", fontSize: "0.95rem", margin: "0.15rem 0" }}>
                {item.nombre}
              </strong>
              <div className="muted" style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>
                {pesos(item.precio_centavos)}
              </div>
              <form action={agregarDesdeCatalogo.bind(null, slug, item.id)} style={{ display: "flex", gap: "0.4rem" }}>
                <input
                  name="cantidad"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="input"
                  style={{ width: 56, padding: "0.45rem 0.5rem" }}
                  aria-label="Cantidad"
                />
                <button type="submit" className="btn btn-primario" style={{ flex: 1, padding: "0.45rem 0.6rem" }}>
                  Agregar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
