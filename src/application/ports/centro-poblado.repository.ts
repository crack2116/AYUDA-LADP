import type { CentroPoblado } from "@/domain/entities/centro-poblado";

export interface CentroPobladoRepository {
  listAll(): Promise<CentroPoblado[]>;
  findById(id: string): Promise<CentroPoblado | null>;
  listByCoordinator(userId: string): Promise<CentroPoblado[]>;
  search(query: string): Promise<CentroPoblado[]>;
  reset(): Promise<void>;
}
