import type { CentroPobladoRepository } from "@/application/ports/centro-poblado.repository";
import type {
  IncidenciaConCentro,
  IncidenciaRepository,
} from "@/application/ports/incidencia.repository";
import { ok, type Result } from "@/application/result";
import type { UserProfile } from "@/domain/entities/user";
import { can, isIncidenciaVisible } from "@/domain/permissions/rbac";

export interface ListIncidenciasDeps {
  incidenciaRepository: IncidenciaRepository;
  centroPobladoRepository: CentroPobladoRepository;
}

export interface ListIncidenciasInput {
  user: UserProfile;
}

export class ListIncidenciasUseCase {
  private readonly deps: ListIncidenciasDeps;

  constructor(deps: ListIncidenciasDeps) {
    this.deps = deps;
  }

  async execute({ user }: ListIncidenciasInput): Promise<Result<IncidenciaConCentro[]>> {
    if (!can(user, "incidencia:read")) {
      return ok([]);
    }

    const [incidencias, centros] = await Promise.all([
      this.deps.incidenciaRepository.listAll(),
      this.deps.centroPobladoRepository.listAll(),
    ]);
    const centrosById = new Map(centros.map((centro) => [centro.id, centro]));

    const visible: IncidenciaConCentro[] = [];
    for (const incidencia of incidencias) {
      if (!isIncidenciaVisible(user, incidencia, centros)) continue;
      const centroPoblado = centrosById.get(incidencia.centroPobladoId);
      if (!centroPoblado) continue;
      visible.push({ incidencia, centroPoblado });
    }

    visible.sort((left, right) => {
      const delta =
        Date.parse(right.incidencia.createdAt) - Date.parse(left.incidencia.createdAt);
      if (delta !== 0) return delta;
      return left.incidencia.codigoAuditoria < right.incidencia.codigoAuditoria ? -1 : 1;
    });

    return ok(visible);
  }
}
