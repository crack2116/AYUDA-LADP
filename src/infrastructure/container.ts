import type { AuditCodeAllocator } from "@/application/ports/audit-code-allocator";
import type { AuthRepository } from "@/application/ports/auth.repository";
import type { CentroPobladoRepository } from "@/application/ports/centro-poblado.repository";
import type { CsvExporter } from "@/application/ports/csv-exporter";
import type { GpsService } from "@/application/ports/gps.service";
import type { IncidenciaRepository } from "@/application/ports/incidencia.repository";
import type { LocalCache } from "@/application/ports/local-cache";
import type { SupportTicketRepository } from "@/application/ports/support-ticket.repository";
import { CalculateJefaturaKpisUseCase } from "@/application/use-cases/calculate-jefatura-kpis.use-case";
import { CheckDuplicateIncidenciaUseCase } from "@/application/use-cases/check-duplicate-incidencia.use-case";
import { CreateIncidenciaUseCase } from "@/application/use-cases/create-incidencia.use-case";
import { CreateSupportTicketUseCase } from "@/application/use-cases/create-support-ticket.use-case";
import { ExportIncidenciasCsvUseCase } from "@/application/use-cases/export-incidencias-csv.use-case";
import { ListIncidenciasUseCase } from "@/application/use-cases/list-incidencias.use-case";
import { ListUsersUseCase } from "@/application/use-cases/list-users.use-case";
import { LoginUseCase } from "@/application/use-cases/login.use-case";
import { TacticalDraftsUseCase } from "@/application/use-cases/tactical-drafts.use-case";
import { ValidateIncidenciaExistenceUseCase } from "@/application/use-cases/validate-incidencia-existence.use-case";

import { LocalStorageCache } from "@/infrastructure/cache/local-storage-cache";
import { createCsvExporter } from "@/infrastructure/csv/csv.exporter";
import { BrowserGpsService } from "@/infrastructure/gps/browser-gps.service";
import { LocalAuditCodeAllocator } from "@/infrastructure/repositories/local-audit-code-allocator";
import { LocalAuthRepository } from "@/infrastructure/repositories/local-auth.repository";
import { LocalCentroPobladoRepository } from "@/infrastructure/repositories/local-centro-poblado.repository";
import { LocalIncidenciaRepository } from "@/infrastructure/repositories/local-incidencia.repository";
import { LocalSupportTicketRepository } from "@/infrastructure/repositories/local-support-ticket.repository";

export interface AppUseCases {
  createIncidencia: CreateIncidenciaUseCase;
  checkDuplicate: CheckDuplicateIncidenciaUseCase;
  validateExistence: ValidateIncidenciaExistenceUseCase;
  calculateKpis: CalculateJefaturaKpisUseCase;
  exportCsv: ExportIncidenciasCsvUseCase;
  createSupportTicket: CreateSupportTicketUseCase;
  login: LoginUseCase;
  listIncidencias: ListIncidenciasUseCase;
  listUsers: ListUsersUseCase;
  tacticalDrafts: TacticalDraftsUseCase;
}

export interface AppContainer {
  clock: () => Date;
  incidenciaRepository: IncidenciaRepository;
  centroPobladoRepository: CentroPobladoRepository;
  supportTicketRepository: SupportTicketRepository;
  authRepository: AuthRepository;
  auditCodeAllocator: AuditCodeAllocator;
  gpsService: GpsService;
  cache: LocalCache;
  csvExporter: CsvExporter;
  useCases: AppUseCases;
}

export interface CreateTestContainerOptions {
  /** A Date freezes the clock; a function is called on every read. */
  now?: Date | (() => Date);
}

function resolveClock(now?: Date | (() => Date)): () => Date {
  if (typeof now === "function") {
    return now;
  }
  if (now instanceof Date) {
    const fixed = now.getTime();
    return () => new Date(fixed);
  }
  return () => new Date();
}

function createContainer(clock: () => Date): AppContainer {
  const incidenciaRepository = new LocalIncidenciaRepository(clock);
  const centroPobladoRepository = new LocalCentroPobladoRepository(clock);
  const supportTicketRepository = new LocalSupportTicketRepository(clock);
  const authRepository = new LocalAuthRepository();
  const auditCodeAllocator = new LocalAuditCodeAllocator(clock);
  const gpsService = new BrowserGpsService();
  const cache = new LocalStorageCache();
  const csvExporter = createCsvExporter();

  const useCases: AppUseCases = {
    createIncidencia: new CreateIncidenciaUseCase({
      incidenciaRepository,
      auditCodeAllocator,
      now: clock,
    }),
    checkDuplicate: new CheckDuplicateIncidenciaUseCase({
      incidenciaRepository,
      centroPobladoRepository,
    }),
    validateExistence: new ValidateIncidenciaExistenceUseCase({
      incidenciaRepository,
    }),
    calculateKpis: new CalculateJefaturaKpisUseCase({
      incidenciaRepository,
    }),
    exportCsv: new ExportIncidenciasCsvUseCase({
      incidenciaRepository,
      centroPobladoRepository,
      csvExporter,
      now: clock,
    }),
    createSupportTicket: new CreateSupportTicketUseCase({
      supportTicketRepository,
      now: clock,
    }),
    login: new LoginUseCase({ authRepository }),
    listIncidencias: new ListIncidenciasUseCase({
      incidenciaRepository,
      centroPobladoRepository,
    }),
    listUsers: new ListUsersUseCase({ authRepository }),
    tacticalDrafts: new TacticalDraftsUseCase({
      cache,
      now: clock,
    }),
  };

  return {
    clock,
    incidenciaRepository,
    centroPobladoRepository,
    supportTicketRepository,
    authRepository,
    auditCodeAllocator,
    gpsService,
    cache,
    csvExporter,
    useCases,
  };
}

let sharedContainer: AppContainer | null = null;

/** Composition root memoized per browser tab. */
export function getContainer(): AppContainer {
  if (!sharedContainer) {
    sharedContainer = createContainer(() => new Date());
  }
  return sharedContainer;
}

/** Fresh adapters with a controllable clock for tests and demos. */
export function createTestContainer(options: CreateTestContainerOptions = {}): AppContainer {
  return createContainer(resolveClock(options.now));
}
