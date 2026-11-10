"use client";

import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  House,
  ShieldCheck,
  TrendingUp,
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
        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Total Hogares Afectados
            </span>
            <span className="mt-1 text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
              {formatCount(kpis.totalHogaresAfectados)}
            </span>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-secondary">
            <House className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded bg-error-container px-2 py-0.5 text-[11px] font-black text-on-error-container">
            <TrendingUp className="h-3 w-3" /> +14.8%
          </span>
          <svg className="h-6 w-16 text-error" fill="none" viewBox="0 0 80 28" aria-hidden="true">
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
        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Estado de Validación
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
                {formatCount(kpis.incidenciasVerificadas)}
              </span>
              <span className="text-xs font-bold text-on-surface-variant">
                ({kpis.porcentajeVerificadas}%)
              </span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed/50 text-secondary">
            <ShieldCheck className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-tertiary-fixed"
            role="progressbar"
            aria-label="Porcentaje de incidencias validadas"
            aria-valuenow={kpis.porcentajeVerificadas}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, kpis.porcentajeVerificadas))}%` }}
            />
            <div
              className="h-full bg-tertiary-fixed-dim"
              style={{
                width: `${Math.max(0, 100 - Math.min(100, Math.max(0, kpis.porcentajeVerificadas)))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-secondary">{formatCount(kpis.incidenciasVerificadas)} Validados</span>
            <span className="text-on-tertiary-container">
              {formatCount(kpis.incidenciasPendientes)} Pendientes
            </span>
          </div>
        </div>
      </article>

      {/* KPI 3: Centros Poblados Afectados */}
      <article
        data-testid="kpi-centros"
        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Centros Poblados Afectados
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
                {formatCount(kpis.centrosPobladosAfectados)}
              </span>
              <span className="text-xs font-bold text-on-surface-variant">localidades</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-secondary">
            <Building2 className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded bg-tertiary-fixed/60 px-2 py-0.5 text-[11px] font-black text-on-tertiary-container">
            Alerta Crítica
          </span>
          <div className="flex items-end gap-1 h-5" aria-hidden="true">
            <div className="h-2 w-1 rounded-sm bg-surface-container-high" />
            <div className="h-3 w-1 rounded-sm bg-surface-container-high" />
            <div className="h-4 w-1 rounded-sm bg-secondary-fixed-dim" />
            <div className="h-5 w-1 rounded-sm bg-secondary" />
            <div className="h-5 w-1 rounded-sm bg-error" />
          </div>
        </div>
      </article>

      {/* KPI 4: Reportes Ingresados Hoy */}
      <article
        data-testid="kpi-ultimas-24h"
        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Reportes Hoy (24h)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
                {formatCount(kpis.reportesUltimas24h)}
              </span>
              <span className="text-xs font-bold text-on-surface-variant">recientes</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
            <Clock className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5 text-[11px] font-black text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> +18 en 1h
          </span>
          <svg className="h-5 w-16 text-secondary" fill="none" viewBox="0 0 80 24" aria-hidden="true">
            <path
              d="M2 18 L16 14 L30 19 L44 9 L58 13 L78 3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      </article>

      {/* KPI 5: Necesidad Principal Crítica */}
      <article
        data-testid="kpi-necesidad"
        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Necesidad Crítica
            </span>
            <p className="mt-1 truncate text-base font-black text-on-surface sm:text-lg">
              {kpis.necesidadPrincipalCritica.label}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Activity className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant">
            {kpis.necesidadPrincipalCritica.count > 0
              ? `${formatCount(kpis.necesidadPrincipalCritica.count)} reportes`
              : "Sin reportes"}
          </span>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
            Prioridad 1
          </span>
        </div>
      </article>

      {/* KPI 6: Tipo de Afectación Predominante */}
      <article
        data-testid="kpi-tipo"
        className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Afectación Mayor
            </span>
            <p className="mt-1 truncate text-base font-black text-on-surface sm:text-lg">
              {kpis.tipoAfectacionPredominante.label}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <AlertTriangle className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant">
            {kpis.tipoAfectacionPredominante.count > 0
              ? `${formatCount(kpis.tipoAfectacionPredominante.count)} reportes`
              : "Sin reportes"}
          </span>
          <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-900">
            Vector Activo
          </span>
        </div>
      </article>
    </div>
  );
}
