import type { UserRole } from "@/domain/entities/user";

const LIMA_TIME_ZONE = "America/Lima";

/** Landing route for each role after login. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "jefatura":
      return "/jefatura";
    case "coordinador":
      return "/coordinador";
    case "asistente":
    default:
      return "/incidencias/nuevo";
  }
}

const integerFormatter = new Intl.NumberFormat("es-PE");

/** Groups thousands with the Peruvian locale. */
export function formatCount(value: number): string {
  return integerFormatter.format(value);
}

/** Renders a YYYY-MM-DD key as DD/MM/YYYY without re-parsing time zones. */
export function formatDateKey(dateKey: string | null): string {
  if (!dateKey) {
    return "Sin fecha";
  }
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) {
    return dateKey;
  }
  return `${day}/${month}/${year}`;
}

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "set",
  "oct",
  "nov",
  "dic",
] as const;

const MONTHS_LONG = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Setiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

/** Compact label for a YYYY-MM-DD key, e.g. "10 nov 2026". */
export function formatShortDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !day || Number.isNaN(monthIndex) || !MONTHS_SHORT[monthIndex]) {
    return dateKey;
  }
  return `${Number(day)} ${MONTHS_SHORT[monthIndex]} ${year}`;
}

/** Long month label for a YYYY-MM key, e.g. "Noviembre 2026". */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || Number.isNaN(monthIndex) || !MONTHS_LONG[monthIndex]) {
    return monthKey;
  }
  return `${MONTHS_LONG[monthIndex]} ${year}`;
}

/**
 * Human label for the period covered by a set of YYYY-MM-DD keys.
 * One month renders as "Noviembre 2026"; several months render as a range.
 */
export function formatPeriodoLabel(dateKeys: readonly string[]): string {
  const months = [...new Set(dateKeys.map((key) => key.slice(0, 7)))].sort();
  const first = months[0];
  const last = months[months.length - 1];
  if (!first || !last) {
    return "Sin datos";
  }
  return first === last
    ? formatMonthKey(first)
    : `${formatMonthKey(first)} – ${formatMonthKey(last)}`;
}

/** Renders an ISO timestamp in America/Lima. */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: LIMA_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/** Single-line GPS reading such as "-5.19449, -80.62812 (±12m)". */
export function formatAccuracy(accuracy: number): string {
  return `Precisión ±${Math.round(accuracy)} m`;
}
