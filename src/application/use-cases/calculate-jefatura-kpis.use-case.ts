import type { IncidenciaRepository } from "@/application/ports/incidencia.repository";
import { ok, type Result } from "@/application/result";
import type { JefaturaKpis } from "@/domain/entities/kpis";
import { calculateJefaturaKpis } from "@/domain/services/kpi-calculator";

export interface CalculateJefaturaKpisDeps {
  incidenciaRepository: IncidenciaRepository;
}

export interface CalculateJefaturaKpisInput {
  now: Date;
}

export class CalculateJefaturaKpisUseCase {
  private readonly deps: CalculateJefaturaKpisDeps;

  constructor(deps: CalculateJefaturaKpisDeps) {
    this.deps = deps;
  }

  async execute({ now }: CalculateJefaturaKpisInput): Promise<Result<JefaturaKpis>> {
    const incidencias = await this.deps.incidenciaRepository.listAll();
    return ok(calculateJefaturaKpis(incidencias, now));
  }
}
