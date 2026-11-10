"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  Download,
  House,
  ShieldCheck,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import type { JefaturaKpis } from "@/domain/entities/kpis";
import {
  labelForNecesidad,
  labelForTipoAfectacion,
} from "@/domain/entities/incidencia";
import { USER_ROLE_LABELS } from "@/domain/entities/user";import { isIncidenciaVisible, scopeForUser } from "@/domain/permissions/rbac";
import { getContainer } from "@/infrastructure/container";
import { DEMO_USERS } from "@/infrastructure/seed/demo-data";

import { useAppSession } from "@/presentation/components/layout/RoleShell";
import { downloadTextFile } from "@/presentation/lib/download";
import { formatCount, formatDateKey } from "@/presentation/lib/format";

type DashboardTab = "incidencias" | "coordinadores" | "asistentes";

const TABS: ReadonlyArray<{ id: DashboardTab; label: string }> = [
  { id: "incidencias", label: "Incidencias nacionales" },
  { id: "coordinadores", label: "Desempeño de coordinadores" },
  { id: "asistentes", label: "Actividad de asistentes" },
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
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ladp-cobalt">
            Jefatura nacional · DINAPROS
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ladp-navy-dark sm:text-3xl">
            Panel de situación nacional
          </h1>
          <p className="mt-1 text-sm text-ladp-slate">
            Lectura ejecutiva de las incidencias reportadas por las brigadas.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            data-testid="export-csv"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ladp-cobalt px-4 text-sm font-black text-white hover:bg-ladp-cobalt-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden={true} />
            {exporting ? "Exportando…" : "Exportar CSV Nacional"}
          </button>
          {exportError ? (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {exportError}
            </p>
          ) : null}
        </div>
      </header>

      {loadError ? (
        <p role="alert" className="rounded-xl border border-red-600/30 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {loadError}
        </p>
      ) : null}

      {loading || !kpis ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-ladp-surface" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            testId="kpi-hogares"
            label="Total de hogares afectados"
            value={formatCount(kpis.totalHogaresAfectados)}
            detail="Suma nacional de hogares reportados"
            icon={House}
          />
          <KpiCard
            testId="kpi-verificadas"
            label="Incidencias verificadas"
            value={formatCount(kpis.incidenciasVerificadas)}
            detail={`${formatCount(kpis.incidenciasPendientes)} pendientes · ${kpis.porcentajeVerificadas}% del total`}
            icon={ShieldCheck}
            progress={kpis.porcentajeVerificadas}
          />
          <KpiCard
            testId="kpi-centros"
            label="Centros poblados afectados"
            value={formatCount(kpis.centrosPobladosAfectados)}
            detail="Centros con al menos un reporte"
            icon={Building2}
          />
          <KpiCard
            testId="kpi-necesidad"
            label="Necesidad principal crítica"
            value={kpis.necesidadPrincipalCritica.label}
            detail={
              kpis.necesidadPrincipalCritica.count > 0
                ? `${formatCount(kpis.necesidadPrincipalCritica.count)} reportes`
                : "Sin datos"
            }
            icon={Activity}
          />
          <KpiCard
            testId="kpi-tipo"
            label="Tipo de afectación predominante"
            value={kpis.tipoAfectacionPredominante.label}
            detail={
              kpis.tipoAfectacionPredominante.count > 0
                ? `${formatCount(kpis.tipoAfectacionPredominante.count)} reportes`
                : "Sin datos"
            }
            icon={AlertTriangle}
          />
          <KpiCard
            testId="kpi-ultimas-24h"
            label="Reportes en las últimas 24h"
            value={formatCount(kpis.reportesUltimas24h)}
            detail="Registrados en las últimas 24 horas"
            icon={Clock}
          />
        </div>
      )}

      <section className="ladp-surface-card overflow-hidden">
        <div
          role="tablist"
          aria-label="Vistas del panel nacional"
          className="flex gap-1 overflow-x-auto border-b border-ladp-navy/10 bg-ladp-bg px-2 pt-2"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
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
                className={`min-h-11 shrink-0 rounded-t-xl px-4 text-sm font-bold ${
                  active
                    ? "bg-ladp-surface text-ladp-navy-dark"
                    : "text-ladp-slate hover:bg-white/60 hover:text-ladp-navy-dark"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="p-4 sm:p-5"
        >
          {activeTab === "incidencias" ? (
            <IncidenciasTable rows={rows} loading={loading} />
          ) : null}

          {activeTab === "coordinadores" ? (
            <div className="overflow-x-auto rounded-xl border border-ladp-navy/10">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <caption className="sr-only">Desempeño de coordinadores</caption>
                <thead className="bg-ladp-bg text-xs uppercase tracking-wide text-ladp-slate">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-bold">Coordinador</th>
                    <th scope="col" className="px-3 py-3 font-bold">Región</th>
                    <th scope="col" className="px-3 py-3 font-bold">Centros</th>
                    <th scope="col" className="px-3 py-3 font-bold">Incidencias en su área</th>
                    <th scope="col" className="px-3 py-3 font-bold">Verificadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ladp-navy/10">
                  {coordinatorRows.map(({ profile, centros: centroCount, incidencias, verificadas }) => (
                    <tr key={profile.id}>
                      <td className="px-3 py-3 font-bold text-ladp-navy-dark">{profile.nombre}</td>
                      <td className="px-3 py-3 text-ladp-slate">
                        {profile.teatroOperacionesRegion ?? "Nacional"}
                      </td>
                      <td className="px-3 py-3 font-semibold">{centroCount}</td>
                      <td className="px-3 py-3 font-semibold">{formatCount(incidencias)}</td>
                      <td className="px-3 py-3 font-semibold">{formatCount(verificadas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "asistentes" ? (
            <div className="overflow-x-auto rounded-xl border border-ladp-navy/10">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <caption className="sr-only">Actividad de asistentes</caption>
                <thead className="bg-ladp-bg text-xs uppercase tracking-wide text-ladp-slate">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-bold">Asistente</th>
                    <th scope="col" className="px-3 py-3 font-bold">Región</th>
                    <th scope="col" className="px-3 py-3 font-bold">Reportes creados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ladp-navy/10">
                  {assistantRows.map(({ profile, reportes }) => (
                    <tr key={profile.id}>
                      <td className="px-3 py-3 font-bold text-ladp-navy-dark">{profile.nombre}</td>
                      <td className="px-3 py-3 text-ladp-slate">
                        {profile.teatroOperacionesRegion ?? "Nacional"}
                      </td>
                      <td className="px-3 py-3 font-semibold">{formatCount(reportes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <p className="text-xs text-ladp-slate">
        Sesión: {USER_ROLE_LABELS[user.rol]} · Los datos se guardan localmente en este
        navegador.
      </p>
    </div>
  );
}

function KpiCard({
  testId,
  label,
  value,
  detail,
  icon: Icon,
  progress,
}: {
  testId: string;
  label: string;
  value: string;
  detail: string;
  icon: typeof House;
  progress?: number;
}) {
  return (
    <article data-testid={testId} className="ladp-surface-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-ladp-slate">{label}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ladp-cobalt/10 text-ladp-cobalt">
          <Icon className="h-5 w-5" aria-hidden={true} />
        </span>
      </div>
      <p className="mt-2 break-words text-2xl font-black leading-tight text-ladp-navy-dark">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-ladp-slate">{detail}</p>
      {typeof progress === "number" ? (
        <div className="mt-3">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-ladp-bg"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Porcentaje de incidencias verificadas"
          >
            <div
              className="h-full rounded-full bg-ladp-orange"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function IncidenciasTable({
  rows,
  loading,
}: {
  rows: readonly IncidenciaConCentro[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-ladp-slate">Cargando incidencias…</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ladp-navy/20 px-4 py-4 text-sm text-ladp-slate">
        Todavía no hay incidencias registradas.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ladp-navy/10">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <caption className="sr-only">Incidencias nacionales</caption>
        <thead className="bg-ladp-bg text-xs uppercase tracking-wide text-ladp-slate">
          <tr>
            <th scope="col" className="px-3 py-3 font-bold">Código</th>
            <th scope="col" className="px-3 py-3 font-bold">Centro poblado</th>
            <th scope="col" className="px-3 py-3 font-bold">Tipo</th>
            <th scope="col" className="px-3 py-3 font-bold">Hogares</th>
            <th scope="col" className="px-3 py-3 font-bold">Necesidad</th>
            <th scope="col" className="px-3 py-3 font-bold">Fecha</th>
            <th scope="col" className="px-3 py-3 font-bold">Verificado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ladp-navy/10">
          {rows.map(({ incidencia, centroPoblado }) => (
            <tr key={incidencia.id} data-testid="incidencia-row">
              <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-bold text-ladp-navy-dark">
                {incidencia.codigoAuditoria}
              </td>
              <td className="px-3 py-3">
                <span className="block font-bold text-ladp-navy-dark">{centroPoblado.nombre}</span>
                <span className="block text-xs text-ladp-slate">{centroPoblado.sector}</span>
              </td>
              <td className="px-3 py-3 text-ladp-slate">
                {labelForTipoAfectacion(incidencia.tipoAfectacion)}
              </td>
              <td className="px-3 py-3 font-semibold">{formatCount(incidencia.hogaresAfectados)}</td>
              <td className="px-3 py-3 text-ladp-slate">
                {labelForNecesidad(incidencia.necesidadPrincipal)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-ladp-slate">
                {formatDateKey(incidencia.fechaSuceso)}
              </td>
              <td className="px-3 py-3">
                <VerifiedBadge verified={incidencia.verificado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
        verified ? "bg-green-100 text-green-800" : "bg-ladp-amber/30 text-ladp-navy-dark"
      }`}
    >
      {verified ? "Verificado" : "Pendiente"}
    </span>
  );
}
