import { describe, expect, it } from "vitest";

import type { CsvIncidenciaRow } from "@/application/ports/csv-exporter";
import {
  buildIncidenciaCsv,
  csvExporter,
  toCsv,
} from "@/infrastructure/csv/csv.exporter";

const HEADER =
  "Codigo de Auditoria,Centro Poblado,Sector,Region,Tipo de Afectacion,Necesidad Principal,Hogares Afectados,Fecha del Suceso,Verificado,Coordenadas GPS,Creado Por,Fecha de Registro";

const row: CsvIncidenciaRow = {
  codigoAuditoria: "INC-2026-00001",
  centroPoblado: "Catacaos",
  sector: "Bajo Piura",
  region: "Piura / Norte",
  tipoAfectacion: "inundacion",
  necesidadPrincipal: "agua_potable",
  hogaresAfectados: 35,
  fechaSuceso: "2026-11-10",
  verificado: true,
  gpsCoords: "-5.19449, -80.62812 (±12m)",
  creadoPor: "user-asi-01",
  createdAt: "2026-11-10T10:00:00.000Z",
};

describe("toCsv", () => {
  it("starts with a UTF-8 BOM and uses CRLF", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\r\n");
    expect(csv.replace(/^\uFEFF/, "")).toBe("a,b\r\n1,2\r\n");
  });

  it("keeps only the header when there are no rows", () => {
    expect(toCsv(["a", "b"], []).replace(/^\uFEFF/, "")).toBe("a,b\r\n");
  });

  it("doubles quotes and wraps fields containing quotes", () => {
    const csv = toCsv(["nota"], [['El vecino dijo "hay agua"']]);
    expect(csv.replace(/^\uFEFF/, "")).toBe('nota\r\n"El vecino dijo ""hay agua"""\r\n');
  });

  it("quotes fields containing commas or newlines", () => {
    const csv = toCsv(["nota"], [["Calle 1, sector 2"], ["Linea uno\nLinea dos"]]);
    const body = csv.replace(/^\uFEFF/, "");
    expect(body).toContain('"Calle 1, sector 2"');
    expect(body).toContain('"Linea uno\nLinea dos"');
  });
});

describe("buildIncidenciaCsv", () => {
  it("writes the exact Spanish header", () => {
    const csv = buildIncidenciaCsv([]);
    const [header] = csv.replace(/^\uFEFF/, "").split("\r\n");
    expect(header).toBe(HEADER);
  });

  it("localizes labels and verified values", () => {
    const csv = buildIncidenciaCsv([row]);
    const body = csv.replace(/^\uFEFF/, "");

    expect(body).toContain("Inundación");
    expect(body).toContain("Agua potable");
    expect(body).toContain(",Si,");
    expect(body).toContain("2026-11-10");
  });

  it("renders a pending report with an empty GPS column", () => {
    const csv = buildIncidenciaCsv([
      { ...row, verificado: false, gpsCoords: null, tipoAfectacion: "otro", necesidadPrincipal: "otro" },
    ]);
    const lines = csv.replace(/^\uFEFF/, "").trimEnd().split("\r\n");
    const cells = lines[1]?.split(",");

    expect(cells?.[8]).toBe("No");
    expect(cells?.[9]).toBe("");
    expect(lines[1]).toContain("Otro");
  });

  it("never embeds images or binary payloads", () => {
    const csv = buildIncidenciaCsv([row]);

    expect(csv).not.toContain("data:image");
    expect(csv).not.toContain("base64");
    expect(csv).not.toContain("\u0000");
    expect(typeof csv).toBe("string");
  });

  it("exposes the exporter port implementation", () => {
    expect(csvExporter.buildIncidenciaCsv([row])).toContain("INC-2026-00001");
  });
});
