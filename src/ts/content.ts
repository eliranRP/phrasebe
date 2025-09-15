(() => {
  function sendSelectionIfAny(): void {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (selectedText.length > 0) {
      try {
        chrome.runtime.sendMessage({ type: 'textSelected', payload: selectedText });
      } catch (_err) {
        // ignore in non-extension contexts
      }
    }
  }

  document.addEventListener('mouseup', sendSelectionIfAny);
  document.addEventListener('keyup', sendSelectionIfAny);
})();
