(() => {
  const textarea = document.getElementById('input') as HTMLTextAreaElement | null;
  const clearBtn = document.getElementById('clear') as HTMLButtonElement | null;

  if (clearBtn && textarea) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      textarea.focus();
    });
  }

  if (textarea) {
    textarea.focus();
  }
})();
