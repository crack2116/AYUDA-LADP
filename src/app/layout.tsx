import type { Metadata, Viewport } from "next";

import { SupportChatWidget } from "@/presentation/components/support/SupportChatWidget";
import { BreakModuleTesterBar } from "@/presentation/components/qa/BreakModuleTesterBar";

import "./globals.css";

export const metadata: Metadata = {
  title: "AYUDA LADP — Sistema de Alertas y Respuesta Humanitaria",
  description:
    "Sistema de alertas y respuesta humanitaria para brigadas de campo en Perú. Registro de incidencias, validación y KPIs nacionales.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071B3E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">
        {children}
        <SupportChatWidget />
        <BreakModuleTesterBar />
      </body>
    </html>
  );
}
