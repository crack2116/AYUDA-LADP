"use client";

import { useState } from "react";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  Droplets,
  Eye,
  FileCheck,
  MapPin,
  MoreVertical,
  PlusCircle,
  Printer,
  Table,
  X,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import {
  labelForNecesidad,
  labelForTipoAfectacion,
} from "@/domain/entities/incidencia";
import { formatCount, formatDateKey, formatPeriodoLabel } from "@/presentation/lib/format";

interface JefaturaIncidentTableProps {
  rows: readonly IncidenciaConCentro[];
  loading: boolean;
  onValidateIncidencia?: (incidenciaId: string) => Promise<boolean>;
  onBulkValidate?: (incidenciaIds: readonly string[]) => Promise<number>;
  onInspectOnMap?: (incidenciaId: string) => void;
  onRegisterAtCentro?: (centroId: string) => void;
}

export function JefaturaIncidentTable({
  rows,
  loading,
  onValidateIncidencia,
  onBulkValidate,
  onInspectOnMap,
  onRegisterAtCentro,
}: JefaturaIncidentTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailRow, setDetailRow] = useState<IncidenciaConCentro | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [bulkValidating, setBulkValidating] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const selectedPendingIds = selectedIds.filter((id) =>
    rows.some((row) => row.incidencia.id === id && !row.incidencia.verificado),
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.incidencia.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkValidate = async () => {
    if (!onBulkValidate || selectedPendingIds.length === 0) return;
    setBulkValidating(true);
    setActionStatus(null);
    const count = await onBulkValidate(selectedPendingIds);
    setBulkValidating(false);
    setSelectedIds((prev) => prev.filter((id) => !selectedPendingIds.includes(id)));
    if (count > 0) {
      setActionStatus(
        count === 1
          ? "1 incidencia validada correctamente."
          : `${count} incidencias validadas correctamente.`,
      );
    }
  };

  const handleValidateOne = async (id: string, codigo: string) => {
    if (!onValidateIncidencia) return;
    setValidatingId(id);
    setOpenMenuId(null);
    const updated = await onValidateIncidencia(id);
    setValidatingId(null);
    if (updated) {
      setActionStatus(`Incidencia ${codigo} marcada como validada.`);
    }
  };

  const handleCopyCode = async (codigo: string) => {
    setOpenMenuId(null);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codigo);
      }
      setActionStatus(`Código ${codigo} copiado.`);
    } catch {
      setActionStatus(`Código de auditoría: ${codigo}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        Cargando incidencias nacionales del sistema…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        No se encontraron incidencias que coincidan con los criterios de búsqueda táctica.
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
      {/* Table Header and Bulk Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
            <Table className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-[13.5px] font-bold tracking-tight text-brand-ink sm:text-base">
            Tabla maestra de incidencias nacionales
          </h2>
          <span className="rounded-full bg-brand-mist px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {formatPeriodoLabel(rows.map((row) => row.incidencia.fechaSuceso))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Registro</span>
          </button>
          <button
            type="button"
            data-testid="bulk-validate-btn"
            disabled={bulkValidating || selectedPendingIds.length === 0 || !onBulkValidate}
            onClick={() => void handleBulkValidate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3.5 py-2 text-xs font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileCheck className="h-4 w-4" />
            <span>
              {bulkValidating
                ? "Validando..."
                : `Validación Masiva (${selectedPendingIds.length})`}
            </span>
          </button>
        </div>
      </div>

      {actionStatus ? (
        <div
          role="status"
          className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-lg bg-brand-mist px-3 py-2 text-xs font-semibold text-brand-blue sm:mx-5"
        >
          <span>{actionStatus}</span>
          <button
            type="button"
            onClick={() => setActionStatus(null)}
            aria-label="Cerrar aviso"
            className="rounded p-0.5 text-slate-500 hover:text-brand-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-brand-mist text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th scope="col" className="w-12 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas las incidencias"
                  checked={selectedIds.length === rows.length && rows.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded text-secondary"
                />
              </th>
              <th scope="col" className="px-3 py-3">Código INC</th>
              <th scope="col" className="px-3 py-3">Jurisdicción / Región</th>
              <th scope="col" className="px-3 py-3">Centro Poblado / Sector</th>
              <th scope="col" className="px-3 py-3">Tipo de Afectación</th>
              <th scope="col" className="px-3 py-3">Hogares Afectados</th>
              <th scope="col" className="px-3 py-3">Estado</th>
              <th scope="col" className="px-3 py-3">Fecha de Registro</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-brand-ink font-medium">
            {rows.map(({ incidencia, centroPoblado }, rowIndex) => {
              const isSelected = selectedIds.includes(incidencia.id);
              const isMenuOpen = openMenuId === incidencia.id;
              const openUpward = rows.length - rowIndex <= 2;
              return (
                <tr
                  key={incidencia.id}
                  data-testid="incidencia-row"
                  className={`transition-colors hover:bg-brand-mist ${
                    isSelected ? "bg-brand-soft/70" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar incidencia ${incidencia.codigoAuditoria}`}
                      checked={isSelected}
                      onChange={() => toggleSelectOne(incidencia.id)}
                      className="h-4 w-4 cursor-pointer rounded text-secondary"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-brand-blue">
                    {incidencia.codigoAuditoria}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 font-bold text-brand-ink">
                      <span className="h-2 w-2 rounded-full bg-brand-blue" />
                      <span>{centroPoblado.region}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="block font-bold text-brand-ink">{centroPoblado.nombre}</span>
                    <span className="block text-[11px] font-normal text-slate-500">
                      {centroPoblado.sector}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-brand-mist px-2 py-1 text-[11.5px] font-semibold text-slate-600">
                      <Droplets className="h-3.5 w-3.5 text-brand-blue" />
                      {labelForTipoAfectacion(incidencia.tipoAfectacion)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-brand-ink">
                    <span className="text-sm font-bold text-brand-blue">
                      {formatCount(incidencia.hogaresAfectados)}
                    </span>{" "}
                    hogares
                  </td>
                  <td className="px-3 py-3">
                    {incidencia.verificado ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Validado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-500">
                    {formatDateKey(incidencia.fechaSuceso)}
                  </td>
                  <td className="relative px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setDetailRow({ incidencia, centroPoblado });
                        }}
                        title="Ver Ficha Técnica"
                        className="rounded-lg p-1.5 text-brand-blue transition-colors hover:bg-brand-soft"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!incidencia.verificado && onValidateIncidencia ? (
                        <button
                          type="button"
                          disabled={validatingId === incidencia.id}
                          onClick={() =>
                            void handleValidateOne(incidencia.id, incidencia.codigoAuditoria)
                          }
                          title="Validar existencia"
                          className="rounded-lg p-1.5 text-brand-positive transition-colors hover:bg-emerald-50 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        title="Opciones"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        onClick={() =>
                          setOpenMenuId((cur) => (cur === incidencia.id ? null : incidencia.id))
                        }
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    {isMenuOpen ? (
                      <div
                        role="menu"
                        aria-label={`Acciones para ${incidencia.codigoAuditoria}`}
                        className={`absolute right-4 ${
                          openUpward ? "bottom-full mb-1" : "top-full mt-1"
                        } z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-lg`}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleCopyCode(incidencia.codigoAuditoria)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-mist"
                        >
                          <Copy className="h-3.5 w-3.5 text-brand-blue" />
                          <span>Copiar código INC</span>
                        </button>
                        {onInspectOnMap ? (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              onInspectOnMap(incidencia.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-mist"
                          >
                            <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                            <span>Ver en Mapa de Campo</span>
                          </button>
                        ) : null}
                        {onRegisterAtCentro ? (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              onRegisterAtCentro(centroPoblado.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-mist"
                          >
                            <PlusCircle className="h-3.5 w-3.5 text-ladp-orange" />
                            <span>Nuevo reporte en centro</span>
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailRow ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                  Ficha Técnica de Incidencia
                </span>
                <h3 className="font-mono text-lg font-bold text-brand-ink">
                  {detailRow.incidencia.codigoAuditoria}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-brand-mist p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Centro Poblado
                  </span>
                  <p className="font-bold text-brand-ink text-sm">
                    {detailRow.centroPoblado.nombre}
                  </p>
                  <p className="text-slate-500">
                    {detailRow.centroPoblado.sector} ({detailRow.centroPoblado.region})
                  </p>
                </div>
                <div className="rounded-lg bg-brand-mist p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Afectación
                  </span>
                  <p className="font-bold text-brand-ink text-sm">
                    {labelForTipoAfectacion(detailRow.incidencia.tipoAfectacion)}
                  </p>
                  <p className="font-mono text-brand-blue font-bold">
                    {detailRow.incidencia.hogaresAfectados} Hogares
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-brand-mist p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Necesidad Principal
                </span>
                <p className="font-bold text-brand-ink text-sm">
                  {labelForNecesidad(detailRow.incidencia.necesidadPrincipal)}
                </p>
              </div>

              {detailRow.incidencia.notaReferencia ? (
                <div className="rounded-lg bg-brand-mist p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Observaciones de Campo
                  </span>
                  <p className="mt-1 text-slate-600">
                    {detailRow.incidencia.notaReferencia}
                  </p>
                </div>
              ) : null}

              {detailRow.incidencia.gpsCoords ? (
                <div className="rounded-lg bg-brand-mist p-3 font-mono text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Coordenadas GPS
                  </span>
                  <p className="text-slate-600">
                    {detailRow.incidencia.gpsCoords}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              {onInspectOnMap ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = detailRow.incidencia.id;
                    setDetailRow(null);
                    onInspectOnMap(id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-3.5 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Ver en Mapa</span>
                </button>
              ) : null}
              {!detailRow.incidencia.verificado && onValidateIncidencia ? (
                <button
                  type="button"
                  disabled={validatingId === detailRow.incidencia.id}
                  onClick={async () => {
                    const id = detailRow.incidencia.id;
                    const codigo = detailRow.incidencia.codigoAuditoria;
                    await handleValidateOne(id, codigo);
                    setDetailRow(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-positive px-3.5 py-2 text-xs font-bold text-white transition-colors hover:brightness-110 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Validar Existencia</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-lg bg-brand-deep px-4 py-2 text-xs font-bold text-white transition-colors hover:brightness-110"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
