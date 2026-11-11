import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LocalStorageCache,
  createLocalCache,
} from "@/infrastructure/cache/local-storage-cache";
import { createTestContainer, getContainer } from "@/infrastructure/container";
import { BrowserGpsService } from "@/infrastructure/gps/browser-gps.service";
import { LocalAuditCodeAllocator } from "@/infrastructure/repositories/local-audit-code-allocator";
import { LocalAuthRepository, demoCredentials } from "@/infrastructure/repositories/local-auth.repository";
import { LocalCentroPobladoRepository } from "@/infrastructure/repositories/local-centro-poblado.repository";
import { LocalIncidenciaRepository } from "@/infrastructure/repositories/local-incidencia.repository";
import { LocalSupportTicketRepository } from "@/infrastructure/repositories/local-support-ticket.repository";
import {
  clearStore,
  read,
  readSessionValue,
  remove,
  storeKey,
  subscribeStore,
  write,
  writeSessionValue,
} from "@/infrastructure/repositories/local-store";
import {
  DEMO_CENTROS,
  DEMO_PASSWORD,
  DEMO_USERS,
  buildDemoDataset,
  ensureDemoSeed,
} from "@/infrastructure/seed/demo-data";

const NOW = new Date("2026-11-10T15:00:00.000Z");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local store", () => {
  it("writes and reads JSON with fallbacks", () => {
    write("sample", { count: 3 });
    expect(read("sample", { count: 0 })).toEqual({ count: 3 });
    expect(read("missing", { count: 9 })).toEqual({ count: 9 });
  });

  it("survives malformed JSON", () => {
    window.localStorage.setItem(storeKey("broken"), "{not-json");
    expect(read("broken", "fallback")).toBe("fallback");
  });

  it("removes a key", () => {
    write("sample", 1);
    remove("sample");
    expect(read("sample", 0)).toBe(0);
  });

  it("notifies subscribers on write and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeStore(listener);

    write("sample", 1);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    write("sample", 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("clears every namespaced key", () => {
    write("a", 1);
    write("b", 2);
    clearStore();
    expect(read("a", 0)).toBe(0);
    expect(read("b", 0)).toBe(0);
  });

  it("works without window using the in-memory fallback", () => {
    vi.stubGlobal("window", undefined);
    write("memory-only", "ok");
    expect(read("memory-only", "missing")).toBe("ok");
  });

  it("writes persistent sessions to localStorage only", () => {
    writeSessionValue("session", { id: "user-jef-01" }, true);

    expect(readSessionValue<{ id: string }>("session")?.id).toBe("user-jef-01");
    expect(window.localStorage.getItem(storeKey("session"))).not.toBeNull();
    expect(window.sessionStorage.getItem(storeKey("session"))).toBeNull();
  });

  it("writes ephemeral sessions to sessionStorage only", () => {
    writeSessionValue("session", { id: "user-jef-01" }, false);

    expect(readSessionValue<{ id: string }>("session")?.id).toBe("user-jef-01");
    expect(window.localStorage.getItem(storeKey("session"))).toBeNull();
    expect(window.sessionStorage.getItem(storeKey("session"))).not.toBeNull();
  });
});

describe("demo seed", () => {
  it("is deterministic for the same clock", () => {
    expect(buildDemoDataset(NOW)).toEqual(buildDemoDataset(NOW));
  });

  it("contains the requested demo volume", () => {
    const dataset = buildDemoDataset(NOW);

    expect(dataset.users).toHaveLength(11);
    expect(dataset.users.filter((user) => user.rol === "jefatura")).toHaveLength(6);
    expect(dataset.users.filter((user) => user.rol === "coordinador")).toHaveLength(2);
    expect(dataset.users.filter((user) => user.rol === "asistente")).toHaveLength(3);
    expect(dataset.centros).toHaveLength(12);
    expect(dataset.incidencias).toHaveLength(9);
    expect(dataset.tickets).toHaveLength(0);
  });

  it("spreads incidents over the last three days with a mixed state", () => {
    const dataset = buildDemoDataset(NOW);
    const codes = new Set(dataset.incidencias.map((incidencia) => incidencia.codigoAuditoria));
    const gps = dataset.incidencias.filter((incidencia) => incidencia.gpsCoords !== null);
    const verified = dataset.incidencias.filter((incidencia) => incidencia.verificado);

    expect(codes.size).toBe(9);
    expect(gps).toHaveLength(4);
    expect(verified).toHaveLength(4);
    expect(dataset.incidencias.map((incidencia) => incidencia.codigoAuditoria)[0]).toBe(
      "INC-2026-00001",
    );

    for (const incidencia of dataset.incidencias) {
      const age = NOW.getTime() - Date.parse(incidencia.createdAt);
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThanOrEqual(72 * 60 * 60 * 1000);
    }
  });

  it("keeps today flags consistent with the Lima date", () => {
    const dataset = buildDemoDataset(NOW);
    const today = dataset.incidencias[0]?.fechaSuceso;

    for (const incidencia of dataset.incidencias) {
      if (incidencia.ocurrioHoy) {
        expect(incidencia.fechaSuceso).toBe(today);
      }
    }
  });

  it("seeds only once per version", () => {
    ensureDemoSeed(NOW);
    write("incidencias", []);
    ensureDemoSeed(NOW);
    expect(read<unknown[]>("incidencias", [])).toHaveLength(0);
  });

  it("uses real Peruvian locality names", () => {
    const names = DEMO_CENTROS.map((centro) => centro.nombre);
    expect(names).toContain("Catacaos");
    expect(names).toContain("Chulucanas");
    expect(names).toContain("Tambogrande");
    expect(names).toContain("Sechura");
    expect(names).toContain("Chincha Alta");
  });
});

describe("local repositories", () => {
  it("reads and searches centros poblados", async () => {
    const repository = new LocalCentroPobladoRepository(() => NOW);

    expect(await repository.listAll()).toHaveLength(12);
    expect((await repository.findById("c-catacaos"))?.nombre).toBe("Catacaos");
    expect(await repository.findById("missing")).toBeNull();
    expect(await repository.listByCoordinator("user-coo-pn-01")).toHaveLength(5);
    expect((await repository.search("catacaos")).map((centro) => centro.id)).toEqual([
      "c-catacaos",
    ]);
  });

  it("resets centros to the seed", async () => {
    const repository = new LocalCentroPobladoRepository(() => NOW);
    write("centros", []);
    await repository.reset();
    expect(await repository.listAll()).toHaveLength(12);
  });

  it("creates, lists and verifies incidencias", async () => {
    const repository = new LocalIncidenciaRepository(() => NOW);
    expect(await repository.listAll()).toHaveLength(9);

    const created = await repository.create(
      {
        centroPobladoId: "c-catacaos",
        tipoAfectacion: "inundacion",
        hogaresAfectados: 5,
        necesidadPrincipal: "agua_potable",
        ocurrioHoy: true,
        fechaSuceso: "2026-11-10",
        gpsCoords: null,
        notaReferencia: null,
        creadoPor: "user-asi-01",
      },
      {
        codigoAuditoria: "INC-2026-00010",
        creadoPor: "user-asi-01",
        createdAt: NOW.toISOString(),
      },
    );

    expect(created.verificado).toBe(false);
    expect(created.codigoAuditoria).toBe("INC-2026-00010");
    expect(await repository.listAll()).toHaveLength(10);
    expect(await repository.findByCentroPoblado("c-catacaos")).toHaveLength(2);
    expect((await repository.findById(created.id))?.hogaresAfectados).toBe(5);

    const verified = await repository.markVerified("inc-02");
    expect(verified?.verificado).toBe(true);
    expect((await repository.findById("inc-02"))?.verificado).toBe(true);
    expect(await repository.markVerified("missing")).toBeNull();
  });

  it("resets incidencias to the seed", async () => {
    const repository = new LocalIncidenciaRepository(() => NOW);
    write("incidencias", []);
    await repository.reset();
    expect(await repository.listAll()).toHaveLength(9);
  });

  it("stores support tickets", async () => {
    const repository = new LocalSupportTicketRepository(() => NOW);
    expect(await repository.listAll()).toHaveLength(0);

    await repository.create({
      id: "ticket-1",
      usuarioId: null,
      opcionProblema: "datos_no_cargan",
      detalleOpcional: null,
      rutaOrigen: "/login",
      createdAt: NOW.toISOString(),
    });

    expect(await repository.listAll()).toHaveLength(1);
    await repository.reset();
    expect(await repository.listAll()).toHaveLength(0);
  });
});

describe("audit code allocator", () => {
  it("continues after the seeded sequence", async () => {
    const allocator = new LocalAuditCodeAllocator(() => NOW);
    expect(await allocator.next(NOW)).toBe("INC-2026-00010");
    expect(await allocator.next(NOW)).toBe("INC-2026-00011");
  });

  it("resets to one when the Lima year changes", async () => {
    const allocator = new LocalAuditCodeAllocator(() => NOW);
    ensureDemoSeed(NOW);
    write("audit-sequence", { year: 2026, last: 4 });

    expect(await allocator.next(new Date("2026-12-31T15:00:00.000Z"))).toBe("INC-2026-00005");
    expect(await allocator.next(new Date("2027-01-01T15:00:00.000Z"))).toBe("INC-2027-00001");
  });

  it("never repeats a code under 50 parallel calls", async () => {
    const allocator = new LocalAuditCodeAllocator(() => NOW);
    ensureDemoSeed(NOW);
    write("audit-sequence", { year: 2026, last: 0 });

    const codes = await Promise.all(
      Array.from({ length: 50 }, () => allocator.next(NOW)),
    );

    expect(new Set(codes).size).toBe(50);
    expect(codes[0]).toBe("INC-2026-00001");
    expect(codes[49]).toBe("INC-2026-00050");
  });
});

describe("local auth repository", () => {
  const credentials = {
    identificadorOficial: "JEF-001",
    claveOperacional: DEMO_PASSWORD,
    jurisdiccion: "nacional" as const,
    mantenerSesion: true,
  };

  it("logs in a jefatura user and restores the session", async () => {
    const repository = new LocalAuthRepository();

    const result = await repository.login(credentials);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe("user-jef-01");
    expect(window.localStorage.getItem(storeKey("session"))).not.toBeNull();

    const restored = await repository.restoreSession();
    expect(restored?.identificadorOficial).toBe("JEF-001");
  });

  it("uses sessionStorage when the session is not kept", async () => {
    const repository = new LocalAuthRepository();

    const result = await repository.login({ ...credentials, mantenerSesion: false });

    expect(result.ok).toBe(true);
    expect(window.localStorage.getItem(storeKey("session"))).toBeNull();
    expect(window.sessionStorage.getItem(storeKey("session"))).not.toBeNull();
    expect((await repository.restoreSession())?.id).toBe("user-jef-01");
  });

  it("logs out", async () => {
    const repository = new LocalAuthRepository();
    await repository.login(credentials);

    await repository.logout();

    expect(await repository.restoreSession()).toBeNull();
  });

  it("upgrades a session with keepSession", async () => {
    const repository = new LocalAuthRepository();
    const login = await repository.login({ ...credentials, mantenerSesion: false });
    if (!login.ok) throw new Error("login failed");

    await repository.keepSession(login.value);

    expect(window.localStorage.getItem(storeKey("session"))).not.toBeNull();
  });

  it("rejects a wrong password and an unknown identifier", async () => {
    const repository = new LocalAuthRepository();

    const wrongPassword = await repository.login({
      ...credentials,
      claveOperacional: "wrong-pass",
    });
    const unknown = await repository.login({
      ...credentials,
      identificadorOficial: "NOPE-999",
    });

    expect(wrongPassword.ok).toBe(false);
    expect(unknown.ok).toBe(false);
    if (wrongPassword.ok || unknown.ok) return;
    expect(wrongPassword.error.code).toBe("validation_error");
    expect(unknown.error.message).toContain("incorrectos");
  });

  it("rejects a jurisdiction mismatch with a Spanish message", async () => {
    const repository = new LocalAuthRepository();

    const result = await repository.login({ ...credentials, jurisdiccion: "campo" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("validation_error");
    expect(result.error.message).toContain("jurisdicción");
    expect(result.error.fieldErrors?.jurisdiccion).toBeTruthy();
  });

  it("validates coordinator and assistant jurisdictions", async () => {
    const repository = new LocalAuthRepository();
    const coordinator = await repository.login({
      identificadorOficial: "COO-PN-01",
      claveOperacional: DEMO_PASSWORD,
      jurisdiccion: "piura_norte",
      mantenerSesion: false,
    });
    const assistant = await repository.login({
      identificadorOficial: "ASI-SC-01",
      claveOperacional: DEMO_PASSWORD,
      jurisdiccion: "campo",
      mantenerSesion: false,
    });

    expect(coordinator.ok).toBe(true);
    expect(assistant.ok).toBe(true);
  });

  it("ignores a corrupted session payload", async () => {
    const repository = new LocalAuthRepository();
    window.localStorage.setItem(storeKey("session"), JSON.stringify({ id: 42 }));

    expect(await repository.restoreSession()).toBeNull();
  });

  it("publishes the demo credential pairs", () => {
    const credentialsList = demoCredentials();

    expect(credentialsList).toHaveLength(DEMO_USERS.length);
    expect(credentialsList[0]).toMatchObject({
      identificadorOficial: "JEF-001",
      claveOperacional: DEMO_PASSWORD,
      jurisdiccion: "nacional",
      rol: "jefatura",
    });
  });

  it("lists all demo user profiles without leaking shared mutable arrays", async () => {
    const repository = new LocalAuthRepository();
    const list = await repository.listUsers();

    expect(list).toHaveLength(DEMO_USERS.length);
    list[0]?.centroPobladoIds.push("mutated");
    const fresh = await repository.listUsers();
    expect(fresh[0]?.centroPobladoIds).not.toContain("mutated");
  });
});

describe("local cache", () => {
  it("stores and removes values", () => {
    const cache = new LocalStorageCache();

    expect(cache.get<{ id: string }>("draft")).toBeNull();
    cache.set("draft", { id: "inc-1" });
    expect(cache.get<{ id: string }>("draft")).toEqual({ id: "inc-1" });
    cache.remove("draft");
    expect(cache.get("draft")).toBeNull();
  });

  it("exposes a factory for the composition root", () => {
    const cache = createLocalCache();
    cache.set("draft", "value");
    expect(cache.get<string>("draft")).toBe("value");
  });
});

describe("container", () => {
  it("memoizes the shared container", () => {
    expect(getContainer()).toBe(getContainer());
  });

  it("wires a fresh container with a controllable clock", async () => {
    const container = createTestContainer({ now: NOW });
    const jefaturaUser = DEMO_USERS.find((user) => user.rol === "jefatura");
    if (!jefaturaUser) throw new Error("demo dataset has no jefatura user");
    const values = {
      centroPobladoId: "c-catacaos",
      tipoAfectacion: "inundacion" as const,
      hogaresAfectados: 6,
      necesidadPrincipal: "alimentos" as const,
      ocurrioHoy: true,
      fechaSuceso: "2026-11-10",
      gpsCoords: null,
      notaReferencia: null,
    };

    const created = await container.useCases.createIncidencia.execute({
      values,
      creadoPor: "user-asi-01",
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.createdAt).toBe(NOW.toISOString());
    expect(created.value.codigoAuditoria).toBe("INC-2026-00010");

    const listed = await container.useCases.listIncidencias.execute({
      user: jefaturaUser,
    });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value).toHaveLength(10);

    const kpis = await container.useCases.calculateKpis.execute({ now: NOW });
    expect(kpis.ok).toBe(true);
    if (!kpis.ok) return;
    expect(kpis.value.centrosPobladosAfectados).toBe(9);

    const exported = await container.useCases.exportCsv.execute({
      user: jefaturaUser,
      scope: { kind: "national" },
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(exported.value.filename).toBe("incidencias-nacional-2026-11-10.csv");
    expect(exported.value.rowCount).toBe(10);

    const ticket = await container.useCases.createSupportTicket.execute({
      opcionProblema: "datos_no_cargan",
      rutaOrigen: "/jefatura",
    });
    expect(ticket.ok).toBe(true);

    const login = await container.useCases.login.execute({
      identificadorOficial: "JEF-001",
      claveOperacional: DEMO_PASSWORD,
      jurisdiccion: "nacional",
      mantenerSesion: true,
    });
    expect(login.ok).toBe(true);

    expect(container.clock().getTime()).toBe(NOW.getTime());
    expect(container.gpsService).toBeInstanceOf(BrowserGpsService);
  });

  it("accepts a live clock function", () => {
    const clock = () => NOW;
    const container = createTestContainer({ now: clock });
    expect(container.clock).toBe(clock);
  });

  it("falls back to a live system clock", () => {
    const container = createTestContainer();
    expect(container.clock()).toBeInstanceOf(Date);
  });
});

describe("supabase schema", () => {
  const schema = readFileSync(
    join(process.cwd(), "src/infrastructure/db/supabaseSchema.sql"),
    "utf8",
  );

  it("declares the role enum, sequence and trigger", () => {
    expect(schema).toContain("CREATE TYPE user_role AS ENUM");
    expect(schema).toContain("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    expect(schema).toContain("CREATE SEQUENCE public.incidencia_seq START WITH 1");
    expect(schema).toContain("generar_codigo_incidencia");
    expect(schema).toContain("BEFORE INSERT ON public.incidencias");
  });

  it("enables RLS and grants permissions", () => {
    expect(schema).toContain("ENABLE ROW LEVEL SECURITY");
    expect(schema).toContain("CREATE POLICY incidencias_select_jefatura");
    expect(schema).toContain("CREATE POLICY incidencias_select_asistente");
    expect(schema).toContain("GRANT SELECT, INSERT, UPDATE ON public.incidencias");
  });
});
