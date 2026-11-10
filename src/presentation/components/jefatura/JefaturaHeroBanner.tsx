"use client";

import { AlertTriangle, Calendar, Clock, Download } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#03153d] via-[#0a2a6b] to-[#144ba8] text-white shadow-xl border border-blue-400/20">
      {/* Decorative atmospheric gradient glows & dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: "radial-gradient(#d7e2ff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-blue-500/20 blur-2xl"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Institutional identity & Command context */}
        <div className="flex items-start gap-4 sm:items-center">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-2.5 shadow-inner ring-1 ring-white/25 backdrop-blur-md">
            <Image
              src="/ad-logo.png"
              alt="Emblema Institucional de AYUDA LADP"
              width={120}
              height={120}
              className="h-full w-auto object-contain drop-shadow-md"
            />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl uppercase">
              PANEL DE CONTROL NACIONAL – JEFATURA
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                FENÓMENO EL NIÑO 2026
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-sky-100/90 leading-snug max-w-2xl">
              <span>Panel de situación nacional</span> · Red de Alertas, Logística Crítica y Coordinación Humanitaria de Emergencia.
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-sky-200/80">
              <span className="font-mono text-sky-200 font-bold tracking-wide">
                DINAPROS / COEN • AYUDA LADP
              </span>
              <span aria-hidden="true">•</span>
              <span className="font-bold text-white/95">
                Credencial Activa: Rol Jefatura Nacional
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Telemetry window, Alert Status & Orange Export CTA */}
        <div className="flex flex-col items-start gap-2.5 border-t border-white/15 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
          {/* Date & Time Glass Pill */}
          <div className="inline-flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>01 Feb. 2026 – 28 Feb. 2026</span>
            </span>
            <span className="h-3.5 w-px bg-white/25" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 font-mono text-sky-100">
              <Clock className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>13:45:30 PET</span>
            </span>
          </div>

          {/* Operational Alert Pill */}
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#fff0f0]/95 border border-rose-200/80 px-3.5 py-1.5 text-[#ba1a1a] shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#ba1a1a]" aria-hidden="true" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Nivel 4: Rojo Operacional Activo
            </span>
          </div>

          {/* Export CSV Primary CTA */}
          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <button
              type="button"
              data-testid="export-csv"
              onClick={() => void onExportCsv()}
              disabled={exporting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#d94e02] px-5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-950/30 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{exporting ? "Generando descarga…" : "Exportar CSV Nacional"}</span>
            </button>
            {exportError ? (
              <p role="alert" className="text-xs font-bold text-rose-200">
                {exportError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
