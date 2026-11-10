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
import { formatCount, formatDateKey } from "@/presentation/lib/format";

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
      <div className="rounded-2xl bg-surface-container-lowest p-8 text-center text-sm font-semibold text-on-surface-variant shadow-sm border border-surface-container-high/40">
        Cargando incidencias nacionales del sistema…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-surface-container-high bg-surface-container-lowest p-8 text-center text-sm font-semibold text-on-surface-variant shadow-sm">
        No se encontraron incidencias que coincidan con los criterios de búsqueda táctica.
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40">
      {/* Table Header and Bulk Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high/30 p-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Table className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-black text-on-surface">
            Tabla Maestra de Incidencias Nacionales
          </h2>
          <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-[10px] font-black uppercase text-on-secondary-fixed">
            FEBRERO 2026
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Registro</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-on-secondary shadow-xs transition-colors hover:bg-on-secondary-fixed-variant"
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
            <tr className="bg-primary text-on-primary font-bold uppercase tracking-wider text-[11px]">
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
          <tbody className="divide-y divide-surface-container-high/40 text-on-surface font-medium">
            {rows.map(({ incidencia, centroPoblado }) => {
              const isSelected = selectedIds.includes(incidencia.id);
              return (
                <tr
                  key={incidencia.id}
                  data-testid="incidencia-row"
                  className={`transition-colors hover:bg-surface-container-low/70 ${
                    isSelected ? "bg-surface-container/40" : ""
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
                  <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-secondary">
                    {incidencia.codigoAuditoria}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 font-bold text-on-surface">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      <span>{centroPoblado.region}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="block font-bold text-on-surface">{centroPoblado.nombre}</span>
                    <span className="block text-[11px] text-on-surface-variant font-normal">
                      {centroPoblado.sector}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-0.5 text-xs font-semibold text-on-surface">
                      <Droplets className="h-3.5 w-3.5 text-secondary" />
                      {labelForTipoAfectacion(incidencia.tipoAfectacion)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-on-surface">
                    <span className="text-sm font-black text-secondary">
                      {formatCount(incidencia.hogaresAfectados)}
                    </span>{" "}
                    hogares
                  </td>
                  <td className="px-3 py-3">
                    {incidencia.verificado ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-green-800">
                        <CheckCircle className="h-3 w-3" /> Validado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ladp-amber/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-ladp-navy-dark">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-on-surface-variant">
                    {formatDateKey(incidencia.fechaSuceso)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailRow({ incidencia, centroPoblado })}
                        title="Ver Ficha Técnica"
                        className="rounded-lg p-1.5 text-secondary hover:bg-surface-container transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Editar Registro"
                        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        <FileEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Opciones"
                        className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors"
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
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-surface-container-high/60">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                  Ficha Técnica de Incidencia
                </span>
                <h3 className="font-mono text-lg font-black text-on-surface">
                  {detailRow.incidencia.codigoAuditoria}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Centro Poblado
                  </span>
                  <p className="font-bold text-on-surface text-sm">
                    {detailRow.centroPoblado.nombre}
                  </p>
                  <p className="text-on-surface-variant">
                    {detailRow.centroPoblado.sector} ({detailRow.centroPoblado.region})
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Afectación
                  </span>
                  <p className="font-bold text-on-surface text-sm">
                    {labelForTipoAfectacion(detailRow.incidencia.tipoAfectacion)}
                  </p>
                  <p className="font-mono text-secondary font-bold">
                    {detailRow.incidencia.hogaresAfectados} Hogares
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-low p-3">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                  Necesidad Principal
                </span>
                <p className="font-bold text-on-surface text-sm">
                  {labelForNecesidad(detailRow.incidencia.necesidadPrincipal)}
                </p>
              </div>

              {detailRow.incidencia.notaReferencia ? (
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Observaciones de Campo
                  </span>
                  <p className="mt-1 text-on-surface">
                    {detailRow.incidencia.notaReferencia}
                  </p>
                </div>
              ) : null}

              {detailRow.incidencia.gpsCoords ? (
                <div className="rounded-xl bg-surface-container-low p-3 font-mono text-[11px]">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                    Coordenadas GPS
                  </span>
                  <p className="text-on-surface">
                    {detailRow.incidencia.gpsCoords}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary hover:bg-on-secondary-fixed-variant"
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
