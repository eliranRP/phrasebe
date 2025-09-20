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

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  if (command === 'open-translate-box') {
    // Send message to active tab to trigger translation
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'trigger-translation'
        });
      }
    });
  }
});