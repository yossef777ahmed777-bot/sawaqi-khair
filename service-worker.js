const CACHE_NAME = "sawaqi-al-khair-v5"; // احرص على تغيير الرقم (v4, v5, ...) مع كل تحديث رئيسي ترفعه للموقع
const BASE = "/sawaqi-al-khair/";

const CORE = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
];

// 1. تثبيت Service Worker الجديد فوراً وتخزين الملفات الأساسية
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .catch(() => {})
  );
  self.skipWaiting();
});

// 2. تفعيل النسخة الجديدة وحذف أي كاش قديم تماماً
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
  // السيطرة على كافة الصفحات المفتوحة فوراً دون انتظار إغلاق المتصفح
  event.clients.claim();
});

// 3. التعامل مع طلبات الشبكة والملفات
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // تجاهل الطلبات القادمة من مواقع خارجية (مثل Google Fonts أو Analytics)
  if (url.origin !== self.location.origin) return;

  // أ. معالجة صفحات HTML والمسار الرئيسي: الشبكة أولاً مع منع كاش المتصفح القديم
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === BASE
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => 
          caches.match(event.request).then(cached => cached || caches.match(BASE))
        )
    );
    return;
  }

  // ب. معالجة باقي الملفات (الصور، الأيقونات، إلخ): الإنترنت أولاً وعند عدم توفره يتم جلبها من الكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

