import type { Metadata } from "next";
import { obtenerConfigApp } from "@/config/config";

const { nombreMarca } = obtenerConfigApp();

export const metadata: Metadata = {
  title: nombreMarca,
  description: `${nombreMarca} — mesas de regalos para tus eventos`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
