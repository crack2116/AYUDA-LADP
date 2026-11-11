# Feature: Cierre de controles UI pendientes, feature flags demo, error boundaries y zona horaria SQL

## Objective
Completar los controles interactivos pendientes en la tabla maestra de Jefatura, aislar herramientas de demo/QA detrás de bandera de entorno, proteger rutas con error boundaries de Next.js App Router y corregir la zona horaria `America/Lima` en el esquema SQL objetivo.

## Tasks
- [x] T1 Crear `odd/tasks/ui-polish-and-resilience.md` y centralizar bandera `isDemoToolsEnabled()` en `src/presentation/lib/runtime-flags.ts`.
- [x] T2 Ocultar en producción (salvo `NEXT_PUBLIC_ENABLE_DEMO_TOOLS="true"`) el bloque de accesos demo en `LoginView`, `BreakModuleTesterBar` y el selector `Cambiar de rol` en `RoleShell`.
- [x] T3 Cablear `JefaturaIncidentTable` + `IncidenciasCampoTab` + `JefaturaDashboardView`: `Validación Masiva`, validación individual por fila, menú contextual con acciones reales (`Copiar código INC`, `Ubicar en Mapa de Campo`, `Nuevo reporte en este centro`) y preselección en mapa; quitar botones muertos.
- [x] T4 Agregar `RuntimeErrorFallback`, `src/app/error.tsx` y `src/app/global-error.tsx`.
- [x] T5 Corregir `timezone('America/Lima', now())` en `generar_codigo_incidencia()` y restricción `fecha_suceso` de `src/infrastructure/db/supabaseSchema.sql`.
- [x] T6 Pruebas unitarias/integración + `tsc`, `eslint --max-warnings 0`, `vitest --coverage`, `pnpm build` y Playwright.

## Verification
- `pnpm exec tsc --noEmit`: exit 0
- `pnpm exec eslint src --max-warnings 0`: exit 0
- `pnpm test:coverage`: 11 test files, 181 tests passed (`Stmts 87.23%`, `Branch 80.9%`, `Funcs 90%`, `Lines 87.55%`)
- `pnpm build`: exit 0 (`next build --turbopack`, 10/10 static pages generated)
- `pnpm exec playwright test`: 1 passed (`src/__tests__/e2e/flujo-completo.spec.ts`)
- Runtime Playwright desktop (`1440x900`) & mobile (`390x844`): 0 console/page errors, `overflowX: false`, verified bulk validation (`Validación Masiva (2)` -> `2 incidencias validadas correctamente.`) and row contextual menu (`Ver en Mapa de Campo` -> `INC-2026-00001` preselected)
