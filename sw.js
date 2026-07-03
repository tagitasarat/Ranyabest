// Service Worker — ร้านยา Best
// index.html ใช้ network-first (deploy ใหม่แล้วเห็นทันที, offline ใช้ตัวที่แคชไว้)
// ไฟล์อื่น (ไลบรารี/ไอคอน) ใช้ cache-first
const CACHE = 'ranyabest-v1';
const ASSETS = ['./', './index.html', './zxing.min.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // จัดการเฉพาะไฟล์ในเว็บเราเอง — JSONP/รูปจาก Google ปล่อยผ่านตามปกติ
  if (url.origin !== location.origin || e.request.method !== 'GET') return;

  if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    // network-first: ได้ตัวใหม่เสมอ, เน็ตล่มค่อยใช้แคช
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // cache-first สำหรับไฟล์คงที่
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
