"use client";

import { ChevronDown, MapPin, RotateCcw, Search } from "lucide-react";

interface JefaturaFilterBarProps {
  codeSearch: string;
  onCodeSearchChange: (value: string) => void;
  sectorSearch: string;
  onSectorSearchChange: (value: string) => void;
  selectedRegion: string;
  onRegionChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedTipo: string;
  onTipoChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
}

export function JefaturaFilterBar({
  codeSearch,
  onCodeSearchChange,
  sectorSearch,
  onSectorSearchChange,
  selectedRegion,
  onRegionChange,
  selectedStatus,
  onStatusChange,
  selectedTipo,
  onTipoChange,
  filteredCount,
  totalCount,
  onResetFilters,
}: JefaturaFilterBarProps) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_12px_rgba(12,45,110,0.045)] border border-slate-200/80">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        {/* Primary Inputs Grid */}
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search INC */}
          <div className="relative flex items-center lg:col-span-3">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => onCodeSearchChange(e.target.value)}
              placeholder="Buscar por Código INC..."
              className="h-9.5 w-full rounded-xl bg-[#f6f9fe] border border-slate-200/80 pl-8.5 pr-3 text-xs font-semibold text-[#071938] placeholder:text-slate-400 transition-colors focus:bg-white focus:border-[#0e4ec3] focus:outline-none focus:ring-2 focus:ring-[#0e4ec3]/20"
            />
          </div>

          {/* Search Sector / Centro */}
          <div className="relative flex items-center lg:col-span-3">
            <MapPin className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={sectorSearch}
              onChange={(e) => onSectorSearchChange(e.target.value)}
              placeholder="Centro Poblado / Sector..."
              className="h-9.5 w-full rounded-xl bg-[#f6f9fe] border border-slate-200/80 pl-8.5 pr-3 text-xs font-semibold text-[#071938] placeholder:text-slate-400 transition-colors focus:bg-white focus:border-[#0e4ec3] focus:outline-none focus:ring-2 focus:ring-[#0e4ec3]/20"
            />
          </div>

          {/* Dropdown Región */}
          <div className="relative flex items-center lg:col-span-2">
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="h-9.5 w-full cursor-pointer appearance-none rounded-xl bg-[#f6f9fe] border border-slate-200/80 pl-2.5 pr-7 text-xs font-semibold text-[#071938] transition-colors focus:bg-white focus:border-[#0e4ec3] focus:outline-none focus:ring-2 focus:ring-[#0e4ec3]/20"
            >
              <option value="all">Región: Todas</option>
              <option value="Piura">Piura</option>
              <option value="Tumbes">Tumbes</option>
              <option value="Lambayeque">Lambayeque</option>
              <option value="La Libertad">La Libertad</option>
              <option value="Áncash">Áncash</option>
              <option value="Ica">Ica</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Dropdown Estado */}
          <div className="relative flex items-center lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-9.5 w-full cursor-pointer appearance-none rounded-xl bg-[#f6f9fe] border border-slate-200/80 pl-2.5 pr-7 text-xs font-semibold text-[#071938] transition-colors focus:bg-white focus:border-[#0e4ec3] focus:outline-none focus:ring-2 focus:ring-[#0e4ec3]/20"
            >
              <option value="all">Estado: Todos</option>
              <option value="verified">Validado</option>
              <option value="pending">Pendiente</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Dropdown Afectación */}
          <div className="relative flex items-center lg:col-span-2">
            <select
              value={selectedTipo}
              onChange={(e) => onTipoChange(e.target.value)}
              className="h-9.5 w-full cursor-pointer appearance-none rounded-xl bg-[#f6f9fe] border border-slate-200/80 pl-2.5 pr-7 text-xs font-semibold text-[#071938] transition-colors focus:bg-white focus:border-[#0e4ec3] focus:outline-none focus:ring-2 focus:ring-[#0e4ec3]/20"
            >
              <option value="all">Afectación: Todas</option>
              <option value="inundacion_pluvial">Inundación pluvial</option>
              <option value="desborde_rio">Desborde de río</option>
              <option value="deslizamiento">Deslizamiento</option>
              <option value="colapso_vivienda">Colapso de vivienda</option>
              <option value="corte_energia">Corte de energía</option>
              <option value="aislamiento_vial">Aislamiento vial</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Action buttons & Counter */}
        <div className="flex shrink-0 items-center justify-between gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-9.5 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200/80"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer</span>
          </button>

          <div className="rounded-xl bg-blue-50/90 border border-blue-200/70 px-3 py-2 font-mono text-[11px] font-bold text-[#0e4ec3] whitespace-nowrap">
            Mostrando <strong className="text-[#071938] font-black">{filteredCount}</strong> de {totalCount}
          </div>
        </div>
      </div>
    </div>
  );
}
