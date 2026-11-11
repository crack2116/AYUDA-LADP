"use client";

import { Download } from "lucide-react";

import { BrandMark } from "@/presentation/components/brand/BrandMark";

interface JefaturaHeroBannerProps {
  onExportCsv: () => Promise<void> | void;
  exporting: boolean;
  exportError: string | null;
  /** Period covered by the loaded incidents, e.g. "Noviembre 2026". */
  periodo?: string | null;
}

export function JefaturaHeroBanner({
  onExportCsv,
  exporting,
  exportError,
  periodo,
}: JefaturaHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-brand-deep text-white">
      <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <BrandMark className="h-12 w-12 sm:h-14 sm:w-14" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ladp-amber sm:text-[10px] sm:tracking-[0.2em]">
              Jefatura nacional{periodo ? ` · ${periodo}` : ""}
            </p>
            <h1 className="mt-1 text-xl font-bold leading-tight tracking-tight sm:text-2xl">
              Panel de Control Nacional
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] font-medium leading-relaxed text-blue-100/75">
              <span className="font-bold text-white/95">Panel de situación nacional</span>
              {" · "}Alertas, logística crítica y coordinación humanitaria de emergencia en
              tiempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 xl:shrink-0 xl:items-end">
          <button
            type="button"
            data-testid="export-csv"
            onClick={() => void onExportCsv()}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ladp-orange px-5 text-[11.5px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-ladp-orange-light active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
  );
}
