"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  House,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import {
  labelForNecesidad,
  labelForTipoAfectacion,
} from "@/domain/entities/incidencia";
import { scopeForUser } from "@/domain/permissions/rbac";
import { getContainer } from "@/infrastructure/container";

import { useAppSession } from "@/presentation/components/layout/RoleShell";
import { downloadTextFile } from "@/presentation/lib/download";
import { formatCount, formatDateKey } from "@/presentation/lib/format";

export function CoordinadorAreaView() {
  const { user } = useAppSession();
  const [rows, setRows] = useState<IncidenciaConCentro[]>([]);
  const [centros, setCentros] = useState<CentroPoblado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    const container = getContainer();
    const [listResult, centroList] = await Promise.all([
      container.useCases.listIncidencias.execute({ user }),
      container.centroPobladoRepository.listAll(),
    ]);

    if (listResult.ok) {
      setRows(listResult.value);
    } else {
      setLoadError(listResult.error.message);
    }

    setCentros(
      centroList.filter(
        (centro) =>
          centro.coordinadorZonaId === user.id ||
          user.centroPobladoIds.includes(centro.id),
      ),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(
    () =>
      centros.map((centro) => {
        const centroRows = rows.filter((row) => row.centroPoblado.id === centro.id);
        return {
          centro,
          incidencias: centroRows.length,
          hogares: centroRows.reduce(
            (sum, row) => sum + row.incidencia.hogaresAfectados,
            0,
          ),
        };
      }),
    [centros, rows],
  );

  const totals = useMemo(() => {
    const verificadas = rows.filter((row) => row.incidencia.verificado).length;
    return {
      hogares: rows.reduce((sum, row) => sum + row.incidencia.hogaresAfectados, 0),
      verificadas,
      pendientes: rows.length - verificadas,
      centros: centros.length,
    };
  }, [centros.length, rows]);

  const handleValidate = async (incidenciaId: string) => {
    setValidatingId(incidenciaId);
    setActionError(null);
    const result = await getContainer().useCases.validateExistence.execute({
      incidenciaId,
      user,
    });
    setValidatingId(null);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    await load();
  };

  const handleExport = async () => {
    setExporting(true);
    setActionError(null);
    const result = await getContainer().useCases.exportCsv.execute({
      user,
      scope: scopeForUser(user),
    });
    setExporting(false);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    downloadTextFile(result.value.filename, result.value.csv);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ladp-cobalt">
            Coordinación regional
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ladp-navy-dark sm:text-3xl">
            Mi área de operaciones
          </h1>
          <p className="mt-1 text-sm text-ladp-slate">
            {user.teatroOperacionesRegion ?? "Área asignada"} · valida la existencia de
            los reportes de tu zona.
          </p>
        </div>
        <button
          type="button"
          data-testid="export-csv"
          onClick={() => void handleExport()}
          disabled={exporting}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ladp-cobalt px-4 text-sm font-black text-white hover:bg-ladp-cobalt-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" aria-hidden={true} />
          {exporting ? "Exportando…" : "Exportar CSV de mi Área"}
        </button>
      </header>

      {loadError ? (
        <p role="alert" className="rounded-xl border border-red-600/30 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="rounded-xl border border-red-600/30 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        <KpiChip
          label="Hogares afectados"
          value={formatCount(totals.hogares)}
          icon={House}
        />
        <KpiChip
          label="Verificadas / pendientes"
          value={`${formatCount(totals.verificadas)} / ${formatCount(totals.pendientes)}`}
          icon={ShieldCheck}
        />
        <KpiChip
          label="Centros bajo su mando"
          value={formatCount(totals.centros)}
          icon={Building2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <section aria-labelledby="centros-title" className="space-y-3">
          <h2
            id="centros-title"
            className="flex items-center gap-2 text-lg font-black text-ladp-navy-dark"
          >
            <Building2 className="h-5 w-5 text-ladp-cobalt" aria-hidden={true} />
            Centros poblados
          </h2>

          {loading ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-ladp-surface" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ladp-navy/20 bg-ladp-surface px-4 py-3 text-sm text-ladp-slate">
              No tienes centros poblados asignados.
            </p>
          ) : (
            <ul className="space-y-2">
              {cards.map(({ centro, incidencias, hogares }) => (
                <li key={centro.id} className="ladp-surface-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-black text-ladp-navy-dark">{centro.nombre}</p>
                      <p className="text-xs font-semibold text-ladp-slate">{centro.sector}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-ladp-cobalt/10 px-2.5 py-0.5 text-xs font-black text-ladp-cobalt">
                      {formatCount(incidencias)} rep.
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ladp-slate">
                    <House className="h-4 w-4" aria-hidden={true} />
                    {formatCount(hogares)} hogares afectados
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="incidencias-area-title" className="space-y-3">
          <h2
            id="incidencias-area-title"
            className="flex items-center gap-2 text-lg font-black text-ladp-navy-dark"
          >
            <TriangleAlert className="h-5 w-5 text-ladp-orange" aria-hidden={true} />
            Incidencias de mi área
          </h2>

          {loading ? (
            <p className="text-sm text-ladp-slate" role="status">
              Cargando incidencias…
            </p>
          ) : rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ladp-navy/20 bg-ladp-surface px-4 py-4 text-sm text-ladp-slate">
              No hay incidencias registradas en tu área.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-ladp-navy/10 bg-ladp-surface">
              <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                <caption className="sr-only">Incidencias del área del coordinador</caption>
                <thead className="bg-ladp-bg text-xs uppercase tracking-wide text-ladp-slate">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-bold">Código</th>
                    <th scope="col" className="px-3 py-3 font-bold">Centro</th>
                    <th scope="col" className="px-3 py-3 font-bold">Tipo</th>
                    <th scope="col" className="px-3 py-3 font-bold">Hogares</th>
                    <th scope="col" className="px-3 py-3 font-bold">Necesidad</th>
                    <th scope="col" className="px-3 py-3 font-bold">Fecha</th>
                    <th scope="col" className="px-3 py-3 font-bold">Estado</th>
                    <th scope="col" className="px-3 py-3 font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ladp-navy/10">
                  {rows.map(({ incidencia, centroPoblado }) => (
                    <tr key={incidencia.id} data-testid="incidencia-row">
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-bold text-ladp-navy-dark">
                        {incidencia.codigoAuditoria}
                      </td>
                      <td className="px-3 py-3 font-bold text-ladp-navy-dark">
                        {centroPoblado.nombre}
                      </td>
                      <td className="px-3 py-3 text-ladp-slate">
                        {labelForTipoAfectacion(incidencia.tipoAfectacion)}
                      </td>
                      <td className="px-3 py-3 font-semibold">
                        {formatCount(incidencia.hogaresAfectados)}
                      </td>
                      <td className="px-3 py-3 text-ladp-slate">
                        {labelForNecesidad(incidencia.necesidadPrincipal)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-ladp-slate">
                        {formatDateKey(incidencia.fechaSuceso)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                            incidencia.verificado
                              ? "bg-green-100 text-green-800"
                              : "bg-ladp-amber/30 text-ladp-navy-dark"
                          }`}
                        >
                          {incidencia.verificado ? "Verificado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {incidencia.verificado ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                            <CheckCircle2 className="h-4 w-4" aria-hidden={true} />
                            Validado
                          </span>
                        ) : (
                          <button
                            type="button"
                            data-testid="validate-incidencia"
                            onClick={() => void handleValidate(incidencia.id)}
                            disabled={validatingId === incidencia.id}
                            className="min-h-11 whitespace-nowrap rounded-lg border border-ladp-orange px-3 text-xs font-black text-ladp-orange hover:bg-orange-50 disabled:opacity-60"
                          >
                            {validatingId === incidencia.id
                              ? "Validando…"
                              : "Validar Existencia"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof House;
}) {
  return (
    <div className="ladp-surface-card flex items-center gap-3 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ladp-orange/10 text-ladp-orange">
        <Icon className="h-5 w-5" aria-hidden={true} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ladp-slate">{label}</p>
        <p className="text-xl font-black text-ladp-navy-dark">{value}</p>
      </div>
    </div>
  );
}
