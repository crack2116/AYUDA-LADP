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
