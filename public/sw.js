const CACHE_NAME = "scanova-v2";

// Files to cache immediately
const STATIC_ASSETS = [
  "/login",
  "/manifest.json",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

// ── Install ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
});

// ── Activate ────────────────────────────────────────
self.addEventListener("activate", (event) => {
  self.clients.claim();

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // remove old caches
          }
        }),
      ),
    ),
  );
});

// ── Fetch ───────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api")) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  // 3. Handle navigation requests (pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Save a copy in cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cached) => {
            return cached || caches.match("/login");
          });
        }),
    );
    return;
  }

  // 4. Handle static assets (cache-first)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // Optional fallback for assets
            return null;
          })
      );
    }),
  );
});