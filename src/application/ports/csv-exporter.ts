import type { NecesidadPrincipal, TipoAfectacion } from "@/domain/entities/incidencia";

export interface CsvIncidenciaRow {
  codigoAuditoria: string;
  centroPoblado: string;
  sector: string;
  region: string;
  tipoAfectacion: TipoAfectacion;
  necesidadPrincipal: NecesidadPrincipal;
  hogaresAfectados: number;
  fechaSuceso: string;
  verificado: boolean;
  gpsCoords: string | null;
  creadoPor: string;
  createdAt: string;
}

export interface CsvExporter {
  buildIncidenciaCsv(rows: CsvIncidenciaRow[]): string;
}
