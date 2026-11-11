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
      <section className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] xl:flex-row xl:items-center">
        <div className="flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mist px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
              </span>
              RED TETRA & SATELITAL EN VIVO
            </span>
            <span className="text-slate-400 font-bold">•</span>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              COEN / INDECI / SINAGERD
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
            SUPERVISIÓN DE MANDOS Y DESPLIEGUE TERRITORIAL
          </h2>

          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            Monitoreo en tiempo real de oficiales de comando, brigadas tácticas de respuesta rápida y teatros de operaciones COEN / COER / INDECI desplegados ante el Fenómeno El Niño 2026.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start xl:self-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-4 py-2.5 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
          >
            <FileDown className="h-4 w-4" />
            <span>Descargar Reporte de Dotación (PDF)</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-blue"
          >
            <MapPinPlus className="h-4 w-4" />
            <span>Asignar Nuevo Cuadrante</span>
          </button>
        </div>
      </section>

      {/* 2. TARJETAS DE INDICADORES DE DESPLIEGUE (KPIs) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Oficiales y Mandos
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                142
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-slate-500">
              <span>En Puesto de Mando Activo</span>
              <span className="font-mono font-bold text-brand-ink">98% (139)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-blue" style={{ width: "98%" }} />
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              3 en relevo táctico operacional
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fuerza de Brigadistas
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                2,480
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-slate-500">
              <span>Disponibilidad Operativa</span>
              <span className="font-mono font-bold text-brand-ink">86% (2,133 Activos)</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-blue/80" style={{ width: "86%" }} />
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              124 patrullas de primera línea
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Teatros Operativos
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                8 Regiones
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-ladp-orange">
              <Map className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-ladp-orange">
                Piura
              </span>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-ladp-orange">
                Tumbes
              </span>
              <span className="rounded bg-brand-mist px-1.5 py-0.5 text-[10px] font-bold text-brand-ink">
                Lambayeque
              </span>
              <span className="rounded bg-brand-mist px-1.5 py-0.5 text-[10px] font-bold text-brand-ink">
                +5 más
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Despliegue reforzado en franja norte
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Red Tetra / Satelital
              </span>
              <span className="mt-1 text-3xl font-bold tracking-tight text-brand-ink">
                99.1%
              </span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
              <RadioTower className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-2 text-xs">
            <div className="flex items-center justify-between font-medium text-slate-500">
              <span>Respaldo BGAN / Starlink</span>
              <span className="font-mono font-bold text-brand-ink">Sincronizado</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-blue" style={{ width: "99.1%" }} />
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              38 repetidoras solares activas
            </span>
          </div>
        </div>
      </section>

      {/* 3. PANEL DUAL: DISTRIBUCIÓN TERRITORIAL Y CADENA DE COMANDO */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Panel Izquierdo (7 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            {/* Barra de Filtros por Macro-Región */}
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-brand-blue" />
                <h3 className="text-base font-bold text-brand-ink">
                  Matriz de Teatros y Cuadrantes Tácticos
                </h3>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-brand-mist p-1 text-xs">
                {(["norte", "centro", "sur", "oriente"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMacroRegion(r)}
                    className={`rounded-lg px-2.5 py-1 font-bold capitalize transition-all ${
                      macroRegion === r
                        ? "bg-brand-blue text-white shadow-xs"
                        : "text-slate-500 hover:text-brand-ink"
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
              <div className="flex flex-col gap-2.5 rounded-xl bg-brand-mist p-4 transition-colors hover:bg-brand-soft/60">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-brand-ink">
                        Cuadrante Norte 1 - Piura & Tumbes
                      </h4>
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-negative">
                        Alerta Roja / Extremo
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-brand-ink">Cnel. E. Salazar R.</strong> (PMA Chulucanas / Sullana)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-ink">
                      VHF 148.250 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase text-brand-blue">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-bold text-brand-ink">680 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Unidades Móviles</span>
                    <span className="text-sm font-bold text-brand-ink">34 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-bold text-brand-ink">82% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-brand-ink">Hace 4 min</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Suministros de Respuesta Inmediata (Motobombas, Víveres, Carpas)</span>
                    <span className="font-mono font-bold text-brand-ink">88% Almacenado</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-brand-blue" style={{ width: "88%" }} />
                  </div>
                </div>
              </div>

              {/* Cuadrante 2: Norte 2 */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-brand-mist p-4 transition-colors hover:bg-brand-soft/60">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-brand-ink">
                        Cuadrante Norte 2 - Lambayeque & La Libertad
                      </h4>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-ladp-orange">
                        Alerta Naranja / Severo
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-brand-ink">Cmdte. M. Vásquez T.</strong> (Base Táctica Chiclayo / Motupe)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-ink">
                      VHF 152.125 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase text-brand-blue">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-bold text-brand-ink">510 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Unidades Anfibias</span>
                    <span className="text-sm font-bold text-brand-ink">22 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-bold text-brand-ink">76% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-brand-ink">Hace 11 min</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Suministros de Respuesta Inmediata</span>
                    <span className="font-mono font-bold text-brand-ink">71% Almacenado</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-brand-blue/80" style={{ width: "71%" }} />
                  </div>
                </div>
              </div>

              {/* Cuadrante 3: Áncash */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-brand-mist p-4 transition-colors hover:bg-brand-soft/60">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-brand-ink">
                        Cuadrante Cuenca Áncash - Santa & Huarmey
                      </h4>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-ladp-orange">
                        Alerta Naranja
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-brand-ink">Cap. R. Morales P.</strong> (Puesto Avanzado Huarmey)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-ink">
                      VHF 149.775 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase text-brand-blue">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-bold text-brand-ink">280 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Unidades Móviles</span>
                    <span className="text-sm font-bold text-brand-ink">16 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-bold text-brand-ink">89% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-brand-ink">Hace 18 min</span>
                  </div>
                </div>
              </div>

              {/* Cuadrante 4: Central */}
              <div className="flex flex-col gap-2.5 rounded-xl bg-brand-mist p-4 transition-colors hover:bg-brand-soft/60">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-brand-ink">
                        Cuadrante Central - Cuenca del Rímac & Chosica
                      </h4>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        Alerta Amarilla / Monitoreo
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                      Comandante a Cargo: <strong className="font-bold text-brand-ink">Mayor J. Quispe C.</strong> (Base Chosica Km 34)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-brand-ink">
                      VHF 146.500 MHz
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase text-brand-blue">
                      <Wifi className="h-3 w-3" /> ENLACE ACTIVO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Efectivos Desplegados</span>
                    <span className="text-sm font-bold text-brand-ink">390 Brigadistas</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Unidades Rápidas</span>
                    <span className="text-sm font-bold text-brand-ink">18 Vehículos</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Capacidad Evacuación</span>
                    <span className="text-sm font-bold text-brand-ink">94% Estimado</span>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Último Despacho</span>
                    <span className="font-mono text-xs font-bold text-brand-ink">Hace 2 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho (5 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {/* Comandante General de Guardia */}
          <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-brand-blue" />
                <h3 className="text-base font-bold text-brand-ink">
                  Comandante General de Guardia
                </h3>
              </div>
              <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase text-brand-blue">
                Turno Alfa 01
              </span>
            </div>

            <div className="flex items-start gap-4 rounded-xl bg-brand-mist p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-deep">
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-bold text-white">
                  JQ
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                    Gral. Brig. EP (R)
                  </span>
                  <h4 className="truncate text-base font-bold text-brand-ink">
                    Jorge Quispe C.
                  </h4>
                  <span className="text-xs font-medium text-slate-500 leading-tight">
                    Director Nacional de Operaciones de Emergencia (DNOE)
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-brand-ink">
                  <Clock className="h-4 w-4 text-brand-blue" />
                  <span>
                    Tiempo en Guardia: <strong className="font-mono font-bold text-brand-ink">06h 45m</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-deep px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-blue"
              >
                <Radio className="h-4 w-4" />
                <span>Frecuencia Directa</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-mist px-3 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Llamada Cifrada</span>
              </button>
            </div>
          </div>

          {/* Protocolos de Escalación Inmediata */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-ladp-orange" />
                <h3 className="text-base font-bold text-brand-ink">
                  Protocolos de Escalación Inmediata
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 rounded-xl bg-brand-mist p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-mono font-bold text-brand-negative">
                  01
                </span>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-brand-ink">
                    Nivel 5: Catástrofe Nacional (Decreto Supremo)
                  </span>
                  <p className="text-slate-500 font-medium mt-0.5">
                    Autorización del Consejo de Ministros e INDECI Central. Convocatoria total de las FF.AA.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-brand-mist p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-mono font-bold text-ladp-orange">
                  02
                </span>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-brand-ink">
                    Nivel 4: Emergencia Regional de Gran Magnitud
                  </span>
                  <p className="text-slate-500 font-medium mt-0.5">
                    Activación directa COER con soporte de comandos logísticos DNOE.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-brand-mist p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-mono font-bold text-brand-ink">
                  03
                </span>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-brand-ink">
                    Nivel 3: Despliegue Local Interprovincial
                  </span>
                  <p className="text-slate-500 font-medium mt-0.5">
                    Respuesta articulada por brigadas distritales y compañías de bomberos.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">
              <span className="font-bold text-brand-blue">
                Directiva Activa
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TABLA DETALLADA DE MANDOS REGIONALES Y BRIGADAS ASIGNADAS */}
      <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-brand-ink">
              Nómina y Registro de Despliegue de Oficiales de Campo
            </h3>
            <span className="text-xs font-medium text-slate-500">
              Total: {filteredOfficers.length} Oficiales registrados • Despliegue activo en 8 departamentos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder="Buscar oficial o base..."
                className="h-9 w-full rounded-lg bg-brand-mist pl-8 pr-3 text-xs font-semibold text-brand-ink placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
            </div>

            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
            >
              <option value="all">Todos los Rangos</option>
              <option value="coronel">Coronel / Comandante</option>
              <option value="mayor">Mayor / Capitán</option>
              <option value="civil">Coordinadores Territoriales</option>
            </select>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
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
              <tr className="bg-brand-mist text-slate-500 font-bold uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-slate-100 text-brand-ink font-medium">
              {filteredOfficers.map((officer) => (
                <tr key={officer.id} className="transition-colors hover:bg-brand-mist/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-deep font-mono text-xs font-bold text-white">
                        {officer.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-brand-ink truncate">{officer.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {officer.code}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-ink">{officer.rank}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {officer.specialty}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-brand-ink">{officer.base}</td>
                  <td className="px-4 py-3.5 font-bold text-brand-ink">{officer.region}</td>
                  <td className="px-4 py-3.5 font-semibold text-brand-blue">{officer.force}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        officer.statusType === "critical"
                          ? "bg-rose-50 text-brand-negative"
                          : officer.statusType === "warning"
                            ? "bg-amber-50 text-ladp-orange"
                            : officer.statusType === "stable"
                              ? "bg-emerald-50 text-brand-positive"
                              : "bg-brand-soft text-brand-blue"
                      }`}
                    >
                      {officer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500">{officer.lastReport}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-brand-blue hover:bg-brand-soft transition-colors"
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
