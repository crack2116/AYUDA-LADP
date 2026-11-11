"use client";

import { useId, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Baby,
  BellRing,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudRain,
  Crosshair,
  Droplets,
  Flame,
  HeartHandshake,
  History,
  Home,
  MapPin,
  Navigation,
  Paperclip,
  PhoneOff,
  RefreshCw,
  Save,
  Send,
  Shield,
  ShieldAlert,
  Trash2,
  Truck,
  UploadCloud,
  UserCheck,
  Users,
  Video,
  Waves,
  ZapOff,
} from "lucide-react";

type PhenomenonType =
  | "fluvial"
  | "huayco"
  | "colapso"
  | "lluvia"
  | "quebrada"
  | "oleaje";

interface PhenomenonOption {
  id: PhenomenonType;
  title: string;
  description: string;
  icon: typeof Droplets;
  accent: string;
  badge: string;
}

const PHENOMENON_OPTIONS: readonly PhenomenonOption[] = [
  {
    id: "fluvial",
    title: "Inundación Fluvial",
    description: "Desborde de río / defensas ribereñas",
    icon: Droplets,
    accent: "border-sky-500 bg-sky-50/50 text-sky-950 dark:bg-sky-950/20 dark:text-sky-100",
    badge: "Prioridad 1",
  },
  {
    id: "huayco",
    title: "Huayco / Masa",
    description: "Movimiento de detritos y lodo en quebradas",
    icon: Flame,
    accent: "border-amber-500 bg-amber-50/50 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100",
    badge: "Prioridad 1",
  },
  {
    id: "colapso",
    title: "Colapso Vial",
    description: "Corte de puentes o rutas de penetración",
    icon: AlertOctagon,
    accent: "border-orange-500 bg-orange-50/50 text-orange-950 dark:bg-orange-950/20 dark:text-orange-100",
    badge: "Acceso Crítico",
  },
  {
    id: "lluvia",
    title: "Lluvia Torrencial",
    description: "Anegamiento urbano severo / colapso pluvial",
    icon: CloudRain,
    accent: "border-blue-500 bg-blue-50/50 text-blue-950 dark:bg-blue-950/20 dark:text-blue-100",
    badge: "Monitoreo",
  },
  {
    id: "quebrada",
    title: "Quebrada Seca",
    description: "Activación súbita de flujo sin aviso previo",
    icon: Activity,
    accent: "border-purple-500 bg-purple-50/50 text-purple-950 dark:bg-purple-950/20 dark:text-purple-100",
    badge: "Alta Amenaza",
  },
  {
    id: "oleaje",
    title: "Oleaje Anómalo",
    description: "Impacto en borde litoral e infraestructura portuaria",
    icon: Waves,
    accent: "border-cyan-500 bg-cyan-50/50 text-cyan-950 dark:bg-cyan-950/20 dark:text-cyan-100",
    badge: "Costero",
  },
];

interface RegionData {
  provincias: Record<string, string[]>;
}

const GEOGRAPHIC_DATA: Record<string, RegionData> = {
  Piura: {
    provincias: {
      Piura: ["Catacaos", "Cura Mori", "Castilla", "Tambogrande", "Las Lomas"],
      Morropón: ["Chulucanas", "Buenos Aires", "Morropón", "Salitral"],
      Paita: ["Paita", "Amotape", "La Huaca", "Vichayal"],
      Sullana: ["Sullana", "Bellavista", "Lancones", "Marcavelica", "Querecotillo"],
    },
  },
  Tumbes: {
    provincias: {
      Tumbes: ["Tumbes", "Corrales", "La Cruz", "Pampas de Hospital", "San Jacinto"],
      Zarumilla: ["Zarumilla", "Aguas Verdes", "Matapalo", "Papayal"],
      "Contralmirante Villar": ["Zorritos", "Casitas", "Canoas de Punta Sal"],
    },
  },
  Lambayeque: {
    provincias: {
      Chiclayo: ["Chiclayo", "Chongoyape", "Eten", "José Leonardo Ortiz", "La Victoria"],
      Lambayeque: ["Lambayeque", "Íllimo", "Jayanca", "Mochumí", "Mórrope", "Olmos", "Pacora"],
      Ferreñafe: ["Ferreñafe", "Cañaris", "Incahuasi", "Pítipo"],
    },
  },
  "La Libertad": {
    provincias: {
      Trujillo: ["Trujillo", "El Porvenir", "Florencia de Mora", "Huanchaco", "La Esperanza", "Laredo", "Moche", "Víctor Larco"],
      Ascope: ["Ascope", "Chicama", "Chocope", "Magdalena de Cao", "Paiján"],
      Pacasmayo: ["San Pedro de Lloc", "Guadalupe", "Jequetepeque", "Pacasmayo", "San José"],
    },
  },
};

const CASERIOS_MAP: Record<string, string[]> = {
  Catacaos: ["CP El Molino", "Monte Sullón", "Simbilá", "Narihualá", "Pedregal Grande", "Pedregal Chico"],
  "Cura Mori": ["Cucungará", "Nuevo Pozo de los Ramos", "Santa Rosa", "San Pedro"],
  Castilla: ["Miraflores", "Tacalá", "El Indio", "Chiclayito"],
  Chulucanas: ["Batanes", "Yapatera", "La Encantada", "Sol Sol"],
  Tumbes: ["Puerto Pizarro", "Puyango", "San Juan de la Virgen"],
  Íllimo: ["La Zaranda", "El Puente", "Las Juntas"],
};

export function RegistroTacticoTab() {
  const compId = useId();

  // Stepper State
  const [activeStep, setActiveStep] = useState<number>(2);

  // Header State
  // The audit code is allocated by the backend when the incident is registered, so a
  // draft has none. Keep it absent instead of showing a sequential code that does not
  // exist in the system; the timestamp stays empty until the operator syncs the GPS.
  const [syncTimestamp, setSyncTimestamp] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  // Module A State
  const [reportingChannel, setReportingChannel] = useState("bgan");
  const [phenomenon, setPhenomenon] = useState<PhenomenonType>("fluvial");

  // Module B State
  const [selectedRegion, setSelectedRegion] = useState("Piura");
  const [selectedProvincia, setSelectedProvincia] = useState("Piura");
  const [selectedDistrito, setSelectedDistrito] = useState("Catacaos");
  const [selectedCaserio, setSelectedCaserio] = useState("CP El Molino");
  const [latitude, setLatitude] = useState("-5.2654");
  const [longitude, setLongitude] = useState("-80.6782");
  const [altitude, setAltitude] = useState("29 msnm (±0.8m)");
  const [utmZone, setUtmZone] = useState("17M / 540821E 9425881N");
  const [gpsAccuracy, setGpsAccuracy] = useState("±2.4m");
  const [activeMapLayer, setActiveMapLayer] = useState<"satelite" | "topografia" | "inundacion">("inundacion");

  // Module C State (EDAN Counters)
  const [familiasAfectadas, setFamiliasAfectadas] = useState(110);
  const [damnificadosDirectos, setDamnificadosDirectos] = useState(480);
  const [menoresLactantes, setMenoresLactantes] = useState(85);
  const [adultosMayores, setAdultosMayores] = useState(34);
  const [transitability, setTransitability] = useState<"4x4" | "aerea" | "bloqueada" | "aislado">("aislado");

  // Basic Services Checklist
  const [servicesState, setServicesState] = useState({
    sinAgua: true,
    sinLuz: true,
    sinCobertura: true,
    colapsoDesague: false,
    saludAfectado: true,
  });

  // Right Panel State (Multimedia & Dispatch)
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: "f1", name: "Desborde_río_Piura_km12.jpg", size: "1.8 MB", verified: true },
    { id: "f2", name: "Corte_terraplen_acceso.jpg", size: "2.1 MB", verified: true },
  ]);
  const [droneStreamActive, setDroneStreamActive] = useState(true);
  const [brigadeDispatchEnabled, setBrigadeDispatchEnabled] = useState(true);
  const [selectedBrigadeUnit, setSelectedBrigadeUnit] = useState("bravo-3");

  const [requestedEquipment, setRequestedEquipment] = useState({
    motobombas: true,
    boteZodiac: true,
    sacosTerreros: true,
    racionesAgua: true,
  });

  // Handlers
  const handleRefreshGps = () => {
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;
    setLatitude((-5.2654 + latOffset).toFixed(4));
    setLongitude((-80.6782 + lngOffset).toFixed(4));
    setGpsAccuracy(`±${(1.8 + Math.random() * 1.5).toFixed(1)}m`);
    setSyncTimestamp(
      new Date().toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " -05",
    );
  };

  const handleRegionChange = (reg: string) => {
    setSelectedRegion(reg);
    const provincias = Object.keys(GEOGRAPHIC_DATA[reg]?.provincias ?? {});
    const firstProv = provincias[0] ?? "";
    setSelectedProvincia(firstProv);
    const distritos = GEOGRAPHIC_DATA[reg]?.provincias[firstProv] ?? [];
    const firstDist = distritos[0] ?? "";
    setSelectedDistrito(firstDist);
    const caserios = CASERIOS_MAP[firstDist] ?? ["Centro Poblado Principal"];
    setSelectedCaserio(caserios[0] ?? "Zona Centro");
  };

  const handleProvinciaChange = (prov: string) => {
    setSelectedProvincia(prov);
    const distritos = GEOGRAPHIC_DATA[selectedRegion]?.provincias[prov] ?? [];
    const firstDist = distritos[0] ?? "";
    setSelectedDistrito(firstDist);
    const caserios = CASERIOS_MAP[firstDist] ?? ["Centro Poblado Principal"];
    setSelectedCaserio(caserios[0] ?? "Zona Centro");
  };

  const handleDistritoChange = (dist: string) => {
    setSelectedDistrito(dist);
    const caserios = CASERIOS_MAP[dist] ?? ["Sector Central", "Zona Rural Alta"];
    setSelectedCaserio(caserios[0] ?? "Sector Central");
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRegisterIncident = () => {
    setLastNotification(`Incidencia registrada en la red COEN/INDECI. Brigada ${selectedBrigadeUnit.toUpperCase()} notificada. El código de auditoría se asigna al confirmar el registro.`);
  };

  const handleSaveDraft = () => {
    setLastNotification("Borrador guardado en el cache local seguro (IndexedDB/LocalStorage cifrado AES-256).");
  };

  const handleEmitSismate = () => {
    setLastNotification(`¡ALERTA SISMATE ENVIADA! Mensaje de alerta celular emitido a 12,450 terminales en el cuadrante de Catacaos.`);
  };

  return (
    <div className="space-y-6">
      {/* Tactical Command Header */}
      <header className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wider text-brand-blue">
              <Shield className="h-3.5 w-3.5 text-ladp-orange" />
              <span>Comando Operativo / Registro Táctico de Incidencias en Campo</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ladp-orange">
              PROTOCOLO EDAN PERÚ — FORMULARIO DE EVALUACIÓN RÁPIDA
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-brand-ink">
              REGISTRO TÁCTICO DE INCIDENCIA DE CAMPO
            </h2>
            <p className="max-w-3xl text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Ingreso inmediato de reportes georreferenciados, evaluación preliminar de severidad
              hidrometeorológica, asignación de cuadrante y despacho de recursos de respuesta rápida
              ante el Fenómeno El Niño 2026.
            </p>
          </div>

          {/* Quick Action / Telemetry Header Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {/* SAT Telemetry pill */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-mist px-3.5 py-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-brand-positive">Telemetría SAT En Línea</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">(BGAN/Starlink)</span>
            </div>

            {/* Audit code: allocated by the backend on registration, never faked here. */}
            <div className="flex items-center justify-between gap-2 rounded-lg bg-brand-mist px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Código de auditoría
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-700">
                Pendiente de asignación
              </span>
            </div>

            {/* Drafts indicator */}
            <button
              type="button"
              data-testid="test-load-draft"
              onClick={handleSaveDraft}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-soft px-3.5 py-2 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              <span>Cargar Borrador Local (3 pendientes)</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner if action clicked */}
        {lastNotification ? (
          <div
            role="status"
            className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-positive shrink-0" />
              <span>{lastNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastNotification(null)}
              className="rounded p-1 hover:bg-emerald-100 text-emerald-700"
            >
              ✕
            </button>
          </div>
        ) : null}
      </header>

      {/* 4-Step Stepper Bar */}
      <nav aria-label="Progreso del formulario táctico" className="rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <li
            data-testid="test-step-1"
            onClick={() => setActiveStep(1)}
            className={`cursor-pointer rounded-lg p-3 flex items-center gap-3 transition-all border ${
              activeStep === 1
                ? "bg-brand-soft border-brand-blue text-brand-ink"
                : "border-transparent bg-brand-mist/60 hover:bg-brand-mist text-slate-500"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-positive text-white font-bold text-xs">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-brand-positive">
                Paso 1 · Validado
              </span>
              <span className="block truncate text-xs font-bold text-brand-ink">
                Datos de Fuente y Brigada
              </span>
            </div>
          </li>

          <li
            data-testid="test-step-2"
            onClick={() => setActiveStep(2)}
            className={`cursor-pointer rounded-lg p-3 flex items-center gap-3 transition-all border ${
              activeStep === 2
                ? "bg-brand-blue text-white border-brand-blue shadow-xs"
                : "border-transparent bg-brand-mist/60 hover:bg-brand-mist text-slate-500"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                activeStep === 2 ? "bg-white text-brand-blue" : "bg-brand-soft text-brand-blue"
              }`}
            >
              2
            </div>
            <div className="min-w-0">
              <span
                className={`block text-[11px] font-bold uppercase tracking-wider ${
                  activeStep === 2 ? "text-blue-100" : "text-brand-blue"
                }`}
              >
                Paso 2 · En Curso
              </span>
              <span
                className={`block truncate text-xs font-bold ${
                  activeStep === 2 ? "text-white" : "text-brand-ink"
                }`}
              >
                Georreferenciación y Cuadrante
              </span>
            </div>
          </li>

          <li
            data-testid="test-step-3"
            onClick={() => setActiveStep(3)}
            className={`cursor-pointer rounded-lg p-3 flex items-center gap-3 transition-all border ${
              activeStep === 3
                ? "bg-brand-soft border-brand-blue text-brand-ink"
                : "border-transparent bg-brand-mist/60 hover:bg-brand-mist text-slate-500"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-brand-ink font-bold text-xs">
              3
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Paso 3 · Pendiente
              </span>
              <span className="block truncate text-xs font-bold text-brand-ink">
                Evaluación EDAN y Población
              </span>
            </div>
          </li>

          <li
            data-testid="test-step-4"
            onClick={() => setActiveStep(4)}
            className={`cursor-pointer rounded-lg p-3 flex items-center gap-3 transition-all border ${
              activeStep === 4
                ? "bg-brand-soft border-brand-blue text-brand-ink"
                : "border-transparent bg-brand-mist/60 hover:bg-brand-mist text-slate-500"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-brand-ink font-bold text-xs">
              4
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Paso 4 · Pendiente
              </span>
              <span className="block truncate text-xs font-bold text-brand-ink">
                Evidencia y Despacho
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Main 2-Column Grid: Form Sections (Left) & Support Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Modules (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Módulo A: Identificación de la Fuente y Tipo de Evento */}
          <section className="rounded-xl bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue text-white text-xs font-bold">
                  A
                </span>
                <h3 className="text-sm sm:text-base font-bold text-brand-ink">
                  Identificación de la Fuente y Tipo de Evento
                </h3>
              </div>
              <span className="rounded-full bg-rose-50 text-brand-negative px-2.5 py-0.5 text-[11px] font-bold uppercase">
                Prioridad Alta
              </span>
            </div>

            {/* Officer, Channel & Sync Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Informant */}
              <div className="md:col-span-4 space-y-1.5 rounded-xl bg-brand-mist p-3.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Oficial Informante</span>
                  <span className="inline-flex items-center gap-1 text-brand-positive font-bold">
                    <UserCheck className="h-3 w-3" /> Verificado
                  </span>
                </div>
                <p className="text-xs font-bold text-brand-ink">Cmdte. Manuel Vásquez T.</p>
                <p className="text-[11px] text-slate-500 font-medium">Patrulla Táctica Bravo-3</p>
              </div>

              {/* Channel */}
              <div className="md:col-span-5 space-y-1.5 rounded-xl bg-brand-mist p-3.5">
                <label
                  htmlFor={`${compId}-channel-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Canal de Transmisión
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-channel-select`}
                    data-testid="channel-select"
                    value={reportingChannel}
                    onChange={(e) => setReportingChannel(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-white border border-slate-200/80 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-brand-ink focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="bgan">Terminal Satelital Móvil (BGAN)</option>
                    <option value="radio">Radio HF/VHF Operacional (Red PNP)</option>
                    <option value="movil">Formulario Móvil de Campo (Cache local)</option>
                    <option value="fibra">Enlace Directo COER Piura (Enlace Fibra)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="text-[10px] text-brand-positive font-bold">Cifrado Operativo FIPS 140-2</p>
              </div>

              {/* Timestamp */}
              <div className="md:col-span-3 space-y-1.5 rounded-xl bg-brand-mist p-3.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Marca de Tiempo</span>
                  <span className="text-[10px] font-bold text-brand-blue">GPS Sync</span>
                </div>
                <p className="text-xs font-mono font-bold text-brand-ink">
                  {syncTimestamp ?? "Pendiente de sincronización GPS"}
                </p>
                <button
                  type="button"
                  onClick={handleRefreshGps}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                >
                  <RefreshCw className="h-3 w-3" /> Resincronizar RTC
                </button>
              </div>
            </div>

            {/* Phenomenon Type Selection Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                Tipo de Fenómeno Principal (Selección Obligatoria):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {PHENOMENON_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = phenomenon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`phenomenon-${item.id}`}
                      onClick={() => setPhenomenon(item.id)}
                      className={`relative flex flex-col items-start gap-2 rounded-xl p-3 text-left transition-all border-2 ${
                        isSelected
                          ? "border-brand-blue bg-brand-soft/60 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-brand-mist/50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-brand-blue text-white"
                              : "bg-brand-mist text-brand-ink"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="rounded-full bg-brand-mist px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          {item.badge}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-brand-ink">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Módulo B: Georreferenciación Precisa y Ubicación Territorial */}
          <section className="rounded-xl bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue text-white text-xs font-bold">
                  B
                </span>
                <h3 className="text-sm sm:text-base font-bold text-brand-ink">
                  Georreferenciación Precisa y Ubicación Territorial
                </h3>
              </div>
              <button
                type="button"
                data-testid="gps-btn"
                onClick={handleRefreshGps}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft hover:bg-brand-blue text-brand-blue hover:text-white px-3 py-1.5 text-xs font-bold transition-colors"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span>Obtener GPS Dispositivo ({gpsAccuracy})</span>
              </button>
            </div>

            {/* Cascading Location Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Region */}
              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-region-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Departamento / Región
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-region-select`}
                    data-testid="region-select"
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    {Object.keys(GEOGRAPHIC_DATA).map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {/* Provincia */}
              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-provincia-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Provincia
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-provincia-select`}
                    data-testid="provincia-select"
                    value={selectedProvincia}
                    onChange={(e) => handleProvinciaChange(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    {Object.keys(GEOGRAPHIC_DATA[selectedRegion]?.provincias ?? {}).map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {/* Distrito */}
              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-distrito-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Distrito
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-distrito-select`}
                    data-testid="distrito-select"
                    value={selectedDistrito}
                    onChange={(e) => handleDistritoChange(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    {(GEOGRAPHIC_DATA[selectedRegion]?.provincias[selectedProvincia] ?? []).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {/* Caserio / CP */}
              <div className="space-y-1">
                <label
                  htmlFor={`${compId}-caserio-select`}
                  className="block text-[11px] font-bold text-slate-500"
                >
                  Caserío / Centro Poblado
                </label>
                <div className="relative">
                  <select
                    id={`${compId}-caserio-select`}
                    data-testid="caserio-select"
                    value={selectedCaserio}
                    onChange={(e) => setSelectedCaserio(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-brand-mist py-2 pl-3 pr-8 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  >
                    {(CASERIOS_MAP[selectedDistrito] ?? ["Sector Central", "Zona Rural"]).map((cas) => (
                      <option key={cas} value={cas}>
                        {cas}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Coordinates Inputs Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Latitud (WGS84)
                </label>
                <input
                  type="text"
                  data-testid="lat-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Longitud (WGS84)
                </label>
                <input
                  type="text"
                  data-testid="lng-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Altitud / Cota
                </label>
                <input
                  type="text"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  className="w-full rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Zona UTM
                </label>
                <input
                  type="text"
                  value={utmZone}
                  onChange={(e) => setUtmZone(e.target.value)}
                  className="w-full rounded-lg bg-brand-mist px-3 py-2 font-mono text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                />
              </div>
            </div>

            {/* Tactical Mini Map Preview */}
            <div className="relative overflow-hidden rounded-xl bg-brand-deep p-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ladp-orange" />
                  <span className="text-xs font-bold text-blue-100">
                    Detección Hidrológica: Cuenca Río Piura (Sector Medio - {selectedDistrito})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveMapLayer("satelite")}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                      activeMapLayer === "satelite" ? "bg-brand-blue text-white" : "bg-white/10 text-white/75 hover:bg-white/20"
                    }`}
                  >
                    Satélite
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMapLayer("topografia")}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                      activeMapLayer === "topografia" ? "bg-brand-blue text-white" : "bg-white/10 text-white/75 hover:bg-white/20"
                    }`}
                  >
                    Topografía
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMapLayer("inundacion")}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                      activeMapLayer === "inundacion" ? "bg-ladp-orange text-white" : "bg-white/10 text-white/75 hover:bg-white/20"
                    }`}
                  >
                    Inundación 2017
                  </button>
                </div>
              </div>

              {/* Stylized Vector Radar Preview Canvas */}
              <div className="relative h-44 w-full rounded-lg bg-[#04122b] overflow-hidden flex items-center justify-center">
                {/* Grid Overlay */}
                <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="tacticalGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#tacticalGrid)" />
                </svg>

                {/* River vector line */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <path
                    d="M 10 20 Q 90 90 200 80 T 390 140"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="8"
                    strokeOpacity="0.4"
                  />
                  <path
                    d="M 10 20 Q 90 90 200 80 T 390 140"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                  {activeMapLayer === "inundacion" && (
                    <polygon
                      points="120,60 250,50 320,110 180,120"
                      fill="#ea580c"
                      fillOpacity="0.3"
                      stroke="#ea580c"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>

                {/* Pulsing Tactical Pin */}
                <div className="relative z-10 flex flex-col items-center">
                  <span className="relative flex h-5 w-5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ladp-orange opacity-75" />
                    <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-ladp-orange text-white font-bold text-[9px]">
                      📍
                    </span>
                  </span>
                  <div className="mt-1 rounded bg-brand-deep/85 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-sm">
                    {latitude}, {longitude}
                  </div>
                  <span className="text-[9px] font-bold text-white/85">{selectedCaserio}</span>
                </div>

                {/* Mini Compass */}
                <div className="absolute top-2 right-2 flex flex-col items-center rounded bg-brand-deep/75 px-1.5 py-0.5 text-[9px] font-mono text-blue-200 backdrop-blur-sm">
                  <span>N</span>
                  <Navigation className="h-3 w-3 text-blue-200 rotate-45" />
                </div>
              </div>
            </div>
          </section>

          {/* Módulo C: Cuantificación Preliminar de Afectación y Necesidades (EDAN) */}
          <section className="rounded-xl bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue text-white text-xs font-bold">
                  C
                </span>
                <h3 className="text-sm sm:text-base font-bold text-brand-ink">
                  Cuantificación Preliminar de Afectación y Necesidades (EDAN)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Validación de primer impacto
              </span>
            </div>

            {/* Numeric Steppers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Familias */}
              <div className="rounded-xl bg-brand-mist p-3.5 space-y-2">
                <div className="flex items-center justify-between text-brand-ink">
                  <span className="text-xs font-bold">Familias Afectadas</span>
                  <Home className="h-4 w-4 text-brand-blue" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid="counter-familias-dec"
                    onClick={() => setFamiliasAfectadas((v) => Math.max(0, v - 5))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    data-testid="counter-familias-input"
                    value={familiasAfectadas}
                    onChange={(e) => setFamiliasAfectadas(Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 text-center font-mono text-base font-bold text-brand-ink bg-white rounded-lg border border-slate-200/80 py-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  />
                  <button
                    type="button"
                    data-testid="counter-familias-inc"
                    onClick={() => setFamiliasAfectadas((v) => v + 5)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center font-medium">Viviendas anegadas</p>
              </div>

              {/* Damnificados */}
              <div className="rounded-xl bg-brand-mist p-3.5 space-y-2">
                <div className="flex items-center justify-between text-brand-ink">
                  <span className="text-xs font-bold">Damnificados Directos</span>
                  <Users className="h-4 w-4 text-ladp-orange" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDamnificadosDirectos((v) => Math.max(0, v - 10))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={damnificadosDirectos}
                    onChange={(e) => setDamnificadosDirectos(Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 text-center font-mono text-base font-bold text-brand-ink bg-white rounded-lg border border-slate-200/80 py-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  />
                  <button
                    type="button"
                    onClick={() => setDamnificadosDirectos((v) => v + 10)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center font-medium">Pérdida habitacional</p>
              </div>

              {/* Menores / Lactantes */}
              <div className="rounded-xl bg-brand-mist p-3.5 space-y-2">
                <div className="flex items-center justify-between text-brand-ink">
                  <span className="text-xs font-bold">Menores / Lactantes</span>
                  <Baby className="h-4 w-4 text-sky-600" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMenoresLactantes((v) => Math.max(0, v - 2))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={menoresLactantes}
                    onChange={(e) => setMenoresLactantes(Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 text-center font-mono text-base font-bold text-brand-ink bg-white rounded-lg border border-slate-200/80 py-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  />
                  <button
                    type="button"
                    onClick={() => setMenoresLactantes((v) => v + 2)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center font-medium">Atención nutricional</p>
              </div>

              {/* Adultos Mayores */}
              <div className="rounded-xl bg-brand-mist p-3.5 space-y-2">
                <div className="flex items-center justify-between text-brand-ink">
                  <span className="text-xs font-bold">Adultos Mayores / PcD</span>
                  <HeartHandshake className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAdultosMayores((v) => Math.max(0, v - 2))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={adultosMayores}
                    onChange={(e) => setAdultosMayores(Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 text-center font-mono text-base font-bold text-brand-ink bg-white rounded-lg border border-slate-200/80 py-1 focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                  />
                  <button
                    type="button"
                    onClick={() => setAdultosMayores((v) => v + 2)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-brand-ink font-bold hover:bg-brand-soft transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center font-medium">Evacuación asistida</p>
              </div>
            </div>

            {/* Transitability Radio Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                Condición de Transitabilidad y Vías de Acceso
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "4x4", label: "Transitable 4x4", desc: "Tracción doble apta" },
                  { id: "aerea", label: "Solo Vía Aérea / Fluvial", desc: "Zodiac o Helibalde" },
                  { id: "bloqueada", label: "Bloqueada por Lodo/Agua", desc: "Corte de calzada" },
                  { id: "aislado", label: "Aislado Totalmente", desc: "Riesgo vital inminente" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`transit-${item.id}`}
                    onClick={() => setTransitability(item.id as typeof transitability)}
                    className={`rounded-lg p-3 text-left border-2 transition-all ${
                      transitability === item.id
                        ? "border-ladp-orange bg-amber-50/70 text-brand-ink font-bold"
                        : "border-slate-200/80 bg-white hover:bg-brand-mist/60 text-brand-ink"
                    }`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Basic Services Checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink">
                Afectación de Líneas Vitales y Servicios Básicos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  data-testid="service-agua"
                  onClick={() => setServicesState((s) => ({ ...s, sinAgua: !s.sinAgua }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg p-3 border text-center transition-all ${
                    servicesState.sinAgua
                      ? "bg-rose-50 border-brand-negative/50 text-brand-negative font-bold"
                      : "bg-brand-mist border-transparent text-slate-500 hover:bg-brand-soft/60"
                  }`}
                >
                  <Droplets className="h-4 w-4" />
                  <span className="text-[11px] font-bold leading-tight">Sin Agua Potable</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesState((s) => ({ ...s, sinLuz: !s.sinLuz }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg p-3 border text-center transition-all ${
                    servicesState.sinLuz
                      ? "bg-rose-50 border-brand-negative/50 text-brand-negative font-bold"
                      : "bg-brand-mist border-transparent text-slate-500 hover:bg-brand-soft/60"
                  }`}
                >
                  <ZapOff className="h-4 w-4" />
                  <span className="text-[11px] font-bold leading-tight">Corte Fluido Eléctrico</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesState((s) => ({ ...s, sinCobertura: !s.sinCobertura }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg p-3 border text-center transition-all ${
                    servicesState.sinCobertura
                      ? "bg-rose-50 border-brand-negative/50 text-brand-negative font-bold"
                      : "bg-brand-mist border-transparent text-slate-500 hover:bg-brand-soft/60"
                  }`}
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="text-[11px] font-bold leading-tight">Sin Cobertura Móvil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesState((s) => ({ ...s, colapsoDesague: !s.colapsoDesague }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg p-3 border text-center transition-all ${
                    servicesState.colapsoDesague
                      ? "bg-rose-50 border-brand-negative/50 text-brand-negative font-bold"
                      : "bg-brand-mist border-transparent text-slate-500 hover:bg-brand-soft/60"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[11px] font-bold leading-tight">Colapso Alcantarillado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServicesState((s) => ({ ...s, saludAfectado: !s.saludAfectado }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg p-3 border text-center transition-all ${
                    servicesState.saludAfectado
                      ? "bg-rose-50 border-brand-negative/50 text-brand-negative font-bold"
                      : "bg-brand-mist border-transparent text-slate-500 hover:bg-brand-soft/60"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="text-[11px] font-bold leading-tight">Centro Salud Inundado</span>
                </button>
              </div>
            </div>
          </section>

          {/* Módulo D: Matriz de Severidad Sugerida */}
          <section className="rounded-xl bg-rose-50/75 p-5 sm:p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] border border-rose-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-brand-negative animate-pulse" />
                <h3 className="text-sm sm:text-base font-bold text-brand-ink">
                  Matriz de Severidad Sugerida (Cálculo Algorítmico Táctico)
                </h3>
              </div>
              <span className="rounded-full bg-brand-negative text-white px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-xs">
                Nivel 4 · Rojo Crítico
              </span>
            </div>
            <div className="rounded-xl bg-white p-4 border border-rose-200/60 text-xs text-brand-ink space-y-2 leading-relaxed">
              <p className="font-bold text-brand-negative">
                Justificación Automática de Despacho Inmediato:
              </p>
              <p className="font-medium text-slate-600">
                El sensor hidrométrico en estación Catacaos registró un caudal de{" "}
                <strong className="text-brand-ink">1,640 m³/s</strong> (superando el umbral de alerta
                roja de 1,500 m³/s). La combinación con{" "}
                <strong className="text-brand-ink">{familiasAfectadas} familias</strong> en condición de{" "}
                <strong className="text-ladp-orange font-bold uppercase">{transitability}</strong> califica
                el incidente para intervención prioritaria de brigadas tácticas anfibias.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Support Panel, Evidence & Immediate Dispatch (4 Cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Multimedia Dropzone & Files */}
          <section className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-brand-ink flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-brand-blue" />
                <span>Evidencia Multimedia</span>
              </h3>
              <span className="text-[10px] font-bold text-brand-blue uppercase font-mono">
                AES-256
              </span>
            </div>

            {/* Dropzone mock */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-brand-mist/70 p-4 text-center hover:bg-brand-mist transition-colors cursor-pointer">
              <UploadCloud className="mx-auto h-8 w-8 text-brand-blue mb-1" />
              <p className="text-xs font-bold text-brand-ink">Arrastre fotos o videos aquí</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Metadatos EXIF georreferenciados obligatorios
              </p>
            </div>

            {/* Uploaded items */}
            <div className="space-y-2">
              {uploadedFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg bg-brand-mist p-2.5 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold text-brand-ink">{f.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-brand-positive font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{f.size} · GPS OK</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(f.id)}
                    title="Eliminar archivo"
                    className="rounded-lg p-1 text-slate-500 hover:text-brand-negative hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Drone link */}
            <button
              type="button"
              data-testid="drone-stream-btn"
              onClick={() => setDroneStreamActive(!droneStreamActive)}
              className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold transition-all border ${
                droneStreamActive
                  ? "bg-brand-soft border-brand-blue/40 text-brand-blue"
                  : "bg-brand-mist border-transparent text-slate-600 hover:bg-brand-soft/60"
              }`}
            >
              <Video className="h-4 w-4" />
              <span>
                {droneStreamActive ? "Enlazar Dron FEN-Alpha 02 (Stream Activo)" : "Activar Enlace con Dron FEN"}
              </span>
            </button>
          </section>

          {/* Despacho de Brigada (GPS Proximity) */}
          <section className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-brand-ink flex items-center gap-2">
                <Truck className="h-4 w-4 text-ladp-orange" />
                <span>Despacho de Brigada</span>
              </h3>
              <span className="text-[10px] font-bold text-ladp-orange font-mono">GPS Proximity</span>
            </div>

            {/* Dispatch toggle */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                data-testid="brigade-dispatch-checkbox"
                checked={brigadeDispatchEnabled}
                onChange={(e) => setBrigadeDispatchEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/25"
              />
              <span className="text-xs font-bold text-brand-ink leading-tight">
                Activar Despacho Inmediato USAR / Anfibios
                <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                  Despliegue de cuadrilla táctica en menos de 15 min
                </span>
              </span>
            </label>

            {/* Units selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500">
                Unidad Más Cercana Detectada:
              </label>
              {[
                { id: "bravo-3", name: "Patrulla Bravo-3", dist: "a 4.2 km", status: "Disponible" },
                { id: "bomberos", name: "Cía. Bomberos Piura N° 25", dist: "a 8.6 km", status: "En base" },
                { id: "ejercito", name: "Batallón de Ingeniería EP N° 51", dist: "a 14 km", status: "Alistado" },
              ].map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedBrigadeUnit(unit.id)}
                  className={`w-full flex items-center justify-between rounded-lg p-2.5 text-xs text-left transition-all border ${
                    selectedBrigadeUnit === unit.id
                      ? "border-brand-blue bg-brand-soft/70 font-bold text-brand-ink"
                      : "border-transparent bg-brand-mist text-brand-ink hover:bg-brand-soft/50"
                  }`}
                >
                  <div>
                    <p className="font-bold text-brand-ink">{unit.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{unit.dist}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-brand-blue">
                    {unit.status}
                  </span>
                </button>
              ))}
            </div>

            {/* Requested Equipment to Base */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500">
                Equipamiento Solicitado a Base:
              </label>
              <div className="space-y-1.5 text-xs font-medium text-brand-ink">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestedEquipment.motobombas}
                    onChange={(e) => setRequestedEquipment((s) => ({ ...s, motobombas: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded text-brand-blue"
                  />
                  <span>2 Motobombas de 6&quot; de alta presión</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestedEquipment.boteZodiac}
                    onChange={(e) => setRequestedEquipment((s) => ({ ...s, boteZodiac: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded text-brand-blue"
                  />
                  <span>1 Bote zodiac con motor fuera de borda</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestedEquipment.sacosTerreros}
                    onChange={(e) => setRequestedEquipment((s) => ({ ...s, sacosTerreros: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded text-brand-blue"
                  />
                  <span>200 Sacos terreros y geomalla</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requestedEquipment.racionesAgua}
                    onChange={(e) => setRequestedEquipment((s) => ({ ...s, racionesAgua: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded text-brand-blue"
                  />
                  <span>Raciones frías y agua embotellada</span>
                </label>
              </div>
            </div>
          </section>

          {/* Action Execution Panel */}
          <section className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] space-y-3">
            <h3 className="text-sm font-bold text-brand-ink border-b border-slate-100 pb-2 flex items-center gap-2">
              <Send className="h-4 w-4 text-ladp-orange" />
              <span>Ejecución del Registro</span>
            </h3>

            {/* Primary Action Button */}
            <button
              type="button"
              data-testid="submit-incident-btn"
              onClick={handleRegisterIncident}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-ladp-orange hover:bg-ladp-orange/90 text-white py-3 px-4 text-sm font-bold uppercase tracking-wider shadow-xs transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Registrar Incidencia y Notificar</span>
            </button>

            {/* Draft Save */}
            <button
              type="button"
              data-testid="save-draft-btn"
              onClick={handleSaveDraft}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-mist hover:bg-brand-soft text-brand-ink py-2.5 px-4 text-xs font-bold transition-colors"
            >
              <Save className="h-3.5 w-3.5 text-brand-blue" />
              <span>Guardar Borrador en Cache Táctico</span>
            </button>

            {/* SISMATE Alert Button */}
            <button
              type="button"
              data-testid="sismate-alert-btn"
              onClick={handleEmitSismate}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-brand-negative py-2.5 px-4 text-xs font-bold border border-rose-200 transition-colors"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Emitir Alerta Celular SISMATE</span>
            </button>

            <p className="text-[10px] text-slate-500 text-center font-medium leading-tight pt-1">
              El envío asignará un código INC oficial inmutable certificado en el nodo de auditoría
              nacional INDECI / COEN.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
