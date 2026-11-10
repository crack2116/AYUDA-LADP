"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Clock,
  FileDown,
  Map,
  MapPinPlus,
  PhoneCall,
  Radar,
  Radio,
  RadioTower,
  Search,
  ShieldAlert,
  Users,
  Wifi,
} from "lucide-react";

interface OfficerRecord {
  id: string;
  code: string;
  name: string;
  initials: string;
  rank: string;
  specialty: string;
  base: string;
  region: string;
  force: string;
  status: string;
  statusType: "critical" | "warning" | "stable" | "monitoring";
  lastReport: string;
}

const OFFICERS_ROSTER: readonly OfficerRecord[] = [
  {
    id: "off-01",
    code: "OF-PER-84920",
    name: "Cnel. Eduardo Salazar R.",
    initials: "ES",
    rank: "Coronel de Artillería",
    specialty: "Gestión Táctica de Desastres",
    base: "PMA Chulucanas / Sullana",
    region: "Piura & Tumbes",
    force: "680 Brigadistas (34 Unidades)",
    status: "Desplegado / Alerta Roja",
    statusType: "critical",
    lastReport: "Hace 4 min",
  },
  {
    id: "off-02",
    code: "OF-PER-77312",
    name: "Cmdte. Manuel Vásquez T.",
    initials: "MV",
    rank: "Comandante Infantería",
    specialty: "Rescate y Evacuación Rápida",
    base: "Base Chiclayo / Motupe",
    region: "Lambayeque & La Libertad",
    force: "510 Brigadistas (22 Unidades)",
    status: "Desplegado / Alerta Naranja",
    statusType: "warning",
    lastReport: "Hace 11 min",
  },
  {
    id: "off-03",
    code: "OF-PER-91045",
    name: "Cap. Roberto Morales P.",
    initials: "RM",
    rank: "Capitán de Ingeniería",
    specialty: "Defensa Ribereña y Diques",
    base: "Puesto Avanzado Huarmey",
    region: "Áncash (Costa y Callejón)",
    force: "280 Brigadistas (16 Unidades)",
    status: "Desplegado / Alerta Naranja",
    statusType: "warning",
    lastReport: "Hace 18 min",
  },
  {
    id: "off-04",
    code: "OF-PER-65430",
    name: "Mayor Jorge Quispe C.",
    initials: "JQ",
    rank: "Mayor de Caballería",
    specialty: "Logística Fluvial y Helitransportada",
    base: "Base Chosica Km 34",
    region: "Lima Provincias (Rímac)",
    force: "390 Brigadistas (18 Unidades)",
    status: "Monitoreo Activo",
    statusType: "monitoring",
    lastReport: "Hace 2 min",
  },
  {
    id: "off-05",
    code: "COO-PN-01",
    name: "Rosa Herrera Campos",
    initials: "RH",
    rank: "Coordinadora Territorial Norte",
    specialty: "Enlace Humanitario LADP / COEN",
    base: "Puesto Central Catacaos",
    region: "Piura",
    force: "4 Centros Poblados Asignados",
    status: "En Guardia Operativa",
    statusType: "stable",
    lastReport: "Hace 5 min",
  },
  {
    id: "off-06",
    code: "COO-SC-01",
    name: "Miguel Ángel Flores",
    initials: "MF",
    rank: "Coordinador Territorial Sur",
    specialty: "Coordinación Operativa de Base",
    base: "Puesto Avanzado Ica",
    region: "Ica & Chincha",
    force: "2 Centros Poblados Asignados",
    status: "En Guardia Operativa",
    statusType: "stable",
    lastReport: "Hace 8 min",
  },
];

export function SupervisionMandosTab() {
  const [macroRegion, setMacroRegion] = useState<"norte" | "centro" | "sur" | "oriente">("norte");
  const [officerSearch, setOfficerSearch] = useState("");
  const [selectedRank, setSelectedRank] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const filteredOfficers = useMemo(() => {
    return OFFICERS_ROSTER.filter((off) => {
      if (
        officerSearch &&
        !off.name.toLowerCase().includes(officerSearch.toLowerCase()) &&
        !off.code.toLowerCase().includes(officerSearch.toLowerCase()) &&
        !off.base.toLowerCase().includes(officerSearch.toLowerCase())
      ) {
        return false;
      }
      if (selectedRegion !== "all" && !off.region.toLowerCase().includes(selectedRegion.toLowerCase())) {
        return false;
      }
      if (selectedRank !== "all") {
        if (selectedRank === "coronel" && !off.rank.includes("Coronel") && !off.rank.includes("Comandante")) return false;
        if (selectedRank === "mayor" && !off.rank.includes("Mayor") && !off.rank.includes("Capitán")) return false;
        if (selectedRank === "civil" && !off.rank.includes("Coordinador")) return false;
      }
      return true;
    });
  }, [officerSearch, selectedRank, selectedRegion]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. ENCABEZADO TÁCTICO DE SUPERVISIÓN */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm border-l-4 border-l-secondary border border-surface-container-high/40 xl:flex-row xl:items-center">
        <div className="flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-0.5 text-xs font-black uppercase tracking-wider text-on-surface">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-fixed-dim opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              RED TETRA & SATELITAL EN VIVO
            </span>
            <span className="text-on-surface-variant font-bold">•</span>
            <span className="text-xs font-black uppercase tracking-wide text-on-surface-variant">
              COEN / INDECI / SINAGERD • COBERTURA FEN-2026
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">
            SUPERVISIÓN DE MANDOS Y DESPLIEGUE TERRITORIAL
          </h2>

          <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
            Monitoreo en tiempo real de oficiales de comando, brigadas tácticas de respuesta rápida y teatros de operaciones COEN / COER / INDECI desplegados ante el Fenómeno El Niño 2026.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start xl:self-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-low px-4 py-2.5 text-xs font-black text-secondary shadow-xs transition-colors hover:bg-surface-container"
          >
            <FileDown className="h-4 w-4" />
            <span>Descargar Reporte de Dotación (PDF)</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2.5 text-xs font-black text-on-primary shadow-xs transition-all hover:bg-secondary"
          >
            <MapPinPlus className="h-4 w-4" />
            <span>Asignar Nuevo Cuadrante</span>
          </button>
        </div>
      </section>

      {/* 2. TARJETAS DE INDICADORES DE DESPLIEGUE (KPIs) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Oficiales y Mandos
              </span>
              <span className="mt-1 text-3xl font-black tracking-tight text-primary">
                142
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-fixed/30 text-primary-container">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-surface-container-high/20 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-on-surface-variant">
              <span>En Puesto de Mando Activo</span>
              <span className="font-mono font-bold text-primary">98% (139)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary" style={{ width: "98%" }} />
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">
              3 en relevo táctico operacional
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Fuerza de Brigadistas
              </span>
              <span className="mt-1 text-3xl font-black tracking-tight text-primary">
                2,480
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-fixed/40 text-secondary">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-surface-container-high/20 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-on-surface-variant">
              <span>Disponibilidad Operativa</span>
              <span className="font-mono font-bold text-primary">86% (2,133 Activos)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary-container" style={{ width: "86%" }} />
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">
              124 patrullas de primera línea
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Teatros Operativos
              </span>
              <span className="mt-1 text-3xl font-black tracking-tight text-primary">
                8 Regiones
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary-fixed/40 text-on-tertiary-container">
              <Map className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-surface-container-high/20 pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-tertiary-fixed/40 px-1.5 py-0.5 text-[10px] font-black text-on-tertiary-container">
                Piura
              </span>
              <span className="rounded bg-tertiary-fixed/40 px-1.5 py-0.5 text-[10px] font-black text-on-tertiary-container">
                Tumbes
              </span>
              <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface">
                Lambayeque
              </span>
              <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-bold text-on-surface">
                +5 más
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium mt-1">
              Despliegue reforzado en franja norte
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Red Tetra / Satelital
              </span>
              <span className="mt-1 text-3xl font-black tracking-tight text-primary">
                99.1%
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-fixed/50 text-secondary">
              <RadioTower className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-surface-container-high/20 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-on-surface-variant">
              <span>Respaldo BGAN / Starlink</span>
              <span className="font-mono font-bold text-primary">Sincronizado</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-secondary" style={{ width: "99.1%" }} />
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">
              38 repetidoras solares activas
            </span>
          </div>
        </div>
      </section>

      {/* 3. PANEL DUAL: DISTRIBUCIÓN TERRITORIAL Y CADENA DE COMANDO */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Panel Izquierdo (7 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40">
            {/* Barra de Filtros por Macro-Región */}
            <div className="flex flex-col gap-2 border-b border-surface-container-high/20 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-secondary" />
                <h3 className="text-base font-black text-primary">
                  Matriz de Teatros y Cuadrantes Tácticos
                </h3>
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 text-xs">
                {(["norte", "centro", "sur", "oriente"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMacroRegion(r)}
                    className={`rounded-lg px-2.5 py-1 font-bold capitalize transition-all ${
                      macroRegion === r
                        ? "bg-secondary text-on-secondary shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {r === "norte" ? "Norte (Crítica)" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Cuadrantes Tácticos */}
            <div className="flex flex-col gap-3">
              {/* Cuadrante 1: Norte 1 */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4 shadow-xs transition-all hover:bg-surface-container-high/30">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-primary">
                        Cuadrante Norte 1 - Piura & Tumbes
                      </h4>
                      <span className="rounded bg-error-container px-2 py-0.5 text-[10px] font-black uppercase text-on-error-container">
                        Alerta Roja / Extremo
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-primary">Cnel. E. Salazar R.</strong> (PMA Chulucanas / Sullana)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-surface-container-lowest px-2.5 py-1 font-mono text-xs font-bold text-on-surface">
                      VHF 148.250 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary-fixed/50 px-2 py-1 text-[10px] font-black uppercase text-secondary">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-black text-primary">680 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Unidades Móviles</span>
                    <span className="text-sm font-black text-primary">34 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-black text-primary">82% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-on-surface">Hace 4 min</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant">
                    <span>Suministros de Respuesta Inmediata (Motobombas, Víveres, Carpas)</span>
                    <span className="font-mono font-bold text-primary">88% Almacenado</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest/60">
                    <div className="h-full rounded-full bg-secondary" style={{ width: "88%" }} />
                  </div>
                </div>
              </div>

              {/* Cuadrante 2: Norte 2 */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4 shadow-xs transition-all hover:bg-surface-container-high/30">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-primary">
                        Cuadrante Norte 2 - Lambayeque & La Libertad
                      </h4>
                      <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[10px] font-black uppercase text-on-tertiary-container">
                        Alerta Naranja / Severo
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-primary">Cmdte. M. Vásquez T.</strong> (Base Táctica Chiclayo / Motupe)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-surface-container-lowest px-2.5 py-1 font-mono text-xs font-bold text-on-surface">
                      VHF 152.125 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary-fixed/50 px-2 py-1 text-[10px] font-black uppercase text-secondary">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-black text-primary">510 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Unidades Anfibias</span>
                    <span className="text-sm font-black text-primary">22 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-black text-primary">76% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-on-surface">Hace 11 min</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant">
                    <span>Suministros de Respuesta Inmediata</span>
                    <span className="font-mono font-bold text-primary">71% Almacenado</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest/60">
                    <div className="h-full rounded-full bg-secondary-container" style={{ width: "71%" }} />
                  </div>
                </div>
              </div>

              {/* Cuadrante 3: Áncash */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4 shadow-xs transition-all hover:bg-surface-container-high/30">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-primary">
                        Cuadrante Cuenca Áncash - Santa & Huarmey
                      </h4>
                      <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[10px] font-black uppercase text-on-tertiary-container">
                        Alerta Naranja
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-primary">Cap. R. Morales P.</strong> (Puesto Avanzado Huarmey)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-surface-container-lowest px-2.5 py-1 font-mono text-xs font-bold text-on-surface">
                      VHF 149.775 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary-fixed/50 px-2 py-1 text-[10px] font-black uppercase text-secondary">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-black text-primary">280 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Unidades Móviles</span>
                    <span className="text-sm font-black text-primary">16 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-black text-primary">89% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-on-surface">Hace 18 min</span>
                  </div>
                </div>
              </div>

              {/* Cuadrante 4: Central */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4 shadow-xs transition-all hover:bg-surface-container-high/30">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-primary">
                        Cuadrante Central - Cuenca del Rímac & Chosica
                      </h4>
                      <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-black uppercase text-on-surface">
                        Alerta Amarilla / Monitoreo
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-primary">Mayor J. Quispe C.</strong> (Base Chosica Km 34)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-surface-container-lowest px-2.5 py-1 font-mono text-xs font-bold text-on-surface">
                      VHF 146.500 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-secondary-fixed/50 px-2 py-1 text-[10px] font-black uppercase text-secondary">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-black text-primary">390 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Unidades Rápidas</span>
                    <span className="text-sm font-black text-primary">18 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-black text-primary">94% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-2">
                    <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-on-surface">Hace 2 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho (5 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Comandante General de Guardia */}
          <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between border-b border-surface-container-high/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-secondary" />
                <h3 className="text-base font-black text-primary">
                  Comandante General de Guardia
                </h3>
              </div>
              <span className="rounded bg-secondary-fixed/50 px-2 py-0.5 text-[10px] font-black uppercase text-on-secondary-fixed">
                Turno Alfa 01
              </span>
            </div>

            <div className="flex items-start gap-4 rounded-xl bg-surface-container-low p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-primary-container ring-2 ring-surface-container-high">
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-black text-white">
                  JQ
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                    Gral. Brig. EP (R)
                  </span>
                  <h4 className="truncate text-base font-black text-primary">
                    Jorge Quispe C.
                  </h4>
                  <span className="text-xs font-medium text-on-surface-variant leading-tight">
                    Director Nacional de Operaciones de Emergencia (DNOE)
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-on-surface">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span>
                    Tiempo en Guardia: <strong className="font-mono font-bold text-primary">06h 45m</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-container px-3 py-2 text-xs font-black text-on-primary transition-colors hover:bg-secondary"
              >
                <Radio className="h-4 w-4" />
                <span>Frecuencia Directa</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs font-black text-primary transition-colors hover:bg-surface-container-high"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Llamada Cifrada</span>
              </button>
            </div>
          </div>

          {/* Protocolos de Escalación Inmediata */}
          <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40">
            <div className="flex items-center justify-between border-b border-surface-container-high/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-on-tertiary-container" />
                <h3 className="text-base font-black text-primary">
                  Protocolos de Escalación Inmediata
                </h3>
              </div>
              <span className="font-mono text-[10px] font-bold text-on-surface-variant">
                INC-DIRECTIVA-04
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error-container text-xs font-mono font-black text-on-error-container">
                  01
                </span>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-primary">
                    Nivel 5: Catástrofe Nacional (Decreto Supremo)
                  </span>
                  <p className="text-on-surface-variant font-medium mt-0.5">
                    Autorización del Consejo de Ministros e INDECI Central. Convocatoria total de las FF.AA.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-xs font-mono font-black text-on-tertiary-container">
                  02
                </span>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-primary">
                    Nivel 4: Emergencia Regional de Gran Magnitud
                  </span>
                  <p className="text-on-surface-variant font-medium mt-0.5">
                    Activación directa COER con soporte de comandos logísticos DNOE.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-xs font-mono font-black text-on-surface">
                  03
                </span>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-primary">
                    Nivel 3: Despliegue Local Interprovincial
                  </span>
                  <p className="text-on-surface-variant font-medium mt-0.5">
                    Respuesta articulada por brigadas distritales y compañías de bomberos.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-surface-container pt-2 text-[11px] font-medium text-on-surface-variant">
              <span>
                Clave de autorización: <strong className="font-mono font-bold text-primary">AUTH-SEC-2026-FALCON</strong>
              </span>
              <span className="font-bold text-secondary">
                Directiva Activa
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TABLA DETALLADA DE MANDOS REGIONALES Y BRIGADAS ASIGNADAS */}
      <section className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-surface-container-high/20 pb-4">
          <div className="flex flex-col">
            <h3 className="text-base font-black text-primary">
              Nómina y Registro de Despliegue de Oficiales de Campo
            </h3>
            <span className="text-xs font-medium text-on-surface-variant">
              Total: {filteredOfficers.length} Oficiales registrados • Despliegue activo en 8 departamentos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
              <input
                type="text"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder="Buscar oficial o base..."
                className="h-9 w-full rounded-xl bg-surface-container-low pl-8 pr-3 text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
              />
            </div>

            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="h-9 rounded-xl bg-surface-container-low px-2.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="all">Todos los Rangos</option>
              <option value="coronel">Coronel / Comandante</option>
              <option value="mayor">Mayor / Capitán</option>
              <option value="civil">Coordinadores Territoriales</option>
            </select>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="h-9 rounded-xl bg-surface-container-low px-2.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="all">Todas las Regiones</option>
              <option value="piura">Piura & Tumbes</option>
              <option value="lambayeque">Lambayeque</option>
              <option value="áncash">Áncash</option>
              <option value="lima">Lima Provincias</option>
              <option value="ica">Ica & Chincha</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <th scope="col" className="px-4 py-3">Oficial / Identificación</th>
                <th scope="col" className="px-4 py-3">Rango & Especialidad</th>
                <th scope="col" className="px-4 py-3">Puesto de Mando / Base</th>
                <th scope="col" className="px-4 py-3">Región</th>
                <th scope="col" className="px-4 py-3">Fuerza a Cargo</th>
                <th scope="col" className="px-4 py-3">Estado Operativo</th>
                <th scope="col" className="px-4 py-3">Último Reporte</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/40 text-on-surface font-medium">
              {filteredOfficers.map((officer) => (
                <tr key={officer.id} className="transition-colors hover:bg-surface-container-low/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-mono text-xs font-bold text-on-primary">
                        {officer.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-primary truncate">{officer.name}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          {officer.code}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{officer.rank}</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        {officer.specialty}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-on-surface">{officer.base}</td>
                  <td className="px-4 py-3.5 font-bold text-on-surface">{officer.region}</td>
                  <td className="px-4 py-3.5 font-semibold text-secondary">{officer.force}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        officer.statusType === "critical"
                          ? "bg-red-100 text-red-800"
                          : officer.statusType === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : officer.statusType === "stable"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {officer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-on-surface-variant">{officer.lastReport}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-secondary hover:bg-surface-container transition-colors"
                      title="Contactar Enlace"
                    >
                      <Radio className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
