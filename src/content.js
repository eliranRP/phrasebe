(function () {
  // ------- Selection forwarding (kept) -------
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

  // ------- Floating Bubble & Chat -------
  var bubble = document.createElement('div');
  bubble.className = 'phrasebe-bubble';
  bubble.textContent = 'Rephrase';
  document.documentElement.appendChild(bubble);

  var chat = document.createElement('div');
  chat.className = 'phrasebe-chat';
  chat.innerHTML = '' +
    '<div class="phrasebe-chat-header">' +
      '<span>BePhrase</span>' +
      '<button class="phrasebe-button" data-close>✕</button>' +
    '</div>' +
    '<div class="phrasebe-chat-body">' +
      '<textarea class="phrasebe-chat-textarea" placeholder="Type here..."></textarea>' +
    '</div>' +
    '<div class="phrasebe-chat-actions">' +
      '<button class="phrasebe-button" data-cancel>Cancel</button>' +
      '<button class="phrasebe-button primary" data-send>Send</button>' +
    '</div>';
  document.documentElement.appendChild(chat);

  var lastMouse = { x: 0, y: 0 };
  var currentEditable = null;

  // Track mouse for bubble placement
  document.addEventListener('mousemove', function (e) {
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
  }, true);

  // Show bubble when entering editable areas
  function isEditable(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function position(el, x, y) {
    el.style.left = Math.max(8, x + 12) + 'px';
    el.style.top = Math.max(8, y + 12) + 'px';
  }

  document.addEventListener('mouseover', function (e) {
    var target = e.target;
    if (isEditable(target)) {
      currentEditable = target;
      position(bubble, lastMouse.x, lastMouse.y);
      bubble.style.display = 'inline-flex';
    } else if (!chat.contains(target) && target !== bubble) {
      bubble.style.display = 'none';
    }
  }, true);

  // Keep bubble near cursor while over editable
  document.addEventListener('mousemove', function () {
    if (bubble.style.display !== 'none') {
      position(bubble, lastMouse.x, lastMouse.y);
    }
  }, true);

  // Open chat on bubble click
  bubble.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var x = lastMouse.x, y = lastMouse.y;
    position(chat, x, y);
    chat.style.display = 'block';
    var ta = chat.querySelector('.phrasebe-chat-textarea');
    if (ta) { ta.focus(); }
  });

  // Chat actions
  chat.addEventListener('click', function (e) {
    var target = e.target;
    if (!(target instanceof Element)) return;
    if (target.matches('[data-close], [data-cancel]')) {
      chat.style.display = 'none';
      return;
    }
    if (target.matches('[data-send]')) {
      var ta = chat.querySelector('.phrasebe-chat-textarea');
      var value = ta && ta.value ? ta.value : '';
      // In a later step we can wire this to Google AI API.
      // For now, if there is an active editable, insert text.
      if (currentEditable && value) {
        try {
          if (currentEditable.tagName && currentEditable.tagName.toLowerCase() === 'textarea') {
            currentEditable.value = value;
          } else if (currentEditable.tagName && currentEditable.tagName.toLowerCase() === 'input') {
            currentEditable.value = value;
          } else if (currentEditable.isContentEditable) {
            currentEditable.innerText = value;
          }
        } catch (_) {}
      }
      chat.style.display = 'none';
    }
  });

  // Dismiss on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && chat.style.display !== 'none') {
      chat.style.display = 'none';
    }
  });
})();
