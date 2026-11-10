export interface GpsReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  formatted: string;
}

export type GpsErrorReason = "unsupported" | "permission_denied" | "unavailable" | "timeout";

export interface GpsError {
  reason: GpsErrorReason;
  message: string;
}

export type GpsResult = { ok: true; value: GpsReading } | { ok: false; error: GpsError };

export interface GpsService {
  getCurrentPosition(): Promise<GpsResult>;
}
