import type { Incidencia, NecesidadPrincipal, TipoAfectacion } from "@/domain/entities/incidencia";
import {
  labelForNecesidad,
  labelForTipoAfectacion,
} from "@/domain/entities/incidencia";
import type { JefaturaKpis, KpiBreakdown } from "@/domain/entities/kpis";

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_LABEL = "Sin datos";

function buildBreakdown<TValue extends string>(
  values: readonly TValue[],
  labelFor: (value: TValue) => string,
): KpiBreakdown<TValue> {
  if (values.length === 0) {
    return { value: null, label: EMPTY_LABEL, count: 0 };
  }

  const counts = new Map<TValue, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((left, right) => {
    const countDelta = right[1] - left[1];
    if (countDelta !== 0) {
      return countDelta;
    }
    const leftLabel = labelFor(left[0]);
    const rightLabel = labelFor(right[0]);
    if (leftLabel < rightLabel) return -1;
    if (leftLabel > rightLabel) return 1;
    return 0;
  });

  const winner = ranked[0];
  if (!winner) {
    return { value: null, label: EMPTY_LABEL, count: 0 };
  }
  return { value: winner[0], label: labelFor(winner[0]), count: winner[1] };
}

/**
 * Computes the six national KPIs for Jefatura.
 * Ties are broken by label alphabetically so the dashboard never flickers.
 */
export function calculateJefaturaKpis(
  incidencias: readonly Incidencia[],
  now: Date,
): JefaturaKpis {
  const total = incidencias.length;
  const verificadas = incidencias.filter((incidencia) => incidencia.verificado);
  const pendientes = total - verificadas.length;

  const totalHogaresAfectados = incidencias.reduce(
    (sum, incidencia) => sum + incidencia.hogaresAfectados,
    0,
  );

  const nowMs = now.getTime();
  const windowStart = nowMs - DAY_MS;
  const reportesUltimas24h = incidencias.filter((incidencia) => {
    const createdAtMs = Date.parse(incidencia.createdAt);
    return !Number.isNaN(createdAtMs) && createdAtMs >= windowStart && createdAtMs <= nowMs;
  }).length;

  return {
    totalHogaresAfectados,
    incidenciasVerificadas: verificadas.length,
    incidenciasPendientes: pendientes,
    porcentajeVerificadas: total === 0 ? 0 : Math.round((verificadas.length / total) * 1000) / 10,
    centrosPobladosAfectados: new Set(
      incidencias.map((incidencia) => incidencia.centroPobladoId),
    ).size,
    necesidadPrincipalCritica: buildBreakdown<NecesidadPrincipal>(
      incidencias.map((incidencia) => incidencia.necesidadPrincipal),
      labelForNecesidad,
    ),
    tipoAfectacionPredominante: buildBreakdown<TipoAfectacion>(
      incidencias.map((incidencia) => incidencia.tipoAfectacion),
      labelForTipoAfectacion,
    ),
    reportesUltimas24h,
  };
}
