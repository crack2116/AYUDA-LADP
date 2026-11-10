import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getContainer } from "@/infrastructure/container";
import { AsistenteNuevaIncidenciaView } from "@/presentation/views/AsistenteNuevaIncidenciaView";

import {
  FIXED_NOW,
  renderForRole,
  stubClipboard,
  stubGeolocation,
} from "./helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/incidencias/nuevo",
}));

vi.mock("@/infrastructure/container", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/container")>();
  const testContainer = actual.createTestContainer({ now: new Date("2026-11-10T15:00:00.000Z") });
  return { ...actual, getContainer: () => testContainer };
});

const SEEDED_REPORTS = 9;

async function renderForm() {
  const user = userEvent.setup();
  await renderForRole("asistente", <AsistenteNuevaIncidenciaView />);
  await screen.findByText("Registrar nueva incidencia");
  await waitFor(() => {
    expect(screen.getByTestId("centro-combobox")).not.toBeDisabled();
  });
  return user;
}

async function chooseCentro(
  user: ReturnType<typeof userEvent.setup>,
  nombre: string,
) {
  const combobox = screen.getByTestId("centro-combobox");
  await user.click(combobox);
  await user.clear(combobox);
  await user.type(combobox, nombre);
  const option = await screen.findByRole("option", { name: new RegExp(nombre, "i") });
  await user.click(option);
  expect(combobox).toHaveValue(nombre);
}

async function fillValidBase(
  user: ReturnType<typeof userEvent.setup>,
  centro = "La Arena",
) {
  await chooseCentro(user, centro);
  await user.selectOptions(screen.getByTestId("tipo-afectacion"), "inundacion");
  await user.selectOptions(screen.getByTestId("necesidad-principal"), "agua_potable");
  fireEvent.change(screen.getByTestId("hogares-afectados"), {
    target: { value: "12" },
  });
}

async function seededReportCount(): Promise<number> {
  return (await getContainer().incidenciaRepository.listAll()).length;
}

describe("AsistenteNuevaIncidenciaView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("rejects an empty submit and does not persist an incident", async () => {
    const user = await renderForm();

    await user.click(screen.getByTestId("submit-incidencia"));

    const errors = await screen.findByTestId("form-errors");
    expect(errors).toHaveTextContent("Centro poblado");
    expect(errors).toHaveTextContent("Tipo de afectación");
    expect(errors).toHaveTextContent("Hogares afectados");
    expect(errors).toHaveTextContent("Necesidad principal");
    expect(screen.queryByTestId("codigo-auditoria")).not.toBeInTheDocument();
    expect(await seededReportCount()).toBe(SEEDED_REPORTS);
  });

  it("rejects negative and decimal households", async () => {
    const user = await renderForm();
    await fillValidBase(user);

    fireEvent.change(screen.getByTestId("hogares-afectados"), {
      target: { value: "-5" },
    });
    await user.click(screen.getByTestId("submit-incidencia"));
    await waitFor(() => {
      expect(screen.getByTestId("form-errors")).toHaveTextContent(
        "El número de hogares no puede ser negativo.",
      );
    });

    fireEvent.change(screen.getByTestId("hogares-afectados"), {
      target: { value: "1.5" },
    });
    await user.click(screen.getByTestId("submit-incidencia"));
    await waitFor(() => {
      expect(screen.getByTestId("form-errors")).toHaveTextContent(
        "El número de hogares debe ser un número entero.",
      );
    });

    expect(screen.queryByTestId("codigo-auditoria")).not.toBeInTheDocument();
    expect(await seededReportCount()).toBe(SEEDED_REPORTS);
  });

  it("rejects a future date", async () => {
    const user = await renderForm();
    await fillValidBase(user);

    await user.click(screen.getByTestId("ocurrio-hoy-no"));
    fireEvent.change(screen.getByTestId("fecha-suceso"), {
      target: { value: "2027-12-31" },
    });
    await user.click(screen.getByTestId("submit-incidencia"));

    await waitFor(() => {
      expect(screen.getByTestId("form-errors")).toHaveTextContent(
        "La fecha del suceso no puede ser futura.",
      );
    });
    expect(screen.queryByTestId("codigo-auditoria")).not.toBeInTheDocument();
    expect(await seededReportCount()).toBe(SEEDED_REPORTS);
  });

  it("shows the duplicate alert with existing codes for a centro with reports", async () => {
    const user = await renderForm();

    await chooseCentro(user, "Catacaos");

    const alert = await screen.findByTestId("duplicate-alert");
    expect(alert).toHaveTextContent(
      "Ya existen reportes en este centro poblado",
    );
    expect(alert).toHaveTextContent("INC-2026-00001");
    expect(alert).toHaveTextContent("7 días");
  });

  it("registers a valid incident, shows the audit code and copies it", async () => {
    const user = await renderForm();
    await fillValidBase(user, "La Arena");
    await user.type(
      screen.getByTestId("nota-referencia"),
      "Familias refugiadas en el colegio del sector.",
    );

    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await user.click(screen.getByTestId("submit-incidencia"));

    const code = await screen.findByTestId("codigo-auditoria");
    expect(code.textContent).toMatch(/^INC-\d{4}-\d{5}$/);
    expect(code).toHaveTextContent(/^INC-2026-00010$/);

    const assistantReports = screen.getByTestId("assistant-reports");
    expect(within(assistantReports).getByText(code.textContent ?? "")).toBeInTheDocument();
    expect(await seededReportCount()).toBe(SEEDED_REPORTS + 1);

    await user.click(screen.getByTestId("copy-codigo"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("INC-2026-00010");
      expect(screen.getByTestId("copy-codigo")).toHaveTextContent("Copiado");
    });
  });

  it("fills the GPS value on a successful reading", async () => {
    stubGeolocation((success) => {
      success({
        coords: {
          latitude: -5.19449,
          longitude: -80.62812,
          accuracy: 12.4,
        },
      } as GeolocationPosition);
    });
    const user = await renderForm();

    await user.click(screen.getByTestId("gps-button"));

    await waitFor(() => {
      expect(screen.getByTestId("gps-value")).toHaveTextContent(
        "-5.19449, -80.62812 (±12m)",
      );
    });
    expect(screen.getByText("Precisión ±12 m")).toBeInTheDocument();
  });

  it("shows the typed GPS error when permission is denied", async () => {
    stubGeolocation((_success, error) => {
      error?.({
        code: 1,
        message: "User denied Geolocation",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    });
    const user = await renderForm();

    await user.click(screen.getByTestId("gps-button"));

    expect(
      await screen.findByText(
        "No diste permiso para usar la ubicación. Actívala en tu navegador.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("gps-value")).toHaveTextContent(
      "Sin coordenadas registradas",
    );
  });
});
