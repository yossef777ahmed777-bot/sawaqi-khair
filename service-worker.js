const CACHE_NAME = "sawaqi-khair-v4";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// تثبيت النسخة الجديدة
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES))
      .catch(() => {})
  );

  self.skipWaiting();
});

// حذف الكاش القديم وتفعيل النسخة الجديدة
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

// التعامل مع الطلبات
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // لا تعمل Cache لطلبات Firebase أو الخدمات الخارجية
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firebaseapp.com")
  ) {
    return;
  }

  // الملفات الخاصة بالموقع:
  // حاول جلب أحدث نسخة من الإنترنت أولًا،
  // ولو الإنترنت غير متاح استخدم النسخة المخزنة.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy).catch(() => {});
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match("./index.html");
        });
      })
  );
});
