const CACHE_NAME = "sawaqi-khair-runtime-v1";

self.addEventListener("install", () => {
  // تفعيل النسخة الجديدة فور تحميلها
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // التحكم فقط في فتح صفحات الموقع.
  // Firebase والملفات الخارجية تعمل بشكل طبيعي.
  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          return cached || caches.match("/sawaqi-khair/");
        });
      })
  );
});
