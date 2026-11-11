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
  Clock,
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
    <Link href={homeForRole(user.rol)} className="flex items-center gap-2.5">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#195cc7] to-[#0b357c] shadow-[0_6px_16px_rgba(0,0,0,0.32)] ring-1 ring-white/25">
        <ShieldCheck className="h-5 w-5 text-white" aria-hidden={true} />
        <Flame
          className="absolute -bottom-1 -right-1 h-4.5 w-4.5 rounded-full bg-[#041235] p-0.5 text-ladp-orange"
          aria-hidden={true}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-black leading-tight tracking-tight text-white">
          AYUDA LADP
        </span>
        <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-200/75">
          Respuesta humanitaria
        </span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#eef3fb] md:flex">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ladp-surface focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-ladp-navy"
      >
        Saltar al contenido principal
      </a>

      <aside className="relative hidden w-[232px] lg:w-[238px] shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#061842] via-[#041130] to-[#02091c] border-r border-white/10 md:sticky md:top-0 md:flex md:h-screen shadow-xl">
        {/* Decorative diagonal ambient glass wave matching reference sidebar */}
        <svg
          aria-hidden="true"
          viewBox="0 0 240 800"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        >
          <defs>
            <linearGradient id="sidebar-wave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e64db" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#0e3b94" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#02091c" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 0 L240 0 L240 280 C165 360 95 450 0 560 Z" fill="url(#sidebar-wave)" />
          <path d="M0 440 C95 365 170 315 240 240 L240 800 L0 800 Z" fill="#010717" opacity="0.5" />
        </svg>

        <div className="relative z-10 px-4 py-4 border-b border-white/10">{brand}</div>

        <nav aria-label="Navegación principal" className="relative z-10 flex-1 overflow-y-auto px-3 py-3.5">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#0e52c8] to-[#093a94] text-white shadow-[0_6px_18px_-4px_rgba(14,82,200,0.65)] ring-1 ring-white/20"
                        : "text-blue-100/80 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden={true} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user.rol === "jefatura" ? (
          <div className="relative z-10 px-3 pb-2.5">
            <div className="rounded-xl border border-white/12 bg-white/[0.045] p-3 flex flex-col gap-2 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-blue-200/85">
                <span className="uppercase tracking-[0.02em] whitespace-nowrap">Últ. Act. Estadísticas</span>
                <span className="shrink-0 rounded-md bg-[#0e4ec3] px-1.5 py-0.5 font-mono text-[9px] font-bold text-white whitespace-nowrap">
                  Hora: 14:30
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                <span className="inline-flex items-center gap-1.5 text-white/90">
                  <Calendar className="h-3.5 w-3.5 text-sky-300" aria-hidden={true} />
                  <span>12/02/2026</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-blue-100/90">
                  <Clock className="h-3 w-3 text-sky-300" aria-hidden={true} />
                  <span>01:20:45</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[9.5px] font-semibold text-blue-100/75">
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="uppercase tracking-wider text-white/90">SAT-LINK</span>
                  <span className="rounded bg-white/10 px-1 py-px font-mono text-[8.5px] text-sky-200">
                    ENCR 256B
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-300">
                  <Lock className="h-2.5 w-2.5" aria-hidden={true} />
                  99.4%
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="relative z-10 space-y-1.5 border-t border-white/10 px-3.5 pt-2.5 pb-4 bg-black/25">
          <label
            className="block text-[10.5px] font-semibold text-blue-200/80"
            htmlFor="role-switcher"
          >
            Cambiar de rol
          </label>
          <select
            id="role-switcher"
            value={user.rol}
            disabled={switching}
            onChange={(event) => void handleRoleChange(event.target.value as UserRole)}
            className="h-9 w-full rounded-xl border border-white/15 bg-[#091c45] px-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            title="Cambiar de rol cierra la sesión actual"
          >
            <option value="jefatura">Jefatura</option>
            <option value="coordinador">Coordinador</option>
            <option value="asistente">Asistente</option>
          </select>
          <p className="text-[9.5px] leading-tight text-white/45">
            Cambiar a Jefatura o Coordinación cierra la sesión actual.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-ladp-navy md:border-b md:border-slate-200/80 md:bg-white/95 md:backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-6">
            <div className="md:hidden">{brand}</div>
            {user.rol === "jefatura" ? (
              <div className="hidden items-center gap-2 md:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f6fc] border border-[#dce6f5] px-3 py-1 text-[11px] font-bold text-[#1e293b]">
                  <Calendar className="h-3.5 w-3.5 text-[#0e4ec3]" />
                  FEB 2026
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f6fc] border border-[#dce6f5] px-3 py-1 text-[11px] font-bold text-[#1e293b]">
                  <MapPin className="h-3.5 w-3.5 text-[#0e4ec3]" />
                  Nivel Nacional (Todas las Regiones)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf1fd] border border-[#cde0fc] px-3 py-1 text-[11px] font-bold text-[#0e4ec3]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0e4ec3]" />
                  Usuarios Jefatura Activos: 6/6
                </span>
              </div>
            ) : null}
            <div className="ml-auto flex min-w-0 items-center gap-2.5">
              <div className="min-w-0 text-right">
                <p className="max-w-[10rem] truncate text-[13px] font-bold text-white md:max-w-none md:text-[#0f172a] leading-tight">
                  {user.nombre}
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ladp-amber md:text-[#0e4ec3]">
                  {USER_ROLE_LABELS[user.rol]}
                </p>
              </div>
              <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#0e4ec3] text-xs font-extrabold text-white shadow-xs md:flex ring-2 ring-blue-100">
                {initialsFor(user.nombre)}
              </span>
              <button
                type="button"
                data-testid="nav-logout"
                onClick={() => void onLogout()}
                className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-bold text-white transition-all hover:bg-white/10 md:border-slate-200 md:bg-white md:text-slate-700 md:hover:bg-slate-50"
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
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 pb-24 sm:px-5 lg:px-6"
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
