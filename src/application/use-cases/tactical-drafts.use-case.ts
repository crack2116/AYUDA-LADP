import type { LocalCache } from "@/application/ports/local-cache";
import type {
  NecesidadPrincipal,
  TipoAfectacion,
} from "@/domain/entities/incidencia";
import { createId } from "@/domain/lib/id";

export type TacticalTransitability = "4x4" | "aerea" | "bloqueada" | "aislado";

export interface TacticalDraftInput {
  id?: string;
  centroPobladoId: string;
  tipoAfectacion: TipoAfectacion;
  necesidadPrincipal: NecesidadPrincipal;
  hogaresAfectados: number;
  ocurrioHoy: boolean;
  fechaSuceso: string;
  gpsCoords: string;
  notaReferencia: string;
  reportingChannel: string;
  transitability: TacticalTransitability;
  servicesAffected: string[];
}

export interface TacticalDraft extends TacticalDraftInput {
  id: string;
  savedAt: string;
}

export interface TacticalDraftsDeps {
  cache: LocalCache;
  now?: () => Date;
}

const DRAFTS_CACHE_KEY = "jefatura_tactical_drafts_v1";
const MAX_DRAFTS = 20;

function isValidDraft(candidate: unknown): candidate is TacticalDraft {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }
  const item = candidate as Partial<TacticalDraft>;
  return (
    typeof item.id === "string" &&
    typeof item.savedAt === "string" &&
    typeof item.centroPobladoId === "string" &&
    typeof item.tipoAfectacion === "string" &&
    typeof item.necesidadPrincipal === "string" &&
    typeof item.hogaresAfectados === "number" &&
    typeof item.ocurrioHoy === "boolean" &&
    typeof item.fechaSuceso === "string" &&
    typeof item.gpsCoords === "string" &&
    typeof item.notaReferencia === "string" &&
    typeof item.reportingChannel === "string"
  );
}

/**
 * Manages locally cached tactical incident drafts without faking server persistence.
 */
export class TacticalDraftsUseCase {
  private readonly deps: TacticalDraftsDeps;

  constructor(deps: TacticalDraftsDeps) {
    this.deps = deps;
  }

  listDrafts(): TacticalDraft[] {
    const raw = this.deps.cache.get<unknown>(DRAFTS_CACHE_KEY);
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter(isValidDraft);
  }

  saveDraft(input: TacticalDraftInput): { saved: TacticalDraft; drafts: TacticalDraft[] } {
    const existing = this.listDrafts();
    const id = input.id && input.id.trim().length > 0 ? input.id : createId();
    const savedAt = (this.deps.now ? this.deps.now() : new Date()).toISOString();

    const saved: TacticalDraft = {
      ...input,
      id,
      savedAt,
      servicesAffected: [...input.servicesAffected],
    };

    const next = [saved, ...existing.filter((item) => item.id !== id)].slice(0, MAX_DRAFTS);
    this.deps.cache.set(DRAFTS_CACHE_KEY, next);
    return { saved, drafts: next };
  }

  removeDraft(id: string): TacticalDraft[] {
    const next = this.listDrafts().filter((item) => item.id !== id);
    if (next.length === 0) {
      this.deps.cache.remove(DRAFTS_CACHE_KEY);
    } else {
      this.deps.cache.set(DRAFTS_CACHE_KEY, next);
    }
    return next;
  }
}
