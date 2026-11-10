import { render, type RenderResult } from "@testing-library/react";
import { vi } from "vitest";

import type { UserProfile, UserRole } from "@/domain/entities/user";
import { getContainer } from "@/infrastructure/container";
import {
  DEMO_PASSWORD,
  DEMO_USERS,
  jurisdictionForUser,
} from "@/infrastructure/seed/demo-data";
import { RoleGate } from "@/presentation/components/layout/RoleShell";

/** Frozen clock shared by every presentation test and the mocked container. */
export const FIXED_NOW = new Date("2026-11-10T15:00:00.000Z");
export const TODAY_KEY = "2026-11-10";

export function demoUser(role: UserRole): UserProfile {
  const found = DEMO_USERS.find((user) => user.rol === role);
  if (!found) {
    throw new Error(`No demo user seeded for role ${role}`);
  }
  return found;
}

/** Writes a real session through the auth port so RoleGate can restore it. */
export async function seedSession(role: UserRole): Promise<UserProfile> {
  const user = demoUser(role);
  const result = await getContainer().authRepository.login({
    identificadorOficial: user.identificadorOficial,
    claveOperacional: DEMO_PASSWORD,
    jurisdiccion: jurisdictionForUser(user),
    mantenerSesion: true,
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

/** Renders a guarded view exactly like the App Router page does. */
export async function renderForRole(
  role: UserRole,
  ui: React.ReactElement,
): Promise<RenderResult> {
  await seedSession(role);
  return render(<RoleGate allowedRoles={[role]}>{ui}</RoleGate>);
}

/**
 * Captures CSV downloads without touching the real browser download machinery.
 * Returns the filenames assigned to the synthetic anchors.
 */
export function captureCsvDownloads(): {
  filenames: string[];
  createObjectUrl: ReturnType<typeof vi.fn>;
} {
  const filenames: string[] = [];
  const createObjectUrl = vi.fn(() => "blob:mock-csv");

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectUrl,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
    function capture(this: HTMLAnchorElement) {
      filenames.push(this.download);
    },
  );

  return { filenames, createObjectUrl };
}

/** Geolocation stub helpers keep the browser API surface minimal. */
export function stubGeolocation(
  implementation: (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
  ) => void,
): void {
  Object.defineProperty(window.navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: implementation },
  });
}

export function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}
