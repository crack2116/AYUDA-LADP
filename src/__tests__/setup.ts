import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

import { clearStore } from "@/infrastructure/repositories/local-store";

beforeEach(() => {
  clearStore();
});
