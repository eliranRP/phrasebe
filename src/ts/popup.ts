(() => {
  const textarea = document.getElementById('input') as HTMLTextAreaElement | null;
  const clearBtn = document.getElementById('clear') as HTMLButtonElement | null;

  // Function to get selected text from background script
  const getSelectedText = () => {
    chrome.runtime.sendMessage({ type: 'getSelectedText' }, (response) => {
      if (response && response.selectedText && textarea) {
        // Append selected text to existing content
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
    
    // Get selected text when popup opens
    getSelectedText();
  }
})();
