import type { CentroPobladoRepository } from "@/application/ports/centro-poblado.repository";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import { matchesCentroQuery } from "@/domain/entities/centro-poblado";

import { buildDemoDataset, ensureDemoSeed } from "@/infrastructure/seed/demo-data";
import { read, write } from "@/infrastructure/repositories/local-store";

const CENTROS_KEY = "centros";

export class LocalCentroPobladoRepository implements CentroPobladoRepository {
  private readonly clock: () => Date;

  constructor(clock: () => Date = () => new Date()) {
    this.clock = clock;
  }

  async listAll(): Promise<CentroPoblado[]> {
    ensureDemoSeed(this.clock());
    return read<CentroPoblado[]>(CENTROS_KEY, []);
  }

  async findById(id: string): Promise<CentroPoblado | null> {
    const centros = await this.listAll();
    return centros.find((centro) => centro.id === id) ?? null;
  }

  async listByCoordinator(userId: string): Promise<CentroPoblado[]> {
    const centros = await this.listAll();
    return centros.filter((centro) => centro.coordinadorZonaId === userId);
  }

  async search(query: string): Promise<CentroPoblado[]> {
    const centros = await this.listAll();
    return centros.filter((centro) => matchesCentroQuery(centro, query));
  }

  async reset(): Promise<void> {
    write(CENTROS_KEY, buildDemoDataset(this.clock()).centros);
  }
}
