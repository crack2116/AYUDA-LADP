import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import type { Incidencia } from "@/domain/entities/incidencia";
import type { SupportTicket } from "@/domain/entities/support-ticket";
import type { UserProfile } from "@/domain/entities/user";
import { toLimaDateKey, toLimaYear } from "@/domain/lib/date";
import type { Jurisdiccion } from "@/domain/schemas/login.schema";

import { read, remove, write } from "@/infrastructure/repositories/local-store";

export const DEMO_PASSWORD = "ladp2026";
export const DEMO_SEED_KEY = "demo-seed";
export const DEMO_SEED_VERSION = 1;

export const DEMO_REGION_PIURA = "Piura / Norte";
export const DEMO_REGION_SUR = "Sur / Centro";

export const DEMO_USERS: readonly UserProfile[] = [
  {
    id: "user-jef-01",
    identificadorOficial: "JEF-001",
    nombre: "María Elena Quispe",
    rol: "jefatura",
    teatroOperacionesRegion: null,
    centroPobladoIds: [],
  },
  {
    id: "user-jef-02",
    identificadorOficial: "JEF-002",
    nombre: "Carlos Alberto Rojas",
    rol: "jefatura",
    teatroOperacionesRegion: null,
    centroPobladoIds: [],
  },
  {
    id: "user-jef-03",
    identificadorOficial: "JEF-003",
    nombre: "Lucía Fernanda Torres",
    rol: "jefatura",
    teatroOperacionesRegion: null,
    centroPobladoIds: [],
  },
  {
    id: "user-jef-04",
    identificadorOficial: "JEF-004",
    nombre: "Jorge Luis Mendoza",
    rol: "jefatura",
    teatroOperacionesRegion: null,
    centroPobladoIds: [],
  },
  {
    id: "user-jef-05",
    identificadorOficial: "JEF-005",
    nombre: "Ana Patricia Salazar",
    rol: "jefatura",
    teatroOperacionesRegion: null,
    centroPobladoIds: [],
  },
  {
    id: "user-jef-06",
    identificadorOficial: "JEF-006",
    nombre: "Ricardo Antonio Vega",
    rol: "jefatura",
    teatroOperacionesRegion: null,
    centroPobladoIds: [],
  },
  {
    id: "user-coo-pn-01",
    identificadorOficial: "COO-PN-01",
    nombre: "Rosa Herrera Campos",
    rol: "coordinador",
    teatroOperacionesRegion: DEMO_REGION_PIURA,
    centroPobladoIds: ["c-catacaos", "c-tambogrande", "c-sechura", "c-paita"],
  },
  {
    id: "user-coo-sc-01",
    identificadorOficial: "COO-SC-01",
    nombre: "Miguel Ángel Flores",
    rol: "coordinador",
    teatroOperacionesRegion: DEMO_REGION_SUR,
    centroPobladoIds: ["c-ica", "c-chincha-alta"],
  },
  {
    id: "user-asi-01",
    identificadorOficial: "ASI-PN-01",
    nombre: "Luis Paredes",
    rol: "asistente",
    teatroOperacionesRegion: DEMO_REGION_PIURA,
    centroPobladoIds: ["c-catacaos", "c-la-arena"],
  },
  {
    id: "user-asi-02",
    identificadorOficial: "ASI-PN-02",
    nombre: "Elena Soto",
    rol: "asistente",
    teatroOperacionesRegion: DEMO_REGION_PIURA,
    centroPobladoIds: ["c-chulucanas", "c-castilla"],
  },
  {
    id: "user-asi-03",
    identificadorOficial: "ASI-SC-01",
    nombre: "Javier Núñez",
    rol: "asistente",
    teatroOperacionesRegion: DEMO_REGION_SUR,
    centroPobladoIds: ["c-ica", "c-chincha-alta"],
  },
];

export const DEMO_CENTROS: readonly CentroPoblado[] = [
  {
    id: "c-catacaos",
    nombre: "Catacaos",
    sector: "Bajo Piura",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: "user-coo-pn-01",
  },
  {
    id: "c-chulucanas",
    nombre: "Chulucanas",
    sector: "Morropón",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: null,
  },
  {
    id: "c-tambogrande",
    nombre: "Tambogrande",
    sector: "San Lorenzo",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: "user-coo-pn-01",
  },
  {
    id: "c-castilla",
    nombre: "Castilla",
    sector: "Piura Metropolitana",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: null,
  },
  {
    id: "c-veintiseis-octubre",
    nombre: "Veintiséis de Octubre",
    sector: "Piura Metropolitana",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: "user-coo-pn-01",
  },
  {
    id: "c-la-arena",
    nombre: "La Arena",
    sector: "Bajo Piura",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: null,
  },
  {
    id: "c-sechura",
    nombre: "Sechura",
    sector: "Sechura",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: "user-coo-pn-01",
  },
  {
    id: "c-cura-mori",
    nombre: "Cura Mori",
    sector: "Bajo Piura",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: null,
  },
  {
    id: "c-paita",
    nombre: "Paita",
    sector: "Paita",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: "user-coo-pn-01",
  },
  {
    id: "c-sullana",
    nombre: "Sullana",
    sector: "Sullana",
    region: DEMO_REGION_PIURA,
    coordinadorZonaId: null,
  },
  {
    id: "c-ica",
    nombre: "Ica",
    sector: "Ica",
    region: DEMO_REGION_SUR,
    coordinadorZonaId: "user-coo-sc-01",
  },
  {
    id: "c-chincha-alta",
    nombre: "Chincha Alta",
    sector: "Chincha",
    region: DEMO_REGION_SUR,
    coordinadorZonaId: "user-coo-sc-01",
  },
];

export interface AuditSequenceSnapshot {
  year: number;
  last: number;
}

export interface DemoDataset {
  users: UserProfile[];
  centros: CentroPoblado[];
  incidencias: Incidencia[];
  tickets: SupportTicket[];
  auditSequence: AuditSequenceSnapshot;
}

interface DemoIncidenciaSeed {
  centroPobladoId: string;
  tipoAfectacion: Incidencia["tipoAfectacion"];
  hogaresAfectados: number;
  necesidadPrincipal: Incidencia["necesidadPrincipal"];
  ageHours: number;
  gpsCoords: string | null;
  notaReferencia: string | null;
  verificado: boolean;
  creadoPor: string;
}

const DEMO_INCIDENCIA_SEEDS: readonly DemoIncidenciaSeed[] = [
  {
    centroPobladoId: "c-catacaos",
    tipoAfectacion: "inundacion",
    hogaresAfectados: 35,
    necesidadPrincipal: "agua_potable",
    ageHours: 2,
    gpsCoords: "-5.19449, -80.62812 (±12m)",
    notaReferencia: "Familias refugiadas en el colegio San Juan",
    verificado: true,
    creadoPor: "user-asi-01",
  },
  {
    centroPobladoId: "c-chulucanas",
    tipoAfectacion: "huaico",
    hogaresAfectados: 18,
    necesidadPrincipal: "alimentos",
    ageHours: 6,
    gpsCoords: null,
    notaReferencia: "Cruce de la quebrada bloqueado",
    verificado: false,
    creadoPor: "user-asi-02",
  },
  {
    centroPobladoId: "c-tambogrande",
    tipoAfectacion: "colapso_vivienda",
    hogaresAfectados: 7,
    necesidadPrincipal: "carpas_abrigo",
    ageHours: 20,
    gpsCoords: "-4.93253, -80.34116 (±18m)",
    notaReferencia: null,
    verificado: false,
    creadoPor: "user-asi-01",
  },
  {
    centroPobladoId: "c-castilla",
    tipoAfectacion: "aislamiento_vial",
    hogaresAfectados: 0,
    necesidadPrincipal: "maquinaria_limpieza",
    ageHours: 25,
    gpsCoords: null,
    notaReferencia: "Trocha carrozable sin acceso",
    verificado: true,
    creadoPor: "user-asi-02",
  },
  {
    centroPobladoId: "c-veintiseis-octubre",
    tipoAfectacion: "corte_servicios",
    hogaresAfectados: 12,
    necesidadPrincipal: "atencion_medica",
    ageHours: 28,
    gpsCoords: null,
    notaReferencia: "Sin agua ni energía desde ayer",
    verificado: false,
    creadoPor: "user-asi-02",
  },
  {
    centroPobladoId: "c-sechura",
    tipoAfectacion: "desborde_rio",
    hogaresAfectados: 54,
    necesidadPrincipal: "evacuacion_rescate",
    ageHours: 44,
    gpsCoords: "-5.55821, -80.82211 (±25m)",
    notaReferencia: "El río inunda la parte baja del sector",
    verificado: true,
    creadoPor: "user-asi-01",
  },
  {
    centroPobladoId: "c-paita",
    tipoAfectacion: "inundacion",
    hogaresAfectados: 22,
    necesidadPrincipal: "kits_higiene",
    ageHours: 50,
    gpsCoords: null,
    notaReferencia: null,
    verificado: false,
    creadoPor: "user-asi-01",
  },
  {
    centroPobladoId: "c-ica",
    tipoAfectacion: "huaico",
    hogaresAfectados: 14,
    necesidadPrincipal: "agua_potable",
    ageHours: 58,
    gpsCoords: null,
    notaReferencia: "Canal de riego colapsado",
    verificado: true,
    creadoPor: "user-asi-03",
  },
  {
    centroPobladoId: "c-chincha-alta",
    tipoAfectacion: "otro",
    hogaresAfectados: 3,
    necesidadPrincipal: "otro",
    ageHours: 70,
    gpsCoords: "-13.41123, -76.12887 (±30m)",
    notaReferencia: "Vivienda con grietas en el muro posterior",
    verificado: false,
    creadoPor: "user-asi-03",
  },
];

const HOUR_MS = 60 * 60 * 1000;

/**
 * Builds the deterministic demo dataset anchored to the injected clock.
 * The same `now` always produces the same dataset.
 */
export function buildDemoDataset(now: Date): DemoDataset {
  const todayKey = toLimaDateKey(now);

  const incidencias: Incidencia[] = DEMO_INCIDENCIA_SEEDS.map((seed, index) => {
    const createdAt = new Date(now.getTime() - seed.ageHours * HOUR_MS);
    const fechaSuceso = toLimaDateKey(createdAt);
    return {
      id: `inc-${String(index + 1).padStart(2, "0")}`,
      codigoAuditoria: `INC-${toLimaYear(now)}-${String(index + 1).padStart(5, "0")}`,
      centroPobladoId: seed.centroPobladoId,
      tipoAfectacion: seed.tipoAfectacion,
      hogaresAfectados: seed.hogaresAfectados,
      necesidadPrincipal: seed.necesidadPrincipal,
      ocurrioHoy: fechaSuceso === todayKey,
      fechaSuceso,
      gpsCoords: seed.gpsCoords,
      notaReferencia: seed.notaReferencia,
      verificado: seed.verificado,
      creadoPor: seed.creadoPor,
      createdAt: createdAt.toISOString(),
    };
  });

  return {
    users: DEMO_USERS.map((user) => ({ ...user, centroPobladoIds: [...user.centroPobladoIds] })),
    centros: DEMO_CENTROS.map((centro) => ({ ...centro })),
    incidencias,
    tickets: [],
    auditSequence: { year: toLimaYear(now), last: DEMO_INCIDENCIA_SEEDS.length },
  };
}

/** Seeds once per store version so a reload keeps the user's work. */
export function ensureDemoSeed(now: Date = new Date()): void {
  if (read<number>(DEMO_SEED_KEY, 0) === DEMO_SEED_VERSION) {
    return;
  }
  const dataset = buildDemoDataset(now);
  write("centros", dataset.centros);
  write("profiles", dataset.users);
  write("incidencias", dataset.incidencias);
  write("tickets", dataset.tickets);
  write("audit-sequence", dataset.auditSequence);
  write(DEMO_SEED_KEY, DEMO_SEED_VERSION);
}

export function resetDemoSeed(now: Date = new Date()): void {
  remove(DEMO_SEED_KEY);
  ensureDemoSeed(now);
}

/**
 * Jurisdiction each demo account must select on the login screen.
 * Jefatura is national, assistants work in the field, coordinators in their region.
 */
export function jurisdictionForUser(user: UserProfile): Jurisdiccion {
  if (user.rol === "jefatura") {
    return "nacional";
  }
  if (user.rol === "asistente") {
    return "campo";
  }
  return user.teatroOperacionesRegion === DEMO_REGION_SUR ? "sur_centro" : "piura_norte";
}
