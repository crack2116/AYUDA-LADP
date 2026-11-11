import type { UserProfile } from "@/domain/entities/user";
import type { LoginFormValues } from "@/domain/schemas/login.schema";

import type { Result } from "@/application/result";

export type LoginCredentials = LoginFormValues;

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<Result<UserProfile>>;
  restoreSession(): Promise<UserProfile | null>;
  logout(): Promise<void>;
  keepSession(profile: UserProfile): Promise<void>;
  listUsers(): Promise<UserProfile[]>;
}
