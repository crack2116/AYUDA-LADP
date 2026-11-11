"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

import { toLimaDateKey } from "@/domain/lib/date";

import { formatMonthKey, formatShortDateKey } from "@/presentation/lib/format";
import { PERU_REGIONS } from "@/presentation/lib/peru-regions";

interface JefaturaQuickFiltersProps {
  /** Selected day as a YYYY-MM-DD Lima date key, or null for every date. */
  fecha: string | null;
  onFechaChange: (value: string | null) => void;
  /** "all" for the national scope, otherwise one of the Peruvian regions. */
  region: string;
  onRegionChange: (value: string) => void;
  /** Day keys that currently have at least one incident, used as calendar dots. */
  fechasConDatos: readonly string[];
}

const CHIP =
  "inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(12,45,110,0.06)] transition-colors hover:bg-brand-mist";
const CHIP_ACTIVE =
  "inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 text-[11.5px] font-semibold text-brand-blue shadow-[0_1px_2px_rgba(12,45,110,0.06)]";
const PANEL =
  "absolute top-full z-50 mt-2 rounded-xl bg-white p-3 shadow-[0_30px_60px_-24px_rgba(3,11,56,0.45)]";

const WEEKDAYS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"] as const;

/** Monday-first day cells for a YYYY-MM month key. */
function buildMonthGrid(monthKey: string): Array<{ day: number; key: string } | null> {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) {
    return [];
  }
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leadingBlanks = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: Array<{ day: number; key: string } | null> = Array.from(
    { length: leadingBlanks },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      key: `${monthKey}-${String(day).padStart(2, "0")}`,
    });
  }

  return cells;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) {
    return monthKey;
  }
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}

export function JefaturaQuickFilters({
  fecha,
  onFechaChange,
  region,
  onRegionChange,
  fechasConDatos,
}: JefaturaQuickFiltersProps) {
  const hoyKey = useMemo(() => toLimaDateKey(new Date()), []);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    (fecha ?? toLimaDateKey(new Date())).slice(0, 7),
  );

  const closeCalendar = useCallback(() => setCalendarOpen(false), []);
  const closeRegion = useCallback(() => setRegionOpen(false), []);
  const calendarRef = useDismiss(calendarOpen, closeCalendar);
  const regionRef = useDismiss(regionOpen, closeRegion);

  const daysWithData = useMemo(() => new Set(fechasConDatos), [fechasConDatos]);
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const toggleCalendar = () => {
    setViewMonth((fecha ?? hoyKey).slice(0, 7));
    setRegionOpen(false);
    setCalendarOpen((current) => !current);
  };

  const toggleRegion = () => {
    setCalendarOpen(false);
    setRegionOpen((current) => !current);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Calendar: filters the panel by incident day */}
      <div ref={calendarRef} className="relative">
        <button
          type="button"
          onClick={toggleCalendar}
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          aria-label="Filtrar por fecha de la incidencia"
          data-testid="filtro-fecha"
          className={fecha ? CHIP_ACTIVE : CHIP}
        >
          <CalendarDays className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
          <span>{fecha ? formatShortDateKey(fecha) : "Todas las fechas"}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
        </button>

        {calendarOpen ? (
          <div
            role="dialog"
            aria-label="Calendario de incidencias"
            className={`${PANEL} left-0 w-[258px]`}
          >
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
                aria-label="Mes anterior"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-brand-mist hover:text-brand-blue"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[12px] font-bold text-brand-ink">
                {formatMonthKey(viewMonth)}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
                aria-label="Mes siguiente"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-brand-mist hover:text-brand-blue"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((weekday) => (
                <span
                  key={weekday}
                  className="text-center text-[9px] font-bold uppercase tracking-wide text-slate-400"
                >
                  {weekday}
                </span>
              ))}
              {cells.map((cell, index) => {
                if (!cell) {
                  return <span key={`blank-${index}`} aria-hidden="true" />;
                }
                const selected = cell.key === fecha;
                const hasData = daysWithData.has(cell.key);
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => {
                      onFechaChange(cell.key);
                      setCalendarOpen(false);
                    }}
                    aria-pressed={selected}
                    aria-label={formatShortDateKey(cell.key)}
                    className={`relative flex h-8 items-center justify-center rounded-lg text-[11.5px] font-bold transition-colors ${
                      selected
                        ? "bg-brand-deep text-white"
                        : hasData
                          ? "text-brand-ink hover:bg-brand-soft"
                          : "text-slate-300 hover:bg-brand-mist"
                    }`}
                  >
                    {cell.day}
                    {hasData && !selected ? (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-ladp-orange" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  onFechaChange(null);
                  setCalendarOpen(false);
                }}
                className="rounded-lg px-1 py-0.5 text-slate-500 transition-colors hover:text-brand-blue"
              >
                Todas las fechas
              </button>
              <button
                type="button"
                onClick={() => {
                  onFechaChange(hoyKey);
                  setCalendarOpen(false);
                }}
                className="rounded-lg px-1 py-0.5 text-brand-blue transition-colors hover:text-brand-ink"
              >
                Hoy
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Territorial scope: national or any Peruvian region */}
      <div ref={regionRef} className="relative">
        <button
          type="button"
          onClick={toggleRegion}
          aria-expanded={regionOpen}
          aria-haspopup="listbox"
          aria-label="Filtrar por región"
          data-testid="filtro-region"
          className={region !== "all" ? CHIP_ACTIVE : CHIP}
        >
          <MapPin className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
          <span className="max-w-[10rem] truncate">
            {region === "all" ? "Nivel Nacional" : region}
          </span>
          <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
        </button>

        {regionOpen ? (
          <div
            role="listbox"
            aria-label="Regiones del Perú"
            className={`${PANEL} right-0 max-h-[19rem] w-[242px] overflow-y-auto p-2 sm:left-0 sm:right-auto`}
          >
            <p className="px-2 pb-1.5 pt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Ámbito territorial
            </p>
            <button
              type="button"
              role="option"
              aria-selected={region === "all"}
              onClick={() => {
                onRegionChange("all");
                setRegionOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] font-bold transition-colors ${
                region === "all"
                  ? "bg-brand-soft text-brand-blue"
                  : "text-slate-700 hover:bg-brand-mist"
              }`}
            >
              <span>Nivel Nacional (todas las regiones)</span>
              {region === "all" ? <Check className="h-3.5 w-3.5" /> : null}
            </button>

            <div className="my-1.5 h-px bg-slate-100" aria-hidden="true" />

            {PERU_REGIONS.map((name) => {
              const selected = region === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onRegionChange(name);
                    setRegionOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] font-semibold transition-colors ${
                    selected
                      ? "bg-brand-soft font-bold text-brand-blue"
                      : "text-slate-700 hover:bg-brand-mist"
                  }`}
                >
                  <span>{name}</span>
                  {selected ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
