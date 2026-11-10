import type { SupportTicketRepository } from "@/application/ports/support-ticket.repository";
import type { SupportTicket } from "@/domain/entities/support-ticket";

import { ensureDemoSeed } from "@/infrastructure/seed/demo-data";
import { read, write } from "@/infrastructure/repositories/local-store";

const TICKETS_KEY = "tickets";

export class LocalSupportTicketRepository implements SupportTicketRepository {
  private readonly clock: () => Date;

  constructor(clock: () => Date = () => new Date()) {
    this.clock = clock;
  }

  async create(ticket: SupportTicket): Promise<SupportTicket> {
    const tickets = await this.listAll();
    write(TICKETS_KEY, [ticket, ...tickets]);
    return ticket;
  }

  async listAll(): Promise<SupportTicket[]> {
    ensureDemoSeed(this.clock());
    return read<SupportTicket[]>(TICKETS_KEY, []);
  }

  async reset(): Promise<void> {
    write(TICKETS_KEY, []);
  }
}
