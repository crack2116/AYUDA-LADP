"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FilePlus2, Flame, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";

import type { UserProfile, UserRole } from "@/domain/entities/user";
import { USER_ROLE_LABELS } from "@/domain/entities/user";
import { can, type Permission } from "@/domain/permissions/rbac";

import { useSession } from "@/presentation/hooks/use-session";
import { homeForRole } from "@/presentation/lib/format";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  permission: Permission;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/jefatura",
    label: "Panel Nacional",
    icon: LayoutDashboard,
    permission: "kpi:read",
  },
  {
    href: "/coordinador",
    label: "Mi Área",
    icon: LayoutDashboard,
    permission: "kpi:read",
  },
  {
    href: "/incidencias/nuevo",
    label: "Registrar Incidencia",
    icon: FilePlus2,
    permission: "incidencia:create",
  },
];

interface SessionContextValue {
  user: UserProfile;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Session guaranteed by RoleGate; throws when used outside a guarded view. */
export function useAppSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useAppSession must be used inside RoleGate");
  }
  return value;
}

export function RoleSkeleton({ label = "Verificando sesión…" }: { label?: string }) {
  return (
    <div
      className="min-h-screen bg-ladp-bg px-4 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="h-4 w-40 animate-pulse rounded bg-ladp-navy/15" />
        <div className="h-10 w-64 animate-pulse rounded-lg bg-ladp-navy/10" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-ladp-surface"
            />
          ))}
        </div>
        <p className="pt-2 text-center text-sm font-medium text-ladp-slate">{label}</p>
      </div>
    </div>
  );
}

interface RoleGateProps {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
}

/**
 * Session + authorization guard for private views.
 * Loading shows a skeleton, no session goes to /login and a foreign role is
 * redirected to its own home so users can never land on a forbidden screen.
 */
export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { user, loading, logout } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.rol)) {
      router.replace(homeForRole(user.rol));
    }
  }, [allowedRoles, loading, router, user]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  const allowed = Boolean(user && allowedRoles.includes(user.rol));

  if (loading || !user || !allowed) {
    return <RoleSkeleton />;
  }

  const contextValue: SessionContextValue = { user, logout: handleLogout };

  return (
    <SessionContext.Provider value={contextValue}>
      <RoleShell user={user} onLogout={handleLogout}>
        {children}
      </RoleShell>
    </SessionContext.Provider>
  );
}

interface RoleShellProps {
  user: UserProfile;
  onLogout: () => Promise<void> | void;
  children: ReactNode;
}

/** Navy chrome shared by the three role workspaces. */
export function RoleShell({ user, onLogout, children }: RoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => can(user, item.permission)),
    [user],
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleRoleChange = async (role: UserRole) => {
    if (role === user.rol) {
      return;
    }
    if (role === "asistente") {
      router.push("/incidencias/nuevo");
      return;
    }
    setSwitching(true);
    await onLogout();
    setSwitching(false);
  };

  const brand = (
    <Link href={homeForRole(user.rol)} className="flex items-center gap-3">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ladp-cobalt">
        <ShieldCheck className="h-6 w-6 text-white" aria-hidden={true} />
        <Flame
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-ladp-navy p-0.5 text-ladp-orange"
          aria-hidden={true}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black leading-tight tracking-tight text-white md:text-ladp-navy-dark">
          AYUDA LADP
        </span>
        <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-white/60 md:text-ladp-slate">
          Respuesta humanitaria
        </span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-ladp-bg md:flex">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ladp-surface focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-ladp-navy"
      >
        Saltar al contenido principal
      </a>

      <aside className="hidden w-72 shrink-0 flex-col bg-ladp-navy-dark md:sticky md:top-0 md:flex md:h-screen">
        <div className="px-5 py-6">{brand}</div>

        <nav aria-label="Navegación principal" className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-ladp-cobalt text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden={true} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-white/10 px-4 py-4">
          <label
            className="block text-xs font-semibold text-white/70"
            htmlFor="role-switcher"
          >
            Cambiar de rol
          </label>
          <select
            id="role-switcher"
            value={user.rol}
            disabled={switching}
            onChange={(event) => void handleRoleChange(event.target.value as UserRole)}
            className="min-h-11 w-full rounded-lg border border-white/20 bg-ladp-navy px-3 text-sm font-semibold text-white"
            title="Cambiar de rol cierra la sesión actual"
          >
            <option value="jefatura">Jefatura</option>
            <option value="coordinador">Coordinador</option>
            <option value="asistente">Asistente</option>
          </select>
          <p className="text-[11px] leading-snug text-white/50">
            Cambiar a Jefatura o Coordinación cierra la sesión actual.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-ladp-navy md:border-b md:border-ladp-navy/10 md:bg-ladp-surface">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="md:hidden">{brand}</div>
            <div className="ml-auto flex min-w-0 items-center gap-3">
              <div className="min-w-0 text-right">
                <p className="max-w-[9rem] truncate text-sm font-bold text-white md:max-w-none md:text-ladp-navy-dark">
                  {user.nombre}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ladp-amber md:text-ladp-slate">
                  {USER_ROLE_LABELS[user.rol]}
                </p>
              </div>
              <span className="hidden h-11 w-11 items-center justify-center rounded-full bg-ladp-cobalt text-sm font-black text-white md:flex">
                {initialsFor(user.nombre)}
              </span>
              <button
                type="button"
                data-testid="nav-logout"
                onClick={() => void onLogout()}
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-white/25 px-3 text-sm font-bold text-white transition-colors hover:bg-white/10 md:border-ladp-navy/20 md:text-ladp-navy-dark md:hover:bg-ladp-bg"
                aria-label="Salir de la sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden={true} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          <nav aria-label="Navegación principal móvil" className="md:hidden">
            <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-bold ${
                      active ? "bg-ladp-orange text-white" : "bg-white/10 text-white/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden={true} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </header>

        <main
          id="contenido-principal"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-40 sm:px-6 md:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
