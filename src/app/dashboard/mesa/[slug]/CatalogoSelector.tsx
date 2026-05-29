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

export default function CatalogoSelector({
  slug,
  catalogo,
}: {
  slug: string;
  catalogo: CatalogoItem[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [precios, setPrecios] = useState<Record<string, string>>({});

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

  const cantidadDe = (id: string) => cantidades[id] ?? 1;
  const ajustar = (id: string, delta: number) =>
    setCantidades((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));

  // Precio editable (en pesos), arranca con el del catálogo.
  const precioDe = (item: CatalogoItem) =>
    precios[item.id] ?? String(item.precio_centavos / 100);
  const setPrecio = (id: string, valor: string) =>
    setPrecios((prev) => ({ ...prev, [id]: valor }));

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
        <div className="pila" style={{ gap: "0.6rem" }}>
          {filtrado.map((item) => (
            <div
              key={item.id}
              className="tarjeta"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.6rem 0.85rem",
              }}
            >
              {item.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imagen_url}
                  alt={item.nombre}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: "var(--surface)", flexShrink: 0 }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.categoria}
                </div>
                <strong style={{ fontSize: "0.95rem" }}>{item.nombre}</strong>
                {item.descripcion ? (
                  <p className="muted" style={{ margin: "0.1rem 0 0", fontSize: "0.85rem" }}>
                    {item.descripcion}
                  </p>
                ) : null}
              </div>

              <form
                action={agregarDesdeCatalogo.bind(null, slug, item.id)}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                {/* Precio editable */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.85rem" }} title="Edita el precio a tu gusto">
                  <span className="muted">$</span>
                  <input
                    name="precio"
                    type="number"
                    min={1}
                    step="0.01"
                    value={precioDe(item)}
                    onChange={(e) => setPrecio(item.id, e.target.value)}
                    className="input"
                    style={{ width: 80, padding: "0.3rem 0.4rem", textAlign: "right" }}
                    aria-label={`Precio de ${item.nombre}`}
                  />
                  <span className="muted">c/u</span>
                </label>

                {/* Cantidad */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <button type="button" className="btn btn-contorno" style={{ padding: "0.2rem 0.55rem" }} onClick={() => ajustar(item.id, -1)} title="Menos">
                    −
                  </button>
                  <span style={{ minWidth: 22, textAlign: "center", fontWeight: 600 }}>{cantidadDe(item.id)}</span>
                  <button type="button" className="btn btn-contorno" style={{ padding: "0.2rem 0.55rem" }} onClick={() => ajustar(item.id, 1)} title="Más">
                    +
                  </button>
                </div>

                <input type="hidden" name="cantidad" value={cantidadDe(item.id)} />
                <button type="submit" className="btn btn-primario" style={{ padding: "0.45rem 0.9rem" }}>
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
