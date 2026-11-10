"use client";

import { Download, RefreshCw } from "lucide-react";
import Image from "next/image";

interface JefaturaHeroBannerProps {
  onExportCsv: () => Promise<void> | void;
  exporting: boolean;
  exportError: string | null;
}

export function JefaturaHeroBanner({
  onExportCsv,
  exporting,
  exportError,
}: JefaturaHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary-container text-on-primary shadow-lg border border-primary-fixed/20">
      {/* Dynamic technical backdrop grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#d7e2ff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex flex-col gap-space-md p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Institutional identity & Command context */}
        <div className="flex items-start gap-4 sm:items-center">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-inner ring-1 ring-white/20">
            <Image
              src="/ad-logo.png"
              alt="Emblema Institucional de AYUDA LADP"
              width={120}
              height={120}
              className="h-full w-auto object-contain drop-shadow"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-on-primary sm:text-2xl">
                PANEL DE CONTROL NACIONAL – JEFATURA
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-0.5 text-xs font-black tracking-wide text-on-tertiary-fixed">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-tertiary-container opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-on-tertiary-container" />
                </span>
                FENÓMENO EL NIÑO 2026
              </span>
            </div>

            <p className="text-sm font-medium text-primary-fixed-dim">
              <span>Panel de situación nacional</span> · Red de Alertas, Logística Crítica y Coordinación Humanitaria de Emergencia
            </p>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-fixed-dim/90">
              <span className="font-mono text-secondary-fixed">DINAPROS / COEN • AYUDA LADP</span>
              <span aria-hidden="true">•</span>
              <span className="font-bold text-secondary-fixed">
                Credencial Activa: Rol Jefatura Nacional
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Telemetry & Actions */}
        <div className="flex flex-col items-start gap-3 border-t border-surface-container-high/15 pt-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-highest/20 px-3 py-1.5 text-primary-fixed">
              <RefreshCw className="h-4 w-4 animate-spin text-secondary-fixed" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-fixed-dim">
                  Última Telemetría
                </span>
                <span className="font-mono text-xs font-bold text-on-primary">
                  12 Feb 2026 - 11:42:09 PET
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-error-container px-3 py-1.5 text-on-error-container">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider">
                Nivel 4: Rojo Operacional Activo
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <button
              type="button"
              data-testid="export-csv"
              onClick={() => void onExportCsv()}
              disabled={exporting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ladp-orange px-4 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-ladp-orange-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {exporting ? "Generando descarga…" : "Exportar CSV Nacional"}
            </button>
            {exportError ? (
              <p role="alert" className="text-xs font-bold text-red-300">
                {exportError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
