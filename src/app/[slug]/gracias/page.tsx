import Link from "next/link";

function pesos(pesosStr?: string): string | null {
  const n = Number(pesosStr);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function Gracias({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ monto?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const monto = pesos(sp.monto);

  return (
    <main className="contenedor" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
      <div className="tarjeta centro" style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ fontSize: "3rem" }}>🎉</div>
        <h1 style={{ fontSize: "1.6rem", marginTop: "0.5rem" }}>¡Gracias por tu regalo!</h1>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          {monto ? <>Tu aportación de <strong style={{ color: "var(--ink)" }}>{monto}</strong> fue recibida. </> : "Tu aportación fue recibida. "}
          Te enviaremos tu comprobante por correo.
        </p>
        <Link href={`/${slug}`} className="btn btn-primario btn-bloque" style={{ marginTop: "1.25rem" }}>
          Volver a la mesa
        </Link>
      </div>
    </main>
  );
}
