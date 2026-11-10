import type { MetadataRoute } from "next";

/**
 * Manifest for the installable PWA. Next serves it at /manifest.webmanifest,
 * so phones and tablets can add AYUDA LADP to the home screen with its own
 * icon and run it without the browser chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AYUDA LADP — Sistema de Alertas y Respuesta Humanitaria",
    short_name: "AYUDA LADP",
    description:
      "Sistema de alertas y respuesta humanitaria para brigadas de campo en Perú. Registro de incidencias, validación y KPIs nacionales.",
    id: "/",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#071b3e",
    lang: "es-PE",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
