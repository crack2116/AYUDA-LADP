import { toValidationError } from "@/application/lib/validation";
import type { AuditCodeAllocator } from "@/application/ports/audit-code-allocator";
import type { IncidenciaRepository } from "@/application/ports/incidencia.repository";
import { fail, ok, type Result } from "@/application/result";
import type { Incidencia } from "@/domain/entities/incidencia";
import { toLimaDateKey } from "@/domain/lib/date";
import {
  createIncidenciaSchema,
  mapFormValuesToDraft,
  type IncidenciaFormValues,
} from "@/domain/schemas/incidencia.schema";

export interface CreateIncidenciaDeps {
  incidenciaRepository: IncidenciaRepository;
  auditCodeAllocator: AuditCodeAllocator;
  /** Injected clock keeps tests and server rendering deterministic. */
  now?: () => Date;
}

export interface CreateIncidenciaInput {
  values: IncidenciaFormValues;
  creadoPor: string;
}

export class CreateIncidenciaUseCase {
  private readonly deps: CreateIncidenciaDeps;

  constructor(deps: CreateIncidenciaDeps) {
    this.deps = deps;
  }

  async execute({ values, creadoPor }: CreateIncidenciaInput): Promise<Result<Incidencia>> {
    const now = this.deps.now ? this.deps.now() : new Date();
    const schema = createIncidenciaSchema({ today: toLimaDateKey(now) });
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      return fail(toValidationError(parsed.error));
    }

    if (creadoPor.trim().length === 0) {
      return fail({
        code: "validation_error",
        message: "No se pudo identificar al usuario que registra el reporte.",
        fieldErrors: { creadoPor: "La sesión no tiene un usuario válido." },
      });
    }

    const draft = mapFormValuesToDraft(parsed.data, creadoPor);
    const codigoAuditoria = await this.deps.auditCodeAllocator.next(now);

    const incidencia = await this.deps.incidenciaRepository.create(draft, {
      codigoAuditoria,
      creadoPor,
      createdAt: now.toISOString(),
    });

    return ok(incidencia);
  }
}
