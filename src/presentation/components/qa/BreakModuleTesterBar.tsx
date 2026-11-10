"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TriangleAlert, Wrench } from "lucide-react";

import { emitQaInjection, type QaInjection } from "@/presentation/qa/qa-bus";

interface Injection {
  id: QaInjection;
  testId: string;
  label: string;
}

const INJECTIONS: readonly Injection[] = [
  {
    id: "negative-hogares",
    testId: "qa-inject-negative",
    label: "Inyectar Hogares Negativos / Decimales (-25.5)",
  },
  {
    id: "future-fecha",
    testId: "qa-inject-future",
    label: "Forzar Fecha Futura (2027-12-31)",
  },
  {
    id: "empty-form",
    testId: "qa-inject-empty",
    label: "Enviar Formulario Vacío / Incompleto",
  },
];

/**
 * Collapsible QA bar. It only emits events; the incident form owns the fields,
 * so corrupted data never reaches a repository.
 */
export function BreakModuleTesterBar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      {open ? (
        <div className="border-t border-ladp-amber/40 bg-ladp-navy-dark px-3 pb-3 pt-3">
          <div className="mx-auto flex max-w-5xl flex-col gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold text-ladp-amber">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden={true} />
              Solo funciona en el formulario de nueva incidencia. Los errores de
              validación deben aparecer y nada se guarda.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {INJECTIONS.map((injection) => (
                <button
                  key={injection.id}
                  type="button"
                  data-testid={injection.testId}
                  onClick={() => emitQaInjection(injection.id)}
                  className="min-h-11 rounded-lg border border-ladp-amber/50 bg-ladp-amber/10 px-3 py-2 text-left text-xs font-bold text-white transition-colors hover:bg-ladp-amber/20"
                >
                  {injection.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        data-testid="qa-bar-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-white/10 bg-ladp-navy px-3 text-xs font-bold text-white hover:bg-ladp-navy-dark"
      >
        <Wrench className="h-4 w-4 text-ladp-amber" aria-hidden={true} />
        Modo Test 80%+ — Probar Romper Módulo
        {open ? (
          <ChevronDown className="h-4 w-4" aria-hidden={true} />
        ) : (
          <ChevronUp className="h-4 w-4" aria-hidden={true} />
        )}
      </button>
    </div>
  );
}
