// Functional TypeScript implementation for PhraseBE Chrome Extension - Gmail Focus

// Type definitions
interface TextSelectedMessage {
  type: 'textSelected';
  payload: string;
}

interface MousePosition {
  x: number;
  y: number;
}

interface EditableElement {
  element: HTMLElement;
  type: 'textarea' | 'input' | 'contenteditable';
}

interface BubbleElement extends HTMLDivElement {
  style: CSSStyleDeclaration;
}

interface TextReplacementResult {
  success: boolean;
  element: HTMLElement | null;
  originalText: string;
  newText: string;
}

interface GmailState {
  currentElement: HTMLElement | null;
  typingTimer: number | null;
  isTyping: boolean;
  lastCursorPosition: MousePosition | null;
}

// Constants
const CONSTANTS = {
  ICON_PATH: 'assets/icons/papaer_airplane.png',
  REPLACEMENT_TEXT: 'Hi mom how are you?',
  TYPING_DELAY: 1000, // 1 second after stopping typing
  INPUT_DEBOUNCE: 300,
  MAX_INPUT_LENGTH: 10000,
  BUBBLE_OFFSET: 100, // 100px from last letter
  REAPPLICATION_DELAY: 100,
  OBSERVER_DURATION: 2000,
} as const;

// Gmail state management
let gmailState: GmailState = {
  currentElement: null,
  typingTimer: null,
  isTyping: false,
  lastCursorPosition: null,
};

// Utility functions
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const validateInput = (input: string): boolean => {
  return input.length > 0 && input.length < CONSTANTS.MAX_INPUT_LENGTH;
};

const isGmailComposeElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  // Gmail compose textarea detection
  const tagName = element.tagName?.toLowerCase();
  const isTextarea = tagName === 'textarea';
  
  // Gmail-specific selectors
  const className = element.className?.toString() || '';
  const hasGmailClasses = className.includes('Am') || // Gmail compose textarea class
                         className.includes('editable') ||
                         className.includes('compose');
  
  // Check for Gmail compose area attributes
  const ariaLabel = element.getAttribute('aria-label') || '';
  const isGmailCompose = ariaLabel.includes('Compose') || 
                        ariaLabel.includes('Message Body') ||
                        ariaLabel.includes('compose');
  
  // Check if we're on Gmail domain
  const isGmailDomain = window.location.hostname.includes('mail.google.com');
  
  return isGmailDomain && isTextarea && (hasGmailClasses || isGmailCompose);
};

const isEditableElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  // Prioritize Gmail compose elements
  if (isGmailComposeElement(element)) {
    return true;
  }
  
  // Fallback to general editable detection
  const tagName = element.tagName?.toLowerCase();
  const isContentEditable = element.isContentEditable === true;
  const hasContentEditableAttr = element.getAttribute('contenteditable') === 'true';
  
  const isEditableElement = tagName === 'textarea' || 
                           tagName === 'input' || 
                           isContentEditable ||
                           hasContentEditableAttr ||
                           element.getAttribute('role') === 'textbox';
  
  const className = element.className?.toString() || '';
  const hasEditableClasses = Boolean(className && (
    className.includes('lexical-rich-text-input') ||
    className.includes('contenteditable') ||
    className.includes('text-input') ||
    className.includes('x1hx0egp') ||
    className.includes('x6ikm8r') ||
    className.includes('x1odjw0f') ||
    className.includes('x1k6rcq7') ||
    className.includes('x6prxxf')
  ));
  
  const hasWhatsAppAttributes = element.getAttribute('data-lexical-editor') === 'true' ||
                               (element.getAttribute('aria-label')?.includes('message') ?? false) ||
                               (element.getAttribute('aria-placeholder')?.includes('message') ?? false);
  
  return isEditableElement || hasEditableClasses || hasWhatsAppAttributes;
};

const getCursorPosition = (element: HTMLElement): MousePosition | null => {
  try {
    if (element.tagName?.toLowerCase() === 'textarea') {
      return getTextareaCursorPosition(element as HTMLTextAreaElement);
    }
    return getContentEditableCursorPosition(element);
  } catch (error) {
    return null;
  }
};

const getTextareaCursorPosition = (element: HTMLTextAreaElement): MousePosition | null => {
  try {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const lineHeight = parseInt(style.lineHeight) || 20;
    const fontSize = parseInt(style.fontSize) || 16;
    const paddingTop = parseInt(style.paddingTop) || 0;
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    
    // Get cursor position
    const cursorPos = element.selectionStart || 0;
    const textBeforeCursor = element.value.substring(0, cursorPos);
    
    // Calculate line and column
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[currentLine]?.length || 0;
    
    // Calculate pixel position
    const x = rect.left + paddingLeft + (currentColumn * (fontSize * 0.6)); // Approximate character width
    const y = rect.top + paddingTop + (currentLine * lineHeight);
    
    return { x, y };
  } catch (error) {
    return null;
  }
};

const getContentEditableCursorPosition = (element: HTMLElement): MousePosition | null => {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    return {
      x: rect.right,
      y: rect.top
    };
  } catch (error) {
    return null;
  }
};

const getBubblePosition = (element: HTMLElement): MousePosition => {
  // Try to get cursor position first
  const cursorPos = getCursorPosition(element);
  if (cursorPos) {
    return {
      x: cursorPos.x + CONSTANTS.BUBBLE_OFFSET,
      y: cursorPos.y - 40 // Position above cursor
    };
  }
  
  // Fallback to element-based positioning
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + CONSTANTS.BUBBLE_OFFSET,
    y: Math.max(CONSTANTS.BUBBLE_OFFSET, rect.top - 40)
  };
};

// Text replacement functions
const replaceTextInElement = (element: HTMLElement, newText: string): TextReplacementResult => {
  const originalText = element.textContent || '';
  
  if (!validateInput(newText)) {
    return {
      success: false,
      element,
      originalText,
      newText
    };
  }

  const sanitizedText = sanitizeInput(newText);
  
  try {
    const tagName = element.tagName?.toLowerCase();
    
    switch (tagName) {
      case 'textarea':
        (element as HTMLTextAreaElement).value = sanitizedText;
        break;
      case 'input':
        (element as HTMLInputElement).value = sanitizedText;
        break;
      default:
        if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
          replaceContentEditableText(element, sanitizedText);
        }
        break;
    }

    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);

    return {
      success: true,
      element,
      originalText,
      newText: sanitizedText
    };
  } catch (error) {
    return {
      success: false,
      element,
      originalText,
      newText
    };
  }
};

const replaceContentEditableText = (element: HTMLElement, text: string): void => {
  try {
    const whatsappSpans = element.querySelectorAll('span[data-lexical-text="true"]');
    
    if (whatsappSpans.length > 0) {
      const targetSpan = whatsappSpans[0] as HTMLElement;
      targetSpan.className = '';
      targetSpan.textContent = text;
      targetSpan.setAttribute('data-lexical-text', 'true');
      targetSpan.className = 'selectable-text copyable-text';
      
      for (let i = 1; i < whatsappSpans.length; i++) {
        whatsappSpans[i].remove();
      }
    } else {
      const whatsappParagraphs = element.querySelectorAll('p.selectable-text.copyable-text');
    
      if (whatsappParagraphs.length > 0) {
        const firstP = whatsappParagraphs[0] as HTMLElement;
        const whatsappSpans = firstP.querySelectorAll('span.selectable-text.copyable-text');
        
        if (whatsappSpans.length > 0) {
          const firstSpan = whatsappSpans[0] as HTMLElement;
          firstSpan.textContent = text;
          firstSpan.setAttribute('data-lexical-text', 'true');
          firstSpan.className = 'selectable-text copyable-text';
        } else {
          const span = document.createElement('span');
          span.textContent = text;
          span.className = 'selectable-text copyable-text';
          span.setAttribute('data-lexical-text', 'true');
          firstP.innerHTML = '';
          firstP.appendChild(span);
        }
        
        for (let i = 1; i < whatsappParagraphs.length; i++) {
          whatsappParagraphs[i].remove();
        }
      } else {
        element.innerHTML = '';
        
        const p = document.createElement('p');
        p.className = 'selectable-text copyable-text';
        p.setAttribute('dir', 'rtl');
        p.style.cssText = 'text-indent: 0px; margin-top: 0px; margin-bottom: 0px;';
        
        const span = document.createElement('span');
        span.textContent = text;
        span.className = 'selectable-text copyable-text';
        span.setAttribute('data-lexical-text', 'true');
        
        p.appendChild(span);
        element.appendChild(p);
      }
    }
    
    setCursorToEnd(element);
  } catch (error) {
    element.textContent = text;
  }
};

const setCursorToEnd = (element: HTMLElement): void => {
  try {
    const range = document.createRange();
    const selection = window.getSelection();
    
    if (selection) {
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (error) {
    // Silently handle cursor positioning errors
  }
};

// WhatsApp Web specific text replacement with anti-reversion
const replaceWhatsAppText = (element: HTMLElement, newText: string): TextReplacementResult => {
  const originalText = element.textContent || '';
  
  // Strategy 1: Remove class name before inserting new content
  element.className = '';
  
  // Strategy 2: Insert new content
  element.textContent = newText;
  
  // Strategy 3: Trigger input events to notify WhatsApp Web
  const inputEvent = new Event('input', { bubbles: true });
  element.dispatchEvent(inputEvent);
  
  const changeEvent = new Event('change', { bubbles: true });
  element.dispatchEvent(changeEvent);
  
  // Strategy 4: Use setTimeout to reapply after WhatsApp reverts
  setTimeout(() => {
    element.textContent = newText;
    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);
  }, CONSTANTS.REAPPLICATION_DELAY);
  
  // Strategy 5: Use MutationObserver to detect and counter reversion
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        element.textContent = newText;
        element.dispatchEvent(inputEvent);
        element.dispatchEvent(changeEvent);
      }
    });
  });
  
  observer.observe(element, {
    childList: true,
    characterData: true,
    subtree: true
  });
  
  // Stop observing after specified duration
  setTimeout(() => {
    observer.disconnect();
  }, CONSTANTS.OBSERVER_DURATION);
  
  return {
    success: true,
    element,
    originalText,
    newText
  };
};

// Bubble management functions
const createBubble = (): BubbleElement => {
  const bubble = document.createElement('div');
  bubble.className = 'phrasebe-bubble';
  bubble.style.cssText = `
    position: fixed;
    width: 34px;
    height: 34px;
    background: #10b981;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    left: 100px;
    top: 100px;
  `;
  
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL(CONSTANTS.ICON_PATH);
  icon.className = 'phrasebe-icon';
  icon.style.cssText = `
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  `;
  
  bubble.appendChild(icon);
  document.documentElement.appendChild(bubble);

  return bubble as BubbleElement;
};

const positionBubble = (bubble: BubbleElement, element: HTMLElement): void => {
  const pos = getBubblePosition(element);
  const bubbleSize = 34;
  const offset = CONSTANTS.BUBBLE_OFFSET;
  
  let x = pos.x + offset;
  let y = pos.y;
  
  const maxX = window.innerWidth - bubbleSize - offset;
  x = Math.min(Math.max(offset, x), maxX);
  
  const minY = offset;
  y = Math.max(minY, y);
  
  bubble.style.left = x + 'px';
  bubble.style.top = y + 'px';
};

const showBubble = (bubble: BubbleElement, element: HTMLElement): void => {
  positionBubble(bubble, element);
};

const hideBubble = (bubble: BubbleElement): void => {
  // Bubble stays visible for debugging
};

// Main activation function
const activateTextReplacement = (): void => {
  // Use current Gmail element if available
  const element = gmailState.currentElement || 
                 document.querySelector('textarea[aria-label*="Compose"]') as HTMLElement ||
                 document.querySelector('textarea[aria-label*="Message Body"]') as HTMLElement ||
                 document.querySelector('span[data-lexical-text="true"]') as HTMLElement;
  
  if (!element) {
    return;
  }
  
  // Use appropriate replacement method based on element type
  if (element.tagName?.toLowerCase() === 'textarea') {
    replaceTextInElement(element, CONSTANTS.REPLACEMENT_TEXT);
  } else {
    replaceWhatsAppText(element, CONSTANTS.REPLACEMENT_TEXT);
  }
};

// Typing delay management
const clearTypingTimer = (): void => {
  if (gmailState.typingTimer) {
    clearTimeout(gmailState.typingTimer);
    gmailState.typingTimer = null;
  }
};

const startTypingTimer = (element: HTMLElement, bubble: BubbleElement): void => {
  clearTypingTimer();
  gmailState.isTyping = true;
  
  gmailState.typingTimer = window.setTimeout(() => {
    gmailState.isTyping = false;
    gmailState.currentElement = element;
    gmailState.lastCursorPosition = getCursorPosition(element);
    showBubble(bubble, element);
  }, CONSTANTS.TYPING_DELAY);
};

// Initialize extension
const initializeExtension = (): void => {
  const bubble = createBubble();
  
  // Event handlers
  const handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (isEditableElement(target)) {
      startTypingTimer(target, bubble);
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;
    if (isEditableElement(target)) {
      startTypingTimer(target, bubble);
    }
  };

  const handleFocusIn = (event: FocusEvent): void => {
    const target = event.target as HTMLElement;
    if (isEditableElement(target)) {
      gmailState.currentElement = target;
    }
  };

  const handleFocusOut = (event: FocusEvent): void => {
    const target = event.target as HTMLElement;
    if (isEditableElement(target)) {
      clearTypingTimer();
      hideBubble(bubble);
      gmailState.currentElement = null;
      gmailState.isTyping = false;
    }
  };

  const handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    
    if (bubble && bubble.contains(target)) {
      event.preventDefault();
      event.stopPropagation();
      activateTextReplacement();
    }
  };

  const handleMouseUp = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (isEditableElement(target)) {
      // Update cursor position on mouse up
      gmailState.lastCursorPosition = getCursorPosition(target);
    }
  };
  
  // Add event listeners
  document.addEventListener('input', handleInput);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('focusout', handleFocusOut);
  document.addEventListener('click', handleClick);
  document.addEventListener('mouseup', handleMouseUp);
};

// Start the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}