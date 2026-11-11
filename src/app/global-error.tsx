"use client";

import "./globals.css";
import { RuntimeErrorFallback } from "@/presentation/components/layout/RuntimeErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">
        <RuntimeErrorFallback
          title="Error crítico de aplicación"
          digest={error.digest}
          onRetry={reset}
          showHomeLink={false}
        />
      </body>
    </html>
  );
}
