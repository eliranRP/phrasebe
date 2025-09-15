// Store the last selected text
let lastSelectedText = '';

self.addEventListener('install', () => {
  // Skip waiting for immediate activation on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients so the service worker starts controlling open pages
  event.waitUntil(self.clients.claim());
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'textSelected') {
    lastSelectedText = message.payload || '';
    console.log('Text selected:', lastSelectedText);
  }
});

// Listen for messages from popup requesting selected text
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'getSelectedText') {
    sendResponse({ selectedText: lastSelectedText });
  }
});
