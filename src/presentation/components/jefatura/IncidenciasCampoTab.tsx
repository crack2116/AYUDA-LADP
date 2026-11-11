"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Compass,
  Droplets,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minus,
  Navigation,
  PhoneCall,
  Plus,
  Radio,
  RefreshCw,
  Ruler,
  Satellite,
  Search,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
  Users,
  Video,
  Waves,
} from "lucide-react";

interface HotspotRecord {
  id: string;
  code: string;
  basin: string;
  district: string;
  coords: string;
  phenomenon: string;
  riskLevel: "critical" | "severe" | "moderate";
  flowMetric: string;
  flowTrend: string;
  evacuationPct: number;
  assignedBrigade: string;
  lastReport: string;
}

const HOTSPOTS_DATA: readonly HotspotRecord[] = [
  {
    id: "hot-01",
    code: "INC-2025-00142",
    basin: "Río Piura - CP El Molino",
    district: "Catacaos, Piura",
    coords: "-5.194, -80.632",
    phenomenon: "Inundación Fluvial",
    riskLevel: "critical",
    flowMetric: "1,840 m³/s",
    flowTrend: "+48 m³/s/h",
    evacuationPct: 65,
    assignedBrigade: "Patrulla Bravo-3",
    lastReport: "Hace 42s",
  },
  {
    id: "hot-02",
    code: "INC-2025-00141",
    basin: "Quebrada Batanes - Chulucanas",
    district: "Morropón, Piura",
    coords: "-5.097, -80.163",
    phenomenon: "Huayco Activo",
    riskLevel: "severe",
    flowMetric: "Densidad: 1.8 t/m³",
    flowTrend: "Corte vial km 42",
    evacuationPct: 88,
    assignedBrigade: "Brigada Mixta EP-22",
    lastReport: "Hace 3m",
  },
  {
    id: "hot-03",
    code: "INC-2025-00139",
    basin: "Quebrada San Ildefonso",
    district: "El Porvenir, Trujillo",
    coords: "-8.081, -78.988",
    phenomenon: "Alerta de Dique",
    riskLevel: "severe",
    flowMetric: "Capacidad: 84%",
    flowTrend: "Desarenador saturado",
    evacuationPct: 40,
    assignedBrigade: "Defensa Civil Trujillo",
    lastReport: "Hace 7m",
  },
  {
    id: "hot-04",
    code: "INC-2025-00138",
    basin: "Litoral Puerto Pizarro - Manglares",
    district: "Tumbes",
    coords: "-3.498, -80.392",
    phenomenon: "Oleaje & Marea",
    riskLevel: "moderate",
    flowMetric: "Anomalía: +1.4m",
    flowTrend: "Marea viva vespertina",
    evacuationPct: 100,
    assignedBrigade: "Capitanía de Puerto",
    lastReport: "Hace 14m",
  },
];

export function IncidenciasCampoTab() {
  const [activeLayer, setActiveLayer] = useState<"calor" | "puntos" | "rios" | "brigadas" | "radar">("calor");
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotRecord>(HOTSPOTS_DATA[0] as HotspotRecord);
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("all");
  const [zoomLevel, setZoomLevel] = useState(9.4);
  const [bufferDistance, setBufferDistance] = useState("5.0 km");

  const filteredHotspots = useMemo(() => {
    return HOTSPOTS_DATA.filter((item) => {
      if (
        filterSearch &&
        !item.code.toLowerCase().includes(filterSearch.toLowerCase()) &&
        !item.basin.toLowerCase().includes(filterSearch.toLowerCase()) &&
        !item.district.toLowerCase().includes(filterSearch.toLowerCase())
      ) {
        return false;
      }
      if (selectedRiskFilter === "critical" && item.riskLevel !== "critical") return false;
      if (selectedRiskFilter === "severe" && item.riskLevel !== "severe") return false;
      return true;
    });
  }, [filterSearch, selectedRiskFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. ENCABEZADO DE PÁGINA & CONTROL SUPERIOR */}
      <section className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex max-w-4xl flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold uppercase text-ladp-orange">
                <span className="h-1.5 w-1.5 rounded-full bg-ladp-orange animate-pulse" />
                Supervisión FEN 2026
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand-blue">
                <Satellite className="h-3.5 w-3.5" />
                Red Nacional Geoespacial
              </span>
              <span className="rounded-lg bg-brand-mist px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
                WGS84 / UTM ZONA 17S
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-brand-ink sm:text-2xl">
              INCIDENCIAS DE CAMPO – MONITOREO GEOESPACIAL Y MAPA DE CALOR
            </h2>

            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Visualización geoespacial en tiempo real de reportes de afectación, puntos críticos por desborde fluvial y concentración de calor hidrometeorológico por impacto del Fenómeno El Niño 2026.
            </p>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-3 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
            >
              <Navigation className="h-4 w-4" />
              <span>Exportar GeoJSON / KML</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-3 py-2 text-xs font-bold text-brand-ink transition-colors hover:bg-brand-soft"
            >
              <Layers className="h-4 w-4" />
              <span>Filtro de Capas Tácticas</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-blue"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>+ Despachar Brigada a Punto Crítico</span>
            </button>
          </div>
        </div>

        {/* Metadatos de Red y Sensores */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-mist px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-ladp-orange" />
              <span className="font-bold text-brand-ink">CAPA ACTIVA:</span>
              <span>Mapa de Calor Hidrotérmico (KDE 1.2km)</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-mist px-2.5 py-1">
              <Radio className="h-3.5 w-3.5 text-brand-blue" />
              <span className="font-bold text-brand-ink">SENSORES COEN / INDECI:</span>
              <span>412 Estaciones Telemetrizadas</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-mist px-2.5 py-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-blue" />
              <span className="font-bold text-brand-ink">ACTUALIZACIÓN CONTINUA:</span>
              <span className="font-bold text-ladp-orange">Hace 42 seg</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="font-bold text-brand-positive">LATENCIA: 124ms</span>
          </div>
        </div>
      </section>

      {/* 2. TELEMETRÍA RÁPIDA (KPIS COMPACTOS DE CAMPO) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1 */}
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Incidencias Georreferenciadas
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                1,428
              </span>
              <span className="text-xs font-bold text-brand-blue">94% DGPS</span>
            </div>
            <span className="mt-0.5 text-[11px] text-slate-500 font-medium">
              Validación submétrica satelital
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
            <MapPin className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-negative">
              Focos de Calor / Alto Riesgo
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-negative sm:text-3xl">
                34
              </span>
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-negative">
                Nivel Rojo
              </span>
            </div>
            <span className="mt-0.5 text-[11px] text-slate-500 font-medium">
              +4 focos en últimas 2 horas
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-brand-negative">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cuencas Hidrográficas
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                12
              </span>
              <span className="text-xs font-bold text-ladp-orange">
                Desborde Inminente
              </span>
            </div>
            <span className="mt-0.5 text-[11px] text-slate-500 font-medium">
              Ríos Piura, Tumbes, La Leche, Moche
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-ladp-orange">
            <Droplets className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Brigadas en Foco Activo
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                58
              </span>
              <span className="text-xs font-bold text-brand-blue">416 Efectivos</span>
            </div>
            <span className="mt-0.5 text-[11px] text-slate-500 font-medium">
              Capacidad táctica al 82%
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* 3. CONSOLA CARTOGRÁFICA TÁCTICA & PANEL LATERAL INTEGRADO */}
      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Mapa Geoespacial Avanzado (8 Cols) */}
        <div className="relative flex min-h-[660px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] lg:col-span-8">
          {/* Barra Superior Flotante de Modos y Capas */}
          <div className="pointer-events-none absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-2">
            {/* Selector de Capas Rápido */}
            <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-brand-deep/90 p-1.5 text-xs text-white shadow-md backdrop-blur">
              <button
                type="button"
                onClick={() => setActiveLayer("calor")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all ${
                  activeLayer === "calor"
                    ? "bg-brand-blue text-white shadow-xs"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Mapa de Calor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer("puntos")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all ${
                  activeLayer === "puntos"
                    ? "bg-brand-blue text-white shadow-xs"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Puntos (1,428)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer("rios")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all ${
                  activeLayer === "rios"
                    ? "bg-brand-blue text-white shadow-xs"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Waves className="h-3.5 w-3.5" />
                <span>Ríos & Embalses</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer("brigadas")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all ${
                  activeLayer === "brigadas"
                    ? "bg-brand-blue text-white shadow-xs"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Brigadas GPS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer("radar")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all ${
                  activeLayer === "radar"
                    ? "bg-brand-blue text-white shadow-xs"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Satellite className="h-3.5 w-3.5" />
                <span>Satélite Radar</span>
              </button>
            </div>

            {/* Telemetría de Vista GPS */}
            <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-brand-deep/90 px-3 py-1.5 font-mono text-xs text-blue-100 shadow-md">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE SAT-SYNC
              </span>
              <span className="text-white/30">|</span>
              <span>Z: {zoomLevel.toFixed(1)}x</span>
              <span className="text-white/30">|</span>
              <span>PIURA - 05°11&apos;S / 80°38&apos;W</span>
            </div>
          </div>

          {/* Controles Laterales Flotantes Cartográficos */}
          <div className="absolute right-4 top-20 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(16, z + 0.5))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-ink shadow-md transition-colors hover:bg-white"
              title="Acercar Zoom"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(4, z - 0.5))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-ink shadow-md transition-colors hover:bg-white"
              title="Alejar Zoom"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="my-0.5 h-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setZoomLevel(9.4)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-blue shadow-md transition-colors hover:bg-white"
              title="Brújula Norte"
            >
              <Compass className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-ink shadow-md transition-colors hover:bg-white"
              title="Medir Distancia Geodésica"
            >
              <Ruler className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setBufferDistance((b) => (b === "5.0 km" ? "10.0 km" : "5.0 km"))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-ladp-orange shadow-md transition-colors hover:bg-white"
              title={`Radio de Afectación (${bufferDistance})`}
            >
              <Radio className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-ink shadow-md transition-colors hover:bg-white"
              title="Pantalla Completa"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Lienzo Cartográfico Simulado con Coordenadas y Heatmap Interactivo */}
          <div className="relative h-[660px] w-full cursor-grab select-none overflow-hidden bg-brand-deep active:cursor-grabbing">
            {/* Rejilla Militar UTM Táctica de Fondo */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <pattern id="grid-utm" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M 80 0 L 0 0 0 80"
                    fill="none"
                    stroke="#778bb5"
                    strokeWidth="0.75"
                    strokeDasharray="2 4"
                  />
                  <circle cx="80" cy="80" r="1.5" fill="#778bb5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-utm)" />
            </svg>

            {/* Silueta Litoral Costa Norte del Perú (Vector Táctico SVG) */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1000 700"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect x="0" y="0" width="380" height="700" fill="#000d27" opacity="0.6" />
              <path
                d="M 330 0 Q 310 90, 320 160 Q 260 210, 240 280 Q 230 330, 290 390 Q 350 440, 390 510 Q 440 600, 520 700 L 1000 700 L 1000 0 Z"
                fill="#0b2347"
                stroke="#164985"
                strokeWidth="1.5"
                opacity="0.85"
              />
              <path
                d="M 450 140 Q 380 200, 300 240 T 260 300"
                fill="none"
                stroke="#90bafe"
                strokeWidth="3.5"
                opacity="0.85"
              />
              <path
                d="M 490 190 Q 420 230, 360 250"
                fill="none"
                stroke="#90bafe"
                strokeWidth="2"
                opacity="0.6"
              />
              <path
                d="M 520 340 Q 440 370, 330 380"
                fill="none"
                stroke="#90bafe"
                strokeWidth="2.5"
                opacity="0.75"
              />
              <path
                d="M 590 490 Q 490 520, 420 540"
                fill="none"
                stroke="#90bafe"
                strokeWidth="2"
                opacity="0.75"
              />
            </svg>

            {/* Capa de Gradientes de Calor (Heatmap KDE FEN 2026) */}
            <div
              className={`pointer-events-none transition-opacity duration-500 ${
                activeLayer === "calor" ? "opacity-100" : "opacity-30"
              }`}
            >
              {/* FOCO 1: Piura / Sullana / Bajo Piura (Rojo Vivo) */}
              <div
                className="pointer-events-none absolute left-[26%] top-[28%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-85 blur-2xl"
                style={{
                  background: "radial-gradient(circle, #ba1a1a 0%, #ffb68c 50%, transparent 75%)",
                }}
              />
              <div
                className="pointer-events-none absolute left-[28%] top-[29%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90 blur-xl"
                style={{
                  background: "radial-gradient(circle, #ba1a1a 0%, #ba1a1a88 60%, transparent 80%)",
                }}
              />

              {/* FOCO 2: Chulucanas / Morropón */}
              <div
                className="pointer-events-none absolute left-[39%] top-[24%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-xl"
                style={{
                  background: "radial-gradient(circle, #df6900 0%, #ffdbc9 50%, transparent 75%)",
                }}
              />

              {/* FOCO 3: Lambayeque / Íllimo */}
              <div
                className="pointer-events-none absolute left-[38%] top-[48%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-75 blur-2xl"
                style={{
                  background: "radial-gradient(circle, #df6900 0%, #ffb68c 40%, transparent 75%)",
                }}
              />

              {/* FOCO 4: Trujillo */}
              <div
                className="pointer-events-none absolute left-[48%] top-[68%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-65 blur-2xl"
                style={{
                  background: "radial-gradient(circle, #325f9c 0%, #90bafe 40%, transparent 75%)",
                }}
              />
            </div>

            {/* Marcadores Interactivos */}
            {HOTSPOTS_DATA.map((hotspot, idx) => {
              const isSelected = selectedHotspot.id === hotspot.id;
              // Specific geographic pin positions
              const positions = [
                { top: "31%", left: "29%" },
                { top: "25%", left: "38%" },
                { top: "67%", left: "49%" },
                { top: "14%", left: "34%" },
              ];
              const pos = positions[idx % positions.length] as { top: string; left: string };

              return (
                <div
                  key={hotspot.id}
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    {isSelected ? (
                      <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-brand-negative opacity-75" />
                    ) : null}
                    <span
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-xl ring-2 ring-white ${
                        hotspot.riskLevel === "critical"
                          ? "bg-brand-negative text-white"
                          : hotspot.riskLevel === "severe"
                            ? "bg-ladp-orange text-white"
                            : "bg-brand-blue text-white"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                  </div>

                  {/* Etiqueta Flotante Táctica */}
                  <div
                    className={`absolute -top-2 left-9 whitespace-nowrap rounded-lg bg-brand-deep px-2.5 py-1.5 text-xs text-white shadow-lg border-l-4 ${
                      hotspot.riskLevel === "critical"
                        ? "border-brand-negative"
                        : hotspot.riskLevel === "severe"
                          ? "border-ladp-orange"
                          : "border-brand-blue"
                    } ${isSelected ? "flex" : "hidden group-hover:flex"} flex-col`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-white">{hotspot.code}</span>
                      <span className="rounded bg-brand-negative px-1 py-0.2 text-[9px] font-bold uppercase text-white">
                        {hotspot.riskLevel === "critical" ? "CRÍTICO" : "SEVERO"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-blue-200">
                      {hotspot.basin}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Topónimos Geográficos */}
            <span className="pointer-events-none absolute left-[38%] top-[16%] text-[11px] font-bold tracking-wider text-blue-200/70">
              TUMBES
            </span>
            <span className="pointer-events-none absolute left-[33%] top-[34%] text-xs font-bold tracking-widest text-blue-100/90">
              PIURA (SECTOR 01)
            </span>
            <span className="pointer-events-none absolute left-[44%] top-[49%] text-[11px] font-bold tracking-wider text-blue-200/70">
              LAMBAYEQUE
            </span>
            <span className="pointer-events-none absolute left-[53%] top-[69%] text-[11px] font-bold tracking-wider text-blue-200/70">
              LA LIBERTAD
            </span>
            <span className="pointer-events-none absolute left-[10%] top-[40%] font-mono text-xs uppercase tracking-widest text-blue-200/50">
              OCÉANO PACÍFICO SUR
            </span>

            {/* Leyenda Térmica Flotante */}
            <div className="absolute bottom-4 left-4 z-20 min-w-[275px] max-w-sm rounded-xl bg-brand-deep/95 p-3 text-xs text-white shadow-lg backdrop-blur">
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Severidad Térmica / FEN
                </span>
                <span className="font-mono text-[10px] font-bold text-amber-300">
                  KDE 85% CONF
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-brand-soft via-ladp-orange to-brand-negative shadow-inner" />
              <div className="mt-1.5 flex items-center justify-between gap-2.5 font-mono text-[9px] text-blue-200">
                <span>Normal (&lt;20%)</span>
                <span>Mod (20-50%)</span>
                <span>Sev (50-80%)</span>
                <span className="font-bold text-rose-300">Crítico (&gt;80%)</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-blue-200">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-negative" /> Alerta Roja Fluvial
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" /> Sensores Activos
                </span>
              </div>
            </div>

            {/* Indicador de Escala Gráfica */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-brand-deep/90 px-2.5 py-1.5 font-mono text-[10px] text-blue-200 shadow">
              <span>50 km</span>
              <div className="flex h-1 w-16 bg-blue-200">
                <div className="h-full w-8 bg-brand-deep" />
              </div>
              <span>EPSG: 4326</span>
            </div>
          </div>

          {/* Barra de Estado Inferior del Visor */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-brand-mist p-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-brand-blue" />
              <span>Filtro activo: Solo cuencas con caudal &gt; P90 y pendientes &gt; 15°</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>Buffer Activo: {bufferDistance}</span>
              <span>•</span>
              <span>Proyección: Transversa de Mercator</span>
            </div>
          </div>
        </div>

        {/* 4. Panel Lateral Táctico de Inspección (4 Cols) */}
        <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] lg:col-span-4">
          {/* Cabecera de Ficha Táctica */}
          <div className="flex items-start justify-between bg-brand-deep p-4 text-white">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand-negative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  ALERTA ROJA
                </span>
                <span className="font-mono text-xs text-blue-200">
                  #{selectedHotspot.code}
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">
                {selectedHotspot.basin}
              </h3>
              <span className="text-xs text-blue-200">
                {selectedHotspot.district}
              </span>
            </div>
          </div>

          {/* Métricas Críticas Clave del Punto Seleccionado */}
          <div className="flex flex-col gap-4 p-4 text-xs">
            {/* Estado de Riesgo Inminente */}
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-3 text-brand-negative">
              <Droplets className="h-6 w-6 shrink-0 text-brand-negative" />
              <div className="flex flex-col">
                <span className="font-bold uppercase text-[11px]">DESBORDE INMINENTE (NIVEL 4)</span>
                <span className="text-[11px]">Cota de desborde superada en +42 cm en margen izquierda.</span>
              </div>
            </div>

            {/* Grilla de Datos Técnicos y Parámetros Hidrológicos */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col rounded-xl bg-brand-mist p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Caudal Registrado</span>
                <span className="mt-0.5 font-mono text-base font-bold text-brand-ink">
                  {selectedHotspot.flowMetric}
                </span>
                <span className="font-mono text-[10px] font-bold text-brand-negative">
                  {selectedHotspot.flowTrend}
                </span>
              </div>

              <div className="flex flex-col rounded-xl bg-brand-mist p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Población Expuesta</span>
                <span className="mt-0.5 font-mono text-base font-bold text-brand-ink">
                  110 Fam.
                </span>
                <span className="text-[10px] text-slate-500">~480 personas</span>
              </div>

              <div className="flex flex-col rounded-xl bg-brand-mist p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Coordenadas DGPS</span>
                <span className="mt-0.5 font-mono text-[11px] font-bold text-brand-ink">
                  {selectedHotspot.coords}
                </span>
                <span className="text-[10px] text-slate-500">Elev: 29 msnm</span>
              </div>

              <div className="flex flex-col rounded-xl bg-brand-mist p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Velocidad Aumento</span>
                <span className="mt-0.5 font-mono text-base font-bold text-ladp-orange">
                  +48 m³/s/h
                </span>
                <span className="text-[10px] text-ladp-orange font-semibold">Tendencia Ascendente</span>
              </div>
            </div>

            {/* Unidad Táctica Asignada */}
            <div className="flex items-center justify-between rounded-xl bg-brand-mist p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue font-mono text-xs font-bold text-white">
                  B-3
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-brand-ink">{selectedHotspot.assignedBrigade}</span>
                  <span className="text-[11px] text-slate-500">Cmdte. PNP M. Vásquez (14 efectivos)</span>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
            </div>

            {/* Miniatura de Reconocimiento Dron */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="uppercase text-brand-ink">Reconocimiento Aéreo Térmico</span>
                <span className="font-mono text-brand-blue">Dron FEN-Alpha 02</span>
              </div>
              <div className="relative h-28 w-full overflow-hidden rounded-xl bg-brand-deep shadow-inner">
                <div className="flex h-full w-full items-center justify-center font-mono text-xs text-blue-200">
                  [STREAM TÉRMICO FLIR ACTIVO]
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-brand-deep/85 px-2 py-0.5 font-mono text-[10px] text-white">
                  ALT: 180m • FOV 84° • FLIR INFRARED
                </div>
                <div className="absolute right-2 top-2 rounded bg-brand-negative px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  BRECHA DETECTADA
                </div>
              </div>
            </div>

            {/* Acciones Tácticas del Panel */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-ladp-orange py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-ladp-orange/90"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Emitir Alerta Temprana SMS (SISMATE / CAT)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-mist py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>Asignar Recursos Extra</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-mist py-2 text-xs font-bold text-brand-ink transition-colors hover:bg-brand-soft"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Telemetría Dron</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUB-TABLA RÁPIDA DE PUNTOS CALIENTES (HOTSPOTS PRIORITARIOS) */}
      <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-ladp-orange" />
            <h3 className="text-sm font-bold text-brand-ink sm:text-base">
              MATRIZ OPERATIVA DE PUNTOS CALIENTES PRIORITARIOS (HOTSPOTS FEN 2026)
            </h3>
            <span className="rounded-lg bg-brand-mist px-2 py-0.5 text-[11px] font-bold text-brand-ink">
              {filteredHotspots.length} Focos Activos
            </span>
          </div>

          {/* Filtro y Búsqueda Geoespacial */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Filtrar por cuenca o distrito..."
                className="h-9 w-56 rounded-lg bg-brand-mist pl-8 pr-3 text-xs font-semibold text-brand-ink placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
            </div>
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
            >
              <option value="all">Todos los Niveles</option>
              <option value="critical">Solo Nivel Rojo (Crítico)</option>
              <option value="severe">Solo Nivel Naranja</option>
            </select>
          </div>
        </div>

        {/* Tabla Táctica de Datos */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-brand-mist text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th scope="col" className="px-3 py-2.5">Código / ID</th>
                <th scope="col" className="px-3 py-2.5">Cuenca / Localización</th>
                <th scope="col" className="px-3 py-2.5">Tipo Fenómeno</th>
                <th scope="col" className="px-3 py-2.5">Nivel de Riesgo</th>
                <th scope="col" className="px-3 py-2.5">Caudal / Métrica</th>
                <th scope="col" className="px-3 py-2.5">Evacuación</th>
                <th scope="col" className="px-3 py-2.5">Brigada Asignada</th>
                <th scope="col" className="px-3 py-2.5">Último Reporte</th>
                <th scope="col" className="px-3 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-brand-ink font-medium">
              {filteredHotspots.map((hotspot) => {
                const isSelected = selectedHotspot.id === hotspot.id;
                return (
                  <tr
                    key={hotspot.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-brand-soft/60 font-semibold"
                        : "hover:bg-brand-mist/60"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono font-bold text-brand-blue">
                      {hotspot.code}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-ink">{hotspot.basin}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {hotspot.district} ({hotspot.coords})
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-brand-blue" />
                        {hotspot.phenomenon}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          hotspot.riskLevel === "critical"
                            ? "bg-rose-50 text-brand-negative"
                            : hotspot.riskLevel === "severe"
                              ? "bg-amber-50 text-ladp-orange"
                              : "bg-brand-soft text-brand-blue"
                        }`}
                      >
                        {hotspot.riskLevel === "critical"
                          ? "ROJO (CRÍTICO)"
                          : hotspot.riskLevel === "severe"
                            ? "NARANJA (SEVERO)"
                            : "AMARILLO (MODERADO)"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      <span className="font-bold text-brand-ink">{hotspot.flowMetric}</span>
                      <span className="block text-[10px] text-slate-500">{hotspot.flowTrend}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="h-2 w-14 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-brand-blue"
                            style={{ width: `${hotspot.evacuationPct}%` }}
                          />
                        </div>
                        <span>{hotspot.evacuationPct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{hotspot.assignedBrigade}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{hotspot.lastReport}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedHotspot(hotspot)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-brand-blue text-white shadow-xs"
                            : "bg-brand-mist text-brand-blue hover:bg-brand-soft"
                        }`}
                      >
                        {isSelected ? "En Foco" : "Localizar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
