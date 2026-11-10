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
import {
  Calendar,
  FilePlus2,
  Flame,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";

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
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1d5db6] to-[#0d3b80] shadow-md shadow-blue-950/50 ring-1 ring-white/20">
        <ShieldCheck className="h-6 w-6 text-white" aria-hidden={true} />
        <Flame
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#041235] p-0.5 text-ladp-orange"
          aria-hidden={true}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black leading-tight tracking-tight text-white">
          AYUDA LADP
        </span>
        <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-white/70">
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

      <aside className="relative hidden w-72 shrink-0 flex-col bg-gradient-to-b from-[#030d29] via-[#041235] to-[#020718] border-r border-white/5 md:sticky md:top-0 md:flex md:h-screen shadow-2xl">
        {/* Subtle decorative curved ambient light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(ellipse at top left, #1d5db6 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 px-5 py-6 border-b border-white/10">{brand}</div>

        <nav aria-label="Navegación principal" className="relative z-10 flex-1 px-3 py-4">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#1752a7] to-[#0f3d82] text-white shadow-lg shadow-blue-950/60 border border-blue-400/30 ring-1 ring-white/10"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden={true} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user.rol === "jefatura" ? (
          <div className="relative z-10 border-t border-white/10 p-3 bg-black/20">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col gap-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between text-[10px] font-bold text-white/70">
                <span className="uppercase tracking-wider">Últ. Act. Estadísticas</span>
                <span className="rounded bg-sky-500/20 text-sky-300 font-mono px-1.5 py-0.5 border border-sky-400/30">
                  Hora: 14:30
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-white font-bold">
                <span className="inline-flex items-center gap-1.5 text-white/80 font-sans font-medium">
                  <Calendar className="h-3.5 w-3.5 text-sky-400" /> 12/02/2026
                </span>
                <span className="inline-flex items-center gap-1 text-white/80 font-sans font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sesión: 01:20:45
                </span>
              </div>

              {/* SAT-LINK Telemetry Gauge */}
              <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      SAT-LINK ENLACE
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-sky-200 uppercase">
                    ENCR 256B
                  </span>
                </div>
                <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full transition-all" style={{ width: "99.4%" }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/60 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3 text-sky-400" />
                    <span>Conexión Segura Jefatura</span>
                  </span>
                  <span className="font-mono font-bold text-white">99.4%</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="relative z-10 space-y-2 border-t border-white/10 px-4 py-3.5 bg-black/30">
          <label
            className="block text-[11px] font-bold text-white/70 uppercase tracking-wider"
            htmlFor="role-switcher"
          >
            Cambiar de rol
          </label>
          <select
            id="role-switcher"
            value={user.rol}
            disabled={switching}
            onChange={(event) => void handleRoleChange(event.target.value as UserRole)}
            className="min-h-10 w-full rounded-xl border border-white/20 bg-[#0b1c40] px-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            title="Cambiar de rol cierra la sesión actual"
          >
            <option value="jefatura">Jefatura</option>
            <option value="coordinador">Coordinador</option>
            <option value="asistente">Asistente</option>
          </select>
          <p className="text-[10px] leading-snug text-white/50">
            Cambiar a Jefatura o Coordinación cierra la sesión actual.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-ladp-navy md:border-b md:border-slate-200/80 md:bg-white/95 md:backdrop-blur-md shadow-2xs">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="md:hidden">{brand}</div>
            {user.rol === "jefatura" ? (
              <div className="hidden items-center gap-2.5 md:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/90 px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 text-[#0d428e]" />
                  FEB 2026
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/90 px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                  <MapPin className="h-3.5 w-3.5 text-[#0d428e]" />
                  Nivel Nacional (Todas las Regiones)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-3.5 py-1 text-xs font-bold text-[#0d428e] shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0d428e]" />
                  Usuarios Jefatura Activos: 6/6
                </span>
              </div>
            ) : null}
            <div className="ml-auto flex min-w-0 items-center gap-3">
              <div className="min-w-0 text-right">
                <p className="max-w-[10rem] truncate text-sm font-black text-white md:max-w-none md:text-[#071938]">
                  {user.nombre}
                </p>
                <p className="text-[11px] font-black uppercase tracking-wider text-ladp-amber md:text-[#0d428e]">
                  {USER_ROLE_LABELS[user.rol]}
                </p>
              </div>
              <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#0d428e] text-xs font-black text-white shadow-sm md:flex ring-2 ring-white">
                {initialsFor(user.nombre)}
              </span>
              <button
                type="button"
                data-testid="nav-logout"
                onClick={() => void onLogout()}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/25 px-3 text-xs font-bold text-white transition-all hover:bg-white/10 md:border-slate-200/90 md:bg-white md:text-slate-700 md:hover:bg-slate-50 md:shadow-2xs"
                aria-label="Salir de la sesión"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden={true} />
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
