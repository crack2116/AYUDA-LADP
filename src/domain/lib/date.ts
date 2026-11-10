const LIMA_TIME_ZONE = "America/Lima";

/**
 * Returns the calendar day in America/Lima as YYYY-MM-DD.
 * The app must never disagree with the field teams about "today".
 */
export function toLimaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns the year in America/Lima for audit code allocation.
 */
export function toLimaYear(date: Date): number {
  return Number(toLimaDateKey(date).slice(0, 4));
}
