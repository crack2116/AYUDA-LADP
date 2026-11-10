# AYUDA LADP .com

AYUDA LADP es un sistema de alertas y respuesta humanitaria diseñado para emergencias por inundaciones,
deslizamientos y otros eventos asociados al Fenómeno El Niño en Perú. Las brigadas de campo registran
incidencias, los coordinadores regionales validan la existencia real de cada reporte y la jefatura
nacional monitorea un panel de situación en tiempo real con seis KPIs estratégicos. El MVP está
optimizado para trabajo de campo en zonas de baja conectividad: cada registro se guarda primero en el
navegador, las validaciones se ejecutan antes de persistir y la interfaz no depende de servicios de
pago de mapas, GPS ni imágenes.

> Sistemas de Alertas y Respuesta Humanitaria · DINAPROS · Perú

## Qué hace el producto

- **Asistente (brigada de campo):** buscador autocompletable de centros poblados, alerta de duplicados
  y existencia con códigos `INC` recientes, siete tipos de afectación, conteo entero de hogares, ocho
  necesidades críticas, selector de fecha "ocurrido hoy", captura de GPS gratuito mediante la API del
  navegador, notas de referencia y tarjeta de confirmación con código de auditoría `INC-YYYY-NNNNN`.
- **Coordinador (zona regional):** centros poblados asignados a su jurisdicción, tabla de incidencias de
  la región, acción de un clic para `Validar Existencia` y exportación a CSV por área.
- **Jefatura (ámbito nacional):** seis tarjetas de KPIs ejecutivos, tres pestañas de análisis
  (incidencias nacionales, rendimiento de coordinadores, actividad de asistentes) y exportación a CSV
  nacional consolidado.
- **Para todos los usuarios:** widget flotante de chat de soporte técnico accesible desde `/login` y
  todas las vistas de rol, más una barra desplegable de pruebas QA para demostrar el rechazo de datos
  inválidos en vivo.

## Modelo de roles y permisos

| Rol | Alcance | Ruta de inicio | Permisos principales |
| --- | --- | --- | --- |
| `jefatura` | Nacional | `/jefatura` | Lectura global, validar, exportar, consultar KPIs, auditar coordinadores y usuarios |
| `coordinador` | Región propia y centros asignados | `/coordinador` | Lectura de su zona, validar, exportar, consultar métricas de área |
| `asistente` | Únicamente reportes creados por su brigada | `/incidencias/nuevo` | Crear y consultar sus propios reportes |

La autorización sigue el principio de denegación por defecto (`src/domain/permissions/rbac.ts`). La
pantalla de inicio de sesión valida además que la jurisdicción coincida con la cuenta: `nacional` para
Jefatura, `piura_norte` o `sur_centro` para Coordinación, y `campo` para brigadas de asistencia. Si la
jurisdicción no coincide, el acceso es rechazado antes de crear la sesión.

## Árbol de Clean Architecture (Arquitectura Limpia)

```text
src/
├─ domain/                 TypeScript puro: entidades, esquemas Zod, RBAC, código de auditoría,
│                          ventana de duplicados, cálculo de KPIs, utilidades de fecha y GPS.
├─ application/            Puertos y casos de uso. Retorna resultados tipados (Result), sin lanzar excepciones.
│  ├─ ports/               Auth, incidencia, centro poblado, tickets, allocador, GPS, CSV, caché.
│  └─ use-cases/           Login, crear/verificar/validar incidencia, listados, KPIs, CSV, tickets.
├─ infrastructure/         Adaptadores y raíz de composición (Composition Root).
│  ├─ cache/               Guardas de localStorage/sessionStorage y LocalStorageCache.
│  ├─ csv/                 Exportador RFC 4180 con BOM + CRLF para compatibilidad con Excel.
│  ├─ db/                  DDL SQL listo para PostgreSQL / Supabase.
│  ├─ gps/                 Adaptador BrowserGeolocation (nativo, gratuito, sin API key).
│  ├─ repositories/        Repositorios locales sobre almacenamiento con espacio de nombres.
│  ├─ seed/                Conjunto de datos semilla determinista y credenciales de demostración.
│  └─ container.ts         Raíz de composición + createTestContainer({ now }).
├─ presentation/           Vistas React, componentes modulares, hooks, buses de eventos y formateadores.
├─ app/                    Páginas del App Router de Next.js 15 y diseño raíz (layout).
└─ __tests__/              Suites unitarias y RTL con Vitest, más flujo E2E con Playwright.
```

La regla de dependencias apunta siempre hacia adentro: `domain` no importa nada de React, Next ni del
navegador; `application` depende exclusivamente de los puertos; `infrastructure` implementa dichos
puertos; y `presentation` interactúa con el sistema a través del contenedor de dependencias. Reemplazar
los adaptadores locales por Supabase no altera en absoluto la lógica de negocio del dominio ni los casos
de uso.

## Tokens de diseño

Los tokens `@theme` de Tailwind CSS v4 están centralizados en `src/app/globals.css`:

| Token | Valor | Uso principal |
| --- | --- | --- |
| `ladp-navy-dark` | `#030b38` | Barra lateral, fondos oscuros |
| `ladp-navy` | `#071b3e` | Encabezado principal y panel de acceso |
| `ladp-cobalt` | `#002296` | Acciones primarias y enlaces |
| `ladp-cobalt-light` | `#0b318f` | Hover en botones primarios |
| `ladp-orange` | `#f06a00` | Alertas, llamadas a la acción (CTA), anillo de foco |
| `ladp-orange-light` | `#ff7a00` | Hover en llamadas a la acción |
| `ladp-amber` | `#ffb800` | Advertencias y acentos de demostración |
| `ladp-bg` | `#f4f7fb` | Fondo general de la aplicación |
| `ladp-surface` | `#ffffff` | Superficie de tarjetas y tablas |

Tipografías: Inter (sans) y JetBrains Mono (códigos de auditoría), con fuentes de respaldo del sistema.
La clase `.ladp-surface-card` es la utilidad compartida para contenedores. Los íconos provienen de
`lucide-react`, prescindiendo de dependencias de imágenes pesadas.

## Persistencia Local-First y datos semilla

El navegador actúa como base de datos en este MVP:

- `src/infrastructure/repositories/local-store.ts` asigna a cada clave el prefijo `ayuda-ladp:v1`,
  escribe en `localStorage` y mantiene un espejo en memoria para evitar fallos durante SSR o pruebas.
  La sesión puede utilizar `sessionStorage` cuando la opción "Mantener sesión" está desactivada.
- `src/infrastructure/seed/demo-data.ts` genera un conjunto de datos determinista anclado al reloj del
  sistema: 12 centros poblados, 11 perfiles (6 de Jefatura, 2 de Coordinación y 3 de Asistencia) y 9
  incidencias distribuidas en las últimas 70 horas. `ensureDemoSeed` inicializa los datos una sola vez
  por versión (`DEMO_SEED_VERSION`), de modo que recargar la página conserva los nuevos reportes y la
  secuencia de auditoría.
- El asignador de códigos de auditoría lee y actualiza `audit-sequence` en el mismo almacenamiento,
  garantizando que los códigos correlativos nunca se repitan tras recargar. Los datos semilla inician en
  `INC-YYYY-00009`; el siguiente reporte creado toma automáticamente `INC-YYYY-00010`.
- `resetDemoSeed(now)` reconstruye el conjunto de datos de demostración. Las pruebas limpian el estado
  vía `clearStore()` en `src/__tests__/setup.ts`.

Al funcionar de manera local, dos navegadores distintos no comparten datos y borrar los datos del sitio
reinicia la demo. Esta es una decisión arquitectónica deliberada para permitir pruebas completas sin
dependencias de nube obligatorias.

## Migración a Supabase (PostgreSQL 15)

El esquema SQL oficial está disponible en `src/infrastructure/db/supabaseSchema.sql`. Define el tipo enum
`user_role`, las tablas `centros_poblados`, `profiles`, `incidencias` (con restricciones CHECK),
`tickets_soporte`, la secuencia `incidencia_seq` con el disparador `generar_codigo_incidencia()`,
políticas RLS para los tres roles, índices B-Tree e índices GIN con `pg_trgm`.

1. Crear un proyecto en Supabase.
2. Abrir el **SQL Editor** y ejecutar `src/infrastructure/db/supabaseSchema.sql` en un solo bloque.
3. Copiar la cadena de conexión del **transaction pooler** (PgBouncer, modo transacción, puerto `6543`)
   para entornos serverless o Edge. Usar la conexión directa únicamente para migraciones que requieran
   funcionalidades a nivel de sesión. En modo transacción, desactivar el caché de declaraciones
   preparadas en el cliente (`prepare: false`).
4. Reemplazar los adaptadores locales en el contenedor de dependencias:

| Adaptador local | Reemplazo en la nube |
| --- | --- |
| `LocalAuthRepository` | Supabase Auth + adaptador de `profiles` (sesión/JWT en lugar de credenciales locales) |
| `LocalCentroPobladoRepository` | `supabase.from("centros_poblados")` |
| `LocalIncidenciaRepository` | `supabase.from("incidencias")`, incluyendo `markVerified` |
| `LocalSupportTicketRepository` | `supabase.from("tickets_soporte")` |
| `LocalAuditCodeAllocator` | Secuencia y trigger nativo de PostgreSQL tras la inserción |
| `LocalStorageCache` | Caché remoto opcional; la sesión la gestiona Supabase Auth |

Únicamente cambian `src/infrastructure/container.ts` y los archivos adaptadores. Los esquemas del dominio
y los casos de uso permanecen intactos gracias al desacoplamiento por puertos.

## Credenciales de demostración

Contraseña compartida: `ladp2026`. La pantalla de login incluye botones de autorelleno para cada rol:

| Botón | Identificador | Jurisdicción | Vista de destino |
| --- | --- | --- | --- |
| `login-demo-jefatura` | `JEF-001` | `nacional` | `/jefatura` |
| `login-demo-coordinador` | `COO-PN-01` | `piura_norte` | `/coordinador` |
| `login-demo-asistente` | `ASI-PN-01` | `campo` | `/incidencias/nuevo` |

Existen perfiles adicionales para alimentar los KPIs (`JEF-002` a `JEF-006`, `COO-SC-01`, `ASI-PN-02`,
`ASI-SC-01`), pero la interfaz muestra de forma directa los tres accesos de prueba principales.

## Scripts disponibles en pnpm

| Script | Descripción |
| --- | --- |
| `pnpm dev` | Inicia el servidor de desarrollo de Next.js con Turbopack en el puerto 3000 |
| `pnpm build` | Compila la aplicación para producción con Turbopack |
| `pnpm start` | Sirve la compilación de producción |
| `pnpm lint` | Ejecuta el linter ESLint en todo el proyecto |
| `pnpm typecheck` | Ejecuta la comprobación de tipos con `tsc --noEmit` |
| `pnpm test` | Ejecuta la suite de pruebas con Vitest |
| `pnpm test:watch` | Vitest en modo observador (watch) |
| `pnpm test:coverage` | Vitest con reporte de cobertura V8 con umbral mínimo del 80% |
| `pnpm test:e2e` | Ejecuta el flujo End-to-End con Playwright grabando video |

Las dependencias se gestionan con **pnpm 8+** (`pnpm-lock.yaml`).

## Pruebas y cobertura de código

```bash
pnpm test:coverage
```

Vitest se ejecuta bajo jsdom validando `src/domain`, `src/application`, `src/infrastructure` y
`src/presentation`. El umbral de cobertura está fijado en un **mínimo del 80% en sentencias, ramas,
funciones y líneas**, superado en todas las métricas (161 pruebas aprobadas). Las pruebas cubren cada
regla de validación, rutas de fallo en casos de uso, formato CSV, persistencia local y pruebas con
React Testing Library para login, formulario de incidencias, ambos paneles, chat y barra de QA.

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src --max-warnings 0
```

## Pruebas E2E con Playwright y grabación de video

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

`playwright.config.ts` configura un worker de Chromium con `video: "on"`, `trace: "retain-on-failure"`,
configuración regional `locale: "es-PE"` y zona horaria `America/Lima` sobre `http://127.0.0.1:3000`.

La prueba `flujo completo AYUDA LADP` recorre la experiencia completa:
1. Inicio de sesión y envío de ticket de soporte técnico.
2. Intento de reporte por asistente con las tres inyecciones de datos inválidos de la barra de QA.
3. Envío de reporte verídico con alerta de duplicados, resolución de GPS y asignación de código `INC`.
4. Validación de existencia por el coordinador regional y descarga del CSV de su zona.
5. Supervisión de KPIs ejecutivos, navegación por pestañas y descarga del CSV nacional por Jefatura.

El video de la ejecución se guarda automáticamente en:

```text
test-results/flujo-completo-flujo-completo-AYUDA-LADP-chromium/video.webm
```

## Barra de pruebas QA ("Probar Romper Módulo")

Ubicada en la parte inferior de la pantalla (`Modo Test 80%+ — Probar Romper Módulo`), permite simular
fallos de validación en el formulario de incidencias mediante eventos en `presentation/qa/qa-bus`:

1. **Hogares negativos / decimales (-25.5):** error de número entero, rechazo sin persistencia.
2. **Fecha futura (2027-12-31):** error de fecha futura, rechazo sin persistencia.
3. **Formulario vacío / incompleto:** errores de campos obligatorios, rechazo sin persistencia.

Ningún dato erróneo llega al repositorio ni altera el estado almacenado.

## Alcance delimitado del MVP

- **Sin proyecto Supabase en vivo obligatorio:** el esquema SQL y los contratos están listos, pero la
  ejecución por defecto es local-first.
- **Sin proveedor de identidad externo:** las credenciales de demostración se validan mediante el puerto
  de autenticación sin depender de servicios de terceros.
- **Exportación CSV optimizada:** formato ligero con BOM y CRLF para Excel, sin dependencias pesadas de
  generación de PDF o almacenamiento de imágenes.
- **Sin sincronización en segundo plano entre dispositivos:** los datos residen en el perfil del
  navegador correspondiente.

## Puesta en marcha rápida

```bash
pnpm install
pnpm dev
```

Ingresar a `http://127.0.0.1:3000/login`, seleccionar un rol de demostración y comenzar las pruebas con
los datos precargados de Piura y regiones afectadas.
