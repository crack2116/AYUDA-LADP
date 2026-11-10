import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinadorAreaView } from "@/presentation/views/CoordinadorAreaView";
import { JefaturaDashboardView } from "@/presentation/views/JefaturaDashboardView";

import { captureCsvDownloads, FIXED_NOW, renderForRole } from "./helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/jefatura",
}));

vi.mock("@/infrastructure/container", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/container")>();
  const testContainer = actual.createTestContainer({ now: new Date("2026-11-10T15:00:00.000Z") });
  return { ...actual, getContainer: () => testContainer };
});

const KPI_TEST_IDS = [
  "kpi-hogares",
  "kpi-verificadas",
  "kpi-centros",
  "kpi-necesidad",
  "kpi-tipo",
  "kpi-ultimas-24h",
] as const;

describe("JefaturaDashboardView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the six KPI values, switches tabs and downloads the national CSV", async () => {
    const user = userEvent.setup();
    const { filenames } = captureCsvDownloads();
    await renderForRole("jefatura", <JefaturaDashboardView />);

    await screen.findByText("Panel de situación nacional");

    for (const testId of KPI_TEST_IDS) {
      const card = await screen.findByTestId(testId);
      expect(card.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
    expect(screen.getByTestId("kpi-hogares")).toHaveTextContent("165");
    expect(screen.getByTestId("kpi-verificadas")).toHaveTextContent("4");
    expect(screen.getByTestId("kpi-centros")).toHaveTextContent("9");
    expect(screen.getByTestId("kpi-ultimas-24h")).toHaveTextContent("3");

    await user.click(screen.getByTestId("tab-coordinadores"));
    expect(await screen.findByText("Rosa Herrera Campos")).toBeInTheDocument();

    await user.click(screen.getByTestId("tab-asistentes"));
    expect(await screen.findByText("Luis Paredes")).toBeInTheDocument();

    await user.click(screen.getByTestId("tab-incidencias"));
    expect(screen.getAllByTestId("incidencia-row")).toHaveLength(9);

    await user.click(screen.getByTestId("export-csv"));

    await waitFor(() => {
      expect(filenames).toEqual(["incidencias-nacional-2026-11-10.csv"]);
    });
  });
});

describe("CoordinadorAreaView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders only the coordinator area, validates an incident and exports its CSV", async () => {
    const user = userEvent.setup();
    const { filenames } = captureCsvDownloads();
    await renderForRole("coordinador", <CoordinadorAreaView />);

    await screen.findByText("Mi área de operaciones");
    expect(await screen.findAllByText("Catacaos")).not.toHaveLength(0);
    expect(screen.queryByText("Ica")).not.toBeInTheDocument();
    expect(screen.queryByText("Chincha Alta")).not.toBeInTheDocument();

    await screen.findAllByTestId("incidencia-row");
    const rows = screen.getAllByTestId("incidencia-row");
    expect(rows).toHaveLength(7);

    const pendingRow = screen.getByText("INC-2026-00002").closest("tr");
    if (!pendingRow) throw new Error("Pending row not found");
    expect(within(pendingRow).getByText("Pendiente")).toBeInTheDocument();

    const validateButtons = await screen.findAllByTestId("validate-incidencia");
    await user.click(validateButtons[0] as HTMLElement);

    await waitFor(() => {
      const updatedRow = screen.getByText("INC-2026-00002").closest("tr");
      expect(updatedRow).not.toBeNull();
      expect(within(updatedRow as HTMLElement).getByText("Validado")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("export-csv"));

    await waitFor(() => {
      expect(filenames).toEqual(["incidencias-piura-norte-2026-11-10.csv"]);
    });
  });
});
