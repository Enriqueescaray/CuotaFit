"use client";

import { useEffect } from "react";

// Registra el service worker (solo en producción, para no interferir con el HMR de dev).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registro fallido: la app sigue funcionando online */
    });
  }, []);
  return null;
}
