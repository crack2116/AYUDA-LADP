import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import {
  labelForNecesidad,
  labelForTipoAfectacion,
  type Incidencia,
} from "@/domain/entities/incidencia";
import type { UserProfile } from "@/domain/entities/user";
import { parseGpsCoords, type ParsedGpsCoords } from "@/domain/lib/gps";

export interface TerritorialIncidenciaItem {
  incidencia: Incidencia;
  centroPoblado: CentroPoblado;
}

/** Approximate geographic bounding box for Peru (WGS84). */
const PERU_BOUNDS = {
  northLat: -0.04,
  southLat: -18.35,
  westLng: -81.33,
  eastLng: -68.65,
} as const;

export interface ProjectedMapPoint {
  xPercent: number;
  yPercent: number;
}

/**
 * Projects WGS84 coordinates onto percentage positions inside a stylized Peru viewport.
 * Clamped to [10, 90] so markers stay comfortably inside the map frame.
 */
export function projectPeruCoordsToPercent({
  latitude,
  longitude,
}: Pick<ParsedGpsCoords, "latitude" | "longitude">): ProjectedMapPoint {
  const latSpan = PERU_BOUNDS.northLat - PERU_BOUNDS.southLat;
  const lngSpan = PERU_BOUNDS.eastLng - PERU_BOUNDS.westLng;

  const rawX = ((longitude - PERU_BOUNDS.westLng) / lngSpan) * 80 + 10;
  const rawY = ((PERU_BOUNDS.northLat - latitude) / latSpan) * 80 + 10;

  return {
    xPercent: Math.round(Math.min(90, Math.max(10, rawX)) * 10) / 10,
    yPercent: Math.round(Math.min(90, Math.max(10, rawY)) * 10) / 10,
  };
}

export interface RegionDeploymentSummary {
  region: string;
  centros: readonly CentroPoblado[];
  sectores: readonly string[];
  coordinadores: readonly UserProfile[];
  asistentes: readonly UserProfile[];
  totalIncidencias: number;
  verificadas: number;
  pendientes: number;
  totalHogares: number;
  latestDateKey: string | null;
}

function resolveUserCentros(user: UserProfile, centros: readonly CentroPoblado[]): CentroPoblado[] {
  if (user.rol === "jefatura") {
    return [...centros];
  }
  const explicit = new Set(user.centroPobladoIds);
  return centros.filter(
    (centro) =>
      explicit.has(centro.id) ||
      centro.coordinadorZonaId === user.id ||
      (user.teatroOperacionesRegion !== null && centro.region === user.teatroOperacionesRegion),
  );
}

/**
 * Aggregates real territorial deployment metrics per region present in the centro catalog.
 */
export function summarizeRegionsDeployment(
  users: readonly UserProfile[],
  centros: readonly CentroPoblado[],
  rows: readonly TerritorialIncidenciaItem[],
): RegionDeploymentSummary[] {
  const regions = [...new Set(centros.map((centro) => centro.region))].sort();

  const summaries = regions.map((region) => {
    const regionCentros = centros.filter((centro) => centro.region === region);
    const regionCentroIds = new Set(regionCentros.map((centro) => centro.id));
    const sectores = [...new Set(regionCentros.map((centro) => centro.sector))].sort();

    const coordIds = new Set(
      regionCentros
        .map((centro) => centro.coordinadorZonaId)
        .filter((id): id is string => id !== null),
    );

    const coordinadores = users.filter(
      (user) =>
        user.rol === "coordinador" &&
        (coordIds.has(user.id) ||
          user.teatroOperacionesRegion === region ||
          user.centroPobladoIds.some((id) => regionCentroIds.has(id))),
    );

    const asistentes = users.filter(
      (user) =>
        user.rol === "asistente" &&
        (user.teatroOperacionesRegion === region ||
          user.centroPobladoIds.some((id) => regionCentroIds.has(id))),
    );

    const regionRows = rows.filter((row) => row.centroPoblado.region === region);
    const verificadas = regionRows.filter((row) => row.incidencia.verificado).length;
    const pendientes = regionRows.length - verificadas;
    const totalHogares = regionRows.reduce(
      (sum, row) => sum + row.incidencia.hogaresAfectados,
      0,
    );

    const sortedDates = regionRows
      .map((row) => row.incidencia.fechaSuceso)
      .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));

    return {
      region,
      centros: regionCentros,
      sectores,
      coordinadores,
      asistentes,
      totalIncidencias: regionRows.length,
      verificadas,
      pendientes,
      totalHogares,
      latestDateKey: sortedDates[0] ?? null,
    };
  });

  return summaries.sort(
    (left, right) => right.totalIncidencias - left.totalIncidencias || left.region.localeCompare(right.region),
  );
}

export interface PersonnelSupervisionRow {
  profile: UserProfile;
  initials: string;
  assignedCentros: readonly CentroPoblado[];
  createdCount: number;
  areaIncidenciasCount: number;
  areaVerifiedCount: number;
  latestDateKey: string | null;
}

export function extractInitials(nombre: string): string {
  const parts = nombre
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Combines real users, assigned centros poblados, and incident activity into supervision rows.
 */
export function buildPersonnelSupervisionRows(
  users: readonly UserProfile[],
  centros: readonly CentroPoblado[],
  rows: readonly TerritorialIncidenciaItem[],
): PersonnelSupervisionRow[] {
  return users.map((profile) => {
    const assignedCentros = resolveUserCentros(profile, centros);
    const assignedIds = new Set(assignedCentros.map((centro) => centro.id));

    const createdRows = rows.filter((row) => row.incidencia.creadoPor === profile.id);
    const areaRows =
      profile.rol === "jefatura"
        ? rows
        : profile.rol === "asistente"
          ? createdRows
          : rows.filter((row) => assignedIds.has(row.centroPoblado.id));

    const areaVerifiedCount = areaRows.filter((row) => row.incidencia.verificado).length;
    const latestDates = areaRows
      .map((row) => row.incidencia.fechaSuceso)
      .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));

    return {
      profile,
      initials: extractInitials(profile.nombre),
      assignedCentros,
      createdCount: createdRows.length,
      areaIncidenciasCount: areaRows.length,
      areaVerifiedCount,
      latestDateKey: latestDates[0] ?? null,
    };
  });
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: {
      codigoAuditoria: string;
      centroPoblado: string;
      sector: string;
      region: string;
      tipoAfectacion: string;
      necesidadPrincipal: string;
      hogaresAfectados: number;
      verificado: boolean;
      fechaSuceso: string;
      gpsCoords: string;
      notaReferencia: string | null;
    };
  }>;
}

/**
 * Builds an RFC 7946 GeoJSON FeatureCollection from all incidents that carry valid WGS84 coordinates.
 */
export function buildIncidenciasGeoJson(rows: readonly TerritorialIncidenciaItem[]): GeoJsonFeatureCollection {
  const features: GeoJsonFeatureCollection["features"] = [];

  for (const { incidencia, centroPoblado } of rows) {
    const parsed = parseGpsCoords(incidencia.gpsCoords);
    if (!parsed) continue;
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parsed.longitude, parsed.latitude],
      },
      properties: {
        codigoAuditoria: incidencia.codigoAuditoria,
        centroPoblado: centroPoblado.nombre,
        sector: centroPoblado.sector,
        region: centroPoblado.region,
        tipoAfectacion: labelForTipoAfectacion(incidencia.tipoAfectacion),
        necesidadPrincipal: labelForNecesidad(incidencia.necesidadPrincipal),
        hogaresAfectados: incidencia.hogaresAfectados,
        verificado: incidencia.verificado,
        fechaSuceso: incidencia.fechaSuceso,
        gpsCoords: incidencia.gpsCoords ?? "",
        notaReferencia: incidencia.notaReferencia,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
