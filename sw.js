const CACHE_NAME = 'life-timeline-v18'; // Dashboard functionality restored
console.log('LifeStory App Version: 16.0');
console.log('SW v5: Activating force clear...');
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './styles_multitrack.css',
    './styles_battery_final.css',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Fetch event (Network first, fallback to cache)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Activate event (clean up ALL old caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // CAUTION: Clearing all caches to force update
                    return caches.delete(cache);
                })
            ).then(() => self.clients.claim());
        })
    );
});

