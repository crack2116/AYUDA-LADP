import type { AuthRepository } from "@/application/ports/auth.repository";
import { fail, ok, type Result } from "@/application/result";
import type { UserProfile } from "@/domain/entities/user";
import { can } from "@/domain/permissions/rbac";

export interface ListUsersDeps {
  authRepository: AuthRepository;
}

export interface ListUsersInput {
  user: UserProfile;
}

/**
 * Lists institutional user profiles for Jefatura supervision dashboards.
 */
export class ListUsersUseCase {
  private readonly deps: ListUsersDeps;

  constructor(deps: ListUsersDeps) {
    this.deps = deps;
  }

  async execute({ user }: ListUsersInput): Promise<Result<UserProfile[]>> {
    if (!can(user, "user:read")) {
      return fail({
        code: "forbidden",
        message: "Tu rol no tiene permiso para consultar la nómina nacional de usuarios.",
      });
    }

    const users = await this.deps.authRepository.listUsers();
    return ok(users);
  }
}
