// PhraseBE Background Script - Clean Implementation

// Basic message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Simple response
  sendResponse({ success: true, message: 'Background script is working' });
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('PhraseBE extension started');
});

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('PhraseBE extension installed');
});