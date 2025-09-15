// Service worker (background) for PhraseBE
self.addEventListener('install', () => {
  // Skip waiting for immediate activation on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients so the service worker starts controlling open pages
  event.waitUntil(self.clients.claim());
});
