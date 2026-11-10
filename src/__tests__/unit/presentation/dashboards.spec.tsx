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

    await user.click(screen.getByTestId("tab-supervision"));
    expect(await screen.findByText("SUPERVISIÓN DE MANDOS Y DESPLIEGUE TERRITORIAL")).toBeInTheDocument();
    expect(screen.getByText("Jorge Quispe C.")).toBeInTheDocument();
    expect(screen.getByText("Cuadrante Norte 1 - Piura & Tumbes")).toBeInTheDocument();
    expect(screen.getByText("Nivel 5: Catástrofe Nacional (Decreto Supremo)")).toBeInTheDocument();

    await user.click(screen.getByTestId("tab-campo"));
    expect(await screen.findByText("INCIDENCIAS DE CAMPO – MONITOREO GEOESPACIAL Y MAPA DE CALOR")).toBeInTheDocument();

    await user.click(screen.getByTestId("tab-registro"));
    expect(await screen.findByText("REGISTRO TÁCTICO DE INCIDENCIA DE CAMPO")).toBeInTheDocument();

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

  it("supports tactical filtering, technical sheet inspection, and supervision controls", async () => {
    const user = userEvent.setup();
    await renderForRole("jefatura", <JefaturaDashboardView />);

    await screen.findByText("Panel de situación nacional");

    // Filter by Code
    const codeInput = screen.getByPlaceholderText("Buscar por Código INC...");
    await user.type(codeInput, "INC-2026-00001");
    expect(screen.getAllByTestId("incidencia-row")).toHaveLength(1);

    // Filter by Sector & Tipo
    const sectorInput = screen.getByPlaceholderText("Centro Poblado / Sector...");
    await user.type(sectorInput, "Catacaos");
    expect(screen.getAllByTestId("incidencia-row").length).toBeGreaterThan(0);
    await user.clear(sectorInput);

    const selects = screen.getAllByRole("combobox");
    const tipoSelect = selects.find((s) => s.textContent?.includes("Afectación: Todo tipo"));
    if (tipoSelect) {
      await user.selectOptions(tipoSelect, "inundacion_pluvial");
      await user.selectOptions(tipoSelect, "all");
    }

    const regionSelect = selects.find((s) => s.textContent?.includes("Región: Todas (Nacional)"));
    if (regionSelect) {
      await user.selectOptions(regionSelect, "Piura");
      await user.selectOptions(regionSelect, "all");
    }

    // Toggle select all checkbox in incident table
    const selectAllCheckbox = screen.getByLabelText("Seleccionar todas las incidencias");
    await user.click(selectAllCheckbox);
    await user.click(selectAllCheckbox);

    // Reset filters
    await user.click(screen.getByText("Restablecer"));
    expect(screen.getAllByTestId("incidencia-row")).toHaveLength(9);

    // Filter by status verified
    const statusSelect = selects.find((s) => (s as HTMLSelectElement).value === "all" && s.textContent?.includes("Todos los estados"));
    if (statusSelect) {
      await user.selectOptions(statusSelect, "verified");
      expect(screen.getAllByTestId("incidencia-row")).toHaveLength(4);
      await user.selectOptions(statusSelect, "pending");
      expect(screen.getAllByTestId("incidencia-row")).toHaveLength(5);
      await user.selectOptions(statusSelect, "all");
    }

    // Inspect technical sheet modal
    const viewButtons = screen.getAllByTitle("Ver Ficha Técnica");
    await user.click(viewButtons[0] as HTMLElement);
    expect(await screen.findByText("Ficha Técnica de Incidencia")).toBeInTheDocument();
    await user.click(screen.getByText("Cerrar Ficha"));
    await waitFor(() => {
      expect(screen.queryByText("Ficha Técnica de Incidencia")).not.toBeInTheDocument();
    });

    // Chart view toggle
    await user.click(screen.getByText("Por Cuenca"));
    await user.click(screen.getByText("Ámbito Nacional"));

    // Supervision tab controls
    await user.click(screen.getByTestId("tab-supervision"));
    await user.click(screen.getByRole("button", { name: /centro/i }));
    await user.click(screen.getByRole("button", { name: /sur/i }));
    await user.click(screen.getByRole("button", { name: /oriente/i }));
    await user.click(screen.getByRole("button", { name: /norte/i }));

    const supSelects = screen.getAllByRole("combobox");
    const rankSelect = supSelects.find((s) => s.textContent?.includes("Todos los Rangos"));
    if (rankSelect) {
      await user.selectOptions(rankSelect, "coronel");
      expect(screen.getByText("Cnel. Eduardo Salazar R.")).toBeInTheDocument();
      await user.selectOptions(rankSelect, "mayor");
      expect(screen.getByText("Mayor Jorge Quispe C.")).toBeInTheDocument();
      await user.selectOptions(rankSelect, "civil");
      expect(screen.getByText("Rosa Herrera Campos")).toBeInTheDocument();
      await user.selectOptions(rankSelect, "all");
    }

    const supRegionSelect = supSelects.find((s) => s.textContent?.includes("Todas las Regiones"));
    if (supRegionSelect) {
      await user.selectOptions(supRegionSelect, "piura");
      await user.selectOptions(supRegionSelect, "all");
    }

    const officerSearch = screen.getByPlaceholderText("Buscar oficial o base...");
    await user.type(officerSearch, "Salazar");
    expect(screen.getByText("Cnel. Eduardo Salazar R.")).toBeInTheDocument();
    expect(screen.queryByText("Manuel Vásquez")).not.toBeInTheDocument();
    await user.clear(officerSearch);
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
