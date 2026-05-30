import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { obtenerConfigApp } from "@/config/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--fuente" });

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
      <body className={inter.variable}>
        <nav className="nav">
          <div className="contenedor nav-inner">
            <Link href="/" className="marca">
              Regala<span>Love</span>
            </Link>
            <Link href="/login" className="btn btn-fantasma">
              Iniciar sesión
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
