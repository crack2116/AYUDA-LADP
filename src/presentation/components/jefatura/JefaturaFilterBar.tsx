"use client";

import { ChevronDown, MapPin, RotateCcw, Search } from "lucide-react";

interface JefaturaFilterBarProps {
  codeSearch: string;
  onCodeSearchChange: (value: string) => void;
  sectorSearch: string;
  onSectorSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedTipo: string;
  onTipoChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
}

const FIELD =
  "h-10 w-full rounded-lg bg-brand-mist text-xs font-semibold text-brand-ink placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25";

export function JefaturaFilterBar({
  codeSearch,
  onCodeSearchChange,
  sectorSearch,
  onSectorSearchChange,
  selectedStatus,
  onStatusChange,
  selectedTipo,
  onTipoChange,
  filteredCount,
  totalCount,
  onResetFilters,
}: JefaturaFilterBarProps) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] sm:p-3.5">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        {/* Primary Inputs Grid */}
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search INC */}
          <div className="relative flex items-center lg:col-span-4">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => onCodeSearchChange(e.target.value)}
              placeholder="Buscar por Código INC..."
              className={`${FIELD} pl-8.5 pr-3`}
            />
          </div>

          {/* Search Sector / Centro */}
          <div className="relative flex items-center lg:col-span-4">
            <MapPin className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={sectorSearch}
              onChange={(e) => onSectorSearchChange(e.target.value)}
              placeholder="Centro Poblado / Sector..."
              className={`${FIELD} pl-8.5 pr-3`}
            />
          </div>

          {/* Dropdown Estado */}
          <div className="relative flex items-center lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`${FIELD} cursor-pointer appearance-none pl-3 pr-7`}
            >
              <option value="all">Estado: Todos</option>
              <option value="verified">Validado</option>
              <option value="pending">Pendiente</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Dropdown Afectación */}
          <div className="relative flex items-center lg:col-span-2">
            <select
              value={selectedTipo}
              onChange={(e) => onTipoChange(e.target.value)}
              className={`${FIELD} cursor-pointer appearance-none pl-3 pr-7`}
            >
              <option value="all">Afectación: Todas</option>
              <option value="inundacion_pluvial">Inundación pluvial</option>
              <option value="desborde_rio">Desborde de río</option>
              <option value="deslizamiento">Deslizamiento</option>
              <option value="colapso_vivienda">Colapso de vivienda</option>
              <option value="corte_energia">Corte de energía</option>
              <option value="aislamiento_vial">Aislamiento vial</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Action buttons & Counter */}
        <div className="flex shrink-0 items-center justify-between gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-mist px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer</span>
          </button>

          <div className="whitespace-nowrap rounded-lg bg-brand-soft px-3 py-2 font-mono text-[11px] font-bold text-brand-blue">
            Mostrando{" "}
            <strong className="font-bold text-brand-deep">{filteredCount}</strong> de{" "}
            {totalCount}
          </div>
        </div>
      </div>
    </div>
  );
}
