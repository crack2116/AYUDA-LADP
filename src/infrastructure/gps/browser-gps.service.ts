import type {
  GpsError,
  GpsReading,
  GpsResult,
  GpsService,
} from "@/application/ports/gps.service";
import { formatGpsCoords } from "@/domain/lib/gps";

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 0,
};

function mapGpsError(error: GeolocationPositionError): GpsError {
  switch (error.code) {
    case 1:
      return {
        reason: "permission_denied",
        message: "No diste permiso para usar la ubicación. Actívala en tu navegador.",
      };
    case 3:
      return {
        reason: "timeout",
        message: "La ubicación tardó demasiado en responder. Inténtalo de nuevo.",
      };
    case 2:
    default:
      return {
        reason: "unavailable",
        message: "La ubicación no está disponible en este momento.",
      };
  }
}

/**
 * Free GPS through the browser Geolocation API.
 * No API key, no paid provider; failures are typed instead of thrown.
 */
export class BrowserGpsService implements GpsService {
  async getCurrentPosition(): Promise<GpsResult> {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return {
        ok: false,
        error: { reason: "unsupported", message: "Este navegador no soporta el GPS." },
      };
    }

    if (!navigator.geolocation) {
      return {
        ok: false,
        error: { reason: "unsupported", message: "Este navegador no soporta el GPS." },
      };
    }

    return new Promise<GpsResult>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const reading: GpsReading = {
            latitude,
            longitude,
            accuracy,
            formatted: formatGpsCoords({ latitude, longitude, accuracy }),
          };
          resolve({ ok: true, value: reading });
        },
        (error) => {
          resolve({ ok: false, error: mapGpsError(error) });
        },
        GPS_OPTIONS,
      );
    });
  }
}
