import type { CsvExporter, CsvIncidenciaRow } from "@/application/ports/csv-exporter";
import {
  labelForNecesidad,
  labelForTipoAfectacion,
} from "@/domain/entities/incidencia";
import { toLimaDateKey } from "@/domain/lib/date";

const BOM = "\uFEFF";
const CRLF = "\r\n";

const INCIDENCIA_HEADERS = [
  "Codigo de Auditoria",
  "Centro Poblado",
  "Sector",
  "Region",
  "Tipo de Afectacion",
  "Necesidad Principal",
  "Hogares Afectados",
  "Fecha del Suceso",
  "Verificado",
  "Coordenadas GPS",
  "Creado Por",
  "Fecha de Registro",
];

function escapeCsvValue(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * RFC 4180-style CSV: BOM for Excel, CRLF line endings, doubled quotes.
 */
export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const lines = [headers, ...rows].map((cells) => cells.map(escapeCsvValue).join(","));
  return `${BOM}${lines.join(CRLF)}${CRLF}`;
}

export function buildIncidenciaCsv(rows: CsvIncidenciaRow[]): string {
  const data = rows.map((row) => [
    row.codigoAuditoria,
    row.centroPoblado,
    row.sector,
    row.region,
    labelForTipoAfectacion(row.tipoAfectacion),
    labelForNecesidad(row.necesidadPrincipal),
    String(row.hogaresAfectados),
    row.fechaSuceso,
    row.verificado ? "Si" : "No",
    row.gpsCoords ?? "",
    row.creadoPor,
    toLimaDateKey(new Date(row.createdAt)),
  ]);

  return toCsv(INCIDENCIA_HEADERS, data);
}

export const csvExporter: CsvExporter = { buildIncidenciaCsv };

export function createCsvExporter(): CsvExporter {
  return csvExporter;
}
