// Store the last selected text
let lastSelectedText: string = '';

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', () => {
  sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(sw.clients.claim());
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
