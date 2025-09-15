(function () {
  const textarea = document.getElementById('input');
  const clearBtn = document.getElementById('clear');

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      textarea.focus();
    });
  }

  if (textarea) {
    textarea.focus();
  }
})();
