export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ParsedGpsCoords {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
}

/**
 * Formats coordinates for the incident record and the CSV export.
 * Example: "-12.05000, -77.05000 (±12m)"
 */
export function formatGpsCoords({ latitude, longitude, accuracy }: GpsCoordinates): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;
}

/**
 * Formats manually entered WGS84 coordinates into standard latitude, longitude text.
 * Returns null if either coordinate is empty, non-numeric, or outside valid WGS84 bounds.
 */
export function formatManualGpsCoords(latRaw: string, lngRaw: string): string | null {
  const latTrimmed = latRaw.trim();
  const lngTrimmed = lngRaw.trim();
  if (!latTrimmed || !lngTrimmed) {
    return null;
  }
  const latitude = Number(latTrimmed);
  const longitude = Number(lngTrimmed);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

const GPS_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*\(\s*±\s*(\d+(?:\.\d+)?)\s*m\s*\))?\s*$/i;

/**
 * Parses stored GPS coordinates such as "-5.26580, -80.67890 (±11m)" or "-5.26580, -80.67890".
 */
export function parseGpsCoords(raw: string | null | undefined): ParsedGpsCoords | null {
  if (!raw) {
    return null;
  }
  const match = GPS_PATTERN.exec(raw);
  if (!match) {
    return null;
  }
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  const accuracyRaw = match[3] ? Number(match[3]) : null;
  const accuracyMeters =
    accuracyRaw !== null && Number.isFinite(accuracyRaw) ? Math.round(accuracyRaw) : null;
  return { latitude, longitude, accuracyMeters };
}
