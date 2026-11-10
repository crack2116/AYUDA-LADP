import type { Incidencia } from "@/domain/entities/incidencia";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the reports created inside the duplicate window, boundary inclusive.
 * Future timestamps are ignored so a skewed clock never triggers a false warning.
 */
export function incidenciasWithinWindow(
  incidencias: readonly Incidencia[],
  now: Date,
  windowDays: number,
): Incidencia[] {
  const nowMs = now.getTime();
  const windowStart = nowMs - windowDays * DAY_MS;

  return incidencias.filter((incidencia) => {
    const createdAtMs = Date.parse(incidencia.createdAt);
    return (
      !Number.isNaN(createdAtMs) && createdAtMs >= windowStart && createdAtMs <= nowMs
    );
  });
}
