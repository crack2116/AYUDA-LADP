import type {
  IncidenciaCreateMeta,
  IncidenciaRepository,
} from "@/application/ports/incidencia.repository";
import type { Incidencia, IncidenciaDraft } from "@/domain/entities/incidencia";
import { createId } from "@/domain/lib/id";

import { buildDemoDataset, ensureDemoSeed } from "@/infrastructure/seed/demo-data";
import { read, write } from "@/infrastructure/repositories/local-store";

const INCIDENCIAS_KEY = "incidencias";

export class LocalIncidenciaRepository implements IncidenciaRepository {
  private readonly clock: () => Date;

  constructor(clock: () => Date = () => new Date()) {
    this.clock = clock;
  }

  async create(draft: IncidenciaDraft, meta: IncidenciaCreateMeta): Promise<Incidencia> {
    const incidencia: Incidencia = {
      ...draft,
      id: createId(),
      codigoAuditoria: meta.codigoAuditoria,
      creadoPor: meta.creadoPor,
      createdAt: meta.createdAt,
      verificado: false,
    };

    const items = await this.listAll();
    write(INCIDENCIAS_KEY, [incidencia, ...items]);
    return incidencia;
  }

  async listAll(): Promise<Incidencia[]> {
    ensureDemoSeed(this.clock());
    return read<Incidencia[]>(INCIDENCIAS_KEY, []);
  }

  async findByCentroPoblado(centroPobladoId: string): Promise<Incidencia[]> {
    const items = await this.listAll();
    return items.filter((incidencia) => incidencia.centroPobladoId === centroPobladoId);
  }

  async findById(id: string): Promise<Incidencia | null> {
    const items = await this.listAll();
    return items.find((incidencia) => incidencia.id === id) ?? null;
  }

  async markVerified(id: string): Promise<Incidencia | null> {
    const items = await this.listAll();
    let updated: Incidencia | null = null;
    const next = items.map((incidencia) => {
      if (incidencia.id !== id) {
        return incidencia;
      }
      updated = { ...incidencia, verificado: true };
      return updated;
    });

    if (!updated) {
      return null;
    }

    write(INCIDENCIAS_KEY, next);
    return updated;
  }

  async reset(): Promise<void> {
    write(INCIDENCIAS_KEY, buildDemoDataset(this.clock()).incidencias);
  }
}
