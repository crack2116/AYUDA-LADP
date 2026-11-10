import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import type { Incidencia, IncidenciaDraft } from "@/domain/entities/incidencia";

export interface IncidenciaCreateMeta {
  codigoAuditoria: string;
  creadoPor: string;
  createdAt: string;
}

export interface IncidenciaRepository {
  create(draft: IncidenciaDraft, meta: IncidenciaCreateMeta): Promise<Incidencia>;
  listAll(): Promise<Incidencia[]>;
  findByCentroPoblado(centroPobladoId: string): Promise<Incidencia[]>;
  findById(id: string): Promise<Incidencia | null>;
  markVerified(id: string): Promise<Incidencia | null>;
  reset(): Promise<void>;
}

export interface IncidenciaConCentro {
  incidencia: Incidencia;
  centroPoblado: CentroPoblado;
}
