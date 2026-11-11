import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IncidenciasCampoTab } from "@/presentation/components/jefatura/IncidenciasCampoTab";
import { RegistroTacticoTab } from "@/presentation/components/jefatura/RegistroTacticoTab";

describe("IncidenciasCampoTab", () => {
  it("renders cartographic console, telemetry KPIs, filters and hotspot selection", async () => {
    const user = userEvent.setup({ delay: null });
    render(<IncidenciasCampoTab />);

    // Check Header & KPIs
    expect(
      screen.getByText("INCIDENCIAS DE CAMPO – MONITOREO GEOESPACIAL Y MAPA DE CALOR"),
    ).toBeInTheDocument();
    expect(screen.getByText("Incidencias Georreferenciadas")).toBeInTheDocument();
    expect(screen.getByText("1,428")).toBeInTheDocument();
    expect(screen.getByText("Focos de Calor / Alto Riesgo")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();

    // Map controls
    const zoomInBtn = screen.getByTitle("Acercar Zoom");
    await user.click(zoomInBtn);
    const zoomOutBtn = screen.getByTitle("Alejar Zoom");
    await user.click(zoomOutBtn);

    const compassBtn = screen.getByTitle("Brújula Norte");
    await user.click(compassBtn);

    const rulerBtn = screen.getByTitle("Medir Distancia Geodésica");
    await user.click(rulerBtn);
    await user.click(rulerBtn);

    const fullBtn = screen.getByTitle("Pantalla Completa");
    await user.click(fullBtn);

    // Map Layers
    await user.click(screen.getByRole("button", { name: /puntos/i }));
    await user.click(screen.getByRole("button", { name: /ríos/i }));
    await user.click(screen.getByRole("button", { name: /brigadas gps/i }));
    await user.click(screen.getByRole("button", { name: /satélite radar/i }));
    await user.click(screen.getByRole("button", { name: /mapa de calor/i }));

    // Hotspot Selection in table
    const searchInput = screen.getByPlaceholderText("Filtrar por cuenca o distrito...");
    await user.type(searchInput, "El Molino");
    expect(screen.getAllByText("INC-2025-00142").length).toBeGreaterThan(0);
    await user.clear(searchInput);

    // Risk Filter
    const levelSelect = screen.getByRole("combobox");
    await user.selectOptions(levelSelect, "critical");
    expect(screen.getAllByText("CRÍTICO").length).toBeGreaterThan(0);
    await user.selectOptions(levelSelect, "severe");
    await user.selectOptions(levelSelect, "all");

    // Select hotspot row
    const localizeBtns = screen.getAllByRole("button", { name: /localizar|en foco/i });
    await user.click(localizeBtns[0] as HTMLElement);

    // Tactical Inspector Panel controls
    expect(screen.getByText("DESBORDE INMINENTE (NIVEL 4)")).toBeInTheDocument();
    expect(screen.getByText("Caudal Registrado")).toBeInTheDocument();
    const sismateBtn = screen.getByRole("button", { name: /emitir alerta temprana sms/i });
    await user.click(sismateBtn);

    const extraBtn = screen.getByRole("button", { name: /asignar recursos extra/i });
    await user.click(extraBtn);

    const droneBtn = screen.getByRole("button", { name: /telemetría dron/i });
    await user.click(droneBtn);

    // Hotspot pins on map
    const pins = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-label")?.includes("Foco"));
    if (pins[0]) {
      await user.click(pins[0]);
    }

    // Top action buttons
    const exportBtn = screen.getByRole("button", { name: /exportar geojson \/ kml/i });
    await user.click(exportBtn);

    const layersFilterBtn = screen.getByRole("button", { name: /filtro de capas tácticas/i });
    await user.click(layersFilterBtn);

    const dispatchBtn = screen.getByRole("button", { name: /despachar brigada a punto crítico/i });
    await user.click(dispatchBtn);
  });
});

describe("RegistroTacticoTab", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles header controls, stepper navigation and phenomenon selection", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RegistroTacticoTab />);

    // Header elements
    expect(screen.getByText("REGISTRO TÁCTICO DE INCIDENCIA DE CAMPO")).toBeInTheDocument();
    expect(screen.getByText(/PROTOCOLO EDAN PERÚ/i)).toBeInTheDocument();

    // Audit code placeholder for unsaved draft
    expect(screen.getByText("Código de auditoría")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de asignación")).toBeInTheDocument();

    // Load draft button
    const draftBtn = screen.getByTestId("test-load-draft");
    await user.click(draftBtn);
    expect(screen.getByText(/Borrador guardado en el cache local seguro/i)).toBeInTheDocument();

    // Steps Navigation
    await user.click(screen.getByTestId("test-step-1"));
    await user.click(screen.getByTestId("test-step-3"));
    await user.click(screen.getByTestId("test-step-4"));
    await user.click(screen.getByTestId("test-step-2"));

    // Channel select
    const channelSelect = screen.getByTestId("channel-select");
    await user.selectOptions(channelSelect, "radio");
    await user.selectOptions(channelSelect, "movil");
    await user.selectOptions(channelSelect, "fibra");
    await user.selectOptions(channelSelect, "bgan");

    // Resynchronize RTC
    const rtcBtn = screen.getByRole("button", { name: /resincronizar rtc/i });
    await user.click(rtcBtn);

    // Phenomenon choices
    const phenomena = ["fluvial", "huayco", "colapso", "lluvia", "quebrada", "oleaje"] as const;
    for (const p of phenomena) {
      await user.click(screen.getByTestId(`phenomenon-${p}`));
    }
  });

  it("handles location cascades, map layers, EDAN counters, dispatch toggles and action triggers", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RegistroTacticoTab />);

    // GPS Device button
    const gpsBtn = screen.getByTestId("gps-btn");
    await user.click(gpsBtn);

    // Location Cascades
    const regionSelect = screen.getByTestId("region-select");
    await user.selectOptions(regionSelect, "Tumbes");
    await user.selectOptions(regionSelect, "Lambayeque");
    await user.selectOptions(regionSelect, "La Libertad");
    await user.selectOptions(regionSelect, "Piura");

    const provSelect = screen.getByTestId("provincia-select");
    await user.selectOptions(provSelect, "Morropón");
    await user.selectOptions(provSelect, "Piura");

    const distSelect = screen.getByTestId("distrito-select");
    await user.selectOptions(distSelect, "Cura Mori");
    await user.selectOptions(distSelect, "Catacaos");

    const caserioSelect = screen.getByTestId("caserio-select");
    await user.selectOptions(caserioSelect, "Monte Sullón");

    // Coordinates inputs
    const latInput = screen.getByTestId("lat-input");
    fireEvent.change(latInput, { target: { value: "-5.2700" } });
    const lngInput = screen.getByTestId("lng-input");
    fireEvent.change(lngInput, { target: { value: "-80.6800" } });

    // Mini map layer toggles
    await user.click(screen.getByRole("button", { name: /satélite/i }));
    await user.click(screen.getByRole("button", { name: /topografía/i }));
    await user.click(screen.getByRole("button", { name: /inundación 2017/i }));

    // Counters: Familias, Damnificados, Menores, Adultos mayores
    const incFamBtn = screen.getByTestId("counter-familias-inc");
    await user.click(incFamBtn);
    const decFamBtn = screen.getByTestId("counter-familias-dec");
    await user.click(decFamBtn);
    const inputFam = screen.getByTestId("counter-familias-input");
    fireEvent.change(inputFam, { target: { value: "120" } });

    const decBtns = screen.getAllByRole("button", { name: "-" });
    const incBtns = screen.getAllByRole("button", { name: "+" });
    for (const b of incBtns) {
      await user.click(b);
    }
    for (const b of decBtns) {
      await user.click(b);
    }

    // Transitability
    const transitOptions = ["4x4", "aerea", "bloqueada", "aislado"] as const;
    for (const t of transitOptions) {
      await user.click(screen.getByTestId(`transit-${t}`));
    }

    // Services checklist
    await user.click(screen.getByTestId("service-agua"));
    await user.click(screen.getByRole("button", { name: /corte fluido eléctrico/i }));
    await user.click(screen.getByRole("button", { name: /sin cobertura móvil/i }));
    await user.click(screen.getByRole("button", { name: /colapso alcantarillado/i }));
    await user.click(screen.getByRole("button", { name: /centro salud inundado/i }));

    // Delete uploaded file
    const deleteFileBtns = screen.getAllByTitle("Eliminar archivo");
    if (deleteFileBtns[0]) {
      await user.click(deleteFileBtns[0]);
    }

    // Drone stream toggle
    const droneBtn = screen.getByTestId("drone-stream-btn");
    await user.click(droneBtn);
    await user.click(droneBtn);

    // Brigade dispatch checkbox & units
    const brigadeCheckbox = screen.getByTestId("brigade-dispatch-checkbox");
    await user.click(brigadeCheckbox);
    await user.click(brigadeCheckbox);

    const bomberosBtn = screen.getByRole("button", { name: /cía\. bomberos piura n° 25/i });
    await user.click(bomberosBtn);
    const ejercitoBtn = screen.getByRole("button", { name: /batallón de ingeniería ep n° 51/i });
    await user.click(ejercitoBtn);

    // Requested equipment checkboxes
    const equipmentCheckboxes = screen.getAllByRole("checkbox");
    for (const eq of equipmentCheckboxes) {
      await user.click(eq);
      await user.click(eq);
    }

    // Execution Buttons
    const registerBtn = screen.getByTestId("submit-incident-btn");
    await user.click(registerBtn);
    expect(screen.getByText(/Incidencia registrada en la red COEN\/INDECI/i)).toBeInTheDocument();

    const saveDraftBtn = screen.getByTestId("save-draft-btn");
    await user.click(saveDraftBtn);

    const sismateBtn = screen.getByTestId("sismate-alert-btn");
    await user.click(sismateBtn);
    expect(screen.getByText(/¡ALERTA SISMATE ENVIADA!/i)).toBeInTheDocument();

    // Close notification alert
    const closeNotificationBtn = screen.getByRole("button", { name: "✕" });
    await user.click(closeNotificationBtn);
  }, 15_000);
});
