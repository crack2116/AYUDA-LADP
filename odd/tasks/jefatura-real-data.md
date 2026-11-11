# Feature: Conectar pestañas secundarias de Jefatura a datos y casos de uso reales

## Objective
Eliminar los datos estáticos simulados y handlers ficticios en `SupervisionMandosTab`,
`IncidenciasCampoTab` y `RegistroTacticoTab`, conectando las tres vistas de `/jefatura` con
repositorios reales, validación de dominio (`createIncidenciaSchema`), GPS real
(`GpsService`), persistencia real de borradores locales (`LocalCache`) y casos de uso de
`application/` bajo arquitectura limpia.

## Scope
- `domain`:
  - Extender `gps.ts` con parser y formateador manual de coordenadas WGS84 (`parseGpsCoords`,
    `formatManualGpsCoords`).
  - Crear `territorial-analysis.ts` con agregadores puros para supervisión por región,
    nómina de personal sobre `UserProfile[]`, proyección geográfica de Perú y constructor de
    `FeatureCollection` GeoJSON (`projectPeruCoordsToPercent`, `summarizeRegionsDeployment`,
    `buildPersonnelSupervisionRows`, `buildIncidenciasGeoJson`).
- `application` + `infrastructure`:
  - Añadir `listUsers()` a `AuthRepository` y `LocalAuthRepository` + caso de uso
    `ListUsersUseCase` protegido por RBAC (`"user:read"`).
  - Añadir `TacticalDraftsUseCase` sobre `LocalCache` para listar, guardar y eliminar
    borradores locales reales.
  - Exponer `listUsers` y `tacticalDrafts` en `container.ts`.
- `presentation`:
  - Actualizar `JefaturaDashboardView` para cargar `users` vía `listUsers`, quitar la
    importación directa de `DEMO_USERS` desde `infrastructure/seed`, pasar datos/callbacks
    reales a los tres tabs y recargar KPIs/filas tras registrar o validar incidencias.
  - Reescribir la lógica interna de `SupervisionMandosTab`, `IncidenciasCampoTab` y
    `RegistroTacticoTab` conservando la línea visual unificada (`brand-*`, `ladp-*`,
    `slate-*`, dos radios, sin `font-black`) y cero métricas inventadas.

## Tasks
- [x] T1 `odd/tasks/jefatura-real-data.md`: Documentar alcance y criterios de aceptación.
- [x] T2 Dominio: `parseGpsCoords`, `formatManualGpsCoords` y `territorial-analysis.ts` +
      pruebas unitarias en `domain.spec.ts`.
- [x] T3 Aplicación + Infraestructura: `ListUsersUseCase`, `TacticalDraftsUseCase`,
      `AuthRepository.listUsers` + pruebas en `use-cases.spec.ts` e `infrastructure.spec.ts`.
- [x] T4 Presentación: Conectar `JefaturaDashboardView`, `RegistroTacticoTab`,
      `IncidenciasCampoTab` y `SupervisionMandosTab`.
- [x] T5 Tests & Verificación: Actualizar `jefatura-tabs.spec.tsx` y `dashboards.spec.tsx`
      con flujo real E2E (borrador local, GPS, creación de incidencia actualizando panel,
      validación en campo, exportación GeoJSON/CSV); validar `tsc`, `eslint`, cobertura y
      Playwright runtime.

## Verification
- `pnpm exec tsc --noEmit` -> OK (`0` errores)
- `pnpm exec eslint src --max-warnings 0` -> OK (`0` warnings / errores)
- `pnpm test:coverage` -> `11` suites / `175` pruebas en verde (`87.3%` Stmts, `81.11%` Branch, `89.8%` Funcs, `87.57%` Lines)
- `pnpm build` -> OK (`next build --turbopack`, 10/10 páginas estáticas)
- `pnpm exec playwright test` (`src/__tests__/e2e/flujo-completo.spec.ts`) -> OK (`1 passed`)
- Playwright runtime sobre `/jefatura` (`1440x900` y `390x844`): `overflowX=false` en los 4 tabs y 2 viewports, `0` console errors, `0` page errors; descargas reales (`incidencias-nacional-2026-11-10.csv`, `nomina-supervision-2026-11-10.csv`, `incidencias-campo-2026-11-10.geojson`), validación en campo (`5 -> 4` pendientes) y creación táctica real (`INC-2026-00010`, refresco de panel `165 -> 170` hogares, `9 -> 10` centros).
