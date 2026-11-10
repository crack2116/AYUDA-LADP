import { normalizeText } from "@/domain/lib/text";

export interface CentroPoblado {
  id: string;
  nombre: string;
  sector: string;
  region: string;
  coordinadorZonaId: string | null;
}

/**
 * Accent- and case-insensitive match over nombre, sector and region.
 * An empty query matches every centro poblado.
 */
export function matchesCentroQuery(centro: CentroPoblado, query: string): boolean {
  const needle = normalizeText(query);
  if (needle.length === 0) {
    return true;
  }
  return [centro.nombre, centro.sector, centro.region].some((field) =>
    normalizeText(field).includes(needle),
  );
}
