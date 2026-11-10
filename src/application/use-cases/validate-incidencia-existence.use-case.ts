import type { IncidenciaRepository } from "@/application/ports/incidencia.repository";
import { fail, ok, type Result } from "@/application/result";
import type { Incidencia } from "@/domain/entities/incidencia";
import type { UserProfile } from "@/domain/entities/user";
import { can } from "@/domain/permissions/rbac";

export interface ValidateIncidenciaExistenceDeps {
  incidenciaRepository: IncidenciaRepository;
}

export interface ValidateIncidenciaExistenceInput {
  incidenciaId: string;
  user: UserProfile;
}

export class ValidateIncidenciaExistenceUseCase {
  private readonly deps: ValidateIncidenciaExistenceDeps;

  constructor(deps: ValidateIncidenciaExistenceDeps) {
    this.deps = deps;
  }

  async execute({
    incidenciaId,
    user,
  }: ValidateIncidenciaExistenceInput): Promise<Result<Incidencia>> {
    if (!can(user, "incidencia:validate")) {
      return fail({
        code: "forbidden",
        message: "Tu rol no tiene permiso para validar la existencia de reportes.",
      });
    }

    const incidencia = await this.deps.incidenciaRepository.findById(incidenciaId);

    if (!incidencia) {
      return fail({
        code: "not_found",
        message: "El reporte solicitado no existe.",
      });
    }

    if (incidencia.verificado) {
      return ok(incidencia);
    }

    const updated = await this.deps.incidenciaRepository.markVerified(incidenciaId);

    if (!updated) {
      return fail({
        code: "not_found",
        message: "El reporte solicitado no existe.",
      });
    }

    return ok(updated);
  }
}
