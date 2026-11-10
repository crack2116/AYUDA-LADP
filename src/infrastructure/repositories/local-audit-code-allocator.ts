import type { AuditCodeAllocator } from "@/application/ports/audit-code-allocator";
import { formatAuditCode } from "@/domain/lib/audit-code";
import { toLimaYear } from "@/domain/lib/date";

import { ensureDemoSeed, type AuditSequenceSnapshot } from "@/infrastructure/seed/demo-data";
import { read, write } from "@/infrastructure/repositories/local-store";

const SEQUENCE_KEY = "audit-sequence";

/**
 * Local-first allocator backed by the store.
 * `next` has no awaits before its write, so 50 parallel calls cannot collide.
 * The year always comes from the Lima calendar to match the audit format.
 */
export class LocalAuditCodeAllocator implements AuditCodeAllocator {
  private readonly clock: () => Date;

  constructor(clock: () => Date = () => new Date()) {
    this.clock = clock;
  }

  async next(now: Date): Promise<string> {
    ensureDemoSeed(this.clock());

    const year = toLimaYear(now);
    const state = read<AuditSequenceSnapshot>(SEQUENCE_KEY, { year, last: 0 });
    const last = state.year === year ? state.last + 1 : 1;

    write(SEQUENCE_KEY, { year, last });
    return formatAuditCode(year, last);
  }
}
