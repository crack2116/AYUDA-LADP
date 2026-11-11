# Feature: Panel Nacional full-bleed y visual limpio

## Objective
Rehacer el Dashboard Nacional (`/jefatura`) para que ocupe todo el ancho disponible
sin márgenes laterales y con una jerarquía visual limpia: tarjetas sin bordes,
tipografía más grande y componentes que se adaptan de 320 px a 1920 px.

## Problem
El panel estaba centrado con `max-w-[1440px]`, así que en 1920 px quedaban ~380 px
vacíos de cada lado. Además el hero acumulaba logo de 68 px, silueta de mapa, cuatro
líneas de texto y tres píldoras; y cada bloque (KPI, gráficos, filtros, tabla) tenía
borde, sombra distinta y ruido interno (sparklines, píldoras, chips).

## Why
Es la pantalla principal de Jefatura Nacional: se proyecta en pantallas grandes y se
consulta desde tablet y celular. El espacio desperdiciado y el exceso de bordes hacían
difícil leer los indicadores.

## Scope
- In: shell (`RoleShell`), hero, tarjetas KPI, gráficos, barra de filtros, chips de
  fecha/región, tabla de incidencias, barra de pestañas, footer, logo compartido
  (`BrandMark`).
- Out: `SupervisionMandosTab`, `IncidenciasCampoTab`, `RegistroTacticoTab` (se
  rediseñan en otra iteración), datos, lógica de negocio, RBAC.

## Tasks
- [x] T1 `RoleShell`: `main` full-bleed (sin `max-w`), padding progresivo y
      `pb-16` en el aside para que la barra de QA no tape el selector de rol.
      Route: inline. Evidence: `w-full flex-1 px-3 pt-3 pb-24 … 2xl:px-6`.
- [x] T2 `BrandMark` compartido (logo AD en disco blanco con aro) reutilizado en
      login, sidebar y hero. Route: inline (extracción mecánica).
- [x] T3 Hero: de 5 bloques a 2 (identidad + estado/exportar); se elimina silueta,
      grilla de puntos, franja DINAPROS y píldoras de fecha redundantes.
- [x] T4 KPI: 6 tarjetas sin borde, número 28 px, etiqueta uppercase y caption;
      grid `2 → 3 → 6` columnas. Se conservan los 6 `data-testid`.
- [x] T5 Gráficos: paneles sin borde, leyenda plana, toggle `Ámbito Nacional /
      Por Cuenca` (texto conservado por contrato de test).
- [x] T6 Filtros y tabla: campos `bg-[#f2f6fc]` sin borde, `thead` claro en lugar de
      azul marino, filas con hover suave. Se conserva `data-testid="incidencia-row"`.
- [x] T7 Pestañas: una fila con scroll en móvil y 6 columnas iguales en desktop.
- [x] T8 Verificación responsive 320/390/768/1024/1440/1920 sin scroll horizontal.
- [x] T9 Chips reales de filtro (`JefaturaQuickFilters`) publicados en la barra superior
      del shell mediante `ShellHeaderSlot` (portal + contexto): el panel conserva el
      estado, el shell sólo presta el espacio. Calendario mensual con puntos naranjas en
      los días con incidencias, acciones `Todas las fechas` / `Hoy`, y selector de ámbito
      con las 25 regiones del Perú (`PERU_REGIONS`) más `Nivel Nacional`. Route: inline
      (2 componentes nuevos). Evidence: `data-testid="filtro-fecha"` / `"filtro-region"`,
      26 opciones.
- [x] T10 Filtro por día exacto (`incidencia.fechaSuceso`) y ámbito por coincidencia
      sobre `region + nombre + sector` (`matchesRegion`), porque los datos demo usan
      etiquetas compuestas (`"Piura / Norte"`). `selectedFecha` entra en
      `filteredRows` y en `Restablecer`.
- [x] T11 Se elimina el `<select>` de Región de `JefaturaFilterBar` (duplicaba el chip)
      y se rebalancea la grilla a 4/4/2/2 columnas.
- [x] T12 Se eliminan las píldoras estáticas del header del shell (`FEB 2026`,
      `Nivel Nacional (Todas las Regiones)`, `Usuarios Jefatura Activos`): mostraban
      datos fijos y contradecían a los chips reales. El período del hero y de la tabla
      ahora se deriva de los datos (`formatPeriodoLabel`).
- [x] T12b Header a una sola fila: chips 305 px + bloque de usuario 243 px no entraban
      entre 768 y 834 px (la fila saltaba a 104 px). De 768 a 1023 px se oculta el
      nombre/rol del usuario (`md:hidden lg:block`) y la fila queda en 56 px; el slot usa
      `empty:hidden`, así las otras dos vistas no ganan altura.
- [x] T13 Contrato de test: día con incidencias, 26 opciones de región, Piura = 7 filas,
      Lima = estado vacío y `Restablecer` = 9 filas.
- [x] T14 Sin precisión inventada: el bloque lateral `Últ. Act. Estadísticas`
      (`Hora: 14:30`, `12/02/2026`, `01:20:45`, `SAT-LINK ENCR 256B`, `99.4%`) pasa a un
      reloj real en `America/Lima` resuelto tras el montaje (sin desajuste de hidratación).
      Las series fijas del gráfico regional (`93/92/84/66/62` con severidades
      `EXTREMO/ALTO/…`) se derivan ahora de `rows` agrupando por `region` o `sector`;
      se elimina el fallback inventado del donut y los textos `SAT-LINK` /
      `100% cobertura`. El centro del donut muestra el conteo real de reportes.
- [x] T15 Jerarquía de indicadores: los seis KPI idénticos pasan a una sola superficie con
      una cifra dominante (46-52 px), dos contadores secundarios (26 px) y tres
      referencias en lista. Sin icono por tarjeta, sin sombra por tarjeta, grilla de 2
      columnas en móvil. Se conservan los seis `data-testid`.
- [x] T16 Test de no regresión: el desglose regional sale de los datos y las series
      inventadas (`Tumbes (Frontera Norte)`, `Cuenca Río Piura`, `93 incidencias`) ya no
      se renderizan.
- [x] T17 Disciplina de paleta: se declaran tokens en `@theme` (`brand-ink`, `brand-deep`,
      `brand-blue`, `brand-soft`, `brand-mist`, `brand-positive`, `brand-negative`) y los
      ~51 hex duplicados del dashboard se colapsan en ellos; el naranja/ámbar reutilizan
      `ladp-orange` / `ladp-amber` y los neutros pasan a la escala `slate`. El ramp del
      donut (`#38bdf8`, `#f59e0b`, `#ea580c`, `#e11d48`, `#1e3a8a`) se sustituye por seis
      pasos de un solo azul, y el riel por `brand-soft`. El FAB de soporte pierde su
      gradiente hardcodeado `#ff9a3c → #e05f00` y el `ring-4` blanco.
      Route: inline (script de normalización por archivo). Evidence: `globals.css` `@theme`.
- [x] T18 Dos radios: contenedores `rounded-xl`, controles `rounded-lg`; `rounded-full`
      queda sólo para badges de estado, avatares, puntos y barras finas. Chips de filtro,
      tabs, toggle de gráficos y botones de la tabla dejan de ser píldoras. El hero pierde
      el gradiente radial, el glow azul y el glow rosa: fondo sólido `brand-deep` y CTA
      naranja plano, sin sombra. La nav activa del shell pasa a `bg-brand-blue` sin
      gradiente ni `ring`.
- [x] T19 Peso tipográfico: los 20 `font-black` (900) del alcance del dashboard pasan a
      `font-bold` (700) — hero, tabla, chips, gráficos, barra de filtros, pestañas, shell y
      widget de soporte. Con una sola familia, 900 engrosaba etiquetas y cifras hasta
      volverlas manchas. Route: inline (script por archivo, sin reemplazos globales).
- [x] T20 Se elimina el badge `Nivel 4 · Rojo operacional` del hero. No existe ningún
      campo de nivel, alerta ni severidad en `domain/` ni en `application/`; derivarlo de
      los datos habría inventado un umbral y además duplicaba el conteo de validación que
      ya muestran los KPI (`4 de 9`). El hero queda en identidad + acción (exportar), que
      era el objetivo de T3. Si más adelante hace falta un nivel de emergencia, tiene que
      venir de un campo declarado por autoridad, no de una fórmula de UI.

## Acceptance criteria
- En 1920 px el contenido llega a ambos bordes del área útil (sin franjas vacías).
- Ningún panel del dashboard usa `border` como separador principal.
- Los `data-testid` de KPI, tabla y exportación siguen existiendo.
- `pnpm test`, `tsc`, `eslint` y `pnpm build` en verde.

## Checks
- `pnpm exec tsc --noEmit` → OK
- `pnpm exec eslint src --max-warnings 0` → OK
- `pnpm test:coverage` → 167/167 en 11 archivos (`87.79% Stmts`, `83.4% Branch`, `88.86% Funcs`, `87.79% Lines`)
- `pnpm build` → OK
- Auditoría de tokens en las 3 pestañas secundarias (`SupervisionMandosTab`, `IncidenciasCampoTab`, `RegistroTacticoTab`): `0` `font-black`, `0` `rounded-2xl`/`rounded-3xl`, `0` tokens Material heredados (`surface-container-*`, `on-surface*`, `primary`, `secondary`).
- Playwright runtime sobre `/jefatura` (`1440×900` y `390×844`) en `Dashboard Nacional`, `Supervisión de Mandos`, `Incidencias de Campo` y `Registro Táctico`: `overflowX=false` en los 4 tabs y 2 viewports, `0` errores de consola y `0` errores de página.
- Capturas previas de filtros (`%TEMP%\opencode\jef-filters-{390,768,1920}.png`, `jef-final-1440.png`): `overflowX=false`, header en una fila de 56 px, filtros E2E y reloj Lima verificados.

## Progress
Dashboard Nacional y pestañas secundarias (`SupervisionMandosTab`, `IncidenciasCampoTab`
y `RegistroTacticoTab`) unificados bajo la misma paleta (`brand-*`, `ladp-*`, `slate-*`),
dos radios (`rounded-xl` tarjetas / `rounded-lg` controles) y tres pesos tipográficos
(400/600/700, sin `font-black`), eliminando además el doble header oscuro redundante en
`RegistroTacticoTab` y los IDs ficticios solicitados (`INC-2026-00143` + marca fija en
`RegistroTacticoTab`, `REF: COEN-PE-N993-2026` en `IncidenciasCampoTab`, y
`COBERTURA FEN-2026`, `INC-DIRECTIVA-04` y `AUTH-SEC-2026-FALCON` en
`SupervisionMandosTab`).

## Deuda conocida
- Las pestañas secundarias (`SupervisionMandosTab`, `IncidenciasCampoTab`,
  `RegistroTacticoTab`) mantienen arreglos locales estáticos (`OFFICERS_ROSTER`,
  `HOTSPOTS_DATA`, `GEOGRAPHIC_DATA` y métricas operativas de referencia como `124ms` /
  `412 Estaciones`) hasta que se conecten a casos de uso y repositorios reales de
  `application/` y `infrastructure/`.
- El FAB de soporte (`fixed bottom-20 right-4`) puede solaparse visualmente con el
  borde derecho de controles cuando el flujo cae a esa altura en desktop (`1440×900`).

## Next step
Conectar `SupervisionMandosTab`, `IncidenciasCampoTab` y `RegistroTacticoTab` con
casos de uso reales sobre `IncidentRepository` y persistencia real de borradores.
