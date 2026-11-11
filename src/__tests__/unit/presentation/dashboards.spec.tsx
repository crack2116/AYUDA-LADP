import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinadorAreaView } from "@/presentation/views/CoordinadorAreaView";
import { JefaturaDashboardView } from "@/presentation/views/JefaturaDashboardView";

import { captureCsvDownloads, demoUser, FIXED_NOW, renderForRole } from "./helpers";

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
    expect(screen.getAllByText(demoUser("jefatura").nombre).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Piura / Norte").length).toBeGreaterThan(0);
    expect(screen.getByText("Flujo de Validación y Escalación LADP")).toBeInTheDocument();
    expect(screen.queryByText("Jorge Quispe C.")).not.toBeInTheDocument();
    expect(screen.queryByText("Cnel. Eduardo Salazar R.")).not.toBeInTheDocument();
    expect(screen.queryByText("Nivel 5: Catástrofe Nacional (Decreto Supremo)")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("tab-campo"));
    expect(await screen.findByText("INCIDENCIAS DE CAMPO – MONITOREO GEOESPACIAL Y MAPA DE CALOR")).toBeInTheDocument();
    expect(screen.queryByText("1,428")).not.toBeInTheDocument();

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

    // Supervision tab real controls & CSV export
    const { filenames: supFilenames } = captureCsvDownloads();
    await user.click(screen.getByTestId("tab-supervision"));
    expect(await screen.findAllByTestId("region-deployment-card")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Piura / Norte" }));
    expect(screen.getAllByTestId("region-deployment-card")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getAllByTestId("region-deployment-card")).toHaveLength(2);

    const personnelTable = screen.getByRole("table");

    const roleSelect = screen.getByLabelText("Filtrar por rol");
    await user.selectOptions(roleSelect, "coordinador");
    expect(within(personnelTable).getAllByText("Rosa Herrera Campos").length).toBeGreaterThan(0);
    expect(within(personnelTable).queryByText("Luis Paredes")).not.toBeInTheDocument();
    await user.selectOptions(roleSelect, "all");

    const regionFilterSelect = screen.getByLabelText("Filtrar personal por región");
    await user.selectOptions(regionFilterSelect, "Sur / Centro");
    expect(within(personnelTable).getAllByText("Miguel Ángel Flores").length).toBeGreaterThan(0);
    expect(within(personnelTable).queryByText("Rosa Herrera Campos")).not.toBeInTheDocument();
    await user.selectOptions(regionFilterSelect, "all");

    const personnelSearch = screen.getByPlaceholderText("Buscar personal, ID o región...");
    await user.type(personnelSearch, "Rosa");
    expect(within(personnelTable).getAllByText("Rosa Herrera Campos").length).toBeGreaterThan(0);
    expect(within(personnelTable).queryByText("Miguel Ángel Flores")).not.toBeInTheDocument();

    const detailButtons = screen.getAllByRole("button", { name: /ver centros/i });
    await user.click(detailButtons[0] as HTMLElement);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Cerrar detalle"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.clear(personnelSearch);
    await user.click(screen.getByTestId("export-nomina-btn"));
    await waitFor(() => {
      expect(supFilenames).toEqual(["nomina-supervision-2026-11-10.csv"]);
    });
  });

  it("propagates new incidents registered in Registro Táctico and field validations to KPIs and tabs", async () => {
    const user = userEvent.setup();
    await renderForRole("jefatura", <JefaturaDashboardView />);

    await screen.findByText("Panel de situación nacional");
    expect(await screen.findByTestId("kpi-centros")).toHaveTextContent("9");
    expect(screen.getByTestId("kpi-verificadas")).toHaveTextContent("4");

    // Register a real incident from Registro Táctico
    await user.click(screen.getByTestId("tab-registro"));
    await screen.findByText("REGISTRO TÁCTICO DE INCIDENCIA DE CAMPO");

    const centroSelect = screen.getByTestId("centro-select");
    await waitFor(() => {
      expect(within(centroSelect).getAllByRole("option").length).toBeGreaterThan(1);
    });
    await user.selectOptions(centroSelect, "c-catacaos");
    expect(await screen.findByTestId("duplicate-alert")).toBeInTheDocument();

    // Switch to a locality without prior reports so distinct centros KPI updates 9 -> 10
    await user.selectOptions(centroSelect, "c-la-arena");
    await waitFor(() => {
      expect(screen.queryByTestId("duplicate-alert")).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId("phenomenon-huaico"));
    await user.click(screen.getByTestId("necesidad-alimentos"));
    await user.click(screen.getByTestId("counter-hogares-inc"));
    await user.type(screen.getByTestId("nota-referencia-input"), "Reporte desde tablero táctico");

    await user.click(screen.getByTestId("submit-incident-btn"));
    const auditCode = await screen.findByTestId("codigo-auditoria");
    expect(auditCode).toHaveTextContent(/INC-\d{4}-\d{5}/);

    // Returning to Dashboard Nacional shows updated KPIs and rows (9 -> 10)
    await user.click(screen.getByTestId("tab-incidencias"));
    await waitFor(() => {
      expect(screen.getAllByTestId("incidencia-row")).toHaveLength(10);
    });
    expect(screen.getByTestId("kpi-centros")).toHaveTextContent("10");
    expect(screen.getByTestId("kpi-hogares")).toHaveTextContent("170");

    // Validating a pending incident from Incidencias de Campo updates kpi-verificadas (4 -> 5)
    await user.click(screen.getByTestId("tab-campo"));
    expect(await screen.findAllByTestId("campo-incident-row")).toHaveLength(10);
    const validateBtn = screen.getByTestId("campo-validate-btn");
    await user.click(validateBtn);

    await user.click(screen.getByTestId("tab-incidencias"));
    await waitFor(() => {
      expect(screen.getByTestId("kpi-verificadas")).toHaveTextContent("5");
    });
  }, 15_000);

  it("builds the regional breakdown from the loaded incidents instead of fixed demo series", async () => {
    const user = userEvent.setup();
    await renderForRole("jefatura", <JefaturaDashboardView />);

    await screen.findByText("Panel de situación nacional");
    await screen.findByTestId("kpi-hogares");

    // Region groups come from the incidents themselves
    expect((await screen.findAllByText("Piura / Norte")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sur / Centro").length).toBeGreaterThan(0);

    // Invented series from the old mock never render
    expect(screen.queryAllByText("Tumbes (Frontera Norte)")).toHaveLength(0);
    expect(screen.queryAllByText("Cuenca Río Piura")).toHaveLength(0);
    expect(screen.queryAllByText(/93 incidencias/)).toHaveLength(0);

    await user.click(screen.getByText("Por Cuenca"));
    expect((await screen.findAllByText("Bajo Piura")).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Cuenca Río Piura")).toHaveLength(0);

    await user.click(screen.getByText("Ámbito Nacional"));
  });

  it("filters by incident day with the calendar and by any Peruvian region", async () => {
    const user = userEvent.setup();
    await renderForRole("jefatura", <JefaturaDashboardView />);

    await screen.findByText("Panel de situación nacional");
    expect(await screen.findAllByTestId("incidencia-row")).toHaveLength(9);

    // Calendar: pick a day that carries incidents
    await user.click(await screen.findByTestId("filtro-fecha"));
    const calendar = await screen.findByRole("dialog", { name: "Calendario de incidencias" });
    const dottedDay = within(calendar)
      .getAllByRole("button")
      .find((button) => button.querySelector("span.rounded-full") !== null);
    if (!dottedDay) throw new Error("No day with incidents found in the calendar");

    await user.click(dottedDay);
    const rowsForDay = screen.getAllByTestId("incidencia-row").length;
    expect(rowsForDay).toBeGreaterThan(0);
    expect(rowsForDay).toBeLessThan(9);
    expect(screen.getByTestId("filtro-fecha")).toHaveTextContent(/nov 2026/i);

    // Clearing the day restores every row
    await user.click(screen.getByTestId("filtro-fecha"));
    const reopenCalendar = await screen.findByRole("dialog", { name: "Calendario de incidencias" });
    await user.click(within(reopenCalendar).getByRole("button", { name: "Todas las fechas" }));
    expect(screen.getAllByTestId("incidencia-row")).toHaveLength(9);

    // Regional scope: every region of Peru is offered
    await user.click(screen.getByTestId("filtro-region"));
    const listbox = await screen.findByRole("listbox", { name: "Regiones del Perú" });
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(26);
    for (const region of ["Piura", "Lima", "Cusco", "Ucayali", "Callao"] as const) {
      expect(within(listbox).getByRole("option", { name: region })).toBeInTheDocument();
    }

    await user.click(within(listbox).getByRole("option", { name: "Piura" }));
    expect(screen.getAllByTestId("incidencia-row")).toHaveLength(7);
    expect(screen.getByTestId("filtro-region")).toHaveTextContent("Piura");

    // A region without incidents shows the empty state
    await user.click(screen.getByTestId("filtro-region"));
    const reopenListbox = await screen.findByRole("listbox", { name: "Regiones del Perú" });
    await user.click(within(reopenListbox).getByRole("option", { name: "Lima" }));
    expect(screen.queryAllByTestId("incidencia-row")).toHaveLength(0);
    expect(
      screen.getByText(
        "No se encontraron incidencias que coincidan con los criterios de búsqueda táctica.",
      ),
    ).toBeInTheDocument();

    // Reset restores the national scope
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(screen.getAllByTestId("incidencia-row")).toHaveLength(9);
    expect(screen.getByTestId("filtro-region")).toHaveTextContent("Nivel Nacional");
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
