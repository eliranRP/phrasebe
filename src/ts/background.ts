// Store the last selected text
let lastSelectedText = '';

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

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'textSelected') {
    lastSelectedText = message.payload;
    console.log('Text selected:', lastSelectedText);
  }
});

// Listen for messages from popup requesting selected text
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSelectedText') {
    sendResponse({ selectedText: lastSelectedText });
  }
});
