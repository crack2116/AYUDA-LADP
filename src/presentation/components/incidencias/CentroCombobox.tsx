"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";

import { matchesCentroQuery, type CentroPoblado } from "@/domain/entities/centro-poblado";

interface CentroComboboxProps {
  centros: readonly CentroPoblado[];
  selected: CentroPoblado | null;
  onSelect: (centro: CentroPoblado) => void;
  onClear: () => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/** Searchable, keyboard-operable combobox for centros poblados. */
export function CentroCombobox({
  centros,
  selected,
  onSelect,
  onClear,
  disabled = false,
  invalid = false,
  describedBy,
}: CentroComboboxProps) {
  const [query, setQuery] = useState(selected?.nombre ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();

  const filtered = useMemo(
    () => centros.filter((centro) => matchesCentroQuery(centro, query)),
    [centros, query],
  );

  const choose = (centro: CentroPoblado) => {
    setQuery(centro.nombre);
    setOpen(false);
    onSelect(centro);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : Math.min(current + 1, filtered.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      if (!open) {
        setOpen(true);
        return;
      }
      const centro = filtered[activeIndex];
      if (centro) {
        event.preventDefault();
        choose(centro);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ladp-slate"
          aria-hidden={true}
        />
        <input
          id="centro-poblado-input"
          data-testid="centro-combobox"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtered[activeIndex]
              ? `${listboxId}-option-${filtered[activeIndex].id}`
              : undefined
          }
          aria-invalid={invalid}
          aria-describedby={describedBy}
          autoComplete="off"
          disabled={disabled}
          placeholder="Busca por nombre o sector…"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            setActiveIndex(0);
            if (selected) {
              onClear();
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          className="min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white pl-10 pr-10 text-base text-ladp-navy-dark placeholder:text-ladp-slate-light aria-invalid:border-red-600 disabled:bg-ladp-bg"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ladp-slate"
          aria-hidden={true}
        />
      </div>

      {selected ? (
        <p className="mt-1.5 text-xs font-semibold text-ladp-cobalt">
          Seleccionado: {selected.nombre} · {selected.sector}
        </p>
      ) : null}

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Centros poblados"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-ladp-navy/15 bg-ladp-surface py-1 shadow-xl shadow-ladp-navy/20"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm font-medium text-ladp-slate">
              Sin resultados. Prueba con el nombre del sector.
            </li>
          ) : (
            filtered.map((centro, index) => {
              const active = index === activeIndex;
              const isSelected = selected?.id === centro.id;
              return (
                <li
                  key={centro.id}
                  id={`${listboxId}-option-${centro.id}`}
                  role="option"
                  aria-selected={isSelected}
                  data-testid="centro-option"
                  className={`flex min-h-11 cursor-pointer flex-col justify-center px-4 py-2 text-sm ${
                    active ? "bg-orange-50" : "bg-ladp-surface"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(centro)}
                >
                  <span className="font-bold text-ladp-navy-dark">{centro.nombre}</span>
                  <span className="text-xs text-ladp-slate">
                    {centro.sector} · {centro.region}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
