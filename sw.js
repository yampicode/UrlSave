// Simple SW con precache + runtime cache
const CACHE_NAME = "marcadores-cache-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/main.js",
  "/manifest.json",
  "/sw.js"
  "/icofont.min.css",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.png",
  "/icon.png"
];

// Install: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: estrategia network-first para HTML, cache-first para estáticos
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // HTML/documents: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match("./")))
    );
    return;
  }

  // Estáticos del mismo origen: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
        );
      })
    );
    return;
  }

  // Favicons externos: cache con fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        }).catch(() => cached || new Response(null, { status: 408 }))
      );
    })
  );
});