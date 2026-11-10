# AYUDA LADP .com — MVP (Fenómeno El Niño / DINAPROS)

## Objetivo

Entregar un MVP con calidad de producción del sistema de alertas humanitarias AYUDA LADP: captura de
incidencias basada en roles (Asistente), supervisión por área (Coordinador) y KPIs ejecutivos nacionales
(Jefatura), con GPS gratuito del navegador, exportación a CSV sin imágenes, persistencia local tolerante
a desconexiones, y una suite Vitest por encima del 80% de cobertura más un flujo Playwright que graba video.

## Problema / Justificación

Durante emergencias por El Niño, las brigadas pierden señal en el campo y cientos de reportes llegan al
mismo tiempo. El sistema nunca debe emitir códigos de auditoría duplicados, debe mantener borradores
localmente, validar los datos antes de tocar la base de datos y permitir que Jefatura tenga un panorama
nacional en segundos.

## Alcance

Dentro del alcance:

- Separación en Clean Architecture: `domain` / `application` / `infrastructure` / `presentation`.
- Validación Zod de cada campo de incidencia (sin hogares negativos ni decimales, sin fechas futuras).
- Código de auditoría `INC-YYYY-NNNNN` generado por un asignador atómico único.
- Verificación de duplicados y existencia por centro poblado antes de guardar.
- GPS gratuito mediante `navigator.geolocation` (sin API key ni proveedores de pago).
- Exportación a CSV sin imágenes, con BOM + CRLF y campos entrecomillados (RFC 4180).
- Persistencia Local-First (`localStorage`) con datos semilla para ejecutar el MVP sin configuración de nube.
- DDL PostgreSQL listo para Supabase: tipos enum, secuencia + trigger, políticas RLS, índices B-Tree/GIN.
- Pantalla de inicio de sesión, tres vistas de rol, chat de soporte flotante y barra QA "romper módulo".
- Pruebas unitarias/RTL con cobertura >= 80%, y prueba E2E de Playwright con `video: 'on'`.

Fuera del alcance (documentado en el README):

- Proyecto Supabase en vivo obligatorio. No hay credenciales en este entorno, por lo que el runtime
  utiliza el adaptador local; el DDL SQL y la arquitectura permiten conectarlo posteriormente.
- Hashing de contraseñas o IdP real en esta fase. Validación de credenciales demo mediante el puerto auth.

## Restricciones

- Next.js 15 App Router, React 19, TypeScript estricto, Tailwind CSS v4, únicamente lucide-react (sin imágenes pesadas).
- Fechas evaluadas en la zona horaria `America/Lima`. Servidor y cliente no deben discrepar.
- La aplicación debe compilar y ejecutarse con `pnpm dev` en una máquina limpia sin variables de entorno obligatorias.
- Repositorio: `C:\Users\elcra\Desktop\ONG` (rama `main` y `feat/ayuda-ladp-mvp`).

## Tareas

### T1 — Andamiaje y herramientas — COMPLETADO
Next 15.5.29, React 19.1, Tailwind v4, Zod 4, RHF, lucide-react, Vitest 5, RTL, Playwright 1.65.

### T2 — Capa de Dominio — COMPLETADO
Entidades (`Incidencia`, `UserProfile`, `CentroPoblado`, `SupportTicket`, `JefaturaKpis`), esquemas Zod,
políticas RBAC, formateador de código de auditoría, regla de ventana de duplicados, cálculo de KPIs.

### T3 — Capa de Aplicación — COMPLETADO
Puertos y casos de uso: `CreateIncidencia`, `CheckDuplicateIncidencia`, `ValidateIncidenciaExistence`,
`CalculateJefaturaKpis`, `ExportIncidenciasCsv`, `CreateSupportTicket`, `Login`, `ListIncidencias`.

### T4 — Infraestructura — COMPLETADO
Repositorios locales (localStorage con respaldo en memoria para SSR/tests), datos semilla demo,
`BrowserGpsService`, `CsvExporter`, `LocalStorageCache`, raíz de composición (`container.ts`).

### T5 — Esquema SQL para Supabase — COMPLETADO
`src/infrastructure/db/supabaseSchema.sql`: enum `user_role`, `centros_poblados`, `profiles`,
`incidencia_seq` + trigger, `incidencias` con restricciones CHECK, `tickets_soporte`, RLS para los tres roles,
índices B-Tree + GIN (`pg_trgm`).

### T6 — Sistema de diseño y Login — COMPLETADO
Tokens `@theme` de Tailwind, panel dividido de `/login`, selección de jurisdicción, botón para ver contraseña,
checkbox de persistencia de sesión y acciones secundarias.

### T7 — Panel de Jefatura — COMPLETADO
`/jefatura`: 6 tarjetas de KPIs, pestañas de análisis (incidencias globales / desempeño de coordinadores /
actividad de asistentes), exportación a CSV nacional y selector de rol.

### T8 — Vista de Área del Coordinador — COMPLETADO
`/coordinador`: panel izquierdo con centros poblados y conteos, tabla derecha de incidencias con acción
`Validar Existencia` y exportación a CSV por área.

### T9 — Formulario de Incidencias para Asistente — COMPLETADO
`/incidencias/nuevo`: combobox con búsqueda de centro poblado, alerta de duplicados con códigos recientes,
7 tipos de afectación, hogares afectados (número entero), 8 necesidades críticas, switch "ocurrido hoy",
GPS gratuito, nota de referencia y tarjeta de confirmación con código de auditoría y botón de copiado.

### T10 — Chat de soporte y Barra QA — COMPLETADO
Widget flotante con chips de problemas frecuentes, confirmación inmediata de tickets. Barra QA desplegable
para inyectar casos de prueba: hogares negativos/decimales, fecha futura y formulario vacío.

### T11 — Suite de pruebas — COMPLETADO
`vitest.config.ts` con jsdom, archivo de configuración y umbral mínimo global de cobertura del 80%.
Suites en `src/__tests__/unit/*` para dominio, aplicación, infraestructura y componentes de presentación.

### T12 — Pruebas E2E con Playwright — COMPLETADO
`playwright.config.ts` con `video: 'on'`, `src/__tests__/e2e/flujo-completo.spec.ts` cubriendo login →
ticket de soporte → reporte de asistente + inyecciones QA → validación de coordinador → KPIs y CSV de jefatura.

### T13 — Documentación y verificación final — COMPLETADO
README completo en español, `pnpm lint`, `pnpm build`, `pnpm test:coverage`.

## Evidencia de aceptación

| Requisito | Evidencia |
| --- | --- |
| Vitest >= 80% cobertura | 87.73% líneas, 82.47% ramas, 91.93% funciones, 87.70% sentencias |
| Playwright graba video | `test-results/flujo-completo-flujo-completo-AYUDA-LADP-chromium/video.webm` |
| Código de auditoría `INC-YYYY-NNNNN` | Prueba de asignador con 50 llamadas paralelas sin colisión |
| Sin fecha futura ni hogares negativos | `domain.spec.ts` + especificaciones RTL del formulario + inyecciones de QA |
| GPS gratuito, sin API key | `BrowserGpsService` sobre `navigator.geolocation` con razones de fallo tipadas |
| CSV sin imágenes | Exportador RFC 4180 con BOM + CRLF y campos entrecomillados |
| Base de datos lista para Supabase | `supabaseSchema.sql`: enums, secuencias, triggers, CHECKs, RLS, B-Tree e índices GIN |
