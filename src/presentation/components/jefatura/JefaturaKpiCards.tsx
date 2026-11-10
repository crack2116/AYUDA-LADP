"use client";

import {
  AlertTriangle,
  Building2,
  Clock,
  House,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";

import type { JefaturaKpis } from "@/domain/entities/kpis";
import { formatCount } from "@/presentation/lib/format";

interface JefaturaKpiCardsProps {
  kpis: JefaturaKpis;
}

export function JefaturaKpiCards({ kpis }: JefaturaKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* KPI 1: Hogares Afectados */}
      <article
        data-testid="kpi-hogares"
        className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_4px_18px_-4px_rgba(12,45,110,0.06)] border border-slate-200/80 transition-all hover:shadow-md hover:border-slate-300/80"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Total Hogares Afectados
            </span>
            <span className="mt-1.5 text-2xl font-black tracking-tight text-[#071938] sm:text-[28px] leading-none">
              {formatCount(kpis.totalHogaresAfectados)}
            </span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0d428e] ring-1 ring-blue-100">
            <House className="h-4 w-4" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 text-[11px] font-black text-rose-600">
            <TrendingUp className="h-3 w-3" /> +14.8%
          </span>
          <svg className="h-6 w-16 text-rose-500" fill="none" viewBox="0 0 80 28" aria-hidden="true">
            <path
              d="M2 24 C 18 20, 24 22, 38 14 C 48 8, 62 10, 78 3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <circle cx="78" cy="3" fill="currentColor" r="2.5" />
          </svg>
        </div>
      </article>

      {/* KPI 2: Estado de Validación */}
      <article
        data-testid="kpi-verificadas"
        className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_4px_18px_-4px_rgba(12,45,110,0.06)] border border-slate-200/80 transition-all hover:shadow-md hover:border-slate-300/80"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Estado de Validación
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#071938] sm:text-[28px] leading-none">
                {formatCount(kpis.incidenciasVerificadas)}
              </span>
              <span className="text-xs font-bold text-slate-500">
                ({kpis.porcentajeVerificadas}%)
              </span>
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[#0d428e] ring-1 ring-sky-100">
            <ShieldCheck className="h-4 w-4" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-black text-emerald-700">
              ↑ {kpis.porcentajeVerificadas}% ok
            </span>
            <svg className="h-4 w-14 text-[#1d5db6]" fill="none" viewBox="0 0 80 24" aria-hidden="true">
              <path
                d="M2 18 L18 14 L32 16 L48 8 L64 11 L78 3"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div
            className="flex h-1.5 w-full overflow-hidden rounded-full bg-amber-100"
            role="progressbar"
            aria-label="Porcentaje de incidencias validadas"
            aria-valuenow={kpis.porcentajeVerificadas}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#0d428e] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, kpis.porcentajeVerificadas))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-[#0d428e]">{formatCount(kpis.incidenciasVerificadas)} Validados</span>
            <span className="text-amber-700">{formatCount(kpis.incidenciasPendientes)} Pendientes</span>
          </div>
        </div>
      </article>

      {/* KPI 3: Centros Poblados Afectados */}
      <article
        data-testid="kpi-centros"
        className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_4px_18px_-4px_rgba(12,45,110,0.06)] border border-slate-200/80 transition-all hover:shadow-md hover:border-slate-300/80"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Centros Poblados
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#071938] sm:text-[28px] leading-none">
                {formatCount(kpis.centrosPobladosAfectados)}
              </span>
              <span className="text-[11px] font-bold text-slate-500">localidades</span>
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#0d428e] ring-1 ring-indigo-100">
            <Building2 className="h-4 w-4" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 text-[10px] font-black text-amber-700">
            → Alerta Crítica
          </span>
          <div className="flex items-end gap-1 h-5" aria-hidden="true">
            <div className="h-2 w-1.5 rounded-xs bg-amber-200" />
            <div className="h-3 w-1.5 rounded-xs bg-amber-300" />
            <div className="h-3.5 w-1.5 rounded-xs bg-amber-400" />
            <div className="h-4.5 w-1.5 rounded-xs bg-amber-500" />
            <div className="h-5 w-1.5 rounded-xs bg-orange-600" />
          </div>
        </div>
      </article>

      {/* KPI 4: Reportes Ingresados Hoy */}
      <article
        data-testid="kpi-ultimas-24h"
        className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_4px_18px_-4px_rgba(12,45,110,0.06)] border border-slate-200/80 transition-all hover:shadow-md hover:border-slate-300/80"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Reportes Hoy (24h)
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#071938] sm:text-[28px] leading-none">
                {formatCount(kpis.reportesUltimas24h)}
              </span>
              <span className="text-[11px] font-bold text-slate-500">recientes</span>
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0d428e] ring-1 ring-blue-100">
            <Clock className="h-4 w-4" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200/70 px-2.5 py-0.5 text-[10px] font-black text-sky-700">
            ↑ +50% · 1h
          </span>
          <svg className="h-5 w-16 text-[#1d5db6]" fill="none" viewBox="0 0 80 24" aria-hidden="true">
            <path
              d="M2 18 L16 14 L30 19 L44 9 L58 13 L78 3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </article>

      {/* KPI 5: Necesidad Principal Crítica */}
      <article
        data-testid="kpi-necesidad"
        className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_4px_18px_-4px_rgba(12,45,110,0.06)] border border-slate-200/80 transition-all hover:shadow-md hover:border-slate-300/80"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Necesidad Crítica
            </span>
            <p className="mt-1.5 truncate text-base font-black text-[#071938] sm:text-lg leading-snug">
              {kpis.necesidadPrincipalCritica.label}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
            <Zap className="h-4 w-4" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 text-[10px] font-black text-indigo-700">
            {kpis.necesidadPrincipalCritica.count > 0
              ? `↑ ${formatCount(kpis.necesidadPrincipalCritica.count)} rep.`
              : "0 rep."}
          </span>
          <span className="rounded-full bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
            Prioridad 1
          </span>
        </div>
      </article>

      {/* KPI 6: Tipo de Afectación Predominante */}
      <article
        data-testid="kpi-tipo"
        className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_4px_18px_-4px_rgba(12,45,110,0.06)] border border-slate-200/80 transition-all hover:shadow-md hover:border-slate-300/80"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Afectación Mayor
            </span>
            <p className="mt-1.5 truncate text-base font-black text-[#071938] sm:text-lg leading-snug">
              {kpis.tipoAfectacionPredominante.label}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200/60">
            <AlertTriangle className="h-4 w-4" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-2">
          <span className="text-xs font-bold text-slate-600">
            {kpis.tipoAfectacionPredominante.count > 0
              ? `${formatCount(kpis.tipoAfectacionPredominante.count)} reportes`
              : "Sin reportes"}
          </span>
          <span className="rounded-full bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-700">
            Vector Activo
          </span>
        </div>
      </article>
    </div>
  );
}
