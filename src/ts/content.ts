(() => {
  // Listen for text selection events
  document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      // Send selected text to background script
      chrome.runtime.sendMessage({
        type: 'textSelected',
        payload: selectedText
      }).catch((error) => {
        console.log('Message send failed:', error);
      });
    }
  });

  // Also listen for keyboard selection (Shift+Arrow keys, Ctrl+A, etc.)
  document.addEventListener('keyup', () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      chrome.runtime.sendMessage({
        type: 'textSelected',
        payload: selectedText
      }).catch((error) => {
        console.log('Message send failed:', error);
      });
    }
  });
})();
