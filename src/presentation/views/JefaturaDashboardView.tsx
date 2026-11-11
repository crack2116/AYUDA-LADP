"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ClipboardCheck,
  LayoutGrid,
  Radar,
  ShieldAlert,
  Users,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import type { JefaturaKpis } from "@/domain/entities/kpis";
import { USER_ROLE_LABELS } from "@/domain/entities/user";
import { isIncidenciaVisible, scopeForUser } from "@/domain/permissions/rbac";
import { calculateJefaturaKpis } from "@/domain/services/kpi-calculator";
import { getContainer } from "@/infrastructure/container";
import { DEMO_USERS } from "@/infrastructure/seed/demo-data";

import { ShellHeaderSlot, useAppSession } from "@/presentation/components/layout/RoleShell";
import { IncidenciasCampoTab } from "@/presentation/components/jefatura/IncidenciasCampoTab";
import { JefaturaAnalyticsCharts } from "@/presentation/components/jefatura/JefaturaAnalyticsCharts";
import { JefaturaFilterBar } from "@/presentation/components/jefatura/JefaturaFilterBar";
import { JefaturaHeroBanner } from "@/presentation/components/jefatura/JefaturaHeroBanner";
import { JefaturaIncidentTable } from "@/presentation/components/jefatura/JefaturaIncidentTable";
import { JefaturaKpiCards } from "@/presentation/components/jefatura/JefaturaKpiCards";
import { JefaturaQuickFilters } from "@/presentation/components/jefatura/JefaturaQuickFilters";
import { RegistroTacticoTab } from "@/presentation/components/jefatura/RegistroTacticoTab";
import { SupervisionMandosTab } from "@/presentation/components/jefatura/SupervisionMandosTab";
import { downloadTextFile } from "@/presentation/lib/download";
import { formatCount, formatPeriodoLabel } from "@/presentation/lib/format";

type DashboardTab =
  | "incidencias"
  | "supervision"
  | "campo"
  | "registro"
  | "coordinadores"
  | "asistentes";

const TABS: ReadonlyArray<{
  id: DashboardTab;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: "incidencias", label: "Dashboard Nacional", icon: LayoutGrid },
  { id: "supervision", label: "Supervisión de Mandos", icon: ShieldAlert },
  { id: "campo", label: "Incidencias de Campo", icon: Radar },
  { id: "registro", label: "Registro Táctico", icon: ClipboardCheck },
  { id: "coordinadores", label: "Desempeño Coord.", icon: Users },
  { id: "asistentes", label: "Actividad Asistentes", icon: Activity },
];

/**
 * Matches a centro poblado against a free-text scope such as "Piura".
 * Demo data stores compound labels ("Piura / Norte"), so the comparison
 * runs over region + name + sector.
 */
function matchesRegion(centro: CentroPoblado, region: string): boolean {
  const needle = region.toLowerCase();
  const haystack = `${centro.region} ${centro.nombre} ${centro.sector}`.toLowerCase();
  return haystack.includes(needle);
}

export function JefaturaDashboardView() {
  const { user } = useAppSession();
  const [kpis, setKpis] = useState<JefaturaKpis | null>(null);
  const [rows, setRows] = useState<IncidenciaConCentro[]>([]);
  const [centros, setCentros] = useState<CentroPoblado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("incidencias");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Tactical search & filter bar state
  const [codeSearch, setCodeSearch] = useState("");
  const [sectorSearch, setSectorSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTipo, setSelectedTipo] = useState("all");

  const load = useCallback(async () => {
    const container = getContainer();
    const [kpiResult, listResult, centroList] = await Promise.all([
      container.useCases.calculateKpis.execute({ now: new Date() }),
      container.useCases.listIncidencias.execute({ user }),
      container.centroPobladoRepository.listAll(),
    ]);

    if (kpiResult.ok) {
      setKpis(kpiResult.value);
    } else {
      setLoadError(kpiResult.error.message);
    }
    if (listResult.ok) {
      setRows(listResult.value);
    } else {
      setLoadError(listResult.error.message);
    }
    setCentros(centroList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const coordinatorRows = useMemo(
    () =>
      DEMO_USERS.filter((profile) => profile.rol === "coordinador").map((profile) => {
        const assignedCentros = centros.filter(
          (centro) =>
            centro.coordinadorZonaId === profile.id ||
            profile.centroPobladoIds.includes(centro.id),
        );
        const areaRows = rows.filter((row) =>
          isIncidenciaVisible(profile, row.incidencia, centros),
        );
        return {
          profile,
          centros: assignedCentros.length,
          incidencias: areaRows.length,
          verificadas: areaRows.filter((row) => row.incidencia.verificado).length,
        };
      }),
    [centros, rows],
  );

  const assistantRows = useMemo(
    () =>
      DEMO_USERS.filter((profile) => profile.rol === "asistente").map((profile) => ({
        profile,
        reportes: rows.filter((row) => row.incidencia.creadoPor === profile.id).length,
      })),
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter(({ incidencia, centroPoblado }) => {
      if (
        codeSearch &&
        !incidencia.codigoAuditoria.toLowerCase().includes(codeSearch.toLowerCase())
      ) {
        return false;
      }
      if (
        sectorSearch &&
        !centroPoblado.nombre.toLowerCase().includes(sectorSearch.toLowerCase()) &&
        !centroPoblado.sector.toLowerCase().includes(sectorSearch.toLowerCase())
      ) {
        return false;
      }
      if (selectedRegion !== "all" && !matchesRegion(centroPoblado, selectedRegion)) {
        return false;
      }
      if (selectedFecha && incidencia.fechaSuceso !== selectedFecha) {
        return false;
      }
      if (selectedStatus === "verified" && !incidencia.verificado) {
        return false;
      }
      if (selectedStatus === "pending" && incidencia.verificado) {
        return false;
      }
      if (
        selectedTipo !== "all" &&
        incidencia.tipoAfectacion !== selectedTipo
      ) {
        return false;
      }
      return true;
    });
  }, [
    rows,
    codeSearch,
    sectorSearch,
    selectedRegion,
    selectedFecha,
    selectedStatus,
    selectedTipo,
  ]);

  const filtersActive =
    codeSearch !== "" ||
    sectorSearch !== "" ||
    selectedRegion !== "all" ||
    selectedFecha !== null ||
    selectedStatus !== "all" ||
    selectedTipo !== "all";

  // Indicators follow the active filters: showing national totals next to an
  // empty filtered table would read as a broken panel.
  const visibleKpis = useMemo(
    () =>
      filtersActive && kpis
        ? calculateJefaturaKpis(
            filteredRows.map((row) => row.incidencia),
            new Date(),
          )
        : kpis,
    [filtersActive, filteredRows, kpis],
  );

  const fechasConDatos = useMemo(    () => rows.map(({ incidencia }) => incidencia.fechaSuceso),
    [rows],
  );

  const handleResetFilters = () => {
    setCodeSearch("");
    setSectorSearch("");
    setSelectedRegion("all");
    setSelectedFecha(null);
    setSelectedStatus("all");
    setSelectedTipo("all");
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const result = await getContainer().useCases.exportCsv.execute({
      user,
      scope: scopeForUser(user),
    });
    setExporting(false);
    if (!result.ok) {
      setExportError(result.error.message);
      return;
    }
    downloadTextFile(result.value.filename, result.value.csv);
  };

  return (
    <div className="space-y-3">
      {/* Operational quick filters: incident day + territorial scope, published in the shell top bar */}
      <ShellHeaderSlot>
        <JefaturaQuickFilters
          fecha={selectedFecha}
          onFechaChange={setSelectedFecha}
          region={selectedRegion}
          onRegionChange={setSelectedRegion}
          fechasConDatos={fechasConDatos}
        />
      </ShellHeaderSlot>

      {/* Institutional Hero Command Banner */}
      <JefaturaHeroBanner
        onExportCsv={handleExport}
        exporting={exporting}
        exportError={exportError}
        periodo={
          rows.length > 0 ? formatPeriodoLabel(rows.map((row) => row.incidencia.fechaSuceso)) : null
        }
      />

      {loadError ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {loadError}
        </p>
      ) : null}

      {/* Navigation Tabs Bar */}
      <section className="rounded-xl bg-white p-1.5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div
          role="tablist"
          aria-label="Vistas del panel nacional"
          className="flex items-center gap-1 overflow-x-auto pb-0.5 lg:overflow-visible"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                data-testid={`tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.02em] whitespace-nowrap transition-colors lg:flex-1 ${
                  active
                    ? "bg-brand-deep text-white"
                    : "text-slate-500 hover:bg-brand-mist hover:text-brand-blue"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Panels */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="space-y-3"
      >
        {activeTab === "incidencias" ? (
          <>
            {/* Indicators (follow the active filters) */}
            {loading || !visibleKpis ? (
              <div
                className="rounded-xl bg-white p-4 sm:p-5"
                aria-busy="true"
              >
                <div className="grid grid-cols-2 gap-5 xl:grid-cols-12">
                  <div className="col-span-2 space-y-2 xl:col-span-4">
                    <div className="h-2.5 w-28 animate-pulse rounded bg-slate-100" />
                    <div className="h-11 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-2.5 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-2 xl:col-span-2">
                      <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                      <div className="h-6 w-12 animate-pulse rounded bg-slate-100" />
                      <div className="h-2 w-24 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <JefaturaKpiCards kpis={visibleKpis} />
            )}

            {/* Analytics & Charts (Donut & Regional Bars) */}
            <JefaturaAnalyticsCharts rows={filteredRows} />

            {/* Tactical Search & Filter Bar */}
            <JefaturaFilterBar
              codeSearch={codeSearch}
              onCodeSearchChange={setCodeSearch}
              sectorSearch={sectorSearch}
              onSectorSearchChange={setSectorSearch}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedTipo={selectedTipo}
              onTipoChange={setSelectedTipo}
              filteredCount={filteredRows.length}
              totalCount={rows.length}
              onResetFilters={handleResetFilters}
            />

            {/* Tactical Master Incidents Table */}
            <JefaturaIncidentTable rows={filteredRows} loading={loading} />
          </>
        ) : null}

        {activeTab === "supervision" ? (
          <SupervisionMandosTab />
        ) : null}

        {activeTab === "campo" ? (
          <IncidenciasCampoTab />
        ) : null}

        {activeTab === "registro" ? (
          <RegistroTacticoTab />
        ) : null}

        {activeTab === "coordinadores" ? (
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="p-4 sm:px-5">
              <h3 className="text-base font-bold text-brand-ink">
                Desempeño y Cobertura de Coordinadores Zonales
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Supervisión del avance territorial y verificación de reportes por zona asignada.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <caption className="sr-only">Desempeño de coordinadores</caption>
                <thead className="bg-brand-mist text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Coordinador</th>
                    <th scope="col" className="px-4 py-3">Región Asignada</th>
                    <th scope="col" className="px-4 py-3">Centros Poblados</th>
                    <th scope="col" className="px-4 py-3">Incidencias en Área</th>
                    <th scope="col" className="px-4 py-3">Verificadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-brand-ink">
                  {coordinatorRows.map(
                    ({ profile, centros: centroCount, incidencias, verificadas }) => (
                      <tr key={profile.id} className="transition-colors hover:bg-brand-mist">
                        <td className="px-4 py-3 font-bold text-brand-ink">{profile.nombre}</td>
                        <td className="px-4 py-3 text-slate-500 font-bold">
                          {profile.teatroOperacionesRegion ?? "Nacional"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-brand-blue">
                          {centroCount} centros
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-brand-blue">
                          {formatCount(incidencias)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                            {formatCount(verificadas)} validadas
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "asistentes" ? (
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="p-4 sm:px-5">
              <h3 className="text-base font-bold text-brand-ink">
                Actividad y Reportes de Asistentes de Brigada
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Registro del personal en campo y volumen de levantamiento de datos por agente.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                <caption className="sr-only">Actividad de asistentes</caption>
                <thead className="bg-brand-mist text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Asistente</th>
                    <th scope="col" className="px-4 py-3">Región de Despliegue</th>
                    <th scope="col" className="px-4 py-3">Reportes Creados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-brand-ink">
                  {assistantRows.map(({ profile, reportes }) => (
                    <tr key={profile.id} className="transition-colors hover:bg-brand-mist">
                      <td className="px-4 py-3 font-bold text-brand-ink">{profile.nombre}</td>
                      <td className="px-4 py-3 text-slate-500 font-bold">
                        {profile.teatroOperacionesRegion ?? "Nacional"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-brand-blue">
                        {formatCount(reportes)} registros
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1 text-[11px] font-medium text-slate-400">
        <span>
          Sesión activa: <strong className="font-bold text-slate-600">{USER_ROLE_LABELS[user.rol]}</strong> ({user.nombre})
        </span>
        <span className="font-mono text-[10.5px]">
          AYUDA LADP v1.0 · Caché local seguro activo
        </span>
      </footer>
    </div>
  );
}
