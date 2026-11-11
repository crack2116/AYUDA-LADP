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
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#0b4bb8] via-[#072669] to-[#041338] text-white shadow-[0_14px_34px_-10px_rgba(4,19,56,0.45)] border border-white/10">
      {/* Decorative atmospheric gradient glows & dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#d7e2ff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-1/2 -translate-y-1/2 h-64 w-72 rounded-full bg-[#2478ff]/45 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-400/15 blur-3xl"
      />

      {/* Subtle translucent Peru operational silhouette behind left emblem */}
      <svg
        aria-hidden="true"
        viewBox="0 0 180 220"
        className="pointer-events-none absolute left-28 top-1/2 -translate-y-1/2 h-44 w-auto opacity-20 hidden sm:block"
        fill="none"
      >
        <path
          d="M66 12 C82 10 100 18 112 34 C124 48 134 56 144 74 C154 92 150 112 138 128 C126 144 134 162 126 180 C118 196 100 206 88 202 C74 198 62 180 54 164 C44 146 28 128 24 108 C20 88 30 66 42 46 C48 32 54 14 66 12 Z"
          fill="#60a5fa"
          fillOpacity="0.28"
          stroke="#93c5fd"
          strokeWidth="1.5"
        />
        <circle cx="52" cy="54" r="4" fill="#38bdf8" />
        <circle cx="52" cy="54" r="9" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx="72" cy="118" r="3.5" fill="#fb923c" />
        <circle cx="104" cy="166" r="3" fill="#4ade80" />
      </svg>

      <div className="relative flex flex-col gap-4 px-5 py-4.5 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Institutional identity & Command context */}
        <div className="flex items-start gap-4 sm:items-center">
          <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_8px_22px_rgba(3,15,44,0.35)] ring-2 ring-white/25">
            <Image
              src="/ad-logo.png"
              alt="Emblema Institucional de AYUDA LADP"
              width={120}
              height={120}
              className="h-full w-auto object-contain"
            />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-black tracking-tight text-white sm:text-[22px] uppercase leading-tight">
              PANEL DE CONTROL NACIONAL – JEFATURA
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-rose-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                FENÓMENO EL NIÑO 2026
              </span>
            </div>

            <div className="text-xs sm:text-[13px] font-medium text-blue-100/90 leading-snug max-w-2xl">
              <h2 className="inline font-semibold text-white">Panel de situación nacional</h2>
              {" · "}Red de Alertas, Logística Crítica y Coordinación Humanitaria de Emergencia.
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px] font-semibold text-blue-200/75 uppercase tracking-wide">
              <span className="font-mono text-sky-200 font-bold">
                DINAPROS | COEN | AYUDA LADP
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-bold text-white/95 normal-case tracking-normal">
                Credencial Activa: Rol Jefatura Nacional
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Telemetry window, Alert Status & Orange Export CTA */}
        <div className="flex flex-col items-stretch gap-2 border-t border-white/15 pt-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:w-[325px] lg:shrink-0 lg:flex-col lg:items-stretch lg:border-t-0 lg:pt-0">
          {/* Date & Time Glass Pill */}
          <div className="inline-flex items-center justify-between gap-2.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md px-3.5 py-1.5 text-[11.5px] font-semibold text-white">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>01 Feb. 2026 – 28 Feb. 2026</span>
            </span>
            <span className="h-3 w-px bg-white/25" aria-hidden="true" />
            <span className="inline-flex items-center gap-1 font-mono text-sky-100">
              <Clock className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>13:45:30</span>
            </span>
          </div>

          {/* Operational Alert Pill */}
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff3f3] border border-rose-200/80 px-3.5 py-1.5 text-[#b91c1c] shadow-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#dc2626]" aria-hidden="true" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Nivel 4: Rojo Operacional Activo
            </span>
          </div>

          {/* Export CSV Primary CTA */}
          <div className="flex flex-col items-stretch gap-1">
            <button
              type="button"
              data-testid="export-csv"
              onClick={() => void onExportCsv()}
              disabled={exporting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f78a09] via-[#f06a00] to-[#e05200] px-5 text-xs font-black uppercase tracking-wider text-white shadow-[0_8px_18px_rgba(240,106,0,0.42)] transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
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
