export type UserRole = "jefatura" | "coordinador" | "asistente";

export interface UserProfile {
  id: string;
  identificadorOficial: string;
  nombre: string;
  rol: UserRole;
  /** null means national scope (jefatura). */
  teatroOperacionesRegion: string | null;
  centroPobladoIds: string[];
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  jefatura: "Jefatura",
  coordinador: "Coordinador",
  asistente: "Asistente",
};
