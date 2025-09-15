(function () {
  const textarea = document.getElementById('input');
  const clearBtn = document.getElementById('clear');

  function getSelectedText() {
    try {
      chrome.runtime.sendMessage({ type: 'getSelectedText' }, (response) => {
        if (response && response.selectedText && textarea) {
          const currentText = textarea.value || '';
          const newText = currentText ? currentText + '\n\n' + response.selectedText : response.selectedText;
          textarea.value = newText;
          textarea.focus();
        }
      });
    } catch (e) {
      // ignore
    }
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (textarea) {
        textarea.value = '';
        textarea.focus();
      }
    });
  }

  if (textarea) {
    textarea.focus();
    getSelectedText();
  }
})();
