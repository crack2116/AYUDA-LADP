# AYUDA LADP .com

AYUDA LADP is a humanitarian alert system for floods, landslides and other El Niño emergencies in
Peru. Field brigades register incidents, regional coordinators validate that a report really exists,
and national leadership reads a live situation panel with six KPIs. The MVP is designed for
low-connectivity field work: every write lands in the browser first, validation runs before anything
is stored, and the UI never depends on a paid map, GPS or imaging provider.

> Sistemas de Alertas y Respuesta Humanitaria · DINAPROS · Perú

## What the product does

- **Asistente (field brigade):** searchable centro poblado combobox, duplicate/existence alert with
  recent `INC` codes, seven affectation types, integer households, eight needs, "occurred today"
  switch, free browser GPS, reference note, and a confirmation card with an audit code
  `INC-YYYY-NNNNN`.
- **Coordinador (regional area):** own centros poblados, incident table for the region, one-click
  `Validar Existencia`, and an area CSV export.
- **Jefatura (national):** six KPI cards, three tabs (national incidents, coordinator performance,
  assistant activity) and a national CSV export.
- **Everyone:** floating support chat reachable from `/login` and every role screen, plus a
  collapsible QA "break the module" bar for demoing validation failures.

## Role model

| Role | Scope | Landing route | Main permissions |
| --- | --- | --- | --- |
| `jefatura` | National | `/jefatura` | Read all, validate, export, read KPIs, read coordinators/users |
| `coordinador` | Own region and assigned centros | `/coordinador` | Read own area, validate, export, read area KPIs |
| `asistente` | Only the reports it created | `/incidencias/nuevo` | Create and read own reports |

Authorization is deny-by-default (`src/domain/permissions/rbac.ts`). The login screen also requires
the jurisdiction that matches the account: `nacional` for Jefatura, `piura_norte` or `sur_centro` for
coordination, and `campo` for field brigades. A mismatched jurisdiction is rejected before a session
is written.

## Clean Architecture tree

```text
src/
├─ domain/                 Pure TypeScript: entities, Zod schemas, RBAC, audit code,
│                          duplicate window, KPI calculator, Lima date/GPS helpers.
├─ application/            Ports + use cases. Returns typed Results, never throws.
│  ├─ ports/               Auth, incidencia, centro, ticket, allocator, GPS, CSV, cache.
│  └─ use-cases/           Login, create/check/validate incidencia, list, KPIs, CSV, tickets.
├─ infrastructure/         Adapters and composition root.
│  ├─ cache/               localStorage/sessionStorage guards and LocalStorageCache.
│  ├─ csv/                 RFC 4180 exporter with BOM + CRLF.
│  ├─ db/                  Supabase-ready PostgreSQL DDL.
│  ├─ gps/                 BrowserGeolocation adapter (free, no API key).
│  ├─ repositories/        Local-first repositories over the namespaced store.
│  ├─ seed/                Deterministic demo dataset and credentials.
│  └─ container.ts         Composition root + createTestContainer({ now }).
├─ presentation/           React views, components, hooks, buses and formatting.
├─ app/                    Next.js 15 App Router pages and root layout.
└─ __tests__/              Vitest unit/RTL suites and the Playwright E2E flow.
```

The dependency rule points inward: `domain` imports nothing from React, Next or the browser;
`application` depends only on ports; `infrastructure` implements those ports; `presentation` talks to
the composition root. Swapping the local adapters for Supabase does not change domain or use-case
code.

## Design tokens

Tailwind CSS v4 `@theme` tokens live in `src/app/globals.css`:

| Token | Value | Use |
| --- | --- | --- |
| `ladp-navy-dark` | `#030b38` | Sidebar, dark chrome |
| `ladp-navy` | `#071b3e` | Header and login panel |
| `ladp-cobalt` | `#002296` | Primary actions, links |
| `ladp-cobalt-light` | `#0b318f` | Hover on primary actions |
| `ladp-orange` | `#f06a00` | Alerts, CTAs, focus ring |
| `ladp-orange-light` | `#ff7a00` | CTA hover |
| `ladp-amber` | `#ffb800` | Warnings, demo accents |
| `ladp-bg` | `#f4f7fb` | Page background |
| `ladp-surface` | `#ffffff` | Cards and tables |

Fonts are Inter (sans) and JetBrains Mono (audit codes), with system fallbacks. `.ladp-surface-card`
is the shared card utility. Icons come from `lucide-react`; there are no image assets.

## Local-first persistence and the demo seed

The browser is the database in this MVP:

- `src/infrastructure/repositories/local-store.ts` namespaces every key under `ayuda-ladp:v1`, writes
  to `localStorage` and keeps an in-memory mirror so SSR and tests never crash on missing storage.
  Session persistence can use `sessionStorage` when "Mantener sesión" is off.
- `src/infrastructure/seed/demo-data.ts` builds a deterministic dataset anchored to the injected
  clock: 12 centros poblados, 11 profiles (6 Jefatura, 2 coordination, 3 assistants) and 9 incidents
  spread over the last 70 hours. `ensureDemoSeed` seeds once per `DEMO_SEED_VERSION`, so a reload
  keeps new reports and the audit sequence.
- The audit allocator reads/writes `audit-sequence` in the same store, so codes never repeat across
  reloads. The seed starts at `INC-YYYY-00009`; the next real report is `INC-YYYY-00010`.
- `resetDemoSeed(now)` rebuilds the demo dataset. Tests clear the store through `clearStore()` in
  `src/__tests__/setup.ts`.

Because everything is local, two browsers do not share data and clearing site data resets the demo.
That is the deliberate trade-off while no cloud project exists.

## Supabase path

The SQL target ships at `src/infrastructure/db/supabaseSchema.sql` (PostgreSQL 15). It defines the
`user_role` enum, `centros_poblados`, `profiles`, `incidencias` with CHECK constraints,
`tickets_soporte`, the `incidencia_seq` sequence plus `generar_codigo_incidencia()` trigger, RLS
policies for the three roles, B-Tree indexes and `pg_trgm` GIN indexes.

1. Create a Supabase project.
2. Open **SQL Editor** and run `src/infrastructure/db/supabaseSchema.sql` as one script.
3. Copy the **transaction pooler** connection string (PgBouncer, transaction mode, port `6543`) for
   serverless/edge runtimes. Use the direct connection only for migrations that need session-level
   features. Transaction mode does not keep prepared statements between transactions, so disable
   statement caching in the client (for example `prepare: false` with `postgres-js`).
4. Replace the local adapters and rewire the composition root:

| Local adapter | Cloud replacement |
| --- | --- |
| `LocalAuthRepository` | Supabase Auth + a `profiles` adapter (session/JWT instead of the demo credential list) |
| `LocalCentroPobladoRepository` | `supabase.from("centros_poblados")` |
| `LocalIncidenciaRepository` | `supabase.from("incidencias")`, including `markVerified` |
| `LocalSupportTicketRepository` | `supabase.from("tickets_soporte")` |
| `LocalAuditCodeAllocator` | The database sequence/trigger result from the insert, not a client counter |
| `LocalStorageCache` | Optional remote cache; the session comes from Supabase Auth |

Only `src/infrastructure/container.ts` and the adapter files change. The domain schemas and use cases
stay untouched because they depend on ports.

**Not included:** a live Supabase project, credentials, or a deployed environment. The DDL is the
contract; the local adapter is what runs here.

## Demo credentials

Shared password: `ladp2026`. The login screen has one click-to-fill button per role.

| Button | Identifier | Jurisdiction | Lands on |
| --- | --- | --- | --- |
| `login-demo-jefatura` | `JEF-001` | `nacional` | `/jefatura` |
| `login-demo-coordinador` | `COO-PN-01` | `piura_norte` | `/coordinador` |
| `login-demo-asistente` | `ASI-PN-01` | `campo` | `/incidencias/nuevo` |

Additional seeded accounts exist for the KPIs (`JEF-002`…`JEF-006`, `COO-SC-01`, `ASI-PN-02`,
`ASI-SC-01`) but the login screen only exposes the three demo buttons.

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with Turbopack on port 3000 |
| `npm run build` | Production build with Turbopack |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over the repository |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest + V8 coverage with the 80% global gates |
| `npm run test:e2e` | Playwright flow with video recording |

## Tests and coverage

```bash
npm run test:coverage
```

Vitest runs in jsdom against `src/domain`, `src/application`, `src/infrastructure` and
`src/presentation`. Coverage thresholds are **80% for statements, branches, functions and lines**;
the suite currently sits above that on every metric (161 tests). Unit tests cover every validator
branch, the use-case failure paths, the CSV contract, the local store, and React Testing Library
flows for login, the incident form, both dashboards, the support chat and the QA bar.

```bash
npx tsc --noEmit
npx eslint src --max-warnings 0
```

## Playwright E2E and the recorded video

```bash
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` runs one Chromium worker with `video: "on"`, `trace: "retain-on-failure"`,
`locale: "es-PE"` and `timezoneId: "America/Lima"`, against `http://127.0.0.1:3000`. It starts
`npm run dev` automatically unless a server is already listening (and reuses it locally, never in
CI).

The single test `flujo completo AYUDA LADP` walks the demo story: login and support ticket → assistant
report with the three QA injections → real report with duplicate alert, GPS failure and audit code →
coordinator validation and area CSV → Jefatura KPIs, tabs and national CSV.

The recording lands at:

```text
test-results/flujo-completo-flujo-completo-AYUDA-LADP-chromium/video.webm
```

On failure the same folder also contains `test-failed-1.png` and `trace.zip`.

## QA break-module bar

The bar sits at the bottom of every screen (`Modo Test 80%+ — Probar Romper Módulo`). Its three
buttons only emit events on `presentation/qa/qa-bus`; the incident form owns the fields and runs the
normal Zod resolver. In order:

1. **Hogares negativos / decimales (-25.5)** → integer error, no confirmation.
2. **Fecha futura (2027-12-31)** → future-date error, no confirmation.
3. **Formulario vacío / incompleto** → required-field errors, no confirmation.

Nothing reaches a repository during an injection, and the bar has no effect outside
`/incidencias/nuevo`.

## Deliberate scope limits

- **No live Supabase project.** The schema and adapter seam are shipped, but runtime is local.
- **No real identity provider.** Demo credentials are checked by the auth port; there is no password
  hashing, OAuth, MFA or session refresh.
- **No images or PDF export.** CSV only, with BOM and CRLF for Excel; no maps, photos or attachments.
- **No server API or background sync.** Data is per browser profile and per device.
- **No production RBAC enforcement.** Policies exist in SQL, but the browser demo trusts the local
  session; enable RLS and real auth before any multi-user deployment.

## Quick start

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000/login`, pick a demo role, and follow the seeded Piura data.
