self.addEventListener('install', () => {
  // Skip waiting for immediate activation on install
  // @ts-ignore - TS doesn't know skipWaiting on ServiceWorkerGlobalScope
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    // @ts-ignore - TS doesn't know clients on ServiceWorkerGlobalScope
    (self as unknown as ServiceWorkerGlobalScope).clients.claim()
  );
});
