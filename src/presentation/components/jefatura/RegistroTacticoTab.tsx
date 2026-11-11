"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Crosshair,
  Droplets,
  Flame,
  History,
  Home,
  MapPin,
  PhoneOff,
  Radio,
  RotateCcw,
  Save,
  Send,
  Shield,
  Trash2,
  UserCheck,
  Waves,
  ZapOff,
} from "lucide-react";

import type { DuplicateCheckResult } from "@/application/use-cases/check-duplicate-incidencia.use-case";
import type {
  TacticalDraft,
  TacticalTransitability,
} from "@/application/use-cases/tactical-drafts.use-case";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import {
  NECESIDAD_OPTIONS,
  TIPO_AFECTACION_OPTIONS,
  labelForNecesidad,
  labelForTipoAfectacion,
  type Incidencia,
  type NecesidadPrincipal,
  type TipoAfectacion,
} from "@/domain/entities/incidencia";
import { USER_ROLE_LABELS, type UserProfile } from "@/domain/entities/user";
import { toLimaDateKey } from "@/domain/lib/date";
import { formatManualGpsCoords, parseGpsCoords } from "@/domain/lib/gps";
import { createIncidenciaSchema } from "@/domain/schemas/incidencia.schema";
import { projectPeruCoordsToPercent } from "@/domain/services/territorial-analysis";
import { getContainer } from "@/infrastructure/container";
import { formatAccuracy, formatCount } from "@/presentation/lib/format";

export interface RegistroTacticoTabProps {
  centros?: readonly CentroPoblado[];
  currentUser?: UserProfile | null;
  initialCentroId?: string | null;
  onIncidentCreated?: (incidencia: Incidencia) => Promise<void> | void;
}

const TRANSITABILITY_OPTIONS: ReadonlyArray<{
  id: TacticalTransitability;
  label: string;
  desc: string;
}> = [
  { id: "4x4", label: "Transitable 4x4", desc: "Acceso terrestre restringido" },
  { id: "aerea", label: "Vía Aérea / Fluvial", desc: "Requiere bote o puente aéreo" },
  { id: "bloqueada", label: "Ruta Bloqueada", desc: "Corte por agua o derrumbe" },
  { id: "aislado", label: "Aislamiento Total", desc: "Sin ingreso terrestre" },
];

const VITAL_SERVICES: ReadonlyArray<{
  id: string;
  label: string;
  icon: typeof Droplets;
}> = [
  { id: "sinAgua", label: "Sin Agua Potable", icon: Droplets },
  { id: "sinLuz", label: "Corte Eléctrico", icon: ZapOff },
  { id: "sinCobertura", label: "Sin Cobertura Móvil", icon: PhoneOff },
  { id: "colapsoDesague", label: "Colapso Desagüe", icon: AlertTriangle },
  { id: "saludAfectado", label: "Estab. Salud Afectado", icon: Building2 },
];

function iconForAfectacion(tipo: TipoAfectacion) {
  switch (tipo) {
    case "inundacion":
    case "desborde_rio":
      return Waves;
    case "huaico":
      return Flame;
    case "colapso_vivienda":
      return AlertOctagon;
    case "aislamiento_vial":
      return MapPin;
    case "corte_servicios":
      return ZapOff;
    default:
      return AlertTriangle;
  }
}

async function copyText(value: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function RegistroTacticoTab({
  centros: centrosProp,
  currentUser: currentUserProp,
  initialCentroId = null,
  onIncidentCreated,
}: RegistroTacticoTabProps) {
  const compId = useId();
  const todayKey = useMemo(() => toLimaDateKey(new Date()), []);
  const schema = useMemo(() => createIncidenciaSchema({ today: todayKey }), [todayKey]);

  const [loadedCentros, setLoadedCentros] = useState<readonly CentroPoblado[]>([]);
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(null);

  const centros = useMemo(
    () => (centrosProp && centrosProp.length > 0 ? centrosProp : loadedCentros),
    [centrosProp, loadedCentros],
  );
  const resolvedUser = currentUserProp ?? sessionUser;

  // Stepper & Feedback
  const [activeStep, setActiveStep] = useState<number>(1);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Module A: Source, date & phenomenon
  const [reportingChannel, setReportingChannel] = useState("bgan");
  const [tipoAfectacion, setTipoAfectacion] = useState<TipoAfectacion>("inundacion");
  const [ocurrioHoy, setOcurrioHoy] = useState(true);
  const [fechaSuceso, setFechaSuceso] = useState(todayKey);

  // Module B: Real CentroPoblado cascade & GPS
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSector, setSelectedSector] = useState("all");
  const [centroPobladoId, setCentroPobladoId] = useState(initialCentroId ?? "");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gpsFormatted, setGpsFormatted] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [gpsAccuracyLabel, setGpsAccuracyLabel] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [syncTimestamp, setSyncTimestamp] = useState<string | null>(null);
  const [activeMapLayer, setActiveMapLayer] = useState<"satelite" | "topografia" | "cuencas">("cuencas");

  // Duplicate check
  const [duplicate, setDuplicate] = useState<DuplicateCheckResult | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const duplicateRequestRef = useRef(0);

  // Module C: Quantitative impact & main need
  const [hogaresAfectados, setHogaresAfectados] = useState(0);
  const [necesidadPrincipal, setNecesidadPrincipal] =
    useState<NecesidadPrincipal>("agua_potable");
  const [transitability, setTransitability] = useState<TacticalTransitability>("4x4");
  const [servicesAffected, setServicesAffected] = useState<string[]>([]);
  const [notaReferencia, setNotaReferencia] = useState("");

  // Drafts & Submission state
  const [drafts, setDrafts] = useState<TacticalDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdIncident, setCreatedIncident] = useState<Incidencia | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load fallback centros, active user session, and cached drafts on mount
  useEffect(() => {
    let active = true;
    const container = getContainer();

    if (!centrosProp || centrosProp.length === 0) {
      void container.centroPobladoRepository.listAll().then((list) => {
        if (active) setLoadedCentros(list);
      });
    }

    if (currentUserProp === undefined) {
      void container.authRepository.restoreSession().then((profile) => {
        if (active) setSessionUser(profile);
      });
    }

    setDrafts(container.useCases.tacticalDrafts.listDrafts());

    return () => {
      active = false;
    };
  }, [centrosProp, currentUserProp]);

  const checkDuplicateForCentro = useCallback(async (id: string) => {
    if (!id) {
      setDuplicate(null);
      setDuplicateLoading(false);
      return;
    }
    const reqId = duplicateRequestRef.current + 1;
    duplicateRequestRef.current = reqId;
    setDuplicateLoading(true);
    const res = await getContainer().useCases.checkDuplicate.execute({
      centroPobladoId: id,
      now: new Date(),
    });
    if (duplicateRequestRef.current !== reqId) return;
    setDuplicateLoading(false);
    setDuplicate(res.ok ? res.value : null);
  }, []);

  // Preselect initialCentroId when triggered from Incidencias de Campo
  useEffect(() => {
    if (!initialCentroId || centros.length === 0) return;
    const target = centros.find((c) => c.id === initialCentroId);
    if (!target) return;
    setSelectedRegion(target.region);
    setSelectedSector(target.sector);
    setCentroPobladoId(target.id);
    setActiveStep(2);
    void checkDuplicateForCentro(target.id);
  }, [centros, checkDuplicateForCentro, initialCentroId]);

  const availableRegions = useMemo(
    () => [...new Set(centros.map((c) => c.region))].sort(),
    [centros],
  );

  const availableSectors = useMemo(() => {
    const matching =
      selectedRegion === "all"
        ? centros
        : centros.filter((c) => c.region === selectedRegion);
    return [...new Set(matching.map((c) => c.sector))].sort();
  }, [centros, selectedRegion]);

  const filteredCentros = useMemo(() => {
    return centros.filter((c) => {
      if (selectedRegion !== "all" && c.region !== selectedRegion) return false;
      if (selectedSector !== "all" && c.sector !== selectedSector) return false;
      return true;
    });
  }, [centros, selectedRegion, selectedSector]);

  const selectedCentro = useMemo(
    () => centros.find((c) => c.id === centroPobladoId) ?? null,
    [centros, centroPobladoId],
  );

  const parsedMapPoint = useMemo(() => {
    const parsed = parseGpsCoords(gpsFormatted);
    if (!parsed) return null;
    return {
      parsed,
      projected: projectPeruCoordsToPercent(parsed),
    };
  }, [gpsFormatted]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedSector("all");
    if (centroPobladoId) {
      const stillMatches = centros.some(
        (c) => c.id === centroPobladoId && (region === "all" || c.region === region),
      );
      if (!stillMatches) {
        setCentroPobladoId("");
        setDuplicate(null);
      }
    }
  };

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    if (centroPobladoId) {
      const stillMatches = centros.some(
        (c) =>
          c.id === centroPobladoId &&
          (selectedRegion === "all" || c.region === selectedRegion) &&
          (sector === "all" || c.sector === sector),
      );
      if (!stillMatches) {
        setCentroPobladoId("");
        setDuplicate(null);
      }
    }
  };

  const handleSelectCentro = (id: string) => {
    setCentroPobladoId(id);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.centroPobladoId;
      return next;
    });
    const chosen = centros.find((c) => c.id === id);
    if (chosen) {
      setSelectedRegion(chosen.region);
      setSelectedSector(chosen.sector);
    }
    void checkDuplicateForCentro(id);
  };

  const handleFetchGps = async () => {
    setGpsStatus("loading");
    setGpsError(null);
    setGpsAccuracyLabel(null);
    const res = await getContainer().gpsService.getCurrentPosition();
    if (res.ok) {
      setLatitude(res.value.latitude.toFixed(5));
      setLongitude(res.value.longitude.toFixed(5));
      setGpsFormatted(res.value.formatted);
      setGpsAccuracyLabel(formatAccuracy(res.value.accuracy));
      setGpsStatus("ok");
      setSyncTimestamp(
        new Date().toLocaleString("es-PE", {
          timeZone: "America/Lima",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      return;
    }
    setGpsStatus("error");
    setGpsError(res.error.message);
  };

  const handleManualCoordsChange = (nextLat: string, nextLng: string) => {
    setLatitude(nextLat);
    setLongitude(nextLng);
    setGpsError(null);
    setGpsAccuracyLabel(null);
    const manual = formatManualGpsCoords(nextLat, nextLng);
    setGpsFormatted(manual ?? "");
    setGpsStatus(manual ? "ok" : "idle");
  };

  const handleToggleService = (serviceId: string) => {
    setServicesAffected((prev) =>
      prev.includes(serviceId)
        ? prev.filter((item) => item !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleAppendAccessContextToNote = () => {
    const accessLabel =
      TRANSITABILITY_OPTIONS.find((opt) => opt.id === transitability)?.label ?? transitability;
    const serviceLabels = VITAL_SERVICES.filter((srv) => servicesAffected.includes(srv.id)).map(
      (srv) => srv.label,
    );
    const snippet =
      serviceLabels.length > 0
        ? `Acceso: ${accessLabel}. Servicios afectados: ${serviceLabels.join(", ")}.`
        : `Acceso: ${accessLabel}.`;
    const merged = notaReferencia.trim() ? `${notaReferencia.trim()} ${snippet}` : snippet;
    setNotaReferencia(merged.slice(0, 280));
  };

  const handleSaveDraft = () => {
    const { drafts: nextDrafts } = getContainer().useCases.tacticalDrafts.saveDraft({
      id: activeDraftId,
      centroPobladoId,
      tipoAfectacion,
      necesidadPrincipal,
      hogaresAfectados,
      ocurrioHoy,
      fechaSuceso,
      gpsCoords: gpsFormatted,
      notaReferencia,
      reportingChannel,
      transitability,
      servicesAffected,
    });
    setDrafts(nextDrafts);
    if (nextDrafts[0]) {
      setActiveDraftId(nextDrafts[0].id);
    }
    setBanner({
      kind: "ok",
      text: "Borrador guardado en caché local del navegador.",
    });
  };

  const handleLoadDraft = (draft: TacticalDraft) => {
    setActiveDraftId(draft.id);
    setTipoAfectacion(draft.tipoAfectacion);
    setNecesidadPrincipal(draft.necesidadPrincipal);
    setHogaresAfectados(draft.hogaresAfectados);
    setOcurrioHoy(draft.ocurrioHoy);
    setFechaSuceso(draft.fechaSuceso);
    setReportingChannel(draft.reportingChannel);
    setTransitability(draft.transitability);
    setServicesAffected(draft.servicesAffected);
    setNotaReferencia(draft.notaReferencia);
    setGpsFormatted(draft.gpsCoords);

    const parsed = parseGpsCoords(draft.gpsCoords);
    if (parsed) {
      setLatitude(parsed.latitude.toFixed(5));
      setLongitude(parsed.longitude.toFixed(5));
      setGpsAccuracyLabel(
        parsed.accuracyMeters !== null ? formatAccuracy(parsed.accuracyMeters) : null,
      );
      setGpsStatus("ok");
    } else {
      setLatitude("");
      setLongitude("");
      setGpsStatus("idle");
      setGpsAccuracyLabel(null);
    }

    handleSelectCentro(draft.centroPobladoId);
    setDraftDrawerOpen(false);
    setFieldErrors({});
    setBanner({
      kind: "ok",
      text: "Borrador local cargado en el formulario.",
    });
  };

  const handleDeleteDraft = (id: string) => {
    const nextDrafts = getContainer().useCases.tacticalDrafts.removeDraft(id);
    setDrafts(nextDrafts);
    if (activeDraftId === id) {
      setActiveDraftId(undefined);
    }
  };

  const handleResetForm = () => {
    setActiveDraftId(undefined);
    setTipoAfectacion("inundacion");
    setNecesidadPrincipal("agua_potable");
    setOcurrioHoy(true);
    setFechaSuceso(todayKey);
    setSelectedRegion("all");
    setSelectedSector("all");
    setCentroPobladoId("");
    setLatitude("");
    setLongitude("");
    setGpsFormatted("");
    setGpsStatus("idle");
    setGpsAccuracyLabel(null);
    setGpsError(null);
    setSyncTimestamp(null);
    setDuplicate(null);
    setHogaresAfectados(0);
    setTransitability("4x4");
    setServicesAffected([]);
    setNotaReferencia("");
    setFieldErrors({});
    setCreatedIncident(null);
    setCopiedCode(false);
    setBanner(null);
    setActiveStep(1);
  };

  const handleSubmitIncident = async () => {
    setBanner(null);
    setFieldErrors({});

    if (!resolvedUser) {
      setBanner({
        kind: "error",
        text: "Debes mantener una sesión activa para registrar incidencias.",
      });
      return;
    }

    if ((latitude.trim() || longitude.trim()) && !gpsFormatted) {
      setFieldErrors({
        gpsCoords: "Ingresa ambas coordenadas WGS84 válidas (latitud y longitud) o déjalas vacías.",
      });
      setBanner({
        kind: "error",
        text: "Revisa las coordenadas GPS ingresadas manualmente.",
      });
      setActiveStep(2);
      return;
    }

    const rawPayload = {
      centroPobladoId,
      tipoAfectacion,
      hogaresAfectados,
      necesidadPrincipal,
      ocurrioHoy,
      fechaSuceso,
      gpsCoords: gpsFormatted || null,
      notaReferencia: notaReferencia || null,
    };

    const parsed = schema.safeParse(rawPayload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] ? String(issue.path[0]) : "form";
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setBanner({
        kind: "error",
        text: Object.values(nextErrors)[0] ?? "Completa los campos obligatorios antes de registrar.",
      });
      return;
    }

    setSubmitting(true);
    const result = await getContainer().useCases.createIncidencia.execute({
      values: parsed.data,
      creadoPor: resolvedUser.id,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fieldErrors ?? {});
      setBanner({
        kind: "error",
        text: result.error.message,
      });
      return;
    }

    if (activeDraftId) {
      setDrafts(getContainer().useCases.tacticalDrafts.removeDraft(activeDraftId));
      setActiveDraftId(undefined);
    }

    setCreatedIncident(result.value);
    setCopiedCode(false);
    setActiveStep(4);
    setBanner({
      kind: "ok",
      text: `Incidencia registrada con código oficial ${result.value.codigoAuditoria}.`,
    });
    await checkDuplicateForCentro(result.value.centroPobladoId);
    await onIncidentCreated?.(result.value);
  };

  const step1Done = Boolean(tipoAfectacion && reportingChannel);
  const step2Done = centroPobladoId.trim().length > 0;
  const step3Done =
    Number.isInteger(hogaresAfectados) &&
    hogaresAfectados >= 0 &&
    fechaSuceso.length > 0 &&
    Boolean(necesidadPrincipal);
  const step4Done = createdIncident !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wider text-brand-blue">
              <Shield className="h-3.5 w-3.5 text-ladp-orange" />
              <span>Comando Operativo / Registro Táctico de Incidencias</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ladp-orange">
              PROTOCOLO EDAN PERÚ — REGISTRO DIRECTO DE JEFATURA
            </p>
            <h2 className="text-xl font-bold tracking-tight text-brand-ink sm:text-2xl lg:text-3xl">
              REGISTRO TÁCTICO DE INCIDENCIA DE CAMPO
            </h2>
            <p className="max-w-3xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
              Ingreso estructurado sobre el catálogo nacional de centros poblados, detección de
              duplicados en los últimos 7 días, captura GPS del navegador y asignación de código de
              auditoría inmutable.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-mist px-3.5 py-2">
              <span className="text-xs font-bold text-brand-ink">
                {resolvedUser ? resolvedUser.nombre : "Sin sesión"}
              </span>
              <span className="font-mono text-[11px] font-semibold text-brand-blue">
                {resolvedUser ? resolvedUser.identificadorOficial : "--"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-mist px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Código de auditoría
              </span>
              {createdIncident ? (
                <div className="flex items-center gap-1.5">
                  <span
                    data-testid="codigo-auditoria"
                    className="font-mono text-xs font-bold text-brand-positive"
                  >
                    {createdIncident.codigoAuditoria}
                  </span>
                  <button
                    type="button"
                    data-testid="copy-codigo"
                    onClick={async () => {
                      const ok = await copyText(createdIncident.codigoAuditoria);
                      if (ok) setCopiedCode(true);
                    }}
                    className="rounded p-1 text-brand-blue hover:bg-brand-soft"
                    title="Copiar código"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copiedCode ? (
                    <span className="text-[10px] font-bold text-brand-positive">Copiado</span>
                  ) : null}
                </div>
              ) : (
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  Pendiente de asignación
                </span>
              )}
            </div>

            <button
              type="button"
              data-testid="test-load-draft"
              onClick={() => setDraftDrawerOpen((open) => !open)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-soft px-3.5 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
            >
              <History className="h-3.5 w-3.5" />
              <span>Borradores locales ({drafts.length})</span>
            </button>
          </div>
        </div>

        {/* Saved drafts drawer */}
        {draftDrawerOpen ? (
          <div
            data-testid="drafts-panel"
            className="mt-4 rounded-xl bg-brand-mist p-4 text-xs"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-brand-ink">
                Borradores guardados en caché local ({drafts.length})
              </span>
              <button
                type="button"
                onClick={() => setDraftDrawerOpen(false)}
                className="rounded px-2 py-0.5 text-slate-500 hover:bg-white hover:text-brand-ink"
              >
                Cerrar
              </button>
            </div>
            {drafts.length === 0 ? (
              <p className="font-medium text-slate-500">
                No hay borradores locales guardados. Usa &quot;Guardar Borrador Local&quot; para
                conservar un avance antes de registrarlo.
              </p>
            ) : (
              <ul className="space-y-2">
                {drafts.map((draft) => {
                  const centro = centros.find((c) => c.id === draft.centroPobladoId);
                  return (
                    <li
                      key={draft.id}
                      data-testid="draft-item"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-brand-ink">
                          {centro ? `${centro.nombre} (${centro.region})` : "Sin centro poblado"}{" "}
                          · {labelForTipoAfectacion(draft.tipoAfectacion)}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {formatCount(draft.hogaresAfectados)} hogares ·{" "}
                          {labelForNecesidad(draft.necesidadPrincipal)} · {draft.fechaSuceso}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadDraft(draft)}
                          className="rounded-lg bg-brand-blue px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-deep"
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(draft.id)}
                          aria-label="Eliminar borrador"
                          className="rounded-lg bg-rose-50 p-1.5 text-brand-negative hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {banner ? (
          <div
            role={banner.kind === "error" ? "alert" : "status"}
            className={`mt-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-xs font-semibold ${
              banner.kind === "error"
                ? "border-rose-200 bg-rose-50 text-brand-negative"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.kind === "error" ? (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-positive" />
              )}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => setBanner(null)}
              className="rounded p-1 hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        ) : null}
      </header>

      {/* 4-Step Progress Bar */}
      <nav
        aria-label="Progreso del formulario táctico"
        className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]"
      >
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: 1, title: "Fuente y Afectación", done: step1Done },
            { step: 2, title: "Centro Poblado y GPS", done: step2Done },
            { step: 3, title: "Evaluación EDAN", done: step3Done },
            { step: 4, title: "Registro y Código INC", done: step4Done },
          ].map(({ step, title, done }) => {
            const isCurrent = activeStep === step;
            return (
              <li key={step}>
                <button
                  type="button"
                  data-testid={`test-step-${step}`}
                  onClick={() => setActiveStep(step)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    isCurrent
                      ? "border-brand-blue bg-brand-blue text-white shadow-xs"
                      : done
                        ? "border-transparent bg-brand-soft/60 text-brand-ink hover:bg-brand-soft"
                        : "border-transparent bg-brand-mist/60 text-slate-500 hover:bg-brand-mist"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isCurrent
                        ? "bg-white text-brand-blue"
                        : done
                          ? "bg-brand-positive text-white"
                          : "bg-slate-200 text-brand-ink"
                    }`}
                  >
                    {done && !isCurrent ? <Check className="h-4 w-4 stroke-[3]" /> : step}
                  </span>
                  <div className="min-w-0">
                    <span
                      className={`block text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent
                          ? "text-blue-100"
                          : done
                            ? "text-brand-positive"
                            : "text-slate-500"
                      }`}
                    >
                      Paso {step} · {done ? "Listo" : "Pendiente"}
                    </span>
                    <span className="block truncate text-xs font-bold">{title}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form Column (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Module A */}
          <section className="space-y-5 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue text-xs font-bold text-white">
                  A
                </span>
                <h3 className="text-sm font-bold text-brand-ink sm:text-base">
                  Identificación de Fuente, Fecha y Tipo de Afectación
                </h3>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand-blue">
                Paso 1
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
              <div className="space-y-1.5 rounded-xl bg-brand-mist p-3.5 md:col-span-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Informante</span>
                  <span className="inline-flex items-center gap-1 font-bold text-brand-positive">
                    <UserCheck className="h-3 w-3" /> Activo
                  </span>
                </div>
                <p className="text-xs font-bold text-brand-ink">
                  {resolvedUser?.nombre ?? "Sesión requerida"}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {resolvedUser ? USER_ROLE_LABELS[resolvedUser.rol] : "--"}
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl bg-brand-mist p-3.5 md:col-span-4">
                <label
                  htmlFor={`${compId}-channel-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Canal de Reporte
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-channel-select`}
                    data-testid="channel-select"
                    value={reportingChannel}
                    onChange={(e) => setReportingChannel(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200/80 bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="bgan">Enlace Satelital / Directo</option>
                    <option value="radio">Radio HF / VHF Operacional</option>
                    <option value="movil">Registro Móvil en Caché Local</option>
                    <option value="fibra">Consola Web COER / Jefatura</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl bg-brand-mist p-3.5 md:col-span-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <label htmlFor={`${compId}-fecha`}>Fecha del Suceso</label>
                  <button
                    type="button"
                    data-testid="ocurrio-hoy-toggle"
                    onClick={() => {
                      const nextToday = !ocurrioHoy;
                      setOcurrioHoy(nextToday);
                      if (nextToday) {
                        setFechaSuceso(todayKey);
                      }
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      ocurrioHoy
                        ? "bg-brand-blue text-white"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {ocurrioHoy ? "Ocurrió hoy" : "Otra fecha"}
                  </button>
                </div>
                <input
                  id={`${compId}-fecha`}
                  type="date"
                  data-testid="fecha-suceso-input"
                  value={fechaSuceso}
                  max={todayKey}
                  readOnly={ocurrioHoy}
                  onChange={(e) => {
                    setOcurrioHoy(e.target.value === todayKey);
                    setFechaSuceso(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
                {fieldErrors.fechaSuceso ? (
                  <p className="text-[11px] font-semibold text-brand-negative">
                    {fieldErrors.fechaSuceso}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Tipo de Afectacion */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                Tipo de Afectación (Catálogo Oficial):
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {TIPO_AFECTACION_OPTIONS.map((item) => {
                  const Icon = iconForAfectacion(item.value);
                  const isSelected = tipoAfectacion === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      data-testid={`phenomenon-${item.value}`}
                      onClick={() => setTipoAfectacion(item.value)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-brand-blue bg-brand-soft/60 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-brand-mist/50"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-brand-blue text-white"
                            : "bg-brand-mist text-brand-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-brand-ink">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Module B */}
          <section className="space-y-5 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue text-xs font-bold text-white">
                  B
                </span>
                <h3 className="text-sm font-bold text-brand-ink sm:text-base">
                  Centro Poblado y Georreferenciación WGS84
                </h3>
              </div>
              <button
                type="button"
                data-testid="gps-btn"
                disabled={gpsStatus === "loading"}
                onClick={() => void handleFetchGps()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white disabled:opacity-60"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>
                  {gpsStatus === "loading"
                    ? "Obteniendo ubicación..."
                    : gpsAccuracyLabel
                      ? `Actualizar GPS (${gpsAccuracyLabel})`
                      : "Obtener GPS Dispositivo"}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-region-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Región Operativa
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-region-select`}
                    data-testid="region-select"
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    <option value="all">Todas las regiones ({centros.length} centros)</option>
                    {availableRegions.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-sector-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Sector / Cuenca
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-sector-select`}
                    data-testid="sector-select"
                    value={selectedSector}
                    onChange={(e) => handleSectorChange(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    <option value="all">Todos los sectores</option>
                    {availableSectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-centro-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Centro Poblado *
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-centro-select`}
                    data-testid="centro-select"
                    value={centroPobladoId}
                    onChange={(e) => handleSelectCentro(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    <option value="">Selecciona un centro poblado...</option>
                    {filteredCentros.map((centro) => (
                      <option key={centro.id} value={centro.id}>
                        {centro.nombre} — {centro.sector}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
                {fieldErrors.centroPobladoId ? (
                  <p className="text-[11px] font-semibold text-brand-negative">
                    {fieldErrors.centroPobladoId}
                  </p>
                ) : null}
              </div>
            </div>

            {duplicate?.hasPreviousReports ? (
              <div
                data-testid="duplicate-alert"
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ladp-orange" />
                <div>
                  <p className="font-bold">
                    Posible duplicado detectado en {selectedCentro?.nombre ?? "este centro"} (
                    {duplicate.count}{" "}
                    {duplicate.count === 1 ? "reporte previo" : "reportes previos"} en los
                    últimos {duplicate.windowDays} días)
                  </p>
                  <p className="mt-0.5 font-mono text-[11px]">
                    Códigos existentes: {duplicate.codes.join(", ")}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Coordinates inputs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-lat`}
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Latitud WGS84 (opcional)
                </label>
                <input
                  id={`${compId}-lat`}
                  type="text"
                  data-testid="lat-input"
                  placeholder="Ej. -5.26540"
                  value={latitude}
                  onChange={(e) => handleManualCoordsChange(e.target.value, longitude)}
                  className="w-full rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-semibold text-brand-ink placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-lng`}
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Longitud WGS84 (opcional)
                </label>
                <input
                  id={`${compId}-lng`}
                  type="text"
                  data-testid="lng-input"
                  placeholder="Ej. -80.67820"
                  value={longitude}
                  onChange={(e) => handleManualCoordsChange(latitude, e.target.value)}
                  className="w-full rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-semibold text-brand-ink placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Valor GPS Registrado
                </span>
                <div
                  data-testid="gps-value"
                  className="flex min-h-[34px] items-center rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-bold text-brand-ink"
                >
                  {gpsFormatted || "Sin coordenadas registradas"}
                </div>
              </div>
            </div>

            {gpsError || fieldErrors.gpsCoords ? (
              <p className="text-xs font-semibold text-brand-negative">
                {gpsError ?? fieldErrors.gpsCoords}
              </p>
            ) : syncTimestamp ? (
              <p className="font-mono text-[11px] font-semibold text-brand-positive">
                GPS sincronizado: {syncTimestamp}
              </p>
            ) : null}

            {/* Tactical Preview Map */}
            <div className="relative overflow-hidden rounded-xl bg-brand-deep p-4 text-white">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ladp-orange" />
                  <span className="text-xs font-bold text-blue-100">
                    {selectedCentro
                      ? `${selectedCentro.nombre} · ${selectedCentro.sector} (${selectedCentro.region})`
                      : "Vista territorial Perú (selecciona centro o captura GPS)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: "satelite", label: "Satélite" },
                      { id: "topografia", label: "Topografía" },
                      { id: "cuencas", label: "Cuencas" },
                    ] as const
                  ).map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveMapLayer(layer.id)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                        activeMapLayer === layer.id
                          ? "bg-brand-blue text-white"
                          : "bg-white/10 text-white/75 hover:bg-white/20"
                      }`}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`relative h-36 w-full overflow-hidden rounded-lg ${
                  activeMapLayer === "satelite"
                    ? "bg-slate-900"
                    : activeMapLayer === "topografia"
                      ? "bg-brand-ink"
                      : "bg-brand-deep"
                }`}
              >
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
                  aria-hidden="true"
                >
                  <defs>
                    <pattern id={`${compId}-grid`} width="28" height="28" patternUnits="userSpaceOnUse">
                      <path
                        d="M 28 0 L 0 0 0 28"
                        fill="none"
                        stroke="#90bafe"
                        strokeWidth="0.6"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#${compId}-grid)`} />
                </svg>

                {parsedMapPoint ? (
                  <div
                    style={{
                      left: `${parsedMapPoint.projected.xPercent}%`,
                      top: `${parsedMapPoint.projected.yPercent}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-ladp-orange text-white ring-2 ring-white shadow-lg">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-blue-200/80">
                    Sin punto georreferenciado — captura GPS o ingresa latitud y longitud
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Module C */}
          <section className="space-y-5 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue text-xs font-bold text-white">
                  C
                </span>
                <h3 className="text-sm font-bold text-brand-ink sm:text-base">
                  Afectación de Hogares, Necesidad Principal y Observaciones
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">Validación de dominio</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="space-y-2 rounded-xl bg-brand-mist p-4 md:col-span-5">
                <div className="flex items-center justify-between text-brand-ink">
                  <label htmlFor={`${compId}-hogares`} className="text-xs font-bold">
                    Hogares Afectados *
                  </label>
                  <Home className="h-4 w-4 text-brand-blue" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid="counter-hogares-dec"
                    onClick={() => setHogaresAfectados((v) => Math.max(0, v - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white font-bold text-brand-ink hover:bg-brand-soft"
                  >
                    -
                  </button>
                  <input
                    id={`${compId}-hogares`}
                    type="number"
                    min={0}
                    max={100000}
                    data-testid="counter-hogares-input"
                    value={hogaresAfectados}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      setHogaresAfectados(Number.isFinite(raw) ? Math.max(0, Math.trunc(raw)) : 0);
                    }}
                    className="w-24 rounded-lg border border-slate-200/80 bg-white py-1.5 text-center font-mono text-base font-bold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  />
                  <button
                    type="button"
                    data-testid="counter-hogares-inc"
                    onClick={() => setHogaresAfectados((v) => Math.min(100000, v + 5))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white font-bold text-brand-ink hover:bg-brand-soft"
                  >
                    +
                  </button>
                </div>
                {fieldErrors.hogaresAfectados ? (
                  <p className="text-[11px] font-semibold text-brand-negative">
                    {fieldErrors.hogaresAfectados}
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-slate-500">
                    Cantidad entera entre 0 y 100,000 hogares
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-7">
                <span className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Necesidad Principal Prioritaria *
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {NECESIDAD_OPTIONS.map((opt) => {
                    const selected = necesidadPrincipal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`necesidad-${opt.value}`}
                        onClick={() => setNecesidadPrincipal(opt.value)}
                        className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${
                          selected
                            ? "border-brand-blue bg-brand-blue text-white"
                            : "border-slate-200 bg-white text-brand-ink hover:bg-brand-mist"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Transitability */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                Condición de Acceso / Transitabilidad (Contexto Operativo)
              </span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {TRANSITABILITY_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`transit-${item.id}`}
                    onClick={() => setTransitability(item.id)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      transitability === item.id
                        ? "border-ladp-orange bg-amber-50/70 font-bold text-brand-ink"
                        : "border-slate-200/80 bg-white text-brand-ink hover:bg-brand-mist/60"
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Services checklist */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Líneas Vitales Afectadas
                </span>
                <button
                  type="button"
                  onClick={handleAppendAccessContextToNote}
                  className="rounded-lg bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  Insertar resumen en nota
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {VITAL_SERVICES.map((srv) => {
                  const Icon = srv.icon;
                  const active = servicesAffected.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      data-testid={`service-${srv.id}`}
                      onClick={() => handleToggleService(srv.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-center transition-all ${
                        active
                          ? "border-brand-negative/50 bg-rose-50 font-bold text-brand-negative"
                          : "border-transparent bg-brand-mist text-slate-500 hover:bg-brand-soft/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] font-bold leading-tight">{srv.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`${compId}-nota`}
                  className="font-bold uppercase tracking-wider text-brand-ink"
                >
                  Nota de Referencia de Campo (opcional)
                </label>
                <span className="font-mono text-[11px] text-slate-500">
                  {notaReferencia.length}/280
                </span>
              </div>
              <textarea
                id={`${compId}-nota`}
                rows={3}
                maxLength={280}
                data-testid="nota-referencia-input"
                value={notaReferencia}
                onChange={(e) => setNotaReferencia(e.target.value)}
                placeholder="Describe ubicación exacta, familias evacuadas, puntos de acceso o requerimientos urgentes..."
                className="w-full rounded-xl bg-brand-mist p-3 text-xs font-medium text-brand-ink placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
              {fieldErrors.notaReferencia ? (
                <p className="text-[11px] font-semibold text-brand-negative">
                  {fieldErrors.notaReferencia}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        {/* Right Sidebar (4 cols) */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Validation Readiness Panel */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-brand-ink">
                <ClipboardCheck className="h-4 w-4 text-brand-blue" />
                <span>Verificación Pre-Registro</span>
              </h3>
              <span className="rounded bg-brand-mist px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                Esquema EDAN
              </span>
            </div>

            <ul className="space-y-2 text-xs">
              {[
                {
                  label: "Centro poblado",
                  value: selectedCentro ? `${selectedCentro.nombre} (${selectedCentro.region})` : "Sin seleccionar",
                  ok: Boolean(selectedCentro),
                },
                {
                  label: "Tipo de afectación",
                  value: labelForTipoAfectacion(tipoAfectacion),
                  ok: true,
                },
                {
                  label: "Necesidad principal",
                  value: labelForNecesidad(necesidadPrincipal),
                  ok: true,
                },
                {
                  label: "Hogares afectados",
                  value: `${formatCount(hogaresAfectados)} hogares`,
                  ok: Number.isInteger(hogaresAfectados) && hogaresAfectados >= 0,
                },
                {
                  label: "Fecha del suceso",
                  value: fechaSuceso || "Inválida",
                  ok: Boolean(fechaSuceso) && fechaSuceso <= todayKey,
                },
                {
                  label: "GPS (opcional)",
                  value: gpsFormatted || "No registrado",
                  ok: Boolean(gpsFormatted),
                  optional: true,
                },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-2 rounded-lg bg-brand-mist px-3 py-2"
                >
                  <span className="font-semibold text-slate-600">{item.label}</span>
                  <span
                    className={`truncate font-bold ${
                      item.ok
                        ? "text-brand-positive"
                        : item.optional
                          ? "text-slate-500"
                          : "text-ladp-orange"
                    }`}
                  >
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Duplicate Monitor */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-brand-ink">
              <Radio className="h-4 w-4 text-brand-blue" />
              <span>Control de Duplicados ({duplicate?.windowDays ?? 7} días)</span>
            </h3>
            {!centroPobladoId ? (
              <p className="text-xs font-medium text-slate-500">
                Selecciona un centro poblado para consultar reportes recientes en el mismo punto.
              </p>
            ) : duplicateLoading ? (
              <p className="text-xs font-medium text-slate-500">Verificando historial reciente...</p>
            ) : duplicate?.hasPreviousReports ? (
              <div className="space-y-1.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold">
                  {duplicate.count}{" "}
                  {duplicate.count === 1 ? "coincidencia reciente" : "coincidencias recientes"}
                </p>
                {duplicate.codes.map((code) => (
                  <p key={code} className="font-mono text-[11px]">
                    {code}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                Sin duplicados registrados en los últimos {duplicate?.windowDays ?? 7} días para{" "}
                {selectedCentro?.nombre ?? "esta zona"}.
              </div>
            )}
          </section>

          {/* Action Execution Panel */}
          <section className="space-y-3 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-bold text-brand-ink">
              <Send className="h-4 w-4 text-ladp-orange" />
              <span>Ejecución del Registro</span>
            </h3>

            {Object.keys(fieldErrors).length > 0 ? (
              <div
                data-testid="form-errors"
                role="alert"
                className="space-y-1 rounded-lg bg-rose-50 p-2.5 text-[11px] font-semibold text-brand-negative"
              >
                {Object.values(fieldErrors).map((err, index) => (
                  <p key={index}>{err}</p>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              disabled={submitting}
              data-testid="submit-incident-btn"
              onClick={() => void handleSubmitIncident()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-ladp-orange px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-ladp-orange/90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? "Registrando..." : "Registrar Incidencia"}</span>
            </button>

            <button
              type="button"
              data-testid="save-draft-btn"
              onClick={handleSaveDraft}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-mist px-4 py-2.5 text-xs font-bold text-brand-ink transition-colors hover:bg-brand-soft"
            >
              <Save className="h-3.5 w-3.5 text-brand-blue" />
              <span>Guardar Borrador Local</span>
            </button>

            <button
              type="button"
              data-testid="reset-form-btn"
              onClick={handleResetForm}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-brand-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpiar Formulario</span>
            </button>

            <p className="pt-1 text-center text-[10px] font-medium leading-tight text-slate-500">
              Al confirmar el registro se asigna un código INC único en el repositorio nacional de
              incidencias.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
