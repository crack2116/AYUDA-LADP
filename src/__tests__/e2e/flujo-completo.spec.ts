import { expect, test } from "@playwright/test";

const KPI_TEST_IDS = [
  "kpi-hogares",
  "kpi-verificadas",
  "kpi-centros",
  "kpi-necesidad",
  "kpi-tipo",
  "kpi-ultimas-24h",
] as const;

test("flujo completo AYUDA LADP", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:3000",
  });

  // 1. Login screen + support ticket from the public route.
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "AYUDA LADP" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Acceso Institucional" }),
  ).toBeVisible();
  await expect(
    page.getByText("Sistema de Alertas y Respuesta Humanitaria"),
  ).toBeVisible();

  await page.getByTestId("chat-open").click();
  await expect(page.getByTestId("chat-panel")).toBeVisible();
  await page.getByTestId("chat-chip-datos_no_cargan").click();
  await page.getByTestId("chat-submit").click();
  await expect(page.getByTestId("chat-confirmation")).toContainText(
    "Reporte enviado",
  );
  await page.getByTestId("chat-close").click();
  await expect(page.getByTestId("chat-panel")).toBeHidden();

  // 2. Assistant demo credentials.
  await page.getByTestId("login-demo-asistente").click();
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/incidencias/nuevo");
  await expect(
    page.getByRole("heading", { name: "Registrar nueva incidencia" }),
  ).toBeVisible();
  await expect(page.getByTestId("centro-combobox")).toBeEnabled();

  // 3. QA break-module bar: three broken payloads, no confirmation.
  await page.getByTestId("qa-bar-toggle").click();
  await page.getByTestId("qa-inject-negative").click();
  await expect(page.getByTestId("form-errors")).toContainText(
    "El número de hogares debe ser un número entero.",
  );
  await expect(page.getByTestId("codigo-auditoria")).toHaveCount(0);

  await page.getByTestId("qa-inject-future").click();
  await expect(page.getByTestId("form-errors")).toContainText(
    "La fecha del suceso no puede ser futura.",
  );
  await expect(page.getByTestId("codigo-auditoria")).toHaveCount(0);

  await page.getByTestId("qa-inject-empty").click();
  await expect(page.getByTestId("form-errors")).toContainText(
    "Selecciona un centro poblado.",
  );
  await expect(page.getByTestId("codigo-auditoria")).toHaveCount(0);
  await page.getByTestId("qa-bar-toggle").click();

  // 4. Real report: Catacaos already has seed reports.
  await page.getByTestId("centro-combobox").click();
  await page.getByTestId("centro-combobox").fill("Catacaos");
  await page
    .getByTestId("centro-option")
    .filter({ hasText: "Catacaos" })
    .first()
    .click();
  await expect(page.getByTestId("duplicate-alert")).toBeVisible();
  await expect(page.getByTestId("duplicate-alert")).toContainText("INC-");

  await page.getByTestId("tipo-afectacion").selectOption("inundacion");
  await page.getByTestId("hogares-afectados").fill("12");
  await page.getByTestId("necesidad-principal").selectOption("agua_potable");
  await page.getByTestId("ocurrio-hoy-si").click();

  await page.getByTestId("gps-button").click();
  await expect(
    page
      .getByText(
        /No diste permiso para usar la ubicación|La ubicación no está disponible en este momento|Este navegador no soporta el GPS/,
      )
      .first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("gps-value")).toContainText(
    "Sin coordenadas registradas",
  );

  await page
    .getByTestId("nota-referencia")
    .fill("Familias refugiadas en el colegio del sector.");
  await page.getByTestId("submit-incidencia").click();

  const auditCode = page.getByTestId("codigo-auditoria");
  await expect(auditCode).toHaveText(/INC-\d{4}-\d{5}/);
  await expect(page.getByTestId("assistant-reports")).toContainText(
    (await auditCode.textContent()) ?? "",
  );
  await page.getByTestId("copy-codigo").click();
  await expect(page.getByTestId("copy-codigo")).toContainText("Copiado");

  // 5. Coordinator: own area, validation and area CSV.
  await page.getByTestId("nav-logout").click();
  await page.waitForURL("**/login");

  await page.getByTestId("login-demo-coordinador").click();
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/coordinador");
  await expect(
    page.getByRole("heading", { name: "Mi área de operaciones" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Centros poblados" }),
  ).toBeVisible();
  await expect(page.getByText("Catacaos").first()).toBeVisible();
  await expect(page.getByText("Sechura").first()).toBeVisible();
  await expect(page.getByText("Ica", { exact: true })).toHaveCount(0);

  const pendingRow = page
    .getByTestId("incidencia-row")
    .filter({ has: page.getByTestId("validate-incidencia") })
    .first();
  await expect(pendingRow).toBeVisible();
  const pendingCode = (await pendingRow.locator("td").first().innerText()).trim();
  await pendingRow.getByTestId("validate-incidencia").click();
  await expect(
    page.getByTestId("incidencia-row").filter({ hasText: pendingCode }),
  ).toContainText("Validado");

  const [areaDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-csv").click(),
  ]);
  expect(areaDownload.suggestedFilename()).toMatch(
    /^incidencias-piura-norte-\d{4}-\d{2}-\d{2}\.csv$/,
  );

  // 6. Jefatura: six KPIs, three tabs and national CSV.
  await page.getByTestId("nav-logout").click();
  await page.waitForURL("**/login");

  await page.getByTestId("login-demo-jefatura").click();
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/jefatura");
  await expect(
    page.getByRole("heading", { name: "Panel de situación nacional" }),
  ).toBeVisible();

  for (const testId of KPI_TEST_IDS) {
    const kpi = page.getByTestId(testId);
    await expect(kpi).toBeVisible();
    await expect(kpi).not.toHaveText(/^\s*$/);
  }

  await page.getByTestId("tab-coordinadores").click();
  await expect(page.getByText("Rosa Herrera Campos")).toBeVisible();
  await page.getByTestId("tab-asistentes").click();
  await expect(page.getByText("Luis Paredes")).toBeVisible();
  await page.getByTestId("tab-incidencias").click();
  await expect(page.getByTestId("incidencia-row").first()).toBeVisible();

  const [nationalDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-csv").click(),
  ]);
  expect(nationalDownload.suggestedFilename()).toMatch(
    /^incidencias-nacional-\d{4}-\d{2}-\d{2}\.csv$/,
  );
});
