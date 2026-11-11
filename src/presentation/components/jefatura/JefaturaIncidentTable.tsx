"use client";

import { useState } from "react";
import {
  CheckCircle,
  Clock,
  Droplets,
  Eye,
  FileCheck,
  FileEdit,
  MoreVertical,
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
}

export function JefaturaIncidentTable({
  rows,
  loading,
}: JefaturaIncidentTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailRow, setDetailRow] = useState<IncidenciaConCentro | null>(null);

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
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3.5 py-2 text-xs font-bold text-white transition-colors hover:brightness-110"
          >
            <FileCheck className="h-4 w-4" />
            <span>Validación Masiva ({selectedIds.length})</span>
          </button>
        </div>
      </div>

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
            {rows.map(({ incidencia, centroPoblado }) => {
              const isSelected = selectedIds.includes(incidencia.id);
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
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailRow({ incidencia, centroPoblado })}
                        title="Ver Ficha Técnica"
                        className="rounded-lg p-1.5 text-brand-blue transition-colors hover:bg-brand-soft"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Editar Registro"
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <FileEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Opciones"
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
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

            <div className="mt-6 flex justify-end">
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
