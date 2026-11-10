import { afterEach, describe, expect, it, vi } from "vitest";

import { BrowserGpsService } from "@/infrastructure/gps/browser-gps.service";

type PositionCallback = (position: GeolocationPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

const installGeolocation = (
  implementation: (success: PositionCallback, failure: ErrorCallback) => void,
) => {
  const getCurrentPosition = vi.fn(implementation);
  Object.defineProperty(window.navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
  return getCurrentPosition;
};

const position = {
  coords: { latitude: -12.05, longitude: -77.05, accuracy: 12.4 },
} as GeolocationPosition;

const failure = (code: number) => ({ code }) as GeolocationPositionError;

afterEach(() => {
  Object.defineProperty(window.navigator, "geolocation", {
    value: undefined,
    configurable: true,
  });
});

describe("BrowserGpsService", () => {
  it("returns readable coordinates on success", async () => {
    const getCurrentPosition = installGeolocation((success) => success(position));
    const service = new BrowserGpsService();

    const result = await service.getCurrentPosition();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.latitude).toBe(-12.05);
    expect(result.value.longitude).toBe(-77.05);
    expect(result.value.accuracy).toBe(12.4);
    expect(result.value.formatted).toBe("-12.05000, -77.05000 (±12m)");
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
  });

  it("reports an unsupported browser when geolocation is missing", async () => {
    const service = new BrowserGpsService();

    const result = await service.getCurrentPosition();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.reason).toBe("unsupported");
    expect(result.error.message).toContain("no soporta");
  });

  it.each([
    [1, "permission_denied"],
    [2, "unavailable"],
    [3, "timeout"],
    [99, "unavailable"],
  ])("maps geolocation code %i to %s", async (code, reason) => {
    installGeolocation((_success, error) => error(failure(code)));
    const service = new BrowserGpsService();

    const result = await service.getCurrentPosition();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.reason).toBe(reason);
    expect(result.error.message.length).toBeGreaterThan(0);
  });

  it("gives a Spanish permission message", async () => {
    installGeolocation((_success, error) => error(failure(1)));
    const service = new BrowserGpsService();

    const result = await service.getCurrentPosition();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain("permiso");
  });
});
