import type { NecesidadPrincipal, TipoAfectacion } from "@/domain/entities/incidencia";

export interface KpiBreakdown<TValue extends string> {
  value: TValue | null;
  label: string;
  count: number;
}

export interface JefaturaKpis {
  totalHogaresAfectados: number;
  incidenciasVerificadas: number;
  incidenciasPendientes: number;
  /** 0..100 with one decimal. */
  porcentajeVerificadas: number;
  centrosPobladosAfectados: number;
  necesidadPrincipalCritica: KpiBreakdown<NecesidadPrincipal>;
  tipoAfectacionPredominante: KpiBreakdown<TipoAfectacion>;
  reportesUltimas24h: number;
}
