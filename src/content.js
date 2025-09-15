(function () {
  function sendSelectionIfAny() {
    var selection = window.getSelection();
    var selectedText = selection ? String(selection).trim() : '';
    if (selectedText) {
      try {
        chrome.runtime.sendMessage({ type: 'textSelected', payload: selectedText });
      } catch (e) {
        // ignore
      }
    }
  }

  document.addEventListener('mouseup', sendSelectionIfAny);
  document.addEventListener('keyup', sendSelectionIfAny);
})();
