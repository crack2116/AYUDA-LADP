"use client";

import type { JefaturaKpis } from "@/domain/entities/kpis";
import { formatCount } from "@/presentation/lib/format";

interface JefaturaKpiCardsProps {
  kpis: JefaturaKpis;
}

const LABEL =
  "text-[10.5px] font-semibold uppercase leading-tight tracking-[0.08em] text-slate-400";
const SECONDARY_VALUE =
  "mt-2 text-[26px] font-bold leading-none tracking-tight text-brand-ink tabular-nums";
const CAPTION = "mt-1.5 text-[11px] font-medium text-slate-500";
const ROW = "flex items-baseline justify-between gap-4 py-2";
const ROW_LABEL = "text-[11.5px] font-medium text-slate-500";
const ROW_VALUE = "text-right text-[13px] font-bold text-brand-ink";

/**
 * National situation indicators.
 *
 * Deliberately asymmetric: one dominant figure (affected households), two
 * secondary counters and three reference values on a single surface, so the
 * eye knows where to start instead of scanning six identical cards.
 */
export function JefaturaKpiCards({ kpis }: JefaturaKpiCardsProps) {
  const totalIncidencias = kpis.incidenciasVerificadas + kpis.incidenciasPendientes;
  const { necesidadPrincipalCritica, tipoAfectacionPredominante } = kpis;

  return (
    <section
      aria-label="Indicadores de situación nacional"
      className="rounded-xl bg-white p-4 sm:p-5"
    >
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-12 xl:gap-6">
        <article data-testid="kpi-hogares" className="col-span-2 xl:col-span-4">
          <p className={LABEL}>Hogares afectados</p>
          <p className="mt-2 text-[46px] font-bold leading-none tracking-tight text-brand-ink tabular-nums sm:text-[52px]">
            {formatCount(kpis.totalHogaresAfectados)}
          </p>
          <p className="mt-2 text-[12px] font-medium text-slate-500">
            familias damnificadas
          </p>
        </article>

        <article
          data-testid="kpi-verificadas"
          className="xl:col-span-3 xl:border-l xl:border-slate-100 xl:pl-6"
        >
          <p className={LABEL}>Incidencias validadas</p>
          <p className={SECONDARY_VALUE}>
            {formatCount(kpis.incidenciasVerificadas)}
            <span className="ml-1.5 text-[12px] font-medium text-slate-400">
              de {formatCount(totalIncidencias)}
            </span>
          </p>
          <div
            className="mt-3 h-1 w-full max-w-[9rem] overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Porcentaje de incidencias validadas"
            aria-valuenow={kpis.porcentajeVerificadas}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-brand-positive"
              style={{
                width: `${Math.min(100, Math.max(0, kpis.porcentajeVerificadas))}%`,
              }}
            />
          </div>
          <p className={CAPTION}>{kpis.porcentajeVerificadas}% del total</p>
        </article>

        <article
          data-testid="kpi-centros"
          className="xl:col-span-2 xl:border-l xl:border-slate-100 xl:pl-6"
        >
          <p className={LABEL}>Centros poblados</p>
          <p className={SECONDARY_VALUE}>{formatCount(kpis.centrosPobladosAfectados)}</p>
          <p className={CAPTION}>localidades afectadas</p>
        </article>

        <dl
          className="col-span-2 divide-y divide-slate-100 border-t border-slate-100 pt-1 xl:col-span-3 xl:border-t-0 xl:border-l xl:border-slate-100 xl:pl-6 xl:pt-0"
          aria-label="Referencias operativas"
        >
          <div data-testid="kpi-ultimas-24h" className={ROW}>
            <dt className={ROW_LABEL}>Reportes últimas 24 h</dt>
            <dd className={`${ROW_VALUE} tabular-nums`}>
              {formatCount(kpis.reportesUltimas24h)}
            </dd>
          </div>

          <div data-testid="kpi-necesidad" className={ROW}>
            <dt className={ROW_LABEL}>Necesidad crítica</dt>
            <dd className={`${ROW_VALUE} max-w-[10rem] leading-snug`}>
              {necesidadPrincipalCritica.count > 0
                ? necesidadPrincipalCritica.label
                : "Sin reportes"}
            </dd>
          </div>

          <div data-testid="kpi-tipo" className={ROW}>
            <dt className={ROW_LABEL}>Afectación mayor</dt>
            <dd className={`${ROW_VALUE} max-w-[10rem] leading-snug`}>
              {tipoAfectacionPredominante.count > 0
                ? tipoAfectacionPredominante.label
                : "Sin datos"}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
