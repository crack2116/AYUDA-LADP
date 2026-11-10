import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getContainer } from "@/infrastructure/container";
import { BreakModuleTesterBar } from "@/presentation/components/qa/BreakModuleTesterBar";
import { SupportChatWidget } from "@/presentation/components/support/SupportChatWidget";
import { AsistenteNuevaIncidenciaView } from "@/presentation/views/AsistenteNuevaIncidenciaView";

import { FIXED_NOW, renderForRole } from "./helpers";

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

describe("SupportChatWidget", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("opens, sends a ticket through a chip and shows the confirmation", async () => {
    const user = userEvent.setup();
    render(<SupportChatWidget />);

    await user.click(screen.getByTestId("chat-open"));
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();

    await user.click(screen.getByTestId("chat-chip-datos_no_cargan"));
    await user.click(screen.getByTestId("chat-submit"));

    const confirmation = await screen.findByTestId("chat-confirmation");
    expect(confirmation).toHaveTextContent("Reporte enviado");
    expect(confirmation).toHaveTextContent(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );

    const tickets = await getContainer().supportTicketRepository.listAll();
    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.opcionProblema).toBe("datos_no_cargan");
    expect(tickets[0]?.rutaOrigen).toBe("/incidencias/nuevo");
  });

  it("validates that a problem chip is selected before submitting", async () => {
    const user = userEvent.setup();
    render(<SupportChatWidget />);

    await user.click(screen.getByTestId("chat-open"));
    await user.click(screen.getByTestId("chat-submit"));

    expect(
      await screen.findByText("Selecciona el problema que estás reportando."),
    ).toBeInTheDocument();
    expect(await getContainer().supportTicketRepository.listAll()).toHaveLength(0);
  });

  it("closes with the close button", async () => {
    const user = userEvent.setup();
    render(<SupportChatWidget />);

    await user.click(screen.getByTestId("chat-open"));
    await user.click(screen.getByTestId("chat-close"));

    expect(screen.queryByTestId("chat-panel")).not.toBeInTheDocument();
  });
});

describe("BreakModuleTesterBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("injects the three broken payloads into the form without persisting", async () => {
    const user = userEvent.setup();
    await renderForRole(
      "asistente",
      <>
        <AsistenteNuevaIncidenciaView />
        <BreakModuleTesterBar />
      </>,
    );
    await screen.findByText("Registrar nueva incidencia");
    await waitFor(() => {
      expect(screen.getByTestId("centro-combobox")).not.toBeDisabled();
    });

    await user.click(screen.getByTestId("qa-bar-toggle"));
    expect(screen.getByTestId("qa-inject-negative")).toBeInTheDocument();
    expect(screen.getByTestId("qa-inject-future")).toBeInTheDocument();
    expect(screen.getByTestId("qa-inject-empty")).toBeInTheDocument();

    await user.click(screen.getByTestId("qa-inject-negative"));
    await waitFor(() => {
      expect(screen.getByTestId("form-errors")).toHaveTextContent(
        "El número de hogares debe ser un número entero.",
      );
    });
    expect(screen.queryByTestId("codigo-auditoria")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("qa-inject-future"));
    await waitFor(() => {
      expect(screen.getByTestId("form-errors")).toHaveTextContent(
        "La fecha del suceso no puede ser futura.",
      );
    });
    expect(screen.queryByTestId("codigo-auditoria")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("qa-inject-empty"));
    const errors = await screen.findByTestId("form-errors");
    await waitFor(() => {
      expect(errors).toHaveTextContent("Selecciona un centro poblado.");
    });

    expect(screen.queryByTestId("codigo-auditoria")).not.toBeInTheDocument();
    expect(await getContainer().incidenciaRepository.listAll()).toHaveLength(
      SEEDED_REPORTS,
    );
  });
});
