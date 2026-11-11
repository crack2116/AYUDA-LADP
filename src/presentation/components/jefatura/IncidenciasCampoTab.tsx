"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Droplets,
  Flame,
  Layers,
  MapPin,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import type { IncidenciaConCentro } from "@/application/ports/incidencia.repository";
import type { CentroPoblado } from "@/domain/entities/centro-poblado";
import {
  TIPO_AFECTACION_OPTIONS,
  labelForNecesidad,
  labelForTipoAfectacion,
} from "@/domain/entities/incidencia";
import type { UserProfile } from "@/domain/entities/user";
import { toLimaDateKey } from "@/domain/lib/date";
import { parseGpsCoords } from "@/domain/lib/gps";
import { can } from "@/domain/permissions/rbac";
import {
  buildIncidenciasGeoJson,
  projectPeruCoordsToPercent,
} from "@/domain/services/territorial-analysis";
import { getContainer } from "@/infrastructure/container";
import { downloadTextFile } from "@/presentation/lib/download";
import { formatCount, formatDateKey } from "@/presentation/lib/format";

export interface IncidenciasCampoTabProps {
  rows?: readonly IncidenciaConCentro[];
  centros?: readonly CentroPoblado[];
  users?: readonly UserProfile[];
  currentUser?: UserProfile | null;
  onValidateIncidencia?: (incidenciaId: string) => Promise<boolean>;
  onRegisterAtCentro?: (centroId: string) => void;
}

type LayerMode = "calor" | "puntos" | "pendientes";

export function IncidenciasCampoTab({
  rows: rowsProp,
  users: usersProp,
  currentUser: currentUserProp,
  onValidateIncidencia,
  onRegisterAtCentro,
}: IncidenciasCampoTabProps) {
  const [loadedRows, setLoadedRows] = useState<IncidenciaConCentro[]>([]);
  const [loadedUsers, setLoadedUsers] = useState<UserProfile[]>([]);
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(null);

  const [activeLayer, setActiveLayer] = useState<LayerMode>("calor");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "gps">("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [zoomScale, setZoomScale] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const resolvedUser = currentUserProp ?? sessionUser;
  const users = useMemo(
    () => (usersProp && usersProp.length > 0 ? usersProp : loadedUsers),
    [usersProp, loadedUsers],
  );
  const baseRows = useMemo(
    () => (rowsProp !== undefined ? rowsProp : loadedRows),
    [rowsProp, loadedRows],
  );

  // Hydrate independently when rendered outside JefaturaDashboardView (e.g. unit tests)
  useEffect(() => {
    let active = true;
    const container = getContainer();

    const hydrate = async () => {
      const restored =
        currentUserProp === undefined ? await container.authRepository.restoreSession() : null;
      if (active && currentUserProp === undefined) {
        setSessionUser(restored);
      }

      if (rowsProp === undefined) {
        const [incidencias, centros] = await Promise.all([
          container.incidenciaRepository.listAll(),
          container.centroPobladoRepository.listAll(),
        ]);
        const centrosMap = new Map(centros.map((c) => [c.id, c]));
        const joined: IncidenciaConCentro[] = [];
        for (const incidencia of incidencias) {
          const centroPoblado = centrosMap.get(incidencia.centroPobladoId);
          if (centroPoblado) joined.push({ incidencia, centroPoblado });
        }
        joined.sort((a, b) => Date.parse(b.incidencia.createdAt) - Date.parse(a.incidencia.createdAt));
        if (active) setLoadedRows(joined);
      }

      if (usersProp === undefined) {
        const profileList = await container.authRepository.listUsers();
        if (active) setLoadedUsers(profileList);
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [currentUserProp, rowsProp, usersProp]);

  const usersById = useMemo(
    () => new Map(users.map((profile) => [profile.id, profile])),
    [users],
  );

  const filteredRows = useMemo(() => {
    const query = filterSearch.trim().toLowerCase();
    return baseRows.filter(({ incidencia, centroPoblado }) => {
      if (
        query &&
        !incidencia.codigoAuditoria.toLowerCase().includes(query) &&
        !centroPoblado.nombre.toLowerCase().includes(query) &&
        !centroPoblado.sector.toLowerCase().includes(query) &&
        !centroPoblado.region.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (statusFilter === "pending" && incidencia.verificado) return false;
      if (statusFilter === "verified" && !incidencia.verificado) return false;
      if (statusFilter === "gps" && !parseGpsCoords(incidencia.gpsCoords)) return false;
      if (tipoFilter !== "all" && incidencia.tipoAfectacion !== tipoFilter) return false;
      return true;
    });
  }, [baseRows, filterSearch, statusFilter, tipoFilter]);

  const mapMarkers = useMemo(() => {
    return filteredRows
      .filter((row) => (activeLayer === "pendientes" ? !row.incidencia.verificado : true))
      .map((row) => {
        const parsed = parseGpsCoords(row.incidencia.gpsCoords);
        if (!parsed) return null;
        return {
          row,
          parsed,
          point: projectPeruCoordsToPercent(parsed),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [activeLayer, filteredRows]);

  const selectedRow = useMemo(() => {
    if (selectedId) {
      const match = filteredRows.find((r) => r.incidencia.id === selectedId);
      if (match) return match;
    }
    return filteredRows[0] ?? null;
  }, [filteredRows, selectedId]);

  const stats = useMemo(() => {
    const geoCount = baseRows.filter((r) => parseGpsCoords(r.incidencia.gpsCoords) !== null).length;
    const verifiedCount = baseRows.filter((r) => r.incidencia.verificado).length;
    const pendingCount = baseRows.length - verifiedCount;
    const sectores = [...new Set(baseRows.map((r) => r.centroPoblado.sector))];
    const regiones = [...new Set(baseRows.map((r) => r.centroPoblado.region))];
    const totalHogares = baseRows.reduce((sum, r) => sum + r.incidencia.hogaresAfectados, 0);
    const maxRow =
      baseRows.length > 0
        ? [...baseRows].sort(
            (a, b) => b.incidencia.hogaresAfectados - a.incidencia.hogaresAfectados,
          )[0]
        : null;
    const withoutGpsFiltered = filteredRows.filter(
      (r) => parseGpsCoords(r.incidencia.gpsCoords) === null,
    ).length;

    return {
      geoCount,
      geoPct: baseRows.length === 0 ? 0 : Math.round((geoCount / baseRows.length) * 100),
      verifiedCount,
      pendingCount,
      sectores,
      regionCount: regiones.length,
      totalHogares,
      maxRow,
      withoutGpsFiltered,
    };
  }, [baseRows, filteredRows]);

  const maxHogaresInMap = useMemo(() => {
    return Math.max(1, ...mapMarkers.map((m) => m.row.incidencia.hogaresAfectados));
  }, [mapMarkers]);

  const handleExportGeoJson = () => {
    const geoJson = buildIncidenciasGeoJson(filteredRows);
    if (geoJson.features.length === 0) {
      setStatusMessage("No hay incidencias con coordenadas GPS en la vista para exportar GeoJSON.");
      return;
    }
    const filename = `incidencias-campo-${toLimaDateKey(new Date())}.geojson`;
    downloadTextFile(filename, JSON.stringify(geoJson, null, 2), "application/geo+json;charset=utf-8");
    setStatusMessage(
      `GeoJSON exportado (${geoJson.features.length} ${geoJson.features.length === 1 ? "punto" : "puntos"}).`,
    );
  };

  const handleValidateSelected = async () => {
    if (!selectedRow || selectedRow.incidencia.verificado) return;
    setValidating(true);
    let verifiedOk = false;

    if (onValidateIncidencia) {
      verifiedOk = await onValidateIncidencia(selectedRow.incidencia.id);
    } else if (resolvedUser) {
      const res = await getContainer().useCases.validateExistence.execute({
        incidenciaId: selectedRow.incidencia.id,
        user: resolvedUser,
      });
      if (res.ok) {
        verifiedOk = true;
        setLoadedRows((prev) =>
          prev.map((item) =>
            item.incidencia.id === res.value.id
              ? { ...item, incidencia: res.value }
              : item,
          ),
        );
      } else {
        setStatusMessage(res.error.message);
      }
    }

    setValidating(false);
    if (verifiedOk) {
      setStatusMessage(`Incidencia ${selectedRow.incidencia.codigoAuditoria} validada en campo.`);
    }
  };

  const handleCopyInspector = async () => {
    if (!selectedRow) return;
    const text = `${selectedRow.incidencia.codigoAuditoria} · ${selectedRow.centroPoblado.nombre} (${selectedRow.centroPoblado.region}) · ${selectedRow.incidencia.gpsCoords ?? "Sin GPS"}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setStatusMessage(`Datos de ${selectedRow.incidencia.codigoAuditoria} copiados al portapapeles.`);
        return;
      } catch {
        // Fallback message below
      }
    }
    setStatusMessage("El portapapeles no está disponible en este navegador.");
  };

  const canValidate =
    selectedRow !== null &&
    !selectedRow.incidencia.verificado &&
    (resolvedUser ? can(resolvedUser, "incidencia:validate") : false);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 max-w-4xl flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold uppercase text-ladp-orange">
                <span className="h-1.5 w-1.5 rounded-full bg-ladp-orange" />
                Monitoreo Territorial Real
              </span>
              <span className="rounded-lg bg-brand-mist px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-600">
                WGS84 / EPSG:4326
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-brand-ink sm:text-2xl">
              INCIDENCIAS DE CAMPO – MONITOREO GEOESPACIAL Y MAPA DE CALOR
            </h2>

            <p className="text-xs font-medium leading-relaxed text-slate-500">
              Ubicación de reportes activos con coordenadas registradas en campo, distribución de
              hogares afectados por sector y validación directa de incidencias pendientes.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="export-geojson-btn"
              onClick={handleExportGeoJson}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mist px-3 py-2 text-xs font-bold text-brand-blue transition-colors hover:bg-brand-soft"
            >
              <Download className="h-4 w-4" />
              <span>Exportar GeoJSON</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === "pending" ? "all" : "pending"))
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                statusFilter === "pending"
                  ? "bg-amber-100 text-ladp-orange"
                  : "bg-brand-mist text-brand-ink hover:bg-brand-soft"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Solo Pendientes ({stats.pendingCount})</span>
            </button>
            {onRegisterAtCentro ? (
              <button
                type="button"
                onClick={() => onRegisterAtCentro(selectedRow?.centroPoblado.id ?? "")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-blue"
              >
                <MapPin className="h-4 w-4" />
                <span>Nuevo Registro en Campo</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-mist px-2.5 py-1">
              <Flame className="h-3.5 w-3.5 text-ladp-orange" />
              <span className="font-bold text-brand-ink">VISTA ACTIVA:</span>
              <span>
                {activeLayer === "calor"
                  ? "Concentración por hogares y puntos GPS"
                  : activeLayer === "puntos"
                    ? "Marcadores GPS georreferenciados"
                    : "Incidencias pendientes con GPS"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-mist px-2.5 py-1">
              <MapPin className="h-3.5 w-3.5 text-brand-blue" />
              <span className="font-bold text-brand-ink">GEORREFERENCIADOS:</span>
              <span>
                {stats.geoCount} de {baseRows.length} reportes
              </span>
            </div>
          </div>
          {statusMessage ? (
            <span role="status" className="font-semibold text-brand-blue">
              {statusMessage}
            </span>
          ) : null}
        </div>
      </section>

      {/* 4 Real KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Incidencias Georreferenciadas
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                data-testid="campo-kpi-georef"
                className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
              >
                {formatCount(stats.geoCount)}
              </span>
              <span className="text-xs font-bold text-brand-blue">
                {stats.geoPct}% con GPS
              </span>
            </div>
            <span className="mt-0.5 text-[11px] font-medium text-slate-500">
              Sobre {formatCount(baseRows.length)} reportes visibles
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
            <MapPin className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ladp-orange">
              Pendientes de Verificación
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                data-testid="campo-kpi-pending"
                className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
              >
                {formatCount(stats.pendingCount)}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-positive">
                {formatCount(stats.verifiedCount)} verificadas
              </span>
            </div>
            <span className="mt-0.5 text-[11px] font-medium text-slate-500">
              Confirmación de existencia en campo
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-ladp-orange">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sectores / Cuencas Activos
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                {formatCount(stats.sectores.length)}
              </span>
              <span className="text-xs font-bold text-brand-blue">
                {stats.regionCount} {stats.regionCount === 1 ? "región" : "regiones"}
              </span>
            </div>
            <span className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
              {stats.sectores.length > 0 ? stats.sectores.slice(0, 3).join(", ") : "Sin sectores"}
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
            <Droplets className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Hogares Afectados
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
                {formatCount(stats.totalHogares)}
              </span>
              <span className="text-xs font-bold text-brand-blue">
                {formatCount(baseRows.length)} rep.
              </span>
            </div>
            <span className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
              {stats.maxRow
                ? `Mayor: ${stats.maxRow.centroPoblado.nombre} (${formatCount(stats.maxRow.incidencia.hogaresAfectados)} h.)`
                : "Sin afectación reportada"}
            </span>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Map Console + Inspector */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Map (8 cols) */}
        <div className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] lg:col-span-8">
          <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-1.5 rounded-xl bg-brand-deep/90 p-1.5 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => setActiveLayer("calor")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                activeLayer === "calor"
                  ? "bg-ladp-orange text-white"
                  : "text-blue-200 hover:bg-white/10"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Mapa de Calor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("puntos")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                activeLayer === "puntos"
                  ? "bg-brand-blue text-white"
                  : "text-blue-200 hover:bg-white/10"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Puntos ({mapMarkers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("pendientes")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                activeLayer === "pendientes"
                  ? "bg-brand-negative text-white"
                  : "text-blue-200 hover:bg-white/10"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Pendientes</span>
            </button>
          </div>

          <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(1.6, Math.round((z + 0.15) * 100) / 100))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-ink shadow-md hover:bg-white"
              title="Acercar Zoom"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.85, Math.round((z - 0.15) * 100) / 100))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-ink shadow-md hover:bg-white"
              title="Alejar Zoom"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-brand-blue shadow-md hover:bg-white"
              title="Centrar Vista"
            >
              <Compass className="h-4 w-4" />
            </button>
          </div>

          {/* Vector Peru Canvas */}
          <div className="relative h-[520px] w-full overflow-hidden bg-brand-deep select-none">
            <div
              className="relative h-full w-full transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
                aria-hidden="true"
              >
                <defs>
                  <pattern id="grid-utm-real" width="64" height="64" patternUnits="userSpaceOnUse">
                    <path
                      d="M 64 0 L 0 0 0 64"
                      fill="none"
                      stroke="#778bb5"
                      strokeWidth="0.75"
                      strokeDasharray="2 4"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-utm-real)" />
              </svg>

              {/* Heat blobs derived directly from real geoRows */}
              {activeLayer === "calor"
                ? mapMarkers.map(({ row, point }) => {
                    const weight = Math.max(0.35, row.incidencia.hogaresAfectados / maxHogaresInMap);
                    const diameter = Math.round(90 + weight * 110);
                    return (
                      <div
                        key={`heat-${row.incidencia.id}`}
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl opacity-75"
                        style={{
                          left: `${point.xPercent}%`,
                          top: `${point.yPercent}%`,
                          width: `${diameter}px`,
                          height: `${diameter}px`,
                          background: row.incidencia.verificado
                            ? "radial-gradient(circle, #325f9c 0%, transparent 72%)"
                            : "radial-gradient(circle, #df6900 0%, #ffb68c 45%, transparent 72%)",
                        }}
                      />
                    );
                  })
                : null}

              {/* Real clickable incident pins */}
              {mapMarkers.map(({ row, point }) => {
                const isSelected = selectedRow?.incidencia.id === row.incidencia.id;
                const { incidencia, centroPoblado } = row;
                return (
                  <button
                    key={incidencia.id}
                    type="button"
                    aria-label={`Foco ${incidencia.codigoAuditoria} - ${centroPoblado.nombre}`}
                    onClick={() => setSelectedId(incidencia.id)}
                    style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
                    className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  >
                    <span className="relative flex items-center justify-center">
                      {isSelected ? (
                        <span className="absolute inline-flex h-11 w-11 animate-ping rounded-full bg-ladp-orange opacity-70" />
                      ) : null}
                      <span
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-xl ring-2 ring-white transition-transform ${
                          isSelected ? "scale-110" : "group-hover:scale-105"
                        } ${
                          incidencia.verificado
                            ? "bg-brand-blue text-white"
                            : "bg-ladp-orange text-white"
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </span>
                    </span>
                    <span
                      className={`absolute -top-2 left-9 whitespace-nowrap rounded-lg bg-brand-deep px-2.5 py-1 text-left text-[11px] text-white shadow-lg ${
                        isSelected ? "flex" : "hidden group-hover:flex"
                      } flex-col`}
                    >
                      <span className="font-mono font-bold">{incidencia.codigoAuditoria}</span>
                      <span className="text-[10px] text-blue-200">
                        {centroPoblado.nombre} · {formatCount(incidencia.hogaresAfectados)} h.
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {mapMarkers.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="rounded-xl bg-brand-deep/90 px-4 py-3 text-xs font-semibold text-blue-100">
                  No hay incidencias georreferenciadas para los filtros actuales.
                </p>
              </div>
            ) : null}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-brand-deep/95 p-3 text-xs text-white shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Estado de Reportes en Mapa
              </p>
              <div className="mt-1.5 flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-ladp-orange" /> Pendiente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" /> Verificado
                </span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-20 rounded-lg bg-brand-deep/90 px-2.5 py-1.5 font-mono text-[10px] text-blue-200 shadow">
              Zoom {zoomScale.toFixed(2)}x · EPSG:4326
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-brand-mist p-3 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-brand-blue" />
              <span>
                Mostrando {mapMarkers.length} {mapMarkers.length === 1 ? "marcador" : "marcadores"}{" "}
                georreferenciados
              </span>
            </div>
            <span className="font-mono text-[11px]">
              {stats.withoutGpsFiltered > 0
                ? `${stats.withoutGpsFiltered} sin GPS (visibles en matriz)`
                : "Todos los registros visibles cuentan con GPS"}
            </span>
          </div>
        </div>

        {/* Side Inspector Panel (4 cols) */}
        <div
          data-testid="campo-inspector"
          className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)] lg:col-span-4"
        >
          {selectedRow ? (
            <>
              <div className="bg-brand-deep p-4 text-white">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      selectedRow.incidencia.verificado
                        ? "bg-emerald-600 text-white"
                        : "bg-ladp-orange text-white"
                    }`}
                  >
                    {selectedRow.incidencia.verificado ? "VERIFICADO" : "PENDIENTE"}
                  </span>
                  <span className="font-mono text-xs text-blue-200">
                    #{selectedRow.incidencia.codigoAuditoria}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-bold text-white">
                  {selectedRow.centroPoblado.nombre}
                </h3>
                <span className="text-xs text-blue-200">
                  {selectedRow.centroPoblado.sector} · {selectedRow.centroPoblado.region}
                </span>
              </div>

              <div className="flex flex-col gap-3 p-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-brand-mist p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Tipo de Afectación
                    </span>
                    <p className="mt-0.5 font-bold text-brand-ink">
                      {labelForTipoAfectacion(selectedRow.incidencia.tipoAfectacion)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-mist p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Hogares Afectados
                    </span>
                    <p className="mt-0.5 font-mono text-base font-bold text-brand-ink">
                      {formatCount(selectedRow.incidencia.hogaresAfectados)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-mist p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Necesidad Principal
                    </span>
                    <p className="mt-0.5 font-bold text-brand-ink">
                      {labelForNecesidad(selectedRow.incidencia.necesidadPrincipal)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-mist p-2.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Fecha del Suceso
                    </span>
                    <p className="mt-0.5 font-mono font-bold text-brand-ink">
                      {formatDateKey(selectedRow.incidencia.fechaSuceso)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-brand-mist p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Coordenadas WGS84
                  </span>
                  <p className="mt-0.5 font-mono text-[11px] font-bold text-brand-ink">
                    {selectedRow.incidencia.gpsCoords ?? "Sin coordenadas GPS registradas"}
                  </p>
                </div>

                <div className="rounded-xl bg-brand-mist p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Responsables Asignados
                  </span>
                  <p className="mt-0.5 font-semibold text-brand-ink">
                    Reporta:{" "}
                    {usersById.get(selectedRow.incidencia.creadoPor)?.nombre ??
                      selectedRow.incidencia.creadoPor}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Coordinación:{" "}
                    {selectedRow.centroPoblado.coordinadorZonaId
                      ? (usersById.get(selectedRow.centroPoblado.coordinadorZonaId)?.nombre ??
                        selectedRow.centroPoblado.coordinadorZonaId)
                      : "Sin coordinador asignado"}
                  </p>
                </div>

                <div className="rounded-xl bg-brand-mist p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Nota de Campo
                  </span>
                  <p className="mt-0.5 font-medium text-slate-600">
                    {selectedRow.incidencia.notaReferencia ?? "Sin observaciones adicionales."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  {canValidate ? (
                    <button
                      type="button"
                      disabled={validating}
                      data-testid="campo-validate-btn"
                      onClick={() => void handleValidateSelected()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-positive py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:brightness-110 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {validating ? "Validando..." : "Validar Existencia en Campo"}
                      </span>
                    </button>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyInspector()}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-mist py-2 text-xs font-bold text-brand-blue hover:bg-brand-soft"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Ficha</span>
                    </button>
                    {onRegisterAtCentro ? (
                      <button
                        type="button"
                        onClick={() => onRegisterAtCentro(selectedRow.centroPoblado.id)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-mist py-2 text-xs font-bold text-brand-ink hover:bg-brand-soft"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Registrar Seguimiento</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-xs font-semibold text-slate-500">
              Selecciona o filtra una incidencia en la matriz para inspeccionar su ficha técnica.
            </div>
          )}
        </div>
      </section>

      {/* Matrix Table */}
      <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(12,45,110,0.04),0_18px_34px_-28px_rgba(12,45,110,0.45)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-ladp-orange" />
            <h3 className="text-sm font-bold text-brand-ink sm:text-base">
              MATRIZ DE INCIDENCIAS GEORREFERENCIADAS EN CAMPO
            </h3>
            <span className="rounded-lg bg-brand-mist px-2 py-0.5 text-[11px] font-bold text-brand-ink">
              {filteredRows.length} Registros
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Buscar código, centro o sector..."
                className="h-9 w-56 rounded-lg bg-brand-mist pl-8 pr-3 text-xs font-semibold text-brand-ink placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
              />
            </div>

            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "pending" | "verified" | "gps")
              }
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes de validar</option>
              <option value="verified">Solo verificadas</option>
              <option value="gps">Con GPS registrado</option>
            </select>

            <select
              aria-label="Filtrar por tipo de afectación"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="h-9 rounded-lg bg-brand-mist px-2.5 text-xs font-semibold text-brand-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
            >
              <option value="all">Todo tipo de afectación</option>
              {TIPO_AFECTACION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-brand-mist text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-3 py-2.5">
                  Código
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Centro Poblado / Sector
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Afectación
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Necesidad Principal
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Hogares
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Estado
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Fecha
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-brand-ink">
              {filteredRows.map((row) => {
                const { incidencia, centroPoblado } = row;
                const isSelected = selectedRow?.incidencia.id === incidencia.id;
                return (
                  <tr
                    key={incidencia.id}
                    data-testid="campo-incident-row"
                    className={isSelected ? "bg-brand-soft/60 font-semibold" : "hover:bg-brand-mist/60"}
                  >
                    <td className="px-3 py-2.5 font-mono font-bold text-brand-blue">
                      {incidencia.codigoAuditoria}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-ink">{centroPoblado.nombre}</span>
                        <span className="text-[10px] text-slate-500">
                          {centroPoblado.sector} · {centroPoblado.region}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{labelForTipoAfectacion(incidencia.tipoAfectacion)}</td>
                    <td className="px-3 py-2.5">{labelForNecesidad(incidencia.necesidadPrincipal)}</td>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      {formatCount(incidencia.hogaresAfectados)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          incidencia.verificado
                            ? "bg-emerald-50 text-brand-positive"
                            : "bg-amber-50 text-ladp-orange"
                        }`}
                      >
                        {incidencia.verificado ? "Verificado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">
                      {formatDateKey(incidencia.fechaSuceso)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedId(incidencia.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-brand-blue text-white"
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
          {filteredRows.length === 0 ? (
            <p className="py-6 text-center text-xs font-semibold text-slate-500">
              No se encontraron incidencias en campo para los filtros aplicados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
