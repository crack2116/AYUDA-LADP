import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { toValidationError } from "@/application/lib/validation";
import { ok, type Result } from "@/application/result";
import type { AuditCodeAllocator } from "@/application/ports/audit-code-allocator";
import type { AuthRepository } from "@/application/ports/auth.repository";
import type { CentroPobladoRepository } from "@/application/ports/centro-poblado.repository";
import type { CsvExporter, CsvIncidenciaRow } from "@/application/ports/csv-exporter";
import type {
  IncidenciaCreateMeta,
  IncidenciaRepository,
} from "@/application/ports/incidencia.repository";
import type { LocalCache } from "@/application/ports/local-cache";
import type { SupportTicketRepository } from "@/application/ports/support-ticket.repository";
import { CheckDuplicateIncidenciaUseCase } from "@/application/use-cases/check-duplicate-incidencia.use-case";
import { CalculateJefaturaKpisUseCase } from "@/application/use-cases/calculate-jefatura-kpis.use-case";
import { CreateIncidenciaUseCase } from "@/application/use-cases/create-incidencia.use-case";
import { CreateSupportTicketUseCase } from "@/application/use-cases/create-support-ticket.use-case";
import { ExportIncidenciasCsvUseCase } from "@/application/use-cases/export-incidencias-csv.use-case";
import { ListIncidenciasUseCase } from "@/application/use-cases/list-incidencias.use-case";
import { ListUsersUseCase } from "@/application/use-cases/list-users.use-case";
import { LoginUseCase } from "@/application/use-cases/login.use-case";
import { TacticalDraftsUseCase } from "@/application/use-cases/tactical-drafts.use-case";
import { ValidateIncidenciaExistenceUseCase } from "@/application/use-cases/validate-incidencia-existence.use-case";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import type { Incidencia, IncidenciaDraft } from "@/domain/entities/incidencia";
import type { SupportTicket } from "@/domain/entities/support-ticket";
import type { UserProfile } from "@/domain/entities/user";
import type { LoginFormValues } from "@/domain/schemas/login.schema";
import { scopeForUser } from "@/domain/permissions/rbac";
import { LocalAuditCodeAllocator } from "@/infrastructure/repositories/local-audit-code-allocator";
import { ensureDemoSeed } from "@/infrastructure/seed/demo-data";
import { write } from "@/infrastructure/repositories/local-store";

const NOW = new Date("2026-11-10T15:00:00.000Z");
const TODAY = "2026-11-10";

class FakeIncidenciaRepository implements IncidenciaRepository {
  items: Incidencia[] = [];
  createCalls: Array<{ draft: IncidenciaDraft; meta: IncidenciaCreateMeta }> = [];
  markVerifiedCalls = 0;

  async create(draft: IncidenciaDraft, meta: IncidenciaCreateMeta): Promise<Incidencia> {
    const incidencia: Incidencia = {
      ...draft,
      ...meta,
      id: `inc-${this.items.length + 1}`,
      verificado: false,
    };
    this.items.push(incidencia);
    this.createCalls.push({ draft, meta });
    return incidencia;
  }

  async listAll(): Promise<Incidencia[]> {
    return [...this.items];
  }

  async findByCentroPoblado(centroPobladoId: string): Promise<Incidencia[]> {
    return this.items.filter((item) => item.centroPobladoId === centroPobladoId);
  }

  async findById(id: string): Promise<Incidencia | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async markVerified(id: string): Promise<Incidencia | null> {
    this.markVerifiedCalls += 1;
    const found = this.items.find((item) => item.id === id);
    if (!found) return null;
    found.verificado = true;
    return found;
  }

  async reset(): Promise<void> {
    this.items = [];
  }
}

class FakeCentroPobladoRepository implements CentroPobladoRepository {
  itemList: CentroPoblado[] = [];

  async listAll(): Promise<CentroPoblado[]> {
    return [...this.itemList];
  }

  async findById(id: string): Promise<CentroPoblado | null> {
    return this.itemList.find((item) => item.id === id) ?? null;
  }

  async listByCoordinator(userId: string): Promise<CentroPoblado[]> {
    return this.itemList.filter((item) => item.coordinadorZonaId === userId);
  }

  async search(query: string): Promise<CentroPoblado[]> {
    return this.itemList.filter((item) =>
      item.nombre.toLowerCase().includes(query.toLowerCase()),
    );
  }

  async reset(): Promise<void> {
    this.itemList = [];
  }
}

class FakeSupportTicketRepository implements SupportTicketRepository {
  items: SupportTicket[] = [];

  async create(ticket: SupportTicket): Promise<SupportTicket> {
    this.items.push(ticket);
    return ticket;
  }

  async listAll(): Promise<SupportTicket[]> {
    return [...this.items];
  }

  async reset(): Promise<void> {
    this.items = [];
  }
}

class RecordingCsvExporter implements CsvExporter {
  lastRows: CsvIncidenciaRow[] = [];

  buildIncidenciaCsv(rows: CsvIncidenciaRow[]): string {
    this.lastRows = rows;
    return "csv-content";
  }
}

const jefatura: UserProfile = {
  id: "user-jef-01",
  identificadorOficial: "JEF-001",
  nombre: "Maria Elena Quispe",
  rol: "jefatura",
  teatroOperacionesRegion: null,
  centroPobladoIds: [],
};

const coordinadorPiura: UserProfile = {
  id: "user-coo-pn-01",
  identificadorOficial: "COO-PN-01",
  nombre: "Rosa Herrera",
  rol: "coordinador",
  teatroOperacionesRegion: "Piura / Norte",
  centroPobladoIds: [],
};

const asistenteUno: UserProfile = {
  id: "user-asi-01",
  identificadorOficial: "ASI-PN-01",
  nombre: "Luis Paredes",
  rol: "asistente",
  teatroOperacionesRegion: "Piura / Norte",
  centroPobladoIds: ["c1"],
};

const asistenteDos: UserProfile = {
  id: "user-asi-02",
  identificadorOficial: "ASI-PN-02",
  nombre: "Elena Soto",
  rol: "asistente",
  teatroOperacionesRegion: "Piura / Norte",
  centroPobladoIds: ["c1"],
};

const centros: CentroPoblado[] = [
  {
    id: "c1",
    nombre: "Catacaos",
    sector: "Bajo Piura",
    region: "Piura / Norte",
    coordinadorZonaId: "user-coo-pn-01",
  },
  {
    id: "c2",
    nombre: "Chulucanas",
    sector: "Morropon",
    region: "Piura / Norte",
    coordinadorZonaId: null,
  },
  {
    id: "c3",
    nombre: "Ica",
    sector: "Ica",
    region: "Sur / Centro",
    coordinadorZonaId: "user-coo-sc-01",
  },
];

const makeIncidencia = (overrides: Partial<Incidencia> = {}): Incidencia => ({
  id: "inc-1",
  codigoAuditoria: "INC-2026-00001",
  centroPobladoId: "c1",
  tipoAfectacion: "inundacion",
  hogaresAfectados: 10,
  necesidadPrincipal: "agua_potable",
  ocurrioHoy: true,
  fechaSuceso: TODAY,
  gpsCoords: null,
  notaReferencia: null,
  verificado: false,
  creadoPor: "user-asi-01",
  createdAt: "2026-11-10T10:00:00.000Z",
  ...overrides,
});

const validValues = {
  centroPobladoId: "c1",
  tipoAfectacion: "inundacion" as const,
  hogaresAfectados: 18,
  necesidadPrincipal: "alimentos" as const,
  ocurrioHoy: true,
  fechaSuceso: TODAY,
  gpsCoords: "-5.19449, -80.62812 (±12m)",
  notaReferencia: "Familias en el colegio",
};

const makeAllocator = (): AuditCodeAllocator => {
  let sequence = 6;
  return {
    next: async () => {
      sequence += 1;
      return `INC-2026-${String(sequence).padStart(5, "0")}`;
    },
  };
};

const seedRepository = (): FakeIncidenciaRepository => {
  const repository = new FakeIncidenciaRepository();
  repository.items = [
    makeIncidencia({ id: "i1", centroPobladoId: "c1", creadoPor: "user-asi-01" }),
    makeIncidencia({
      id: "i2",
      codigoAuditoria: "INC-2026-00002",
      centroPobladoId: "c1",
      creadoPor: "user-asi-02",
    }),
    makeIncidencia({
      id: "i3",
      codigoAuditoria: "INC-2026-00003",
      centroPobladoId: "c2",
      creadoPor: "user-asi-01",
    }),
    makeIncidencia({
      id: "i4",
      codigoAuditoria: "INC-2026-00004",
      centroPobladoId: "c3",
      creadoPor: "user-asi-03",
      tipoAfectacion: "huaico",
    }),
  ];
  return repository;
};

const seedCentros = (): FakeCentroPobladoRepository => {
  const repository = new FakeCentroPobladoRepository();
  repository.itemList = [...centros];
  return repository;
};

describe("CreateIncidenciaUseCase", () => {
  it("persists a valid report with an allocated audit code", async () => {
    const repository = new FakeIncidenciaRepository();
    const allocator = makeAllocator();
    const useCase = new CreateIncidenciaUseCase({
      incidenciaRepository: repository,
      auditCodeAllocator: allocator,
      now: () => NOW,
    });

    const result = await useCase.execute({ values: validValues, creadoPor: "user-asi-01" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.codigoAuditoria).toBe("INC-2026-00007");
    expect(result.value.createdAt).toBe(NOW.toISOString());
    expect(result.value.creadoPor).toBe("user-asi-01");
    expect(result.value.hogaresAfectados).toBe(18);
    expect(repository.createCalls).toHaveLength(1);
  });

  it("never persists invalid data and returns field errors", async () => {
    const repository = new FakeIncidenciaRepository();
    const useCase = new CreateIncidenciaUseCase({
      incidenciaRepository: repository,
      auditCodeAllocator: makeAllocator(),
      now: () => NOW,
    });

    const result = await useCase.execute({
      values: { ...validValues, hogaresAfectados: 1.5 },
      creadoPor: "user-asi-01",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_error");
    expect(result.error.fieldErrors?.hogaresAfectados).toBeTruthy();
    expect(repository.createCalls).toHaveLength(0);
  });

  it("rejects a missing author after schema validation", async () => {
    const repository = new FakeIncidenciaRepository();
    const useCase = new CreateIncidenciaUseCase({
      incidenciaRepository: repository,
      auditCodeAllocator: makeAllocator(),
      now: () => NOW,
    });

    const result = await useCase.execute({ values: validValues, creadoPor: "   " });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_error");
    expect(result.error.fieldErrors?.creadoPor).toBeTruthy();
    expect(repository.createCalls).toHaveLength(0);
  });

  it("rejects a future date without touching the allocator", async () => {
    const repository = new FakeIncidenciaRepository();
    const allocator = { next: vi.fn(async () => "INC-2026-00099") };
    const useCase = new CreateIncidenciaUseCase({
      incidenciaRepository: repository,
      auditCodeAllocator: allocator,
      now: () => NOW,
    });

    const result = await useCase.execute({
      values: { ...validValues, ocurrioHoy: false, fechaSuceso: "2026-11-11" },
      creadoPor: "user-asi-01",
    });

    expect(result.ok).toBe(false);
    expect(allocator.next).not.toHaveBeenCalled();
    expect(repository.createCalls).toHaveLength(0);
  });
});

describe("CheckDuplicateIncidenciaUseCase", () => {
  it("counts reports inside the seven day window and lists their codes", async () => {
    const repository = new FakeIncidenciaRepository();
    repository.items = [
      makeIncidencia({
        id: "recent",
        codigoAuditoria: "INC-2026-00020",
        createdAt: "2026-11-09T12:00:00.000Z",
      }),
      makeIncidencia({
        id: "boundary",
        codigoAuditoria: "INC-2026-00021",
        createdAt: "2026-11-03T15:00:00.000Z",
      }),
      makeIncidencia({
        id: "old",
        codigoAuditoria: "INC-2026-00022",
        createdAt: "2026-11-01T12:00:00.000Z",
      }),
    ];
    const useCase = new CheckDuplicateIncidenciaUseCase({
      incidenciaRepository: repository,
      centroPobladoRepository: seedCentros(),
    });

    const result = await useCase.execute({ centroPobladoId: "c1", now: NOW });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasPreviousReports).toBe(true);
    expect(result.value.count).toBe(2);
    expect(result.value.codes).toEqual(["INC-2026-00020", "INC-2026-00021"]);
    expect(result.value.windowDays).toBe(7);
    expect(result.value.centroPoblado.nombre).toBe("Catacaos");
  });

  it("returns a clean state when there is no recent report", async () => {
    const useCase = new CheckDuplicateIncidenciaUseCase({
      incidenciaRepository: new FakeIncidenciaRepository(),
      centroPobladoRepository: seedCentros(),
    });

    const result = await useCase.execute({ centroPobladoId: "c1", now: NOW });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hasPreviousReports).toBe(false);
    expect(result.value.count).toBe(0);
    expect(result.value.codes).toEqual([]);
  });

  it("fails with not_found for an unknown centro poblado", async () => {
    const useCase = new CheckDuplicateIncidenciaUseCase({
      incidenciaRepository: new FakeIncidenciaRepository(),
      centroPobladoRepository: seedCentros(),
    });

    const result = await useCase.execute({ centroPobladoId: "missing", now: NOW });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("not_found");
  });

  it("supports a custom window", async () => {
    const repository = new FakeIncidenciaRepository();
    repository.items = [
      makeIncidencia({ createdAt: "2026-11-07T15:00:00.000Z" }),
      makeIncidencia({
        id: "older",
        createdAt: "2026-11-04T12:00:00.000Z",
      }),
    ];
    const useCase = new CheckDuplicateIncidenciaUseCase({
      incidenciaRepository: repository,
      centroPobladoRepository: seedCentros(),
      duplicateWindowDays: 3,
    });

    const result = await useCase.execute({ centroPobladoId: "c1", now: NOW });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.count).toBe(1);
  });
});

describe("ValidateIncidenciaExistenceUseCase", () => {
  it("marks a report as verified for jefatura", async () => {
    const repository = seedRepository();
    const useCase = new ValidateIncidenciaExistenceUseCase({
      incidenciaRepository: repository,
    });

    const result = await useCase.execute({ incidenciaId: "i1", user: jefatura });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.verificado).toBe(true);
  });

  it("is idempotent for an already verified report", async () => {
    const repository = seedRepository();
    const useCase = new ValidateIncidenciaExistenceUseCase({
      incidenciaRepository: repository,
    });

    const first = await useCase.execute({ incidenciaId: "i1", user: jefatura });
    const second = await useCase.execute({ incidenciaId: "i1", user: jefatura });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.verificado).toBe(true);
  });

  it("forbids an asistente from validating", async () => {
    const repository = seedRepository();
    const useCase = new ValidateIncidenciaExistenceUseCase({
      incidenciaRepository: repository,
    });

    const result = await useCase.execute({ incidenciaId: "i1", user: asistenteUno });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("forbidden");
    expect(repository.markVerifiedCalls).toBe(0);
  });

  it("returns not_found for an unknown report", async () => {
    const useCase = new ValidateIncidenciaExistenceUseCase({
      incidenciaRepository: seedRepository(),
    });

    const result = await useCase.execute({ incidenciaId: "missing", user: coordinadorPiura });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("not_found");
  });
});

describe("CalculateJefaturaKpisUseCase", () => {
  it("calculates the national KPIs", async () => {
    const useCase = new CalculateJefaturaKpisUseCase({
      incidenciaRepository: seedRepository(),
    });

    const result = await useCase.execute({ now: NOW });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.centrosPobladosAfectados).toBe(3);
    expect(result.value.reportesUltimas24h).toBe(4);
    expect(result.value.totalHogaresAfectados).toBe(40);
  });
});

describe("ExportIncidenciasCsvUseCase", () => {
  it("exports the national dataset for jefatura", async () => {
    const exporter = new RecordingCsvExporter();
    const useCase = new ExportIncidenciasCsvUseCase({
      incidenciaRepository: seedRepository(),
      centroPobladoRepository: seedCentros(),
      csvExporter: exporter,
      now: () => NOW,
    });

    const result = await useCase.execute({ user: jefatura, scope: scopeForUser(jefatura) });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe("incidencias-nacional-2026-11-10.csv");
    expect(result.value.rowCount).toBe(4);
    expect(result.value.csv).toBe("csv-content");
    expect(exporter.lastRows[0]?.centroPoblado).toBe("Catacaos");
  });

  it("exports only the coordinator area with a slugged filename", async () => {
    const exporter = new RecordingCsvExporter();
    const useCase = new ExportIncidenciasCsvUseCase({
      incidenciaRepository: seedRepository(),
      centroPobladoRepository: seedCentros(),
      csvExporter: exporter,
      now: () => NOW,
    });

    const result = await useCase.execute({
      user: coordinadorPiura,
      scope: scopeForUser(coordinadorPiura),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe("incidencias-piura-norte-2026-11-10.csv");
    expect(result.value.rowCount).toBe(3);
    expect(exporter.lastRows.every((row) => row.region === "Piura / Norte")).toBe(true);
  });

  it("forbids the asistente export", async () => {
    const exporter = new RecordingCsvExporter();
    const useCase = new ExportIncidenciasCsvUseCase({
      incidenciaRepository: seedRepository(),
      centroPobladoRepository: seedCentros(),
      csvExporter: exporter,
      now: () => NOW,
    });

    const result = await useCase.execute({
      user: asistenteUno,
      scope: scopeForUser(asistenteUno),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("forbidden");
    expect(exporter.lastRows).toHaveLength(0);
  });

  it("includes explicitly assigned centros outside the region", async () => {
    const exporter = new RecordingCsvExporter();
    const useCase = new ExportIncidenciasCsvUseCase({
      incidenciaRepository: seedRepository(),
      centroPobladoRepository: seedCentros(),
      csvExporter: exporter,
      now: () => NOW,
    });
    const coordinator: UserProfile = {
      ...coordinadorPiura,
      id: "user-coo-sc-01",
      teatroOperacionesRegion: "Sur / Centro",
      centroPobladoIds: ["c1"],
    };

    const result = await useCase.execute({
      user: coordinator,
      scope: { kind: "area", region: "Sur / Centro", centroPobladoIds: ["c1"] },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Catacaos (explicit) + Ica (region), Chulucanas is outside both criteria.
    expect(result.value.rowCount).toBe(3);
  });

  it("includes centros assigned to the coordinator zone", async () => {
    const exporter = new RecordingCsvExporter();
    const useCase = new ExportIncidenciasCsvUseCase({
      incidenciaRepository: seedRepository(),
      centroPobladoRepository: seedCentros(),
      csvExporter: exporter,
      now: () => NOW,
    });

    const result = await useCase.execute({
      user: coordinadorPiura,
      scope: { kind: "area", region: "", centroPobladoIds: [] },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Catacaos is linked through coordinadorZonaId and holds two reports.
    expect(result.value.rowCount).toBe(2);
  });

  it("falls back to an area filename and skips unknown centros", async () => {
    const repository = seedRepository();
    repository.items.push(
      makeIncidencia({
        id: "orphan",
        codigoAuditoria: "INC-2026-00099",
        centroPobladoId: "missing",
      }),
    );
    const exporter = new RecordingCsvExporter();
    const useCase = new ExportIncidenciasCsvUseCase({
      incidenciaRepository: repository,
      centroPobladoRepository: seedCentros(),
      csvExporter: exporter,
      now: () => NOW,
    });
    const coordinator: UserProfile = {
      ...coordinadorPiura,
      centroPobladoIds: [],
    };

    const result = await useCase.execute({
      user: coordinator,
      scope: { kind: "area", region: "", centroPobladoIds: [] },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe("incidencias-area-2026-11-10.csv");
    expect(result.value.rowCount).toBe(2);
  });
});

describe("CreateSupportTicketUseCase", () => {
  it("stores a valid ticket with the optional user", async () => {
    const repository = new FakeSupportTicketRepository();
    const useCase = new CreateSupportTicketUseCase({
      supportTicketRepository: repository,
      now: () => NOW,
    });

    const result = await useCase.execute({
      opcionProblema: "datos_no_cargan",
      detalleOpcional: "La tabla queda vacia",
      rutaOrigen: "/jefatura",
      usuarioId: "user-jef-01",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.createdAt).toBe(NOW.toISOString());
    expect(result.value.usuarioId).toBe("user-jef-01");
    expect(repository.items).toHaveLength(1);
  });

  it("rejects an invalid problem without storing anything", async () => {
    const repository = new FakeSupportTicketRepository();
    const useCase = new CreateSupportTicketUseCase({
      supportTicketRepository: repository,
      now: () => NOW,
    });

    const result = await useCase.execute({
      opcionProblema: "otro",
      rutaOrigen: "/login",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_error");
    expect(repository.items).toHaveLength(0);
  });
});

describe("LoginUseCase", () => {
  it("delegates to the auth repository", async () => {
    const login = vi.fn(async (): Promise<Result<UserProfile>> => ok(jefatura));
    const authRepository: AuthRepository = {
      login,
      restoreSession: async () => null,
      logout: async () => undefined,
      keepSession: async () => undefined,
      listUsers: async () => [jefatura],
    };
    const useCase = new LoginUseCase({ authRepository });

    const credentials: LoginFormValues = {
      identificadorOficial: "JEF-001",
      claveOperacional: "ladp2026",
      jurisdiccion: "nacional",
      mantenerSesion: true,
    };
    const result = await useCase.execute(credentials);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.nombre).toBe("Maria Elena Quispe");
    expect(login).toHaveBeenCalledWith(credentials);
  });

  it("forwards authentication failures", async () => {
    const authRepository: AuthRepository = {
      login: async () => ({
        ok: false,
        error: { code: "validation_error", message: "Credenciales invalidas." },
      }),
      restoreSession: async () => null,
      logout: async () => undefined,
      keepSession: async () => undefined,
      listUsers: async () => [],
    };
    const useCase = new LoginUseCase({ authRepository });

    const result = await useCase.execute({
      identificadorOficial: "JEF-001",
      claveOperacional: "wrong-password",
      jurisdiccion: "nacional",
      mantenerSesion: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_error");
  });
});

describe("ListIncidenciasUseCase", () => {
  const run = async (user: UserProfile) => {
    const useCase = new ListIncidenciasUseCase({
      incidenciaRepository: seedRepository(),
      centroPobladoRepository: seedCentros(),
    });
    return useCase.execute({ user });
  };

  it("returns every report with its centro poblado for jefatura", async () => {
    const result = await run(jefatura);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(4);
    expect(result.value[0]?.centroPoblado.nombre).toBe("Catacaos");
  });

  it("filters by region for a coordinador", async () => {
    const result = await run(coordinadorPiura);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(3);
    expect(result.value.every((item) => item.centroPoblado.region === "Piura / Norte")).toBe(
      true,
    );
  });

  it("shows only own reports to an asistente", async () => {
    const result = await run(asistenteUno);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value.every((item) => item.incidencia.creadoPor === "user-asi-01")).toBe(
      true,
    );
  });

  it("shows an assistant only its own report, never a colleague's", async () => {
    const result = await run(asistenteDos);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.incidencia.creadoPor).toBe("user-asi-02");
  });

  it("returns an empty list for an unknown role", async () => {
    const unknown: UserProfile = { ...jefatura, rol: "auditor" as UserProfile["rol"] };
    const result = await run(unknown);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(0);
  });
});

describe("validation error mapping", () => {
  it("uses the form key for root-level issues", () => {
    const error = toValidationError(
      new z.ZodError([{ code: "custom", message: "Algo falló", path: [] }]),
    );

    expect(error.code).toBe("validation_error");
    expect(error.fieldErrors?.form).toBe("Algo falló");
  });

  it("keeps the first message per field", () => {
    const error = toValidationError(
      new z.ZodError([
        { code: "custom", message: "primero", path: ["campo"] },
        { code: "custom", message: "segundo", path: ["campo"] },
      ]),
    );

    expect(error.fieldErrors?.campo).toBe("primero");
  });
});

describe("audit code allocator concurrency", () => {
  it("never mints a duplicate under 50 parallel allocations", async () => {
    ensureDemoSeed(NOW);
    write("audit-sequence", { year: 2026, last: 0 });
    const allocator = new LocalAuditCodeAllocator(() => NOW);

    const codes = await Promise.all(
      Array.from({ length: 50 }, () => allocator.next(NOW)),
    );

    expect(codes).toHaveLength(50);
    expect(new Set(codes).size).toBe(50);
    expect(codes[0]).toBe("INC-2026-00001");
    expect(codes[49]).toBe("INC-2026-00050");
  });
});

describe("ListUsersUseCase", () => {
  const makeAuth = (profiles: UserProfile[]): AuthRepository => ({
    login: async () => ok(jefatura),
    restoreSession: async () => null,
    logout: async () => undefined,
    keepSession: async () => undefined,
    listUsers: async () => profiles,
  });

  it("lists personnel only for roles with user:read permission", async () => {
    const useCase = new ListUsersUseCase({
      authRepository: makeAuth([jefatura, coordinadorPiura, asistenteUno]),
    });

    const allowed = await useCase.execute({ user: jefatura });
    expect(allowed.ok).toBe(true);
    if (allowed.ok) {
      expect(allowed.value).toHaveLength(3);
    }

    const deniedCoord = await useCase.execute({ user: coordinadorPiura });
    expect(deniedCoord.ok).toBe(false);
    if (!deniedCoord.ok) {
      expect(deniedCoord.error.code).toBe("forbidden");
    }

    const deniedAsist = await useCase.execute({ user: asistenteUno });
    expect(deniedAsist.ok).toBe(false);
  });
});

describe("TacticalDraftsUseCase", () => {
  it("persists, updates and removes tactical drafts in LocalCache", () => {
    const backing = new Map<string, unknown>();
    const cache: LocalCache = {
      get: <T>(key: string) => (backing.has(key) ? (backing.get(key) as T) : null),
      set: <T>(key: string, value: T) => {
        backing.set(key, value);
      },
      remove: (key: string) => {
        backing.delete(key);
      },
    };
    const useCase = new TacticalDraftsUseCase({ cache, now: () => NOW });

    expect(useCase.listDrafts()).toEqual([]);

    const { saved, drafts } = useCase.saveDraft({
      centroPobladoId: "c-catacaos",
      tipoAfectacion: "inundacion",
      necesidadPrincipal: "agua_potable",
      hogaresAfectados: 18,
      ocurrioHoy: true,
      fechaSuceso: TODAY,
      gpsCoords: "-5.26580, -80.67890",
      notaReferencia: "Calle Comercio anegada",
      reportingChannel: "bgan",
      transitability: "aislado",
      servicesAffected: ["sinAgua"],
    });

    expect(drafts).toHaveLength(1);
    expect(saved.savedAt).toBe(NOW.toISOString());
    expect(useCase.listDrafts()).toHaveLength(1);

    const updated = useCase.saveDraft({
      id: saved.id,
      centroPobladoId: "c-catacaos",
      tipoAfectacion: "inundacion",
      necesidadPrincipal: "alimentos",
      hogaresAfectados: 22,
      ocurrioHoy: true,
      fechaSuceso: TODAY,
      gpsCoords: "-5.26580, -80.67890",
      notaReferencia: "Actualizado",
      reportingChannel: "radio",
      transitability: "bloqueada",
      servicesAffected: ["sinAgua", "sinLuz"],
    });
    expect(updated.drafts).toHaveLength(1);
    expect(updated.saved.hogaresAfectados).toBe(22);

    const afterRemove = useCase.removeDraft(saved.id);
    expect(afterRemove).toEqual([]);
    expect(useCase.listDrafts()).toEqual([]);
  });
});
