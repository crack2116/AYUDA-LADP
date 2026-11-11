"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Eye,
  FileDown,
  Map as MapIcon,
  Radar,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import { USER_ROLE_LABELS, type UserProfile, type UserRole } from "@/domain/entities/user";
import { toLimaDateKey } from "@/domain/lib/date";
import {
  buildPersonnelSupervisionRows,
  extractInitials,
  summarizeRegionsDeployment,
  type PersonnelSupervisionRow,
} from "@/domain/services/territorial-analysis";
import { getContainer } from "@/infrastructure/container";
import { toCsv } from "@/infrastructure/csv/csv.exporter";
import { downloadTextFile } from "@/presentation/lib/download";
import { formatCount, formatDateKey } from "@/presentation/lib/format";

export interface SupervisionMandosTabProps {
  users?: readonly UserProfile[];
  centros?: readonly CentroPoblado[];
  rows?: readonly IncidenciaConCentro[];
  currentUser?: UserProfile | null;
  onNavigateTab?: (tab: "incidencias" | "campo" | "registro") => void;
}

export function SupervisionMandosTab({
  users: usersProp,
  centros: centrosProp,
  rows: rowsProp,
  currentUser: currentUserProp,
  onNavigateTab,
}: SupervisionMandosTabProps) {
  const [loadedUsers, setLoadedUsers] = useState<UserProfile[]>([]);
  const [loadedCentros, setLoadedCentros] = useState<CentroPoblado[]>([]);
  const [loadedRows, setLoadedRows] = useState<IncidenciaConCentro[]>([]);
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(null);

  const [selectedMacroRegion, setSelectedMacroRegion] = useState<string>("all");
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<"all" | UserRole>("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);

  const users = useMemo(
    () => (usersProp !== undefined ? usersProp : loadedUsers),
    [usersProp, loadedUsers],
  );
  const centros = useMemo(
    () => (centrosProp !== undefined ? centrosProp : loadedCentros),
    [centrosProp, loadedCentros],
  );
  const rows = useMemo(
    () => (rowsProp !== undefined ? rowsProp : loadedRows),
    [rowsProp, loadedRows],
  );
  const resolvedUser = currentUserProp ?? sessionUser;

  useEffect(() => {
    let active = true;
    const container = getContainer();

    const hydrate = async () => {
      if (currentUserProp === undefined) {
        const session = await container.authRepository.restoreSession();
        if (active) setSessionUser(session);
      }

      if (usersProp === undefined) {
        const list = await container.authRepository.listUsers();
        if (active) setLoadedUsers(list);
      }

      if (centrosProp === undefined || rowsProp === undefined) {
        const [centroList, incList] = await Promise.all([
          container.centroPobladoRepository.listAll(),
          container.incidenciaRepository.listAll(),
        ]);
        if (!active) return;

        if (centrosProp === undefined) setLoadedCentros(centroList);
        if (rowsProp === undefined) {
          const map = new Map(centroList.map((c) => [c.id, c]));
          const joined: IncidenciaConCentro[] = [];
          for (const incidencia of incList) {
            const centroPoblado = map.get(incidencia.centroPobladoId);
            if (centroPoblado) joined.push({ incidencia, centroPoblado });
          }
          setLoadedRows(joined);
        }
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [centrosProp, currentUserProp, rowsProp, usersProp]);

  const regionSummaries = useMemo(
    () => summarizeRegionsDeployment(users, centros, rows),
    [users, centros, rows],
  );

  const visibleRegionSummaries = useMemo(() => {
    if (selectedMacroRegion === "all") return regionSummaries;
    return regionSummaries.filter((summary) => summary.region === selectedMacroRegion);
  }, [regionSummaries, selectedMacroRegion]);

  const personnelRows = useMemo(
    () => buildPersonnelSupervisionRows(users, centros, rows),
    [users, centros, rows],
  );

  const regionFilterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of centros) set.add(c.region);
    for (const u of users) {
      if (u.teatroOperacionesRegion) set.add(u.teatroOperacionesRegion);
    }
    return [...set].sort();
  }, [centros, users]);

  const filteredPersonnel = useMemo(() => {
    const query = personnelSearch.trim().toLowerCase();
    return personnelRows.filter(({ profile }) => {
      if (
        query &&
        !profile.nombre.toLowerCase().includes(query) &&
        !profile.identificadorOficial.toLowerCase().includes(query) &&
        !(profile.teatroOperacionesRegion ?? "nacional").toLowerCase().includes(query)
      ) {
        return false;
      }
      if (selectedRole !== "all" && profile.rol !== selectedRole) {
        return false;
      }
      if (selectedRegion !== "all") {
        const userRegion = profile.teatroOperacionesRegion ?? "Nacional";
        if (userRegion !== selectedRegion) return false;
      }
      return true;
    });
  }, [personnelRows, personnelSearch, selectedRegion, selectedRole]);

  const inspectedRow: PersonnelSupervisionRow | null = useMemo(
    () =>
      inspectedUserId
        ? (personnelRows.find((r) => r.profile.id === inspectedUserId) ?? null)
        : null,
    [inspectedUserId, personnelRows],
  );

  const kpis = useMemo(() => {
    const jefaturaCount = users.filter((u) => u.rol === "jefatura").length;
    const coordCount = users.filter((u) => u.rol === "coordinador").length;
    const asistenteCount = users.filter((u) => u.rol === "asistente").length;
    const assignedCentros = centros.filter((c) => c.coordinadorZonaId !== null).length;
    const centrosWithReports = new Set(rows.map((r) => r.centroPoblado.id)).size;
    const verifiedCount = rows.filter((r) => r.incidencia.verificado).length;
    const verifiedPct =
      rows.length === 0 ? 0 : Math.round((verifiedCount / rows.length) * 100);
    return {
      totalUsers: users.length,
      jefaturaCount,
      coordCount,
      asistenteCount,
      totalCentros: centros.length,
      assignedCentros,
      centrosWithReports,
      regionCount: regionSummaries.length,
      verifiedCount,
      pendingCount: rows.length - verifiedCount,
      verifiedPct,
    };
  }, [centros, regionSummaries.length, rows, users]);

  const jefaturaCommandList = useMemo(
    () => users.filter((u) => u.rol === "jefatura"),
    [users],
  );

  const handleExportNominaCsv = () => {
    const headers = [
      "Identificador Oficial",
      "Nombre",
      "Rol",
      "Region Asignada",
      "Centros Asignados",
      "Incidencias en Area / Creadas",
      "Verificadas",
      "Ultimo Suceso",
    ];
    const data = filteredPersonnel.map((item) => [
      item.profile.identificadorOficial,
      item.profile.nombre,
      USER_ROLE_LABELS[item.profile.rol],
      item.profile.teatroOperacionesRegion ?? "Nacional",
      String(item.assignedCentros.length),
      String(item.areaIncidenciasCount),
      String(item.areaVerifiedCount),
      item.latestDateKey ?? "Sin actividad",
    ]);
    const csv = toCsv(headers, data);
    downloadTextFile(`nomina-supervision-${toLimaDateKey(new Date())}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] xl:flex-row xl:items-center">
        <div className="flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mist px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-ink">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
              </span>
              CATÁLOGO OPERATIVO ACTIVO
            </span>
            <span className="font-bold text-slate-400">•</span>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              RED NACIONAL AYUDA LADP
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
            SUPERVISIÓN DE MANDOS Y DESPLIEGUE TERRITORIAL
          </h2>

          <p className="text-sm font-medium leading-relaxed text-slate-500">
            Supervisión real de cuentas activas por rol, cobertura de centros poblados por región y
            avance de validación en campo sobre el repositorio de incidencias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start xl:self-center">
          <button
            type="button"
            data-testid="export-nomina-btn"
            onClick={handleExportNominaCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-4 py-2.5 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
          >
            <FileDown className="h-4 w-4" />
            <span>Exportar Nómina (CSV)</span>
          </button>
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => onNavigateTab("campo")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-blue"
            >
              <Radar className="h-4 w-4" />
              <span>Abrir Monitoreo Geoespacial</span>
            </button>
          ) : null}
        </div>
      </section>

      {/* 4 Real KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personal en Plataforma
              </span>
              <span
                data-testid="sup-kpi-users"
                className="mt-1 text-3xl font-bold tracking-tight text-brand-ink"
              >
                {formatCount(kpis.totalUsers)}
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <span className="font-medium text-slate-600">
              {kpis.jefaturaCount} Jefatura · {kpis.coordCount} Coord. · {kpis.asistenteCount}{" "}
              Asistentes
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Centros Poblados Cubiertos
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                {formatCount(kpis.totalCentros)}
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <span className="font-medium text-slate-600">
              {kpis.assignedCentros} con coordinador zonal · {kpis.centrosWithReports} con reportes
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Regiones con Cobertura
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                {formatCount(kpis.regionCount)}
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-ladp-orange">
              <MapIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
            {regionSummaries.map((item) => (
              <span
                key={item.region}
                className="rounded bg-brand-mist px-1.5 py-0.5 text-[10px] font-bold text-brand-ink"
              >
                {item.region}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Avance de Validación
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                {kpis.verifiedPct}%
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-brand-positive">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-slate-500">
              <span>
                {kpis.verifiedCount} verificadas · {kpis.pendingCount} pendientes
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-blue"
                style={{ width: `${kpis.verifiedPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dual Panel: Regional Deployment + Active Jefatura Command & Workflow Protocol */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left 7 cols */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-brand-blue" />
                <h3 className="text-base font-bold text-brand-ink">
                  Matriz de Regiones y Despliegue Territorial
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-brand-mist p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMacroRegion("all")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                    selectedMacroRegion === "all"
                      ? "bg-brand-blue text-white shadow-xs"
                      : "text-slate-500 hover:text-brand-ink"
                  }`}
                >
                  Todas
                </button>
                {regionSummaries.map((item) => (
                  <button
                    key={item.region}
                    type="button"
                    onClick={() => setSelectedMacroRegion(item.region)}
                    className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                      selectedMacroRegion === item.region
                        ? "bg-brand-blue text-white shadow-xs"
                        : "text-slate-500 hover:text-brand-ink"
                    }`}
                  >
                    {item.region}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {visibleRegionSummaries.map((region) => {
                const verifiedRatio =
                  region.totalIncidencias === 0
                    ? 0
                    : Math.round((region.verificadas / region.totalIncidencias) * 100);
                return (
                  <div
                    key={region.region}
                    data-testid="region-deployment-card"
                    className="flex flex-col gap-2.5 rounded-xl bg-brand-mist p-4 transition-colors hover:bg-brand-soft/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-brand-ink">{region.region}</h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              region.pendientes > 0
                                ? "bg-amber-50 text-ladp-orange"
                                : "bg-emerald-50 text-brand-positive"
                            }`}
                          >
                            {region.pendientes} pendientes
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          Coordinación:{" "}
                          <strong className="font-bold text-brand-ink">
                            {region.coordinadores.length > 0
                              ? region.coordinadores.map((c) => c.nombre).join(", ")
                              : "Sin coordinador asignado"}
                          </strong>
                        </p>
                      </div>

                      <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-ink">
                        {region.centros.length} centros · {region.asistentes.length} asistentes
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-lg bg-white p-2">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Reportes Activos
                        </span>
                        <span className="text-sm font-bold text-brand-ink">
                          {formatCount(region.totalIncidencias)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white p-2">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Hogares Reportados
                        </span>
                        <span className="text-sm font-bold text-brand-ink">
                          {formatCount(region.totalHogares)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white p-2">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Verificadas
                        </span>
                        <span className="text-sm font-bold text-brand-positive">
                          {formatCount(region.verificadas)} ({verifiedRatio}%)
                        </span>
                      </div>
                      <div className="rounded-lg bg-white p-2">
                        <span className="block text-[10px] font-bold uppercase text-slate-500">
                          Último Suceso
                        </span>
                        <span className="font-mono text-xs font-bold text-brand-ink">
                          {formatDateKey(region.latestDateKey)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] font-medium text-slate-600">
                      Sectores: {region.sectores.join(", ")}
                    </p>
                  </div>
                );
              })}

              {visibleRegionSummaries.length === 0 ? (
                <p className="py-6 text-center text-xs font-semibold text-slate-500">
                  No hay regiones registradas en el catálogo.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right 5 cols */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Active Jefatura Session & National Command Accounts */}
          <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-brand-blue" />
                <h3 className="text-base font-bold text-brand-ink">
                  Jefatura Nacional en Turno
                </h3>
              </div>
              <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase text-brand-blue">
                Ámbito Nacional
              </span>
            </div>

            {resolvedUser ? (
              <div className="flex items-center gap-4 rounded-xl bg-brand-mist p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-deep font-mono text-lg font-bold text-white">
                  {extractInitials(resolvedUser.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                    {resolvedUser.identificadorOficial} · {USER_ROLE_LABELS[resolvedUser.rol]}
                  </span>
                  <h4 className="truncate text-base font-bold text-brand-ink">
                    {resolvedUser.nombre}
                  </h4>
                  <span className="text-xs font-medium text-slate-500">
                    Sesión autenticada con acceso nacional completo
                  </span>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cuentas de Jefatura ({jefaturaCommandList.length})
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {jefaturaCommandList.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between rounded-lg bg-brand-mist px-3 py-2 text-xs"
                  >
                    <span className="truncate font-bold text-brand-ink">{profile.nombre}</span>
                    <span className="font-mono text-[10px] font-semibold text-brand-blue">
                      {profile.identificadorOficial}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real LADP Operating Flow */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="h-5 w-5 text-ladp-orange" />
              <h3 className="text-base font-bold text-brand-ink">
                Flujo de Validación y Escalación LADP
              </h3>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-start gap-3 rounded-xl bg-brand-mist p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono font-bold text-brand-blue">
                  01
                </span>
                <div>
                  <span className="font-bold text-brand-ink">
                    Levantamiento de Campo y Control 7 días
                  </span>
                  <p className="mt-0.5 font-medium text-slate-500">
                    Asistentes y Jefatura registran incidencias con detección automática de duplicados
                    por centro poblado en ventana de 7 días.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-brand-mist p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 font-mono font-bold text-ladp-orange">
                  02
                </span>
                <div>
                  <span className="font-bold text-brand-ink">
                    Validación Zonal ({kpis.pendingCount} pendientes)
                  </span>
                  <p className="mt-0.5 font-medium text-slate-500">
                    Coordinadores de área y Jefatura verifican la existencia en terreno antes de
                    cerrar el indicador nacional.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-brand-mist p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-mono font-bold text-brand-positive">
                  03
                </span>
                <div>
                  <span className="font-bold text-brand-ink">
                    Consolidación y Exportación Auditada
                  </span>
                  <p className="mt-0.5 font-medium text-slate-500">
                    Cada registro queda trazado por su código INC único para exportación CSV y
                    GeoJSON sin mutación de históricos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personnel Table */}
      <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-brand-ink">
              Nómina Nacional de Personal Operativo
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {filteredPersonnel.length} de {personnelRows.length} cuentas mostradas ·{" "}
              {kpis.regionCount} regiones
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={personnelSearch}
                onChange={(e) => setPersonnelSearch(e.target.value)}
                placeholder="Buscar personal, ID o región..."
                className="h-9 w-full rounded-lg bg-brand-mist pl-8 pr-3 text-xs font-semibold text-brand-ink placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
            </div>

            <select
              aria-label="Filtrar por rol"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as "all" | UserRole)}
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
            >
              <option value="all">Todos los Roles</option>
              <option value="jefatura">Jefatura Nacional</option>
              <option value="coordinador">Coordinador Territorial</option>
              <option value="asistente">Asistente de Campo</option>
            </select>

            <select
              aria-label="Filtrar personal por región"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
            >
              <option value="all">Todas las Regiones</option>
              <option value="Nacional">Ámbito Nacional</option>
              {regionFilterOptions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-brand-mist text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-3">
                  Personal / ID Oficial
                </th>
                <th scope="col" className="px-4 py-3">
                  Rol
                </th>
                <th scope="col" className="px-4 py-3">
                  Región / Jurisdicción
                </th>
                <th scope="col" className="px-4 py-3">
                  Cobertura
                </th>
                <th scope="col" className="px-4 py-3">
                  Actividad en Área
                </th>
                <th scope="col" className="px-4 py-3">
                  Último Suceso
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-brand-ink">
              {filteredPersonnel.map((item) => (
                <tr
                  key={item.profile.id}
                  data-testid="personnel-row"
                  className="transition-colors hover:bg-brand-mist/60"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-deep font-mono text-xs font-bold text-white">
                        {item.initials}
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-bold text-brand-ink">
                          {item.profile.nombre}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {item.profile.identificadorOficial}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.profile.rol === "jefatura"
                          ? "bg-brand-soft text-brand-blue"
                          : item.profile.rol === "coordinador"
                            ? "bg-amber-50 text-ladp-orange"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {USER_ROLE_LABELS[item.profile.rol]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-brand-ink">
                    {item.profile.teatroOperacionesRegion ?? "Nacional"}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-brand-blue">
                    {formatCount(item.assignedCentros.length)}{" "}
                    {item.assignedCentros.length === 1 ? "centro" : "centros"}
                  </td>
                  <td className="px-4 py-3.5 font-mono">
                    {item.profile.rol === "asistente"
                      ? `${item.createdCount} creados`
                      : `${item.areaIncidenciasCount} rep. (${item.areaVerifiedCount} val.)`}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">
                    {formatDateKey(item.latestDateKey)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setInspectedUserId(item.profile.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-mist px-2.5 py-1 text-xs font-bold text-brand-blue hover:bg-brand-soft"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver centros</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPersonnel.length === 0 ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-500">
              No se encontró personal que coincida con los filtros aplicados.
            </p>
          ) : null}
        </div>
      </section>

      {/* Personnel Assignment Modal */}
      {inspectedRow ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de cobertura de ${inspectedRow.profile.nombre}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-blue">
                  {inspectedRow.profile.identificadorOficial} ·{" "}
                  {USER_ROLE_LABELS[inspectedRow.profile.rol]}
                </span>
                <h4 className="mt-0.5 text-lg font-bold text-brand-ink">
                  {inspectedRow.profile.nombre}
                </h4>
                <p className="text-xs font-medium text-slate-500">
                  Jurisdicción: {inspectedRow.profile.teatroOperacionesRegion ?? "Nacional"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setInspectedUserId(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-mist hover:text-brand-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-500">
                Centros poblados asignados / cubiertos ({inspectedRow.assignedCentros.length})
              </p>
              <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                {inspectedRow.assignedCentros.map((centro) => (
                  <div
                    key={centro.id}
                    className="flex items-center justify-between rounded-lg bg-brand-mist px-3 py-2"
                  >
                    <span className="font-bold text-brand-ink">{centro.nombre}</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {centro.sector} · {centro.region}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectedUserId(null)}
                className="rounded-lg bg-brand-deep px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
