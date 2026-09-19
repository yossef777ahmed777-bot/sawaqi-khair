const CACHE_NAME = "sawaqi-al-khair-v3";
const BASE = "/sawaqi-al-khair/";

const CORE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
];

// تثبيت Service Worker الجديد
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .catch(() => {})
  );

  self.skipWaiting();
});

// تفعيل النسخة الجديدة وحذف الكاش القديم
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// التعامل مع طلبات الملفات
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // تجاهل الملفات القادمة من مواقع خارجية
  if (url.origin !== self.location.origin) return;

  // صفحات HTML يجب أن تحصل دائمًا على أحدث نسخة من السيرفر
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === BASE
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: "no-store"
      })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, copy))
              .catch(() => {});
          }

          return response;
        })
        .catch(() =>
          caches.match(event.request)
            .then(response =>
              response || caches.match(BASE)
            )
        )
    );

    return;
  }

  // باقي الملفات: الإنترنت أولًا، والكاش عند عدم وجود الإنترنت
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(() =>
        caches.match(event.request)
      )
  );
});
