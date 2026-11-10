import type { SupportTicket } from "@/domain/entities/support-ticket";

export interface SupportTicketRepository {
  create(ticket: SupportTicket): Promise<SupportTicket>;
  listAll(): Promise<SupportTicket[]>;
  reset(): Promise<void>;
}
