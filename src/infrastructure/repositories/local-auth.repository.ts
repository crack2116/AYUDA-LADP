import type { AuthRepository, LoginCredentials } from "@/application/ports/auth.repository";
import { fail, ok, type Result } from "@/application/result";
import type { UserProfile, UserRole } from "@/domain/entities/user";
import type { Jurisdiccion } from "@/domain/schemas/login.schema";

import {
  DEMO_PASSWORD,
  DEMO_USERS,
  jurisdictionForUser,
} from "@/infrastructure/seed/demo-data";
import {
  readSessionValue,
  removeSessionValue,
  writeSessionValue,
} from "@/infrastructure/repositories/local-store";

const SESSION_KEY = "session";

export interface DemoCredential {
  identificadorOficial: string;
  claveOperacional: string;
  jurisdiccion: Jurisdiccion;
  rol: UserRole;
  nombre: string;
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<UserProfile>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.identificadorOficial === "string" &&
    typeof candidate.nombre === "string" &&
    typeof candidate.rol === "string" &&
    Array.isArray(candidate.centroPobladoIds)
  );
}

/** Demo credentials for the login hint. Shared password is documented in the README. */
export function demoCredentials(): DemoCredential[] {
  return DEMO_USERS.map((user) => ({
    identificadorOficial: user.identificadorOficial,
    claveOperacional: DEMO_PASSWORD,
    jurisdiccion: jurisdictionForUser(user),
    rol: user.rol,
    nombre: user.nombre,
  }));
}

export class LocalAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<Result<UserProfile>> {
    const identifier = credentials.identificadorOficial.trim().toUpperCase();
    const user = DEMO_USERS.find(
      (candidate) => candidate.identificadorOficial.toUpperCase() === identifier,
    );

    if (!user || credentials.claveOperacional !== DEMO_PASSWORD) {
      return fail({
        code: "validation_error",
        message: "Identificador o clave operacional incorrectos.",
        fieldErrors: { claveOperacional: "Verifica tu identificador y tu clave." },
      });
    }

    const expectedJurisdiction = jurisdictionForUser(user);
    if (credentials.jurisdiccion !== expectedJurisdiction) {
      return fail({
        code: "validation_error",
        message:
          "La jurisdicción seleccionada no corresponde a tu usuario. Revisa el selector antes de ingresar.",
        fieldErrors: { jurisdiccion: "Selecciona la jurisdicción asignada a tu usuario." },
      });
    }

    const profile: UserProfile = { ...user, centroPobladoIds: [...user.centroPobladoIds] };
    writeSessionValue(SESSION_KEY, profile, credentials.mantenerSesion);
    return ok(profile);
  }

  async restoreSession(): Promise<UserProfile | null> {
    const profile = readSessionValue<UserProfile>(SESSION_KEY);
    return isUserProfile(profile) ? profile : null;
  }

  async logout(): Promise<void> {
    removeSessionValue(SESSION_KEY);
  }

  async keepSession(profile: UserProfile): Promise<void> {
    writeSessionValue(SESSION_KEY, profile, true);
  }
}
