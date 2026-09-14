// Service worker de Cuotafit — cachea el shell de la app para que el check-in
// funcione sin internet. Estrategia:
//  - navegaciones (páginas): network-first, con fallback a caché.
//  - assets estáticos same-origin (/_next/...): stale-while-revalidate.
//  - todo lo demás (Supabase, fuentes, etc.): pasa directo a la red.
const CACHE = "cuotafit-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navegaciones: network-first con fallback a caché (para abrir /checkin offline).
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(req)) || (await cache.match("/checkin")) || (await cache.match("/login")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Solo cacheamos assets estáticos del propio origen.
  if (!sameOrigin) return;
  if (!url.pathname.startsWith("/_next/") && url.pathname !== "/manifest.webmanifest" && url.pathname !== "/icon.svg") return;

  // Stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetching = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fetching;
    })(),
  );
});
