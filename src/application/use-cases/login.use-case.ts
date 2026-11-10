import type { AuthRepository, LoginCredentials } from "@/application/ports/auth.repository";
import type { Result } from "@/application/result";
import type { UserProfile } from "@/domain/entities/user";

export interface LoginDeps {
  authRepository: AuthRepository;
}

export class LoginUseCase {
  private readonly deps: LoginDeps;

  constructor(deps: LoginDeps) {
    this.deps = deps;
  }

  async execute(credentials: LoginCredentials): Promise<Result<UserProfile>> {
    return this.deps.authRepository.login(credentials);
  }
}
