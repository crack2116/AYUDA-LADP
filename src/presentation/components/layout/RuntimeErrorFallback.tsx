"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface RuntimeErrorFallbackProps {
  title?: string;
  description?: string;
  digest?: string;
  onRetry: () => void;
  showHomeLink?: boolean;
}

/**
 * Institutional runtime error boundary surface used by App Router error handlers.
 */
export function RuntimeErrorFallback({
  title = "Ocurrió un error inesperado en esta vista",
  description = "Tus datos guardados en caché local permanecen seguros. Puedes reintentar cargar el módulo o volver al acceso institucional.",
  digest,
  onRetry,
  showHomeLink = true,
}: RuntimeErrorFallbackProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-mist px-4 py-12 text-brand-ink">
      <div
        role="alert"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-brand-negative">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-negative">
              Contingencia de Sistema · AYUDA LADP
            </p>
            <h1 className="text-lg font-bold tracking-tight text-brand-ink">{title}</h1>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
          {description}
        </p>

        {digest ? (
          <p className="mt-3 rounded-lg bg-brand-mist px-3 py-2 font-mono text-[11px] font-semibold text-slate-500">
            Referencia técnica: {digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ladp-orange px-4 py-2 text-xs font-bold text-white transition-colors hover:brightness-105"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reintentar</span>
          </button>

          {showHomeLink ? (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-mist px-4 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
            >
              Volver al inicio de sesión
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
