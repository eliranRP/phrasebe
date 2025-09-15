// Store the last selected text
let lastSelectedText: string = '';

self.addEventListener('install', () => {
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil((self as unknown as ServiceWorkerGlobalScope).clients.claim());
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: any) => {
  if (message && message.type === 'textSelected') {
    lastSelectedText = String(message.payload || '');
    console.log('Text selected:', lastSelectedText);
  }
});

// Listen for messages from popup requesting selected text
chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (resp: any) => void) => {
  if (message && message.type === 'getSelectedText') {
    sendResponse({ selectedText: lastSelectedText });
  }
});
