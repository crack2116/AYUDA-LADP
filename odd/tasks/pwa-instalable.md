# Feature: PWA instalable + responsive total

## Objective
Que AYUDA LADP sea instalable como app (PWA) en celular y tablet, con el logo de
Asambleas de Dios como ícono, y que el login se adapte sin desbordes desde 320px
hasta 1920px.

## Problem
La app era solo una web responsive: al abrirla en el celular no había forma de
instalarla, no tenía ícono propio ni modo standalone, y en pantallas con notch el
contenido podía quedar bajo la barra del sistema.

## Why
El usuario la va a usar brigadas en campo desde el celular: necesita abrirla como
una app, no como una pestaña del navegador.

## Scope
- In: manifest, íconos (192/512/maskable/apple-touch), meta de iOS, service worker
  mínimo, safe-area insets, verificación 320→1920.
- Out: notificaciones push, sincronización offline de datos, cambios de producto.

## Tasks
- [x] T1 Generar íconos PNG desde el logo AD (192, 512, maskable 512, apple 180).
- [x] T2 Crear `src/app/manifest.ts` con display standalone, start_url `/login`.
- [x] T3 Registrar manifest, icons, appleWebApp y `viewportFit: cover` en `layout.tsx`.
- [x] T4 Service worker `public/sw.js` (sin caché de HTML) + registrar solo en producción.
- [x] T5 Safe-area insets en el panel del login; FAB más chico en móvil.
- [x] T6 Verificar 320/390/768/1024/1440/1920 sin `overflowX`.

## Acceptance criteria
- `GET /manifest.webmanifest` devuelve JSON válido con íconos 192 y 512.
- El `<head>` incluye manifest, apple-touch-icon y viewport-fit=cover.
- Ningún viewport de 320px a 1920px genera scroll horizontal.
- `pnpm test`, `tsc`, `eslint` y `pnpm build` en verde.

## Checks
- `pnpm test` → 161/161
- `pnpm exec tsc --noEmit` → OK
- `pnpm exec eslint src --max-warnings 0` → OK
- `pnpm build` → OK, ruta `/manifest.webmanifest` prerenderizada
- Capturas: `%TEMP%\opencode\vp-{320,390,768,1024,1440,1920}.png`

## Progress
Instalable en localhost/HTTPS con build de producción (`pnpm build && pnpm start`);
en `next dev` el service worker no se registra a propósito.

## Next step
Commit del bloque PWA y prueba real de instalación desde un Android/iOS en la red
local (`http://192.168.1.7:3002` requiere HTTPS para el install prompt).
