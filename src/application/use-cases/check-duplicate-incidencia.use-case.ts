import type { CentroPobladoRepository } from "@/application/ports/centro-poblado.repository";
import type { IncidenciaRepository } from "@/application/ports/incidencia.repository";
import { fail, ok, type Result } from "@/application/result";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import { incidenciasWithinWindow } from "@/domain/services/duplicate-window";

export interface CheckDuplicateIncidenciaDeps {
  incidenciaRepository: IncidenciaRepository;
  centroPobladoRepository: CentroPobladoRepository;
  duplicateWindowDays?: number;
}

export interface CheckDuplicateIncidenciaInput {
  centroPobladoId: string;
  now: Date;
}

export interface DuplicateCheckResult {
  centroPoblado: CentroPoblado;
  hasPreviousReports: boolean;
  count: number;
  codes: string[];
  windowDays: number;
}

const DEFAULT_WINDOW_DAYS = 7;

export class CheckDuplicateIncidenciaUseCase {
  private readonly deps: CheckDuplicateIncidenciaDeps;

  constructor(deps: CheckDuplicateIncidenciaDeps) {
    this.deps = deps;
  }

  async execute({
    centroPobladoId,
    now,
  }: CheckDuplicateIncidenciaInput): Promise<Result<DuplicateCheckResult>> {
    const centroPoblado = await this.deps.centroPobladoRepository.findById(centroPobladoId);

    if (!centroPoblado) {
      return fail({
        code: "not_found",
        message: "El centro poblado seleccionado no existe.",
      });
    }

    const windowDays = this.deps.duplicateWindowDays ?? DEFAULT_WINDOW_DAYS;
    const reports = await this.deps.incidenciaRepository.findByCentroPoblado(centroPobladoId);
    const recent = incidenciasWithinWindow(reports, now, windowDays);

    const codes = [...recent]
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((incidencia) => incidencia.codigoAuditoria);

    return ok({
      centroPoblado,
      hasPreviousReports: codes.length > 0,
      count: codes.length,
      codes,
      windowDays,
    });
  }
}
