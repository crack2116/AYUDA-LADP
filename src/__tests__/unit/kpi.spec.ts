import { describe, expect, it } from "vitest";

import type { Incidencia } from "@/domain/entities/incidencia";
import { calculateJefaturaKpis } from "@/domain/services/kpi-calculator";

const NOW = new Date("2026-11-10T12:00:00.000Z");

const makeIncidencia = (overrides: Partial<Incidencia> = {}): Incidencia => ({
  id: "inc-1",
  codigoAuditoria: "INC-2026-00001",
  centroPobladoId: "c1",
  tipoAfectacion: "inundacion",
  hogaresAfectados: 10,
  necesidadPrincipal: "agua_potable",
  ocurrioHoy: true,
  fechaSuceso: "2026-11-10",
  gpsCoords: null,
  notaReferencia: null,
  verificado: false,
  creadoPor: "user-asi-01",
  createdAt: "2026-11-10T10:00:00.000Z",
  ...overrides,
});

describe("jefatura KPIs", () => {
  it("returns a safe empty state", () => {
    const kpis = calculateJefaturaKpis([], NOW);

    expect(kpis).toEqual({
      totalHogaresAfectados: 0,
      incidenciasVerificadas: 0,
      incidenciasPendientes: 0,
      porcentajeVerificadas: 0,
      centrosPobladosAfectados: 0,
      necesidadPrincipalCritica: { value: null, label: "Sin datos", count: 0 },
      tipoAfectacionPredominante: { value: null, label: "Sin datos", count: 0 },
      reportesUltimas24h: 0,
    });
  });

  it("reports one hundred percent when everything is verified", () => {
    const kpis = calculateJefaturaKpis(
      [
        makeIncidencia({ id: "a", verificado: true, hogaresAfectados: 5 }),
        makeIncidencia({ id: "b", verificado: true, hogaresAfectados: 7 }),
      ],
      NOW,
    );

    expect(kpis.incidenciasVerificadas).toBe(2);
    expect(kpis.incidenciasPendientes).toBe(0);
    expect(kpis.porcentajeVerificadas).toBe(100);
    expect(kpis.totalHogaresAfectados).toBe(12);
  });

  it("rounds the verification percentage to one decimal", () => {
    const kpis = calculateJefaturaKpis(
      [
        makeIncidencia({ id: "a", verificado: true }),
        makeIncidencia({ id: "b" }),
        makeIncidencia({ id: "c" }),
      ],
      NOW,
    );

    expect(kpis.porcentajeVerificadas).toBe(33.3);
    expect(kpis.incidenciasPendientes).toBe(2);
  });

  it("counts unique affected centros poblados", () => {
    const kpis = calculateJefaturaKpis(
      [
        makeIncidencia({ id: "a", centroPobladoId: "c1" }),
        makeIncidencia({ id: "b", centroPobladoId: "c1" }),
        makeIncidencia({ id: "c", centroPobladoId: "c2" }),
      ],
      NOW,
    );

    expect(kpis.centrosPobladosAfectados).toBe(2);
  });

  it("breaks ties alphabetically by label", () => {
    const kpis = calculateJefaturaKpis(
      [
        makeIncidencia({ id: "a", tipoAfectacion: "huaico", necesidadPrincipal: "carpas_abrigo" }),
        makeIncidencia({
          id: "b",
          tipoAfectacion: "inundacion",
          necesidadPrincipal: "alimentos",
        }),
      ],
      NOW,
    );

    // "Huaico / Deslizamiento" sorts before "Inundación".
    expect(kpis.tipoAfectacionPredominante).toEqual({
      value: "huaico",
      label: "Huaico / Deslizamiento",
      count: 1,
    });
    // "Alimentos no perecibles" sorts before "Carpas / Abrigo".
    expect(kpis.necesidadPrincipalCritica).toEqual({
      value: "alimentos",
      label: "Alimentos no perecibles",
      count: 1,
    });
  });

  it("prefers the highest count before alphabetical order", () => {
    const kpis = calculateJefaturaKpis(
      [
        makeIncidencia({ id: "a", tipoAfectacion: "huaico" }),
        makeIncidencia({ id: "b", tipoAfectacion: "huaico" }),
        makeIncidencia({ id: "c", tipoAfectacion: "inundacion" }),
      ],
      NOW,
    );

    expect(kpis.tipoAfectacionPredominante.value).toBe("huaico");
    expect(kpis.tipoAfectacionPredominante.count).toBe(2);
  });

  it("applies the 24 hour boundary inclusively and ignores the future", () => {
    const kpis = calculateJefaturaKpis(
      [
        makeIncidencia({ id: "inside", createdAt: "2026-11-10T11:59:59.999Z" }),
        makeIncidencia({ id: "boundary", createdAt: "2026-11-09T12:00:00.000Z" }),
        makeIncidencia({ id: "outside", createdAt: "2026-11-09T11:59:59.999Z" }),
        makeIncidencia({ id: "future", createdAt: "2026-11-10T12:00:00.001Z" }),
      ],
      NOW,
    );

    expect(kpis.reportesUltimas24h).toBe(2);
  });
});
