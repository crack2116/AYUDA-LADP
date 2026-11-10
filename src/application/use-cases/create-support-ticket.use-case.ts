import { toValidationError } from "@/application/lib/validation";
import type { SupportTicketRepository } from "@/application/ports/support-ticket.repository";
import { fail, ok, type Result } from "@/application/result";
import type { SupportTicket } from "@/domain/entities/support-ticket";
import { createId } from "@/domain/lib/id";
import { supportTicketSchema } from "@/domain/schemas/support-ticket.schema";

export interface CreateSupportTicketDeps {
  supportTicketRepository: SupportTicketRepository;
  now?: () => Date;
}

export interface CreateSupportTicketInput {
  /** Validated by the schema; typed as string so QA tools can inject bad values. */
  opcionProblema: string;
  detalleOpcional?: string | null;
  rutaOrigen: string;
  usuarioId?: string | null;
}

export class CreateSupportTicketUseCase {
  private readonly deps: CreateSupportTicketDeps;

  constructor(deps: CreateSupportTicketDeps) {
    this.deps = deps;
  }

  async execute(input: CreateSupportTicketInput): Promise<Result<SupportTicket>> {
    const parsed = supportTicketSchema.safeParse({
      opcionProblema: input.opcionProblema,
      detalleOpcional: input.detalleOpcional ?? null,
      rutaOrigen: input.rutaOrigen,
    });

    if (!parsed.success) {
      return fail(toValidationError(parsed.error));
    }

    const now = this.deps.now ? this.deps.now() : new Date();

    const ticket: SupportTicket = {
      id: createId(),
      usuarioId: input.usuarioId ?? null,
      opcionProblema: parsed.data.opcionProblema,
      detalleOpcional: parsed.data.detalleOpcional,
      rutaOrigen: parsed.data.rutaOrigen,
      createdAt: now.toISOString(),
    };

    const stored = await this.deps.supportTicketRepository.create(ticket);
    return ok(stored);
  }
}
