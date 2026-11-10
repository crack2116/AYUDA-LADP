import { slugify } from "@/application/lib/slug";
import type { CentroPobladoRepository } from "@/application/ports/centro-poblado.repository";
import type { CsvExporter, CsvIncidenciaRow } from "@/application/ports/csv-exporter";
import type { IncidenciaRepository } from "@/application/ports/incidencia.repository";
import { fail, ok, type Result } from "@/application/result";
import type { UserProfile } from "@/domain/entities/user";
import { toLimaDateKey } from "@/domain/lib/date";
import { can, type Scope } from "@/domain/permissions/rbac";

export interface ExportIncidenciasCsvDeps {
  incidenciaRepository: IncidenciaRepository;
  centroPobladoRepository: CentroPobladoRepository;
  csvExporter: CsvExporter;
  /** Injected clock keeps the export filename deterministic. */
  now?: () => Date;
}

export interface ExportIncidenciasCsvInput {
  user: UserProfile;
  scope: Scope;
}

export interface ExportIncidenciasCsvResult {
  filename: string;
  csv: string;
  rowCount: number;
}

export class ExportIncidenciasCsvUseCase {
  private readonly deps: ExportIncidenciasCsvDeps;

  constructor(deps: ExportIncidenciasCsvDeps) {
    this.deps = deps;
  }

  async execute({
    user,
    scope,
  }: ExportIncidenciasCsvInput): Promise<Result<ExportIncidenciasCsvResult>> {
    if (!can(user, "incidencia:export")) {
      return fail({
        code: "forbidden",
        message: "Tu rol no tiene permiso para exportar incidencias.",
      });
    }

    const [incidencias, centros] = await Promise.all([
      this.deps.incidenciaRepository.listAll(),
      this.deps.centroPobladoRepository.listAll(),
    ]);
    const centrosById = new Map(centros.map((centro) => [centro.id, centro]));

    const rows: CsvIncidenciaRow[] = [];
    for (const incidencia of incidencias) {
      const centro = centrosById.get(incidencia.centroPobladoId);
      if (!centro) continue;
      if (!this.isInScope(scope, user, centro)) continue;

      rows.push({
        codigoAuditoria: incidencia.codigoAuditoria,
        centroPoblado: centro.nombre,
        sector: centro.sector,
        region: centro.region,
        tipoAfectacion: incidencia.tipoAfectacion,
        necesidadPrincipal: incidencia.necesidadPrincipal,
        hogaresAfectados: incidencia.hogaresAfectados,
        fechaSuceso: incidencia.fechaSuceso,
        verificado: incidencia.verificado,
        gpsCoords: incidencia.gpsCoords,
        creadoPor: incidencia.creadoPor,
        createdAt: incidencia.createdAt,
      });
    }

    const now = this.deps.now ? this.deps.now() : new Date();
    const filename = this.buildFilename(scope, toLimaDateKey(now));

    return ok({
      filename,
      csv: this.deps.csvExporter.buildIncidenciaCsv(rows),
      rowCount: rows.length,
    });
  }

  private isInScope(scope: Scope, user: UserProfile, centro: { id: string; region: string; coordinadorZonaId: string | null }): boolean {
    if (scope.kind === "national") {
      return true;
    }
    if (scope.centroPobladoIds.includes(centro.id)) {
      return true;
    }
    if (centro.coordinadorZonaId === user.id) {
      return true;
    }
    return scope.region.length > 0 && centro.region === scope.region;
  }

  private buildFilename(scope: Scope, dateKey: string): string {
    if (scope.kind === "national") {
      return `incidencias-nacional-${dateKey}.csv`;
    }
    const regionSlug = slugify(scope.region) || "area";
    return `incidencias-${regionSlug}-${dateKey}.csv`;
  }
}
