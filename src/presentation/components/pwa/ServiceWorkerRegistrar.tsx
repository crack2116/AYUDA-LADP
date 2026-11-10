"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes the app installable. Only runs in
 * production so the dev server is never shadowed by a cached worker.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is best effort; the app keeps working without it.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
