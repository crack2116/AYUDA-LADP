export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Formats coordinates for the incident record and the CSV export.
 * Example: "-12.05000, -77.05000 (±12m)"
 */
export function formatGpsCoords({ latitude, longitude, accuracy }: GpsCoordinates): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;
}
