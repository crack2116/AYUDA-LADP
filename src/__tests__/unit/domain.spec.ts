import { describe, expect, it } from "vitest";

import { matchesCentroQuery, type CentroPoblado } from "@/domain/entities/centro-poblado";
import {
  NECESIDAD_OPTIONS,
  TIPO_AFECTACION_OPTIONS,
  type Incidencia,
} from "@/domain/entities/incidencia";
import { SUPPORT_PROBLEM_OPTIONS } from "@/domain/entities/support-ticket";
import { USER_ROLE_LABELS, type UserProfile, type UserRole } from "@/domain/entities/user";
import { formatAuditCode } from "@/domain/lib/audit-code";
import { toLimaDateKey } from "@/domain/lib/date";
import { formatGpsCoords } from "@/domain/lib/gps";
import { can, isIncidenciaVisible, scopeForUser } from "@/domain/permissions/rbac";
import {
  createIncidenciaSchema,
  mapFormValuesToDraft,
} from "@/domain/schemas/incidencia.schema";
import { loginSchema } from "@/domain/schemas/login.schema";
import { supportTicketSchema } from "@/domain/schemas/support-ticket.schema";
import { incidenciasWithinWindow } from "@/domain/services/duplicate-window";

const TODAY = "2026-11-10";

const validPayload = {
  centroPobladoId: "centro-1",
  tipoAfectacion: "inundacion" as const,
  hogaresAfectados: 12,
  necesidadPrincipal: "agua_potable" as const,
  ocurrioHoy: true,
  fechaSuceso: TODAY,
  gpsCoords: null,
  notaReferencia: "Calle principal anegada",
};

const schema = createIncidenciaSchema({ today: TODAY });

const makeUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "user-jef-01",
  identificadorOficial: "JEF-001",
  nombre: "Maria Elena Quispe",
  rol: "jefatura",
  teatroOperacionesRegion: null,
  centroPobladoIds: [],
  ...overrides,
});

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

describe("incidencia schema", () => {
  it("accepts a valid payload and normalizes optional text", () => {
    const result = schema.safeParse({
      ...validPayload,
      notaReferencia: "  Familia en el techo  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.hogaresAfectados).toBe(12);
    expect(result.data.notaReferencia).toBe("Familia en el techo");
    expect(result.data.gpsCoords).toBeNull();
  });

  it.each([
    ["negative integer", -1],
    ["negative decimal", -25.5],
    ["positive decimal", 1.5],
    ["empty string", ""],
    ["text", "abc"],
    ["over the maximum", 100001],
  ])("rejects %s households", (_label, hogaresAfectados) => {
    const result = schema.safeParse({ ...validPayload, hogaresAfectados });

    expect(result.success).toBe(false);
    if (result.success) return;
    const issue = result.error.issues.find((entry) =>
      entry.path.includes("hogaresAfectados"),
    );
    expect(issue).toBeDefined();
    expect(issue?.message.length).toBeGreaterThan(0);
  });

  it("accepts the boundaries zero and one hundred thousand", () => {
    expect(schema.safeParse({ ...validPayload, hogaresAfectados: 0 }).success).toBe(true);
    expect(schema.safeParse({ ...validPayload, hogaresAfectados: 100000 }).success).toBe(
      true,
    );
  });

  it("rejects an empty centro poblado", () => {
    const result = schema.safeParse({ ...validPayload, centroPobladoId: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["centroPobladoId"]);
  });

  it("rejects unknown enum values", () => {
    const tipo = schema.safeParse({ ...validPayload, tipoAfectacion: "terremoto" });
    const necesidad = schema.safeParse({
      ...validPayload,
      necesidadPrincipal: "comida",
    });

    expect(tipo.success).toBe(false);
    expect(necesidad.success).toBe(false);
  });

  it("rejects a future date", () => {
    const result = schema.safeParse({
      ...validPayload,
      ocurrioHoy: false,
      fechaSuceso: "2026-11-11",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["fechaSuceso"]);
    expect(result.error.issues[0]?.message).toContain("futura");
  });

  it("rejects impossible calendar dates", () => {
    const result = schema.safeParse({
      ...validPayload,
      ocurrioHoy: false,
      fechaSuceso: "2026-02-30",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a fechaSuceso that does not match ocurrioHoy", () => {
    const result = schema.safeParse({
      ...validPayload,
      ocurrioHoy: true,
      fechaSuceso: "2026-11-09",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toContain("hoy");
  });

  it("accepts a past date when the event did not happen today", () => {
    const result = schema.safeParse({
      ...validPayload,
      ocurrioHoy: false,
      fechaSuceso: "2026-11-08",
    });
    expect(result.success).toBe(true);
  });

  it("caps the optional note at 280 characters", () => {
    expect(schema.safeParse({ ...validPayload, notaReferencia: "a".repeat(280) }).success).toBe(
      true,
    );
    const result = schema.safeParse({ ...validPayload, notaReferencia: "a".repeat(281) });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["notaReferencia"]);
  });

  it("caps the optional GPS string at 80 characters", () => {
    expect(schema.safeParse({ ...validPayload, gpsCoords: "1".repeat(80) }).success).toBe(true);
    expect(schema.safeParse({ ...validPayload, gpsCoords: "1".repeat(81) }).success).toBe(false);
  });

  it("maps parsed form values to a draft with the audit author", () => {
    const parsed = schema.safeParse({ ...validPayload, notaReferencia: "   " });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const draft = mapFormValuesToDraft(parsed.data, "user-asi-01");

    expect(draft.creadoPor).toBe("user-asi-01");
    expect(draft.notaReferencia).toBeNull();
    expect(draft.gpsCoords).toBeNull();
    expect(draft.hogaresAfectados).toBe(12);
  });
});

describe("login schema", () => {
  const validLogin = {
    identificadorOficial: "JEF-001",
    claveOperacional: "ladp2026",
    jurisdiccion: "nacional" as const,
    mantenerSesion: true,
  };

  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse(validLogin).success).toBe(true);
  });

  it("rejects a short identifier and a short password", () => {
    expect(
      loginSchema.safeParse({ ...validLogin, identificadorOficial: "ab" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ ...validLogin, claveOperacional: "12345" }).success,
    ).toBe(false);
  });

  it("rejects an unknown jurisdiction", () => {
    expect(
      loginSchema.safeParse({ ...validLogin, jurisdiccion: "lima" }).success,
    ).toBe(false);
  });
});

describe("support ticket schema", () => {
  it("accepts a valid ticket", () => {
    const result = supportTicketSchema.safeParse({
      opcionProblema: "datos_no_cargan",
      detalleOpcional: "La tabla queda vacia",
      rutaOrigen: "/jefatura",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown problem and an oversized detail", () => {
    expect(
      supportTicketSchema.safeParse({
        opcionProblema: "otro",
        rutaOrigen: "/login",
      }).success,
    ).toBe(false);
    expect(
      supportTicketSchema.safeParse({
        opcionProblema: "datos_no_cargan",
        detalleOpcional: "x".repeat(201),
        rutaOrigen: "/login",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty origin route", () => {
    expect(
      supportTicketSchema.safeParse({
        opcionProblema: "datos_no_cargan",
        rutaOrigen: "",
      }).success,
    ).toBe(false);
  });
});

describe("audit code formatting", () => {
  it("pads the sequence to five digits", () => {
    expect(formatAuditCode(2026, 1)).toBe("INC-2026-00001");
    expect(formatAuditCode(2026, 42)).toBe("INC-2026-00042");
    expect(formatAuditCode(2027, 7)).toBe("INC-2027-00007");
  });

  it("keeps sequences longer than five digits intact", () => {
    expect(formatAuditCode(2026, 123456)).toBe("INC-2026-123456");
  });
});

describe("America/Lima date key", () => {
  it("uses the Lima day across the UTC midnight boundary", () => {
    expect(toLimaDateKey(new Date("2026-11-10T04:30:00.000Z"))).toBe("2026-11-09");
    expect(toLimaDateKey(new Date("2026-11-10T05:00:00.000Z"))).toBe("2026-11-10");
  });

  it("formats a plain local date", () => {
    expect(toLimaDateKey(new Date("2026-11-10T15:00:00.000Z"))).toBe("2026-11-10");
  });
});

describe("GPS coordinate formatting", () => {
  it("formats five decimals and rounds the accuracy", () => {
    expect(
      formatGpsCoords({ latitude: -12.05, longitude: -77.05, accuracy: 12.4 }),
    ).toBe("-12.05000, -77.05000 (±12m)");
    expect(
      formatGpsCoords({ latitude: -5.19449, longitude: -80.62812, accuracy: 8.6 }),
    ).toBe("-5.19449, -80.62812 (±9m)");
  });
});

describe("centro poblado search", () => {
  const centro: CentroPoblado = {
    id: "c1",
    nombre: "San José de Catacaos",
    sector: "Bajo Piura",
    region: "Piura / Norte",
    coordinadorZonaId: "user-coo-pn-01",
  };

  it("matches without accents and without case", () => {
    expect(matchesCentroQuery(centro, "san jose")).toBe(true);
    expect(matchesCentroQuery(centro, "CATACAOS")).toBe(true);
    expect(matchesCentroQuery(centro, "bajo piura")).toBe(true);
    expect(matchesCentroQuery(centro, "piura / norte")).toBe(true);
  });

  it("returns true for an empty query", () => {
    expect(matchesCentroQuery(centro, "   ")).toBe(true);
  });

  it("rejects a non matching query", () => {
    expect(matchesCentroQuery(centro, "ica")).toBe(false);
  });
});

describe("RBAC", () => {
  const permissions = [
    "incidencia:create",
    "incidencia:read",
    "incidencia:validate",
    "incidencia:export",
    "kpi:read",
    "coordinator:read",
    "user:read",
  ] as const;

  it("grants every permission to jefatura", () => {
    const user = makeUser();
    for (const permission of permissions) {
      expect(can(user, permission)).toBe(true);
    }
  });

  it("grants area supervision to coordinador without user administration", () => {
    const user = makeUser({
      id: "user-coo-pn-01",
      rol: "coordinador",
      teatroOperacionesRegion: "Piura / Norte",
    });
    expect(can(user, "incidencia:create")).toBe(true);
    expect(can(user, "incidencia:read")).toBe(true);
    expect(can(user, "incidencia:validate")).toBe(true);
    expect(can(user, "incidencia:export")).toBe(true);
    expect(can(user, "kpi:read")).toBe(true);
    expect(can(user, "coordinator:read")).toBe(true);
    expect(can(user, "user:read")).toBe(false);
  });

  it("limits asistente to create and read", () => {
    const user = makeUser({ rol: "asistente", teatroOperacionesRegion: "Piura / Norte" });
    expect(can(user, "incidencia:create")).toBe(true);
    expect(can(user, "incidencia:read")).toBe(true);
    expect(can(user, "incidencia:validate")).toBe(false);
    expect(can(user, "incidencia:export")).toBe(false);
    expect(can(user, "kpi:read")).toBe(false);
    expect(can(user, "coordinator:read")).toBe(false);
    expect(can(user, "user:read")).toBe(false);
  });

  it("denies everything for an unknown role", () => {
    const user = makeUser({ rol: "auditor" as UserRole });
    for (const permission of permissions) {
      expect(can(user, permission)).toBe(false);
    }
    expect(scopeForUser(user)).toEqual({ kind: "area", region: "", centroPobladoIds: [] });
  });

  it("builds a national scope for jefatura", () => {
    expect(scopeForUser(makeUser())).toEqual({ kind: "national" });
  });

  it("builds an area scope for coordinador", () => {
    const user = makeUser({
      rol: "coordinador",
      teatroOperacionesRegion: "Piura / Norte",
      centroPobladoIds: ["c1", "c2"],
    });
    expect(scopeForUser(user)).toEqual({
      kind: "area",
      region: "Piura / Norte",
      centroPobladoIds: ["c1", "c2"],
    });
  });
});

describe("incidencia visibility", () => {
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
      coordinadorZonaId: "user-coo-pn-02",
    },
    {
      id: "c3",
      nombre: "Ica",
      sector: "Ica",
      region: "Sur / Centro",
      coordinadorZonaId: "user-coo-sc-01",
    },
  ];

  it("shows everything to jefatura", () => {
    const user = makeUser();
    expect(isIncidenciaVisible(user, makeIncidencia({ centroPobladoId: "c3" }), centros)).toBe(
      true,
    );
  });

  it("shows only the assigned region to a coordinador", () => {
    const user = makeUser({
      id: "user-coo-pn-01",
      rol: "coordinador",
      teatroOperacionesRegion: "Piura / Norte",
    });
    expect(isIncidenciaVisible(user, makeIncidencia({ centroPobladoId: "c1" }), centros)).toBe(
      true,
    );
    expect(isIncidenciaVisible(user, makeIncidencia({ centroPobladoId: "c2" }), centros)).toBe(
      true,
    );
    expect(isIncidenciaVisible(user, makeIncidencia({ centroPobladoId: "c3" }), centros)).toBe(
      false,
    );
  });

  it("honours explicitly assigned centros outside the region", () => {
    const user = makeUser({
      id: "user-coo-pn-01",
      rol: "coordinador",
      teatroOperacionesRegion: "Piura / Norte",
      centroPobladoIds: ["c3"],
    });
    expect(isIncidenciaVisible(user, makeIncidencia({ centroPobladoId: "c3" }), centros)).toBe(
      true,
    );
  });

  it("shows an assistant only its own reports", () => {
    const user = makeUser({ id: "user-asi-01", rol: "asistente" });
    expect(
      isIncidenciaVisible(user, makeIncidencia({ creadoPor: "user-asi-01" }), centros),
    ).toBe(true);
    expect(
      isIncidenciaVisible(user, makeIncidencia({ creadoPor: "user-asi-02" }), centros),
    ).toBe(false);
  });

  it("ignores reports whose centro poblado is unknown", () => {
    const user = makeUser({ rol: "coordinador", teatroOperacionesRegion: "Piura / Norte" });
    expect(
      isIncidenciaVisible(user, makeIncidencia({ centroPobladoId: "missing" }), centros),
    ).toBe(false);
  });

  it("denies visibility to an unknown role", () => {
    const user = makeUser({ rol: "auditor" as UserRole });
    expect(isIncidenciaVisible(user, makeIncidencia(), centros)).toBe(false);
  });
});

describe("duplicate window", () => {
  const now = new Date("2026-11-10T12:00:00.000Z");

  it("includes reports inside the window and the exact boundary", () => {
    const reports = [
      makeIncidencia({ id: "a", createdAt: "2026-11-10T11:00:00.000Z" }),
      makeIncidencia({ id: "b", createdAt: "2026-11-03T12:00:00.000Z" }),
      makeIncidencia({ id: "c", createdAt: "2026-11-03T11:59:59.999Z" }),
    ];

    const within = incidenciasWithinWindow(reports, now, 7);

    expect(within.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("excludes future reports", () => {
    const reports = [makeIncidencia({ createdAt: "2026-11-11T12:00:00.000Z" })];
    expect(incidenciasWithinWindow(reports, now, 7)).toHaveLength(0);
  });
});

describe("spanish vocabulary contract", () => {
  it("exposes the exact role labels", () => {
    expect(USER_ROLE_LABELS).toEqual({
      jefatura: "Jefatura",
      coordinador: "Coordinador",
      asistente: "Asistente",
    });
  });

  it("exposes the exact afectacion labels", () => {
    expect(TIPO_AFECTACION_OPTIONS.map((option) => option.label)).toEqual([
      "Inundación",
      "Huaico / Deslizamiento",
      "Colapso de vivienda",
      "Aislamiento vial",
      "Corte de servicios básicos",
      "Desborde de río/quebrada",
      "Otro",
    ]);
  });

  it("exposes the exact necesidad labels", () => {
    expect(NECESIDAD_OPTIONS.map((option) => option.label)).toEqual([
      "Agua potable",
      "Alimentos no perecibles",
      "Carpas / Abrigo",
      "Atención médica",
      "Maquinaria de limpieza",
      "Evacuación / Rescate",
      "Kits de higiene",
      "Otro",
    ]);
  });

  it("exposes the exact support problem labels", () => {
    expect(SUPPORT_PROBLEM_OPTIONS.map((option) => option.label)).toEqual([
      "No carga algún dato en pantalla",
      "No aparece mi Centro Poblado en el buscador",
      "Error al guardar o generar código INC",
      "Problema al validar si existe un reporte",
    ]);
  });
});
