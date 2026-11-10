"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  LocateFixed,
  MapPin,
  RefreshCw,
  Send,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import type { DuplicateCheckResult } from "@/application/use-cases/check-duplicate-incidencia.use-case";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import {
  NECESIDAD_OPTIONS,
  TIPO_AFECTACION_OPTIONS,
  labelForNecesidad,
  labelForTipoAfectacion,
  type Incidencia,
} from "@/domain/entities/incidencia";
import { toLimaDateKey } from "@/domain/lib/date";
import {
  createIncidenciaSchema,
  type IncidenciaFormValues,
  type IncidenciaParsedValues,
} from "@/domain/schemas/incidencia.schema";
import { getContainer } from "@/infrastructure/container";

import { CentroCombobox } from "@/presentation/components/incidencias/CentroCombobox";
import { useAppSession } from "@/presentation/components/layout/RoleShell";
import { formatAccuracy, formatCount, formatDateKey } from "@/presentation/lib/format";
import { subscribeQaInjection } from "@/presentation/qa/qa-bus";

const FIELD_LABELS: Record<keyof IncidenciaFormValues, string> = {
  centroPobladoId: "Centro poblado",
  tipoAfectacion: "Tipo de afectación",
  hogaresAfectados: "Hogares afectados",
  necesidadPrincipal: "Necesidad principal",
  ocurrioHoy: "¿Ocurrió hoy?",
  fechaSuceso: "Fecha del suceso",
  gpsCoords: "Coordenadas GPS",
  notaReferencia: "Nota de referencia",
};

async function writeToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function AsistenteNuevaIncidenciaView() {
  const { user } = useAppSession();
  const todayKey = useMemo(() => toLimaDateKey(new Date()), []);
  const schema = useMemo(() => createIncidenciaSchema({ today: todayKey }), [todayKey]);

  const defaultValues = useMemo(
    () => ({
      centroPobladoId: "",
      ocurrioHoy: true,
      fechaSuceso: todayKey,
      gpsCoords: "",
      notaReferencia: "",
    }),
    [todayKey],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IncidenciaFormValues, unknown, IncidenciaParsedValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [centros, setCentros] = useState<CentroPoblado[]>([]);
  const [centrosLoading, setCentrosLoading] = useState(true);
  const [selectedCentro, setSelectedCentro] = useState<CentroPoblado | null>(null);
  const [comboKey, setComboKey] = useState(0);
  const [duplicate, setDuplicate] = useState<DuplicateCheckResult | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const duplicateRequest = useRef(0);

  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Incidencia | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const [reports, setReports] = useState<IncidenciaConCentro[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const qaChain = useRef<Promise<void>>(Promise.resolve());

  const ocurrioHoy = watch("ocurrioHoy");
  const gpsValue = watch("gpsCoords");

  useEffect(() => {
    let active = true;
    void getContainer()
      .centroPobladoRepository.listAll()
      .then((list) => {
        if (active) {
          setCentros(list);
        }
      })
      .finally(() => {
        if (active) {
          setCentrosLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    const result = await getContainer().useCases.listIncidencias.execute({ user });
    if (result.ok) {
      setReports(result.value.filter((row) => row.incidencia.creadoPor === user.id));
    }
    setReportsLoading(false);
  }, [user]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleSelectCentro = useCallback(
    async (centro: CentroPoblado) => {
      setSelectedCentro(centro);
      setValue("centroPobladoId", centro.id, { shouldValidate: true });
      setDuplicate(null);
      setDuplicateError(null);
      setSubmitError(null);
      const requestId = duplicateRequest.current + 1;
      duplicateRequest.current = requestId;
      setDuplicateLoading(true);

      const result = await getContainer().useCases.checkDuplicate.execute({
        centroPobladoId: centro.id,
        now: new Date(),
      });

      if (duplicateRequest.current !== requestId) {
        return;
      }
      setDuplicateLoading(false);
      if (result.ok) {
        setDuplicate(result.value);
      } else {
        setDuplicateError(result.error.message);
      }
    },
    [setValue],
  );

  const handleClearCentro = useCallback(() => {
    setSelectedCentro(null);
    setValue("centroPobladoId", "", { shouldValidate: false });
    setDuplicate(null);
    setDuplicateError(null);
    duplicateRequest.current += 1;
  }, [setValue]);

  const handleGps = async () => {
    setGpsStatus("loading");
    setGpsError(null);
    setGpsAccuracy(null);
    const result = await getContainer().gpsService.getCurrentPosition();
    if (result.ok) {
      setValue("gpsCoords", result.value.formatted, { shouldValidate: true });
      setGpsStatus("ok");
      setGpsAccuracy(formatAccuracy(result.value.accuracy));
      return;
    }
    setGpsStatus("error");
    setGpsError(result.error.message);
  };

  const onSubmit = useCallback(
    async (values: IncidenciaParsedValues) => {
      setSubmitError(null);
      const result = await getContainer().useCases.createIncidencia.execute({
        values,
        creadoPor: user.id,
      });

      if (!result.ok) {
        setSubmitError(result.error.message);
        const fieldErrors = result.error.fieldErrors ?? {};
        for (const field of Object.keys(FIELD_LABELS) as Array<keyof IncidenciaFormValues>) {
          const message = fieldErrors[field];
          if (message) {
            setError(field, { type: "server", message });
          }
        }
        return;
      }

      setCreated(result.value);
      setCopied(false);
      setCopyHint(null);
      void loadReports();
    },
    [loadReports, setError, user.id],
  );

  const resetFlow = useCallback(() => {
    setCreated(null);
    setSelectedCentro(null);
    setDuplicate(null);
    setDuplicateError(null);
    setSubmitError(null);
    setGpsStatus("idle");
    setGpsError(null);
    setGpsAccuracy(null);
    setCopied(false);
    setCopyHint(null);
    setComboKey((current) => current + 1);
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    return subscribeQaInjection((injection) => {
      setCreated(null);
      setSubmitError(null);

      if (injection === "negative-hogares") {
        fillQaBaseValues();
        setValue("hogaresAfectados", -25.5, { shouldValidate: true });
      } else if (injection === "future-fecha") {
        fillQaBaseValues();
        setValue("ocurrioHoy", false, { shouldValidate: true });
        setValue("fechaSuceso", "2027-12-31", { shouldValidate: true });
      } else {
        reset(defaultValues);
        setSelectedCentro(null);
        setDuplicate(null);
        setDuplicateError(null);
        setComboKey((current) => current + 1);
      }

      window.setTimeout(() => {
        // Serialize QA submissions so a fast second click cannot race the
        // previous async resolver and hide its errors.
        qaChain.current = qaChain.current
          .then(() => handleSubmit(onSubmit)())
          .then(() => undefined)
          .catch(() => undefined);
      }, 0);
    });

    /**
     * QA injections isolate one broken field at a time. Missing required fields
     * are filled with valid demo values so the targeted error stays visible.
     */
    function fillQaBaseValues() {
      const values = getValues();
      const firstCentro = centros[0];
      if (!values.centroPobladoId && firstCentro) {
        setSelectedCentro(firstCentro);
        setValue("centroPobladoId", firstCentro.id, { shouldValidate: false });
      }
      if (!values.tipoAfectacion) {
        setValue("tipoAfectacion", "inundacion", { shouldValidate: false });
      }
      if (
        typeof values.hogaresAfectados !== "number" ||
        !Number.isInteger(values.hogaresAfectados) ||
        values.hogaresAfectados < 0
      ) {
        setValue("hogaresAfectados", 1, { shouldValidate: false });
      }
      if (!values.necesidadPrincipal) {
        setValue("necesidadPrincipal", "agua_potable", { shouldValidate: false });
      }
    }
  }, [centros, defaultValues, getValues, handleSubmit, onSubmit, reset, setValue]);

  const handleCopy = async () => {
    if (!created) {
      return;
    }
    const done = await writeToClipboard(created.codigoAuditoria);
    if (done) {
      setCopied(true);
      setCopyHint(null);
      return;
    }
    const node = document.getElementById("codigo-auditoria-text");
    if (node) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setCopyHint("Selecciona el código y cópialo manualmente.");
  };

  const errorList = (Object.keys(FIELD_LABELS) as Array<keyof IncidenciaFormValues>)
    .map((field) => {
      const message = errors[field]?.message;
      return typeof message === "string" ? { field, message } : null;
    })
    .filter((entry): entry is { field: keyof IncidenciaFormValues; message: string } =>
      entry !== null,
    );

  const fieldError = (field: keyof IncidenciaFormValues): string | undefined => {
    const message = errors[field]?.message;
    return typeof message === "string" ? message : undefined;
  };

  const hasErrors = errorList.length > 0 || Boolean(submitError);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ladp-cobalt">
          Brigada de campo
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ladp-navy-dark sm:text-3xl">
          Registrar nueva incidencia
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ladp-slate">
          Completa los 7 pasos. Todo se valida antes de guardar y recibirás un código
          de auditoría único.
        </p>
      </header>

      <section className="ladp-surface-card overflow-hidden">
        {created ? (
          <div className="px-5 py-8 text-center sm:px-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 className="h-9 w-9" aria-hidden={true} />
            </span>
            <h2 className="mt-4 text-2xl font-black text-ladp-navy-dark">
              Incidencia registrada
            </h2>
            <p className="mt-1 text-sm text-ladp-slate">
              Guarda este código de auditoría para el seguimiento de la brigada.
            </p>

            <p
              id="codigo-auditoria-text"
              data-testid="codigo-auditoria"
              className="mx-auto mt-5 max-w-full break-all rounded-xl border border-ladp-navy/15 bg-ladp-bg px-4 py-4 font-mono text-3xl font-black tracking-tight text-ladp-navy-dark"
            >
              {created.codigoAuditoria}
            </p>

            <div className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                data-testid="copy-codigo"
                onClick={() => void handleCopy()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ladp-cobalt px-4 text-sm font-bold text-white hover:bg-ladp-cobalt-light"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden={true} />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden={true} />
                )}
                {copied ? "Copiado" : "Copiar al portapapeles"}
              </button>
              <button
                type="button"
                onClick={resetFlow}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-ladp-navy/20 px-4 text-sm font-bold text-ladp-navy-dark hover:border-ladp-orange"
              >
                <RefreshCw className="h-4 w-4" aria-hidden={true} />
                Registrar otra incidencia
              </button>
            </div>
            {copyHint ? (
              <p role="status" className="mt-2 text-xs font-semibold text-ladp-slate">
                {copyHint}
              </p>
            ) : null}

            <dl className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-ladp-navy/10 pb-2">
                <dt className="font-semibold text-ladp-slate">Centro poblado</dt>
                <dd className="font-bold text-ladp-navy-dark">
                  {selectedCentro?.nombre ?? "Registrado"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-ladp-navy/10 pb-2">
                <dt className="font-semibold text-ladp-slate">Tipo de afectación</dt>
                <dd className="font-bold text-ladp-navy-dark">
                  {labelForTipoAfectacion(created.tipoAfectacion)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-ladp-slate">Hogares afectados</dt>
                <dd className="font-bold text-ladp-navy-dark">
                  {formatCount(created.hogaresAfectados)}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <form
            className="divide-y divide-ladp-navy/10"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="px-5 py-6 sm:px-7">
              <SectionTitle
                step={1}
                title="Centro poblado"
                hint="Busca por nombre o sector. Si no aparece, repórtalo en Soporte."
              />
              <label
                htmlFor="centro-poblado-input"
                className="mb-1.5 block text-sm font-bold text-ladp-navy-dark"
              >
                Centro poblado afectado
              </label>
              <CentroCombobox
                key={comboKey}
                centros={centros}
                selected={selectedCentro}
                onSelect={(centro) => void handleSelectCentro(centro)}
                onClear={handleClearCentro}
                disabled={centrosLoading}
                invalid={Boolean(fieldError("centroPobladoId"))}
                describedBy={fieldError("centroPobladoId") ? "centro-error" : undefined}
              />
              {centrosLoading ? (
                <p className="mt-1.5 text-xs text-ladp-slate">Cargando centros poblados…</p>
              ) : null}
              {fieldError("centroPobladoId") ? (
                <p
                  id="centro-error"
                  role="alert"
                  className="mt-1.5 text-sm font-semibold text-red-700"
                >
                  {fieldError("centroPobladoId")}
                </p>
              ) : null}

              {duplicateError ? (
                <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {duplicateError}
                </p>
              ) : null}
            </div>

            <div className="px-5 py-6 sm:px-7">
              <SectionTitle
                step={2}
                title="Verificación de reportes previos"
                hint="Revisamos si ya existe un reporte reciente en este centro poblado."
              />
              {!selectedCentro ? (
                <p className="rounded-xl border border-dashed border-ladp-navy/20 px-4 py-3 text-sm text-ladp-slate">
                  Selecciona un centro poblado para activar la verificación.
                </p>
              ) : duplicateLoading ? (
                <p role="status" className="rounded-xl bg-ladp-bg px-4 py-3 text-sm font-semibold text-ladp-slate">
                  Verificando reportes recientes…
                </p>
              ) : duplicate?.hasPreviousReports ? (
                <div
                  data-testid="duplicate-alert"
                  role="alert"
                  className="rounded-xl border border-ladp-amber bg-ladp-amber/20 px-4 py-3 text-ladp-navy-dark"
                >
                  <p className="flex items-start gap-2 text-sm font-bold">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ladp-orange" aria-hidden={true} />
                    Ya existen reportes en este centro poblado. Valida si el caso ya fue
                    reportado o si es nuevo.
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide">
                    Códigos recientes ({duplicate.windowDays} días)
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {duplicate.codes.map((code) => (
                      <li
                        key={code}
                        className="rounded-md border border-ladp-navy/15 bg-ladp-surface px-2 py-1 font-mono text-xs font-bold"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : duplicate ? (
                <p
                  role="status"
                  className="flex items-start gap-2 rounded-xl border border-green-600/30 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden={true} />
                  No hay reportes recientes en este centro poblado. Registra la incidencia.
                </p>
              ) : null}
            </div>

            <div className="px-5 py-6 sm:px-7">
              <SectionTitle step={3} title="Tipo de afectación" />
              <label
                htmlFor="tipo-afectacion"
                className="mb-1.5 block text-sm font-bold text-ladp-navy-dark"
              >
                ¿Qué tipo de afectación ocurrió?
              </label>
              <select
                id="tipo-afectacion"
                data-testid="tipo-afectacion"
                aria-invalid={Boolean(fieldError("tipoAfectacion"))}
                aria-describedby={fieldError("tipoAfectacion") ? "tipo-error" : undefined}
                className="min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white px-3 text-base text-ladp-navy-dark aria-invalid:border-red-600"
                {...register("tipoAfectacion")}
              >
                <option value="">Selecciona el tipo de afectación</option>
                {TIPO_AFECTACION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldError("tipoAfectacion") ? (
                <p id="tipo-error" role="alert" className="mt-1.5 text-sm font-semibold text-red-700">
                  {fieldError("tipoAfectacion")}
                </p>
              ) : null}
            </div>

            <div className="px-5 py-6 sm:px-7">
              <SectionTitle step={4} title="Hogares afectados" />
              <label
                htmlFor="hogares-afectados"
                className="mb-1.5 block text-sm font-bold text-ladp-navy-dark"
              >
                Número de hogares afectados
              </label>
              <input
                id="hogares-afectados"
                data-testid="hogares-afectados"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="Ej. 25"
                aria-invalid={Boolean(fieldError("hogaresAfectados"))}
                aria-describedby={
                  fieldError("hogaresAfectados") ? "hogares-error" : "hogares-help"
                }
                className="min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white px-3 text-base text-ladp-navy-dark placeholder:text-ladp-slate-light aria-invalid:border-red-600"
                {...register("hogaresAfectados", { valueAsNumber: true })}
              />
              <p id="hogares-help" className="mt-1.5 text-xs text-ladp-slate">
                Solo números enteros. Si no hay viviendas afectadas, registra 0.
              </p>
              {fieldError("hogaresAfectados") ? (
                <p id="hogares-error" role="alert" className="mt-1.5 text-sm font-semibold text-red-700">
                  {fieldError("hogaresAfectados")}
                </p>
              ) : null}
            </div>

            <div className="px-5 py-6 sm:px-7">
              <SectionTitle step={5} title="Necesidad principal" />
              <label
                htmlFor="necesidad-principal"
                className="mb-1.5 block text-sm font-bold text-ladp-navy-dark"
              >
                ¿Qué necesita la comunidad con urgencia?
              </label>
              <select
                id="necesidad-principal"
                data-testid="necesidad-principal"
                aria-invalid={Boolean(fieldError("necesidadPrincipal"))}
                aria-describedby={
                  fieldError("necesidadPrincipal") ? "necesidad-error" : undefined
                }
                className="min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white px-3 text-base text-ladp-navy-dark aria-invalid:border-red-600"
                {...register("necesidadPrincipal")}
              >
                <option value="">Selecciona la necesidad principal</option>
                {NECESIDAD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldError("necesidadPrincipal") ? (
                <p
                  id="necesidad-error"
                  role="alert"
                  className="mt-1.5 text-sm font-semibold text-red-700"
                >
                  {fieldError("necesidadPrincipal")}
                </p>
              ) : null}
            </div>

            <div className="px-5 py-6 sm:px-7">
              <SectionTitle
                step={6}
                title="Fecha, GPS y referencia"
                hint="La fecha no puede ser futura. El GPS es gratuito y opcional."
              />

              <fieldset>
                <legend className="mb-1.5 block text-sm font-bold text-ladp-navy-dark">
                  ¿El evento ha ocurrido el día de hoy?
                </legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    data-testid="ocurrio-hoy-si"
                    aria-pressed={ocurrioHoy}
                    onClick={() => {
                      setValue("ocurrioHoy", true, { shouldValidate: true });
                      setValue("fechaSuceso", todayKey, { shouldValidate: true });
                    }}
                    className={`min-h-11 flex-1 rounded-xl border px-4 text-sm font-black ${
                      ocurrioHoy
                        ? "border-ladp-orange bg-ladp-orange text-white"
                        : "border-ladp-navy/20 bg-white text-ladp-navy-dark"
                    }`}
                  >
                    SÍ
                  </button>
                  <button
                    type="button"
                    data-testid="ocurrio-hoy-no"
                    aria-pressed={!ocurrioHoy}
                    onClick={() => setValue("ocurrioHoy", false, { shouldValidate: true })}
                    className={`min-h-11 flex-1 rounded-xl border px-4 text-sm font-black ${
                      !ocurrioHoy
                        ? "border-ladp-orange bg-ladp-orange text-white"
                        : "border-ladp-navy/20 bg-white text-ladp-navy-dark"
                    }`}
                  >
                    NO
                  </button>
                </div>
              </fieldset>

              <div className="mt-4">
                <label
                  htmlFor="fecha-suceso"
                  className="mb-1.5 block text-sm font-bold text-ladp-navy-dark"
                >
                  Fecha del Suceso
                </label>
                <input
                  id="fecha-suceso"
                  data-testid="fecha-suceso"
                  type="date"
                  max={todayKey}
                  aria-invalid={Boolean(fieldError("fechaSuceso"))}
                  aria-describedby={fieldError("fechaSuceso") ? "fecha-error" : undefined}
                  className="min-h-12 w-full max-w-xs rounded-xl border border-ladp-navy/20 bg-white px-3 text-base text-ladp-navy-dark aria-invalid:border-red-600"
                  {...register("fechaSuceso")}
                />
                {fieldError("fechaSuceso") ? (
                  <p id="fecha-error" role="alert" className="mt-1.5 text-sm font-semibold text-red-700">
                    {fieldError("fechaSuceso")}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 rounded-xl border border-ladp-navy/15 bg-ladp-bg p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="gps-button"
                    onClick={() => void handleGps()}
                    disabled={gpsStatus === "loading"}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ladp-cobalt px-4 text-sm font-bold text-white hover:bg-ladp-cobalt-light disabled:opacity-60"
                  >
                    <LocateFixed className="h-4 w-4" aria-hidden={true} />
                    {gpsStatus === "loading" ? "Obteniendo GPS…" : "GPS Gratis"}
                  </button>
                  <span className="text-xs font-semibold text-ladp-slate">
                    Usa la ubicación del navegador, sin costo.
                  </span>
                </div>
                <p
                  data-testid="gps-value"
                  className="mt-2 flex items-start gap-1.5 font-mono text-sm font-bold text-ladp-navy-dark"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ladp-orange" aria-hidden={true} />
                  {gpsValue && gpsValue.length > 0 ? gpsValue : "Sin coordenadas registradas"}
                </p>
                {gpsAccuracy ? (
                  <p className="mt-1 text-xs font-semibold text-green-700">{gpsAccuracy}</p>
                ) : null}
                {gpsStatus === "error" && gpsError ? (
                  <p role="alert" className="mt-1 text-sm font-semibold text-red-700">
                    {gpsError}
                  </p>
                ) : null}
                <input type="hidden" {...register("gpsCoords")} />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="nota-referencia"
                  className="mb-1.5 block text-sm font-bold text-ladp-navy-dark"
                >
                  Nota de referencia <span className="font-normal text-ladp-slate">(opcional)</span>
                </label>
                <textarea
                  id="nota-referencia"
                  data-testid="nota-referencia"
                  rows={3}
                  maxLength={280}
                  placeholder="Ej. Familias refugiadas en el colegio del sector."
                  className="w-full resize-none rounded-xl border border-ladp-navy/20 bg-white px-3 py-2 text-base text-ladp-navy-dark placeholder:text-ladp-slate-light"
                  {...register("notaReferencia")}
                />
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7">
              <SectionTitle
                step={7}
                title="Enviar reporte"
                hint="Al registrar recibirás un código INC único de auditoría."
              />

              {hasErrors ? (
                <div
                  data-testid="form-errors"
                  role="alert"
                  className="mb-4 rounded-xl border border-red-600/30 bg-red-50 px-4 py-3 text-red-800"
                >
                  <p className="flex items-center gap-2 text-sm font-black">
                    <AlertTriangle className="h-5 w-5" aria-hidden={true} />
                    No se pudo registrar. Revisa estos datos:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold">
                    {submitError ? <li>{submitError}</li> : null}
                    {errorList.map((entry) => (
                      <li key={entry.field}>
                        <span className="font-bold">{FIELD_LABELS[entry.field]}:</span>{" "}
                        {entry.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="submit"
                data-testid="submit-incidencia"
                disabled={isSubmitting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ladp-orange px-5 text-base font-black text-white shadow-lg shadow-orange-900/20 hover:bg-ladp-orange-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-5 w-5" aria-hidden={true} />
                {isSubmitting ? "Registrando…" : "Registrar Incidencia"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section data-testid="assistant-reports" className="ladp-surface-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-ladp-navy-dark">
            <ClipboardList className="h-5 w-5 text-ladp-cobalt" aria-hidden={true} />
            Mis reportes recientes
          </h2>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-ladp-navy/15 px-3 text-xs font-bold text-ladp-navy-dark hover:border-ladp-cobalt"
          >
            <RefreshCw className="h-4 w-4" aria-hidden={true} />
            Actualizar
          </button>
        </div>

        {reportsLoading ? (
          <p className="mt-3 text-sm text-ladp-slate" role="status">
            Cargando tus reportes…
          </p>
        ) : reports.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-ladp-navy/20 px-4 py-3 text-sm text-ladp-slate">
            Aún no has registrado reportes en esta sesión.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ladp-navy/10">
            {reports.map(({ incidencia, centroPoblado }) => (
              <li key={incidencia.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-black text-ladp-navy-dark">
                    {incidencia.codigoAuditoria}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                      incidencia.verificado
                        ? "bg-green-100 text-green-800"
                        : "bg-ladp-amber/30 text-ladp-navy-dark"
                    }`}
                  >
                    {incidencia.verificado ? "Verificado" : "Pendiente"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ladp-navy-dark">
                  {centroPoblado.nombre} · {labelForTipoAfectacion(incidencia.tipoAfectacion)}
                </p>
                <p className="text-xs text-ladp-slate">
                  {formatDateKey(incidencia.fechaSuceso)} ·{" "}
                  {formatCount(incidencia.hogaresAfectados)} hogares ·{" "}
                  {labelForNecesidad(incidencia.necesidadPrincipal)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionTitle({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ladp-cobalt text-sm font-black text-white">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-black text-ladp-navy-dark">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-ladp-slate">{hint}</p> : null}
      </div>
    </div>
  );
}
