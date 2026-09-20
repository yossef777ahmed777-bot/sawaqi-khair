const CACHE_VERSION = "sawaqi-khair-auto-v3";
const BASE = "/sawaqi-khair/";

const CORE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
];

// تثبيت النسخة الجديدة فوراً
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE))
      .catch(() => {})
  );
  self.skipWaiting();
});

// تفعيل وحذف الكاش القديم فوراً
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// جلب الملفات بذكاء: الـ Service Worker نفسه لا يتم عمل كاش له أبداً
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // صفحات HTML وملف الـ Service Worker نفسه: من الشبكة دائماً أولاً
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.includes("service-worker.js") ||
    url.pathname === BASE
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(BASE)))
    );
    return;
  }

  // باقي الملفات الثابتة
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
