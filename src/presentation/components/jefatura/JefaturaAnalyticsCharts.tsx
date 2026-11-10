"use client";

import { useMemo, useState } from "react";
import { ArrowRight, MoreVertical } from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import { labelForTipoAfectacion } from "@/domain/entities/incidencia";
import { formatCount } from "@/presentation/lib/format";

interface JefaturaAnalyticsChartsProps {
  rows: readonly IncidenciaConCentro[];
}

export function JefaturaAnalyticsCharts({ rows }: JefaturaAnalyticsChartsProps) {
  const [viewMode, setViewMode] = useState<"nacional" | "cuenca">("nacional");

  // Calculate dynamic affectation vectors from real rows
  const vectorBreakdown = useMemo(() => {
    if (rows.length === 0) {
      return [
        { label: "Inundación / Desborde", count: 2458, pct: 51, color: "#325f9c" },
        { label: "Agua Potable y Saneamiento", count: 2024, pct: 42, color: "#90bafe" },
        { label: "Rescate / Evacuación Crítica", count: 338, pct: 7, color: "#ba1a1a" },
      ];
    }

    const counts: Record<string, number> = {};
    for (const r of rows) {
      const label = labelForTipoAfectacion(r.incidencia.tipoAfectacion);
      counts[label] = (counts[label] ?? 0) + 1;
    }

    const total = rows.length;
    const colors = ["#325f9c", "#90bafe", "#f06a00", "#ba1a1a", "#753400"];
    return Object.entries(counts).map(([label, count], index) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
      color: colors[index % colors.length] as string,
    }));
  }, [rows]);

  // Circumference calculation for SVG Donut (r=46 -> 2*PI*46 ≈ 289)
  const donutSegments = useMemo(() => {
    const circum = 289;
    let accumulatedOffset = 0;
    return vectorBreakdown.map((item) => {
      const strokeDash = (item.pct / 100) * circum;
      const strokeOffset = -accumulatedOffset;
      accumulatedOffset += strokeDash;
      return {
        ...item,
        strokeDash: `${strokeDash} ${circum}`,
        strokeOffset,
      };
    });
  }, [vectorBreakdown]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left Chart Panel: Tipo de Afectación Mayor (Donut Chart) */}
      <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40 lg:col-span-5">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/20">
          <div>
            <h2 className="text-base font-bold text-on-surface">Tipo de Afectación Mayor</h2>
            <p className="text-xs text-on-surface-variant font-medium">
              Distribución porcentual por vector de impacto
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            aria-label="Opciones del gráfico de afectación"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="my-4 flex flex-col items-center justify-around gap-5 sm:flex-row">
          {/* SVG Donut Chart with Hollow Center */}
          <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              {/* Background Ring */}
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="46"
                stroke="#e8eeff"
                strokeWidth="15"
              />
              {/* Colored Segments */}
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
              <span className="text-2xl font-black text-on-surface leading-none">
                100%
              </span>
              <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Impacto
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex w-full flex-col gap-2 sm:w-auto min-w-[190px]">
            {vectorBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate font-semibold text-on-surface">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="font-bold text-on-surface">{item.pct}%</span>
                  <span className="text-[11px] text-on-surface-variant">
                    ({formatCount(item.count)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container pt-3 text-xs text-on-surface-variant font-medium">
          <span>Fuente: Centro de Operaciones de Emergencia Sectorial</span>
          <span className="font-bold text-secondary">
            COES / INDECI
          </span>
        </div>
      </div>

      {/* Right Chart Panel: Reporte por Regiones Críticas (Comparative Bars) */}
      <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40 lg:col-span-7">
        <div className="flex flex-col gap-2 border-b border-surface-container-high/20 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Reporte por Regiones Críticas
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">
              Volumen total de incidencias territoriales activas
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("nacional")}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                viewMode === "nacional"
                  ? "bg-secondary text-on-secondary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Ámbito Nacional
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cuenca")}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                viewMode === "cuenca"
                  ? "bg-secondary text-on-secondary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Por Cuenca
            </button>
          </div>
        </div>

        {/* Horizontal Bar Stack / Bars */}
        <div className="my-3 flex flex-col gap-3">
          {/* Piura */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">Piura (Zona Norte)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-secondary">92 incidencias</span>
                <span className="rounded bg-error-container px-2 py-0.5 text-[10px] font-black uppercase text-on-error-container">
                  Extremo
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-primary-container transition-all duration-500" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Tumbes */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">Tumbes (Frontera Norte)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-secondary">78 incidencias</span>
                <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[10px] font-black uppercase text-on-tertiary-container">
                  Severo
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: "84.7%" }} />
            </div>
          </div>

          {/* Lambayeque */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">Lambayeque (Costa Norte)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-secondary">65 incidencias</span>
                <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[10px] font-black uppercase text-on-tertiary-container">
                  Severo
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary/85 transition-all duration-500" style={{ width: "70.6%" }} />
            </div>
          </div>

          {/* La Libertad */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">La Libertad (Trujillo y Valles)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-secondary">54 incidencias</span>
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">
                  Moderado
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary-container transition-all duration-500" style={{ width: "58.7%" }} />
            </div>
          </div>

          {/* Áncash */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">Áncash (Costa y Callejón)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-secondary">42 incidencias</span>
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant">
                  Vigilancia
                </span>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary-fixed-dim transition-all duration-500" style={{ width: "45.6%" }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container pt-3 text-xs text-on-surface-variant font-medium">
          <span>
            Capacidad de respuesta regional: <strong className="font-bold text-on-surface">Desplegada al 78%</strong>
          </span>
          <div className="inline-flex items-center gap-1 font-bold text-secondary">
            <span>Desglose Provincial Activo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
