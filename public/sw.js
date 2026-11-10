/*
 * Minimal service worker: keeps the app installable and degrades to a clear
 * offline response instead of a browser error page. It never caches HTML or
 * API payloads, so a stale build can never be served after a deploy.
 */
const OFFLINE_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Sin conexión — AYUDA LADP</title>
<style>
  html,body{margin:0;height:100%;font-family:system-ui,sans-serif;background:#071b3e;color:#fff}
  main{display:flex;height:100%;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
  h1{font-size:20px;margin:0}
  p{font-size:14px;color:#c7d2e5;margin:0}
  button{margin-top:8px;border:0;border-radius:12px;padding:10px 20px;font-weight:700;background:#f06a00;color:#fff}
</style></head>
<body><main>
  <h1>Sin conexión</h1>
  <p>No pudimos contactar el servidor. Revisá tu red e intentá de nuevo.</p>
  <button onclick="location.reload()">Reintentar</button>
</main></body></html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
      ),
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => Response.error()));
});
