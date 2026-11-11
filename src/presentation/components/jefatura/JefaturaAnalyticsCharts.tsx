"use client";

import { useMemo, useState } from "react";
import { BarChart3, FileText } from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import { labelForTipoAfectacion } from "@/domain/entities/incidencia";
import { formatCount } from "@/presentation/lib/format";

interface JefaturaAnalyticsChartsProps {
  rows: readonly IncidenciaConCentro[];
}

const PANEL =
  "flex flex-col justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] sm:p-5";

const PANEL_HEAD = "flex items-start justify-between gap-3";
const PANEL_TITLE = "text-[13.5px] font-bold tracking-tight text-brand-ink";
const PANEL_SUB = "text-[11px] font-medium text-slate-500";

export function JefaturaAnalyticsCharts({ rows }: JefaturaAnalyticsChartsProps) {
  const [viewMode, setViewMode] = useState<"nacional" | "cuenca">("nacional");

  // Affectation vectors derived strictly from the loaded rows
  const vectorBreakdown = useMemo(() => {
    if (rows.length === 0) {
      return [];
    }

    const counts: Record<string, number> = {};
    for (const r of rows) {
      const label = labelForTipoAfectacion(r.incidencia.tipoAfectacion);
      counts[label] = (counts[label] ?? 0) + 1;
    }

    const total = Math.max(1, rows.length);
    // One hue, six steps: the donut reads as ranked magnitude, not as a
    // rainbow of unrelated categories.
    const colors = ["#0e4ec3", "#2f6fe0", "#5b90ec", "#86b0f2", "#aecbf7", "#d3e2fb"];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], index) => ({
        label,
        count,
        pct: Math.round((count / total) * 100),
        ratio: count / total,
        color: colors[index % colors.length] as string,
      }));
  }, [rows]);

  // Circumference calculation for SVG Donut (r=46 -> 2*PI*46 ≈ 289.03)
  const donutSegments = useMemo(() => {
    const circum = 2 * Math.PI * 46;
    const gap = vectorBreakdown.length > 1 ? 2.2 : 0;
    let accumulatedOffset = 0;
    return vectorBreakdown.map((item) => {
      const safeRatio = Number.isFinite(item.ratio) ? item.ratio : item.pct / 100;
      const fullArc = safeRatio * circum;
      const strokeDash = Math.max(0.5, fullArc - gap);
      const strokeOffset = -accumulatedOffset;
      accumulatedOffset += fullArc;
      return {
        ...item,
        strokeDash: `${strokeDash} ${circum}`,
        strokeOffset,
      };
    });
  }, [vectorBreakdown]);

  const regionalData = useMemo(() => {
    if (rows.length === 0) {
      return [];
    }

    const counts: Record<string, number> = {};
    for (const row of rows) {
      const name =
        viewMode === "nacional" ? row.centroPoblado.region : row.centroPoblado.sector;
      counts[name] = (counts[name] ?? 0) + 1;
    }

    const max = Math.max(...Object.values(counts));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / max) * 100),
      }));
  }, [rows, viewMode]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* Left Chart Panel: Tipo de Afectación Mayor (Donut Chart) */}
      <div className={`${PANEL} lg:col-span-5`}>
        <div className={PANEL_HEAD}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className={PANEL_TITLE}>Tipo de afectación mayor</h2>
              <p className={PANEL_SUB}>Distribución porcentual por sector de impacto</p>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col items-center gap-5 sm:flex-row">
          {/* SVG Donut Chart with Hollow Center */}
          <div className="relative flex h-[150px] w-[150px] shrink-0 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="46"
                stroke="#eaf1fd"
                strokeWidth="15"
              />
              {donutSegments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="46"
                  stroke={seg.color}
                  strokeDasharray={seg.strokeDash}
                  strokeDashoffset={seg.strokeOffset}
                  strokeWidth="15"
                  className="transition-all duration-500"
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[26px] font-bold leading-none text-brand-ink tabular-nums">
                {formatCount(rows.length)}
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Reportes
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex w-full min-w-0 flex-1 flex-col">
            {vectorBreakdown.length === 0 ? (
              <p className="py-6 text-center text-[12px] font-medium text-slate-400">
                Sin reportes registrados.
              </p>
            ) : null}
            {vectorBreakdown.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 py-[5px] text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className="truncate text-[11.5px] font-semibold text-slate-600"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </div>
                <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
                  <span className="text-[11.5px] font-bold text-brand-ink">{item.pct}%</span>
                  <span className="text-[10px] text-slate-400">
                    ({formatCount(item.count)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
          <span>Fuente: Centro de Operaciones de Emergencia Sectorial</span>
          <span className="font-bold text-brand-blue">COES / INDECI</span>
        </div>
      </div>

      {/* Right Chart Panel: Reporte por Regiones Críticas (Comparative Bars) */}
      <div className={`${PANEL} lg:col-span-7`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className={PANEL_TITLE}>Reporte por regiones críticas</h2>
              <p className={PANEL_SUB}>Volumen de incidencias territoriales activas</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 self-start rounded-lg bg-brand-mist p-0.5 text-xs sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("nacional")}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition-colors ${
                viewMode === "nacional"
                  ? "bg-brand-deep text-white"
                  : "text-slate-500 hover:text-brand-blue"
              }`}
            >
              Ámbito Nacional
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cuenca")}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition-colors ${
                viewMode === "cuenca"
                  ? "bg-brand-deep text-white"
                  : "text-slate-500 hover:text-brand-blue"
              }`}
            >
              Por Cuenca
            </button>
          </div>
        </div>

        <div className="my-4 flex flex-col gap-3.5">
          {regionalData.length === 0 ? (
            <p className="py-6 text-center text-[12px] font-medium text-slate-400">
              Sin reportes registrados para este ámbito.
            </p>
          ) : (
            regionalData.map((reg) => (
              <div key={reg.name} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                  <span className="font-bold text-brand-ink">{reg.name}</span>
                  <span className="text-[11.5px] font-medium text-slate-500 tabular-nums">
                    {formatCount(reg.count)} incidencias
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-mist">
                  <div
                    className="h-full bg-brand-blue transition-all duration-500"
                    style={{ width: `${reg.pct}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
          <span>Según los últimos reportes registrados</span>
          <span className="tabular-nums">{formatCount(rows.length)} en total</span>
        </div>
      </div>
    </div>
  );
}
