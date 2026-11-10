/**
 * Allocates the next INC-YYYY-NNNNN audit code.
 * Must be collision-free and monotonic for a given year.
 */
export interface AuditCodeAllocator {
  next(now: Date): Promise<string>;
}
