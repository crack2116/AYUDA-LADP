/**
 * Builds the human-readable audit code: INC-YYYY-NNNNN.
 * The sequence is allocated by a single atomic allocator.
 */
export function formatAuditCode(year: number, sequence: number): string {
  return `INC-${year}-${String(sequence).padStart(5, "0")}`;
}
