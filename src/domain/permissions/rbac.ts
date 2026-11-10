import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import type { Incidencia } from "@/domain/entities/incidencia";
import type { UserProfile, UserRole } from "@/domain/entities/user";

export type Permission =
  | "incidencia:create"
  | "incidencia:read"
  | "incidencia:validate"
  | "incidencia:export"
  | "kpi:read"
  | "coordinator:read"
  | "user:read";

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  jefatura: new Set<Permission>([
    "incidencia:create",
    "incidencia:read",
    "incidencia:validate",
    "incidencia:export",
    "kpi:read",
    "coordinator:read",
    "user:read",
  ]),
  coordinador: new Set<Permission>([
    "incidencia:create",
    "incidencia:read",
    "incidencia:validate",
    "incidencia:export",
    "kpi:read",
    "coordinator:read",
  ]),
  asistente: new Set<Permission>(["incidencia:create", "incidencia:read"]),
};

function isKnownRole(role: string): role is UserRole {
  return Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role);
}

/** Deny-by-default authorization check. */
export function can(user: UserProfile, permission: Permission): boolean {
  if (!isKnownRole(user.rol)) {
    return false;
  }
  return ROLE_PERMISSIONS[user.rol].has(permission);
}

export type Scope =
  | { kind: "national" }
  | { kind: "area"; region: string; centroPobladoIds: string[] };

export function scopeForUser(user: UserProfile): Scope {
  if (user.rol === "jefatura") {
    return { kind: "national" };
  }
  const known = isKnownRole(user.rol);
  return {
    kind: "area",
    region: known ? (user.teatroOperacionesRegion ?? "") : "",
    centroPobladoIds: known ? [...user.centroPobladoIds] : [],
  };
}

/**
 * Visibility rules:
 * - jefatura: everything, national.
 * - coordinador: own region, assigned zone or explicitly listed centros.
 * - asistente: only the reports it created.
 */
export function isIncidenciaVisible(
  user: UserProfile,
  incidencia: Incidencia,
  centros: readonly CentroPoblado[],
): boolean {
  if (user.rol === "jefatura") {
    return true;
  }
  if (!isKnownRole(user.rol)) {
    return false;
  }
  if (user.rol === "asistente") {
    return incidencia.creadoPor === user.id;
  }

  const centro = centros.find((entry) => entry.id === incidencia.centroPobladoId);
  if (!centro) {
    return false;
  }
  if (user.centroPobladoIds.includes(centro.id)) {
    return true;
  }
  if (centro.coordinadorZonaId === user.id) {
    return true;
  }
  return user.teatroOperacionesRegion !== null && centro.region === user.teatroOperacionesRegion;
}
