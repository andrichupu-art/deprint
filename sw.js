// ===== DEPRINT Service Worker =====
// Strategi: NETWORK FIRST + Auto Clear Cache Lama
// Setiap kali ada versi baru (CACHE_VERSION berubah), semua cache lama otomatis dihapus.

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = 'deprint-cache-' + CACHE_VERSION;

const ASSETS_TO_CACHE = [
    './CETAK_BON_v8.html',
    './manifest.json',
    './LOGO_SJ.png'
];

// ===== INSTALL: simpan asset dasar ke cache =====
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
            .then(() => self.skipWaiting())
    );
});

// ===== ACTIVATE: hapus semua cache versi lama (auto clear cache) =====
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ===== FETCH: NETWORK FIRST, fallback ke cache jika offline =====
self.addEventListener('fetch', (event) => {
    // Hanya tangani request GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Update cache dengan response terbaru dari network
                const resClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, resClone);
                });
                return networkResponse;
            })
            .catch(() => {
                // Offline / network gagal -> ambil dari cache
                return caches.match(event.request).then((cached) => {
                    return cached || caches.match('./CETAK_BON_v8.html');
                });
            })
    );
});

// ===== Auto clear cache saat menerima pesan dari halaman (manual trigger) =====
self.addEventListener('message', (event) => {
    if (event.data === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            cacheNames.forEach((name) => caches.delete(name));
        });
    }
});
