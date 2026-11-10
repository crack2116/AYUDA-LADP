import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

import { clearStore } from "@/infrastructure/repositories/local-store";

beforeEach(() => {
  clearStore();
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window.navigator, "geolocation");
  Reflect.deleteProperty(window.navigator, "clipboard");
});
