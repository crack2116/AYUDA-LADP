import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegistrar } from "@/presentation/components/pwa/ServiceWorkerRegistrar";
import { SupportChatWidget } from "@/presentation/components/support/SupportChatWidget";
import { BreakModuleTesterBar } from "@/presentation/components/qa/BreakModuleTesterBar";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "AYUDA LADP",
  title: "AYUDA LADP — Sistema de Alertas y Respuesta Humanitaria",
  description:
    "Sistema de alertas y respuesta humanitaria para brigadas de campo en Perú. Registro de incidencias, validación y KPIs nacionales.",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  other: {
    // iOS still reads the legacy flag when adding the app to the home screen.
    "apple-mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    title: "AYUDA LADP",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
