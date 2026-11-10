"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, CheckCircle2, Send, X } from "lucide-react";

import {
  SUPPORT_PROBLEM_OPTIONS,
  type SupportProblem,
} from "@/domain/entities/support-ticket";
import { getContainer } from "@/infrastructure/container";
import { subscribeOpenSupportChat } from "@/presentation/support/support-bus";

/**
 * Floating support chat reachable from every route, including /login.
 * It works with no session: the ticket is filed anonymously when needed.
 */
export function SupportChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SupportProblem | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const panelId = useId();
  const detailId = useId();

  useEffect(() => {
    let active = true;
    void getContainer()
      .authRepository.restoreSession()
      .then((profile) => {
        if (active) {
          setUserId(profile?.id ?? null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => subscribeOpenSupportChat(() => setOpen(true)), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const resetForm = () => {
    setSelected(null);
    setDetail("");
    setError(null);
    setTicketId(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selected) {
      setError("Selecciona el problema que estás reportando.");
      return;
    }
    setSubmitting(true);
    const result = await getContainer().useCases.createSupportTicket.execute({
      opcionProblema: selected,
      detalleOpcional: detail.length > 0 ? detail : null,
      rutaOrigen: pathname,
      usuarioId: userId,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setTicketId(result.value.id);
  };

  return (
    <>
      <button
        type="button"
        data-testid="chat-open"
        aria-label="Abrir chat de soporte"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff9a3c] to-[#e05f00] text-white shadow-[0_14px_30px_-10px_rgba(224,95,0,0.75)] ring-4 ring-white/60 transition-transform hover:scale-105 sm:h-14 sm:w-14"
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden={true} />
        ) : (
          <Bot className="h-7 w-7" aria-hidden={true} />
        )}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          data-testid="chat-panel"
          role="dialog"
          aria-labelledby={titleId}
          aria-modal="false"
          className="fixed bottom-36 right-4 z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-ladp-surface shadow-[0_30px_70px_-24px_rgba(3,11,56,0.45)]"
        >
          <div className="flex items-start justify-between gap-3 bg-ladp-navy px-4 py-3">
            <div>
              <h2 id={titleId} className="text-sm font-black text-white">
                Soporte AYUDA LADP
              </h2>
              <p className="text-xs text-white/70">Cuéntanos qué está fallando.</p>
            </div>
            <button
              type="button"
              data-testid="chat-close"
              onClick={() => setOpen(false)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar chat de soporte"
            >
              <X className="h-5 w-5" aria-hidden={true} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {ticketId ? (
              <div
                data-testid="chat-confirmation"
                role="status"
                className="rounded-xl border border-green-600/30 bg-green-50 p-4 text-green-900"
              >
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5" aria-hidden={true} />
                  Reporte enviado
                </div>
                <p className="mt-2 text-sm">
                  Guarda este número de ticket para dar seguimiento:
                </p>
                <p className="mt-1 break-all font-mono text-xs font-bold">{ticketId}</p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 min-h-11 w-full rounded-lg border border-green-700/30 px-3 text-sm font-bold text-green-900 hover:bg-green-100"
                >
                  Enviar otro reporte
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <fieldset>
                  <legend className="text-xs font-bold uppercase tracking-wide text-ladp-slate">
                    ¿Qué problema tienes?
                  </legend>
                  <div className="mt-2 grid gap-2">
                    {SUPPORT_PROBLEM_OPTIONS.map((option) => {
                      const active = selected === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          data-testid={`chat-chip-${option.value}`}
                          aria-pressed={active}
                          onClick={() => {
                            setSelected(option.value);
                            setError(null);
                          }}
                          className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                            active
                              ? "border-ladp-orange bg-orange-50 text-ladp-navy-dark"
                              : "border-ladp-navy/15 bg-ladp-bg text-ladp-navy-dark hover:border-ladp-orange/60"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label
                    htmlFor={detailId}
                    className="block text-xs font-bold uppercase tracking-wide text-ladp-slate"
                  >
                    Detalle opcional
                  </label>
                  <textarea
                    id={detailId}
                    data-testid="chat-detail"
                    value={detail}
                    maxLength={200}
                    rows={3}
                    onChange={(event) => setDetail(event.target.value)}
                    placeholder="Ej. La pantalla de reportes queda en blanco."
                    className="mt-1 w-full resize-none rounded-xl border border-ladp-navy/20 bg-white px-3 py-2 text-sm text-ladp-navy-dark placeholder:text-ladp-slate-light"
                  />
                  <p className="mt-1 text-right text-xs text-ladp-slate">
                    {detail.length}/200
                  </p>
                </div>

                {error ? (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                ) : null}

                <button
                  type="button"
                  data-testid="chat-submit"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ladp-orange px-4 text-sm font-black text-white hover:bg-ladp-orange-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" aria-hidden={true} />
                  {submitting ? "Enviando…" : "Enviar reporte"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
