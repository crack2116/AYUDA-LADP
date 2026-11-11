import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IncidenciasCampoTab } from "@/presentation/components/jefatura/IncidenciasCampoTab";
import { RegistroTacticoTab } from "@/presentation/components/jefatura/RegistroTacticoTab";

import {
  captureCsvDownloads,
  demoUser,
  FIXED_NOW,
  stubClipboard,
  stubGeolocation,
} from "./helpers";

vi.mock("@/infrastructure/container", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/container")>();
  const testContainer = actual.createTestContainer({ now: new Date("2026-11-10T15:00:00.000Z") });
  return { ...actual, getContainer: () => testContainer };
});

describe("IncidenciasCampoTab", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("hydrates real incidents, filters map & matrix, validates existence and exports GeoJSON", async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { filenames } = captureCsvDownloads();
    const jefatura = demoUser("jefatura");

    render(<IncidenciasCampoTab currentUser={jefatura} />);

    expect(
      screen.getByText("INCIDENCIAS DE CAMPO – MONITOREO GEOESPACIAL Y MAPA DE CALOR"),
    ).toBeInTheDocument();

    // Real seeded incidents replace hardcoded fake metrics
    const rows = await screen.findAllByTestId("campo-incident-row");
    expect(rows).toHaveLength(9);
    expect(screen.getByTestId("campo-kpi-georef")).toHaveTextContent("4");
    expect(screen.getByTestId("campo-kpi-pending")).toHaveTextContent("5");
    expect(screen.queryByText("1,428")).not.toBeInTheDocument();
    expect(screen.queryByText("INC-2025-00142")).not.toBeInTheDocument();

    // Map zoom & layer controls
    await user.click(screen.getByTitle("Acercar Zoom"));
    expect(screen.getByText(/Zoom 1\.15x/i)).toBeInTheDocument();
    await user.click(screen.getByTitle("Alejar Zoom"));
    await user.click(screen.getByTitle("Centrar Vista"));
    expect(screen.getByText(/Zoom 1\.00x/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /puntos/i }));
    await user.click(screen.getByRole("button", { name: /^pendientes$/i }));
    await user.click(screen.getByRole("button", { name: /mapa de calor/i }));

    // Search and filters
    const searchInput = screen.getByPlaceholderText("Buscar código, centro o sector...");
    await user.type(searchInput, "Catacaos");
    expect(screen.getAllByTestId("campo-incident-row").length).toBeGreaterThan(0);
    await user.clear(searchInput);

    const statusSelect = screen.getByLabelText("Filtrar por estado");
    await user.selectOptions(statusSelect, "pending");
    expect(screen.getAllByTestId("campo-incident-row")).toHaveLength(5);
    await user.selectOptions(statusSelect, "gps");
    expect(screen.getAllByTestId("campo-incident-row")).toHaveLength(4);
    await user.selectOptions(statusSelect, "all");

    const tipoSelect = screen.getByLabelText("Filtrar por tipo de afectación");
    await user.selectOptions(tipoSelect, "inundacion");
    await user.selectOptions(tipoSelect, "all");

    // Select an unverified row and verify existence in field
    const pendingRow = screen
      .getAllByTestId("campo-incident-row")
      .find((r) => r.textContent?.includes("Pendiente"));
    if (!pendingRow) throw new Error("Expected at least one pending incident row");
    await user.click(within(pendingRow).getByRole("button", { name: /localizar/i }));

    const validateBtn = screen.getByTestId("campo-validate-btn");
    await user.click(validateBtn);

    await waitFor(() => {
      expect(screen.getByTestId("campo-kpi-pending")).toHaveTextContent("4");
    });

    // Copy summary and export real GeoJSON
    await user.click(screen.getByRole("button", { name: /copiar ficha/i }));
    expect(writeText).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("export-geojson-btn"));
    expect(filenames).toEqual(["incidencias-campo-2026-11-10.geojson"]);
  });

  it("handles empty GeoJSON exports, map pin selection, and navigation to Registro Táctico", async () => {
    const user = userEvent.setup({ delay: null });
    const onRegisterAtCentro = vi.fn();
    const { filenames } = captureCsvDownloads();

    render(
      <IncidenciasCampoTab
        currentUser={demoUser("jefatura")}
        onRegisterAtCentro={onRegisterAtCentro}
      />,
    );

    expect(await screen.findAllByTestId("campo-incident-row")).toHaveLength(9);

    const mapPins = screen.getAllByRole("button", { name: /^Foco / });
    expect(mapPins.length).toBeGreaterThan(0);
    await user.click(mapPins[mapPins.length - 1] as HTMLElement);

    await user.click(screen.getByRole("button", { name: /nuevo registro en campo/i }));
    expect(onRegisterAtCentro).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /solo pendientes/i }));
    await user.click(screen.getByRole("button", { name: /solo pendientes/i }));

    await user.type(screen.getByPlaceholderText("Buscar código, centro o sector..."), "ZZZ-NONE");
    await waitFor(() => {
      expect(screen.queryAllByTestId("campo-incident-row")).toHaveLength(0);
    });
    await user.click(screen.getByTestId("export-geojson-btn"));
    expect(filenames).toHaveLength(0);
    expect(
      await screen.findByText(
        "No hay incidencias con coordenadas GPS en la vista para exportar GeoJSON.",
      ),
    ).toBeInTheDocument();
  });
});

describe("RegistroTacticoTab", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("handles real GPS acquisition, local drafts in cache, validation errors and incident creation", async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    stubGeolocation((success) => {
      success({
        coords: { latitude: -5.2654, longitude: -80.6782, accuracy: 8 },
      } as GeolocationPosition);
    });

    const onCreated = vi.fn();
    const jefatura = demoUser("jefatura");
    render(<RegistroTacticoTab currentUser={jefatura} onIncidentCreated={onCreated} />);

    expect(screen.getByText("REGISTRO TÁCTICO DE INCIDENCIA DE CAMPO")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de asignación")).toBeInTheDocument();
    expect(screen.getByTestId("gps-value")).toHaveTextContent("Sin coordenadas registradas");
    expect(screen.getByTestId("test-load-draft")).toHaveTextContent("Borradores locales (0)");

    // Validation blocks incomplete submit before choosing a centro poblado
    await user.click(screen.getByTestId("submit-incident-btn"));
    expect(await screen.findByTestId("form-errors")).toHaveTextContent(
      "Selecciona un centro poblado.",
    );

    // Wait for real CentroPoblado catalog to load
    const centroSelect = screen.getByTestId("centro-select");
    await waitFor(() => {
      expect(within(centroSelect).getAllByRole("option").length).toBeGreaterThan(1);
    });

    await user.selectOptions(screen.getByTestId("region-select"), "Piura / Norte");
    await user.selectOptions(screen.getByTestId("sector-select"), "Bajo Piura");
    await user.selectOptions(centroSelect, "c-catacaos");

    // 24h duplicate warning fires against seeded records
    expect(await screen.findByTestId("duplicate-alert")).toBeInTheDocument();

    // Real GPS read populates coordinates and accuracy
    await user.click(screen.getByTestId("gps-btn"));
    expect(screen.getByTestId("gps-value")).toHaveTextContent("-5.26540, -80.67820 (±8m)");

    // Modify affectation, EDAN counters, transitability, vital services and note
    await user.click(screen.getByTestId("phenomenon-huaico"));
    await user.click(screen.getByTestId("necesidad-agua_potable"));
    const hogaresInput = screen.getByTestId("counter-hogares-input");
    fireEvent.change(hogaresInput, { target: { value: "24" } });
    await user.click(screen.getByTestId("transit-bloqueada"));
    await user.click(screen.getByTestId("service-sinAgua"));
    await user.click(screen.getByRole("button", { name: /insertar resumen en nota/i }));
    expect(screen.getByTestId("nota-referencia-input")).toHaveValue(
      "Acceso: Ruta Bloqueada. Servicios afectados: Sin Agua Potable.",
    );

    // Persist local draft via LocalCache, reset form, then reload draft back
    await user.click(screen.getByTestId("save-draft-btn"));
    expect(screen.getByTestId("test-load-draft")).toHaveTextContent("Borradores locales (1)");

    await user.click(screen.getByTestId("reset-form-btn"));
    expect(screen.getByTestId("centro-select")).toHaveValue("");
    expect(screen.getByTestId("gps-value")).toHaveTextContent("Sin coordenadas registradas");

    await user.click(screen.getByTestId("test-load-draft"));
    expect(await screen.findByTestId("drafts-panel")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cargar" }));
    expect(screen.getByTestId("centro-select")).toHaveValue("c-catacaos");
    expect(screen.getByTestId("counter-hogares-input")).toHaveValue(24);

    // Register real incident and verify backend-assigned INC code + copy + draft cleanup
    await user.click(screen.getByTestId("submit-incident-btn"));
    const auditCode = await screen.findByTestId("codigo-auditoria");
    expect(auditCode).toHaveTextContent(/INC-\d{4}-\d{5}/);
    expect(screen.getByTestId("test-load-draft")).toHaveTextContent("Borradores locales (0)");
    expect(onCreated).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("copy-codigo"));
    expect(writeText).toHaveBeenCalledWith(auditCode.textContent);
  }, 15_000);

  it("handles GPS denial, manual WGS84 coords, map layers, and deleting local drafts", async () => {
    const user = userEvent.setup({ delay: null });
    stubGeolocation((_success, error) => {
      error?.({
        code: 1,
        message: "Permiso denegado",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    });

    render(<RegistroTacticoTab currentUser={demoUser("jefatura")} />);

    const centroSelect = screen.getByTestId("centro-select");
    await waitFor(() => {
      expect(within(centroSelect).getAllByRole("option").length).toBeGreaterThan(1);
    });

    await user.click(screen.getByTestId("gps-btn"));
    expect(
      await screen.findByText("No diste permiso para usar la ubicación. Actívala en tu navegador."),
    ).toBeInTheDocument();

    await user.type(screen.getByTestId("lat-input"), "-5.1945");
    await user.type(screen.getByTestId("lng-input"), "-80.6328");
    expect(screen.getByTestId("gps-value")).toHaveTextContent("-5.19450, -80.63280");

    await user.click(screen.getByRole("button", { name: "Topografía" }));
    await user.click(screen.getByRole("button", { name: "Cuencas" }));
    await user.click(screen.getByRole("button", { name: "Satélite" }));
    await user.click(screen.getByTestId("counter-hogares-inc"));
    await user.click(screen.getByTestId("counter-hogares-dec"));
    expect(screen.getByTestId("counter-hogares-input")).toHaveValue(4);

    await user.clear(screen.getByTestId("lat-input"));
    await user.clear(screen.getByTestId("lng-input"));
    expect(screen.getByTestId("gps-value")).toHaveTextContent("Sin coordenadas registradas");

    await user.click(screen.getByTestId("save-draft-btn"));
    expect(screen.getByTestId("test-load-draft")).toHaveTextContent("Borradores locales (1)");
    await user.click(screen.getByTestId("test-load-draft"));
    await user.click(await screen.findByLabelText("Eliminar borrador"));
    expect(screen.getByTestId("test-load-draft")).toHaveTextContent("Borradores locales (0)");
  }, 15_000);
});
