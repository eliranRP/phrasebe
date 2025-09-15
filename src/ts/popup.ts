(() => {
  const textarea = document.getElementById('input') as HTMLTextAreaElement | null;
  const clearBtn = document.getElementById('clear') as HTMLButtonElement | null;

  const getSelectedText = () => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
    chrome.runtime.sendMessage({ type: 'getSelectedText' }, (response: any) => {
      if (response && typeof response.selectedText === 'string' && textarea) {
        const currentText = textarea.value;
        const newText = currentText ? `${currentText}\n\n${response.selectedText}` : response.selectedText;
        textarea.value = newText;
        textarea.focus();
      }
    });
  };

  if (clearBtn && textarea) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      textarea.focus();
    });
  }

  if (textarea) {
    textarea.focus();
    getSelectedText();
  }
})();
