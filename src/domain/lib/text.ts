/**
 * Normalizes free text for accent- and case-insensitive comparisons.
 * "San José" -> "san jose"
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
