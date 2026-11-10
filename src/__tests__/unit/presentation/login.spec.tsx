import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginView } from "@/presentation/views/LoginView";

import { FIXED_NOW } from "./helpers";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/login",
}));

vi.mock("@/infrastructure/container", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/container")>();
  const testContainer = actual.createTestContainer({ now: new Date("2026-11-10T15:00:00.000Z") });
  return { ...actual, getContainer: () => testContainer };
});

describe("LoginView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
    navigation.replace.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the institutional copy and toggles the password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    expect(screen.getByRole("heading", { name: "AYUDA LADP" })).toBeInTheDocument();
    expect(
      screen.getByText("Sistema de Alertas y Respuesta Humanitaria"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acceso Institucional" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DINAPROS · Perú")).toBeInTheDocument();

    const password = screen.getByTestId("login-password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByTestId("login-password-toggle"));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByTestId("login-password-toggle"));
    expect(password).toHaveAttribute("type", "password");
  });

  it.each([
    ["login-demo-jefatura", "JEF-001", "nacional", "/jefatura"],
    ["login-demo-coordinador", "COO-PN-01", "piura_norte", "/coordinador"],
    ["login-demo-asistente", "ASI-PN-01", "campo", "/incidencias/nuevo"],
  ])(
    "fills %s and routes to %s",
    async (testId, identifier, jurisdiction, destination) => {
      const user = userEvent.setup();
      render(<LoginView />);

      await user.click(screen.getByTestId(testId));

      expect(screen.getByTestId("login-identifier")).toHaveValue(identifier);
      expect(screen.getByTestId("login-password")).toHaveValue("ladp2026");
      expect(screen.getByTestId("login-jurisdiction")).toHaveValue(jurisdiction);

      await user.click(screen.getByTestId("login-submit"));

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledWith(destination);
      });
    },
  );

  it("shows the error alert for a wrong password", async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    await user.click(screen.getByTestId("login-demo-asistente"));
    const password = screen.getByTestId("login-password");
    await user.clear(password);
    await user.type(password, "clave-incorrecta");
    await user.click(screen.getByTestId("login-submit"));

    const error = await screen.findByTestId("login-error");
    expect(error).toHaveTextContent("Identificador o clave operacional incorrectos.");
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("shows the jurisdiction mismatch error", async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    await user.click(screen.getByTestId("login-demo-asistente"));
    await user.selectOptions(screen.getByTestId("login-jurisdiction"), "nacional");
    await user.click(screen.getByTestId("login-submit"));

    const error = await screen.findByTestId("login-error");
    expect(error).toHaveTextContent("La jurisdicción seleccionada no corresponde a tu usuario.");
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
