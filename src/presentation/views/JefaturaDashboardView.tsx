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
import { getContainer } from "@/infrastructure/container";
import { DEMO_USERS } from "@/infrastructure/seed/demo-data";

import { useAppSession } from "@/presentation/components/layout/RoleShell";
import { IncidenciasCampoTab } from "@/presentation/components/jefatura/IncidenciasCampoTab";
import { JefaturaAnalyticsCharts } from "@/presentation/components/jefatura/JefaturaAnalyticsCharts";
import { JefaturaFilterBar } from "@/presentation/components/jefatura/JefaturaFilterBar";
import { JefaturaHeroBanner } from "@/presentation/components/jefatura/JefaturaHeroBanner";
import { JefaturaIncidentTable } from "@/presentation/components/jefatura/JefaturaIncidentTable";
import { JefaturaKpiCards } from "@/presentation/components/jefatura/JefaturaKpiCards";
import { RegistroTacticoTab } from "@/presentation/components/jefatura/RegistroTacticoTab";
import { SupervisionMandosTab } from "@/presentation/components/jefatura/SupervisionMandosTab";
import { downloadTextFile } from "@/presentation/lib/download";
import { formatCount } from "@/presentation/lib/format";

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
  { id: "coordinadores", label: "Desempeño de Coordinadores", icon: Users },
  { id: "asistentes", label: "Actividad de Asistentes", icon: Activity },
];

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
      if (
        selectedRegion !== "all" &&
        !centroPoblado.region.toLowerCase().includes(selectedRegion.toLowerCase())
      ) {
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
  }, [rows, codeSearch, sectorSearch, selectedRegion, selectedStatus, selectedTipo]);

  const handleResetFilters = () => {
    setCodeSearch("");
    setSectorSearch("");
    setSelectedRegion("all");
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
    <div className="space-y-6">
      {/* Institutional Hero Command Banner */}
      <JefaturaHeroBanner
        onExportCsv={handleExport}
        exporting={exporting}
        exportError={exportError}
      />

      {loadError ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-600/30 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {loadError}
        </p>
      ) : null}

      {/* Navigation Tabs Bar */}
      <section className="overflow-hidden rounded-2xl bg-surface-container-lowest p-2 shadow-sm border border-surface-container-high/40">
        <div
          role="tablist"
          aria-label="Vistas del panel nacional"
          className="flex gap-1.5 overflow-x-auto"
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
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider transition-all ${
                  active
                    ? "bg-secondary text-on-secondary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <Icon className="h-4 w-4" />
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
        className="space-y-6"
      >
        {activeTab === "incidencias" ? (
          <>
            {/* KPI Cards Grid */}
            {loading || !kpis ? (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
                aria-busy="true"
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl bg-surface-container-low"
                  />
                ))}
              </div>
            ) : (
              <JefaturaKpiCards kpis={kpis} />
            )}

            {/* Analytics & Charts (Donut & Regional Bars) */}
            <JefaturaAnalyticsCharts rows={rows} />

            {/* Tactical Search & Filter Bar */}
            <JefaturaFilterBar
              codeSearch={codeSearch}
              onCodeSearchChange={setCodeSearch}
              sectorSearch={sectorSearch}
              onSectorSearchChange={setSectorSearch}
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
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
          <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40">
            <div className="border-b border-surface-container-high/20 p-4 sm:px-6">
              <h3 className="text-base font-black text-on-surface">
                Desempeño y Cobertura de Coordinadores Zonales
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Supervisión del avance territorial y verificación de reportes por zona asignada.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <caption className="sr-only">Desempeño de coordinadores</caption>
                <thead className="bg-primary text-on-primary font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Coordinador</th>
                    <th scope="col" className="px-4 py-3">Región Asignada</th>
                    <th scope="col" className="px-4 py-3">Centros Poblados</th>
                    <th scope="col" className="px-4 py-3">Incidencias en Área</th>
                    <th scope="col" className="px-4 py-3">Verificadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40 text-on-surface font-medium">
                  {coordinatorRows.map(
                    ({ profile, centros: centroCount, incidencias, verificadas }) => (
                      <tr key={profile.id} className="transition-colors hover:bg-surface-container-low/50">
                        <td className="px-4 py-3 font-bold text-on-surface">{profile.nombre}</td>
                        <td className="px-4 py-3 text-on-surface-variant font-bold">
                          {profile.teatroOperacionesRegion ?? "Nacional"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          {centroCount} centros
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-secondary">
                          {formatCount(incidencias)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-black uppercase text-green-800">
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
          <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40">
            <div className="border-b border-surface-container-high/20 p-4 sm:px-6">
              <h3 className="text-base font-black text-on-surface">
                Actividad y Reportes de Asistentes de Brigada
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Registro del personal en campo y volumen de levantamiento de datos por agente.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                <caption className="sr-only">Actividad de asistentes</caption>
                <thead className="bg-primary text-on-primary font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Asistente</th>
                    <th scope="col" className="px-4 py-3">Región de Despliegue</th>
                    <th scope="col" className="px-4 py-3">Reportes Creados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40 text-on-surface font-medium">
                  {assistantRows.map(({ profile, reportes }) => (
                    <tr key={profile.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-4 py-3 font-bold text-on-surface">{profile.nombre}</td>
                      <td className="px-4 py-3 text-on-surface-variant font-bold">
                        {profile.teatroOperacionesRegion ?? "Nacional"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-secondary">
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

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-container-high/30 pt-4 text-xs font-medium text-on-surface-variant">
        <span>
          Sesión Activa: <strong className="text-on-surface font-bold">{USER_ROLE_LABELS[user.rol]}</strong> ({user.nombre})
        </span>
        <span className="font-mono text-[11px]">
          AYUDA LADP v1.0 • Cache Local Seguro Activo
        </span>
      </footer>
    </div>
  );
}
