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
    <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container-high/40">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Primary Inputs Grid */}
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {/* Search INC */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => onCodeSearchChange(e.target.value)}
              placeholder="Buscar por Código INC..."
              className="h-10 w-full rounded-xl bg-surface-container-low pl-9 pr-3 text-xs font-semibold text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>

          {/* Search Sector / Centro */}
          <div className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
            <input
              type="text"
              value={sectorSearch}
              onChange={(e) => onSectorSearchChange(e.target.value)}
              placeholder="Centro Poblado / Sector..."
              className="h-10 w-full rounded-xl bg-surface-container-low pl-9 pr-3 text-xs font-semibold text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>

          {/* Dropdown Región */}
          <div className="relative flex items-center">
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low pl-3 pr-8 text-xs font-semibold text-on-surface transition-colors focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">Región: Todas (Nacional)</option>
              <option value="Piura">Piura</option>
              <option value="Tumbes">Tumbes</option>
              <option value="Lambayeque">Lambayeque</option>
              <option value="La Libertad">La Libertad</option>
              <option value="Áncash">Áncash</option>
              <option value="Ica">Ica</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-outline" />
          </div>

          {/* Dropdown Estado */}
          <div className="relative flex items-center">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low pl-3 pr-8 text-xs font-semibold text-on-surface transition-colors focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">Estado: Todos los estados</option>
              <option value="verified">Validado</option>
              <option value="pending">Pendiente</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-outline" />
          </div>

          {/* Dropdown Afectación */}
          <div className="relative flex items-center">
            <select
              value={selectedTipo}
              onChange={(e) => onTipoChange(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low pl-3 pr-8 text-xs font-semibold text-on-surface transition-colors focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">Afectación: Todo tipo</option>
              <option value="inundacion_pluvial">Inundación pluvial</option>
              <option value="desborde_rio">Desborde de río</option>
              <option value="deslizamiento">Deslizamiento</option>
              <option value="colapso_vivienda">Colapso de vivienda</option>
              <option value="corte_energia">Corte de energía</option>
              <option value="aislamiento_vial">Aislamiento vial</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-outline" />
          </div>
        </div>

        {/* Action buttons & Counter */}
        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-surface-container-low px-3 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restablecer</span>
          </button>

          <div className="rounded-xl bg-surface-container px-3 py-2.5 font-mono text-xs font-bold text-secondary">
            Mostrando <strong className="text-on-surface">{filteredCount}</strong> de {totalCount} activas
          </div>
        </div>
      </div>
    </div>
  );
}
