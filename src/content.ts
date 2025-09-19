// PhraseBE Content Script - Gmail Specific Implementation

// Constants
const CONSTANTS = {
  ICON_PATH: 'assets/icons/papaer_airplane.png',
  REPLACEMENT_TEXT: 'Call your mom',
} as const;

// Chrome AI Prompt API integration
const checkAIAvailability = async (): Promise<boolean> => {
  try {

    const availability = await LanguageModel.availability();

    if (availability === 'downloadable') {
      // AI model needs to be downloaded
    }

    return availability !== 'unavailable';
  } catch (error) {
    return false;
  }
};

const createAISession = async (): Promise<LanguageModelSession> => {
  const availability = await LanguageModel.availability();

  if (availability === 'downloadable') {
    // Model needs to be downloaded
  }

  return await LanguageModel.create({
    initialPrompts: [{
      role: "system",
      content: "You are a professional email writing assistant. You help users write concise, email body content based on their instructions. Always respond with only the email body content - no subject lines, no placeholders like [Name] or [Your Name], and no explanations. Keep responses brief and to the point."
    }],
    monitor(m: LanguageModelMonitor) {
      m.addEventListener('downloadprogress', (e: LanguageModelDownloadProgressEvent) => {
        // Download progress
      });
    },
  });
};

const processTextWithAI = async (text: string): Promise<string> => {
  try {
    const session = await createAISession();

    const prompt = `Write a professional email based on these instructions: "${text}"`;

    const result = await session.prompt(prompt);
    session.destroy();

    return result.trim();
  } catch (error) {
    return text; // Return original text if AI fails
  }
};

// Gmail detection
const isGmail = (): boolean => {
  return window.location.hostname.includes('mail.google.com');
};

// Gmail compose contenteditable detection - focus-based
const getGmailComposeDiv = (): HTMLElement | null => {
  // First, check if there's a currently focused contenteditable element
  const activeElement = document.activeElement as HTMLElement;

  // If the active element is a Gmail compose div, use it
  if (activeElement &&
    activeElement.hasAttribute('contenteditable') &&
    activeElement.getAttribute('contenteditable') === 'true' &&
    activeElement.hasAttribute('role') &&
    activeElement.getAttribute('role') === 'textbox') {
    return activeElement;
  }

  // If no focused element, try to find the most recently interacted with compose div
  const allComposeDivs = Array.from(document.querySelectorAll('div[contenteditable="true"][role="textbox"][aria-multiline="true"]')) as HTMLElement[];

  // Look for the one that's visible and has content or cursor
  for (const div of allComposeDivs) {
    const rect = div.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const hasContent = div.textContent && div.textContent.trim().length > 0;
    const hasSelection = window.getSelection() && window.getSelection()!.rangeCount > 0;

    if (isVisible && (hasContent || hasSelection)) {
      return div;
    }
  }

  // Fallback to the first visible compose div
  for (const div of allComposeDivs) {
    const rect = div.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return div;
    }
  }

  return null;
};

// Check if we're in a new email compose (vs reply)
const isNewEmailCompose = (element: HTMLElement): boolean => {
  // Check for specific attributes that indicate new email compose
  const hasGEditable = element.hasAttribute('g_editable');
  const hasMinHeight = element.style.minHeight && element.style.minHeight.includes('325px');

  // Check if parent contains compose-specific elements
  const composeContainer = element.closest('[role="dialog"]') || element.closest('.Am');
  const hasComposeIndicators = composeContainer && (
    composeContainer.querySelector('[aria-label*="compose"]') ||
    composeContainer.querySelector('[aria-label*="Compose"]') ||
    composeContainer.querySelector('.Am')
  );

  return hasGEditable || hasMinHeight || !!hasComposeIndicators;
};

// Bubble management functions
const createBubble = (): HTMLDivElement => {
  const bubble = document.createElement('div');
  bubble.className = 'phrasebe-bubble';
  bubble.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    cursor: pointer;
    z-index: 2147483647;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
    left: 20px;
    top: -35px;
  `;

  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL(CONSTANTS.ICON_PATH);
  icon.className = 'phrasebe-icon';
  icon.style.cssText = `
    width: 20px;
    height: 20px;
  `;

  bubble.appendChild(icon);
  document.documentElement.appendChild(bubble);

  return bubble;
};

// Get cursor position in contenteditable
const getCursorPosition = (element: HTMLElement): { x: number; y: number } | null => {
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
};

// Position bubble at cursor position
const positionBubbleAtCursor = (bubble: HTMLDivElement, element: HTMLElement): void => {
  const cursorPos = getCursorPosition(element);
  if (cursorPos) {
    bubble.style.left = (cursorPos.x + 10) + 'px';
    bubble.style.top = (cursorPos.y + 30) + 'px';
  } else {
    // Fallback to element position
    const rect = element.getBoundingClientRect();
    bubble.style.left = (rect.left + 10) + 'px';
    bubble.style.top = (rect.top + 25) + 'px';
  }
};

// Replace text in Gmail compose contenteditable with AI processing
const replaceGmailText = async (element: HTMLElement): Promise<void> => {
  const originalText = element.textContent || '';

  if (!originalText.trim()) {
    return; // No text to process
  }

  // Check if AI is enabled and available
  if (aiEnabled) {
    const aiAvailable = await checkAIAvailability();

    if (aiAvailable) {
      try {
        // Process text with AI based on user instructions
        const aiAnswer = await processTextWithAI(originalText);
        element.innerHTML = `<div dir="ltr">${aiAnswer}</div>`;
      } catch (error) {
        // Fallback to simple transformation
        const fallbackText = `AI Processed: ${originalText}`;
        element.innerHTML = `<div dir="ltr">${fallbackText}</div>`;
      }
    } else {
      // Simple fallback transformation
      const fallbackText = `Processed: ${originalText}`;
      element.innerHTML = `<div dir="ltr">${fallbackText}</div>`;
    }
  } else {
    // Simple transformation when AI is disabled
    const fallbackText = `Processed: ${originalText}`;
    element.innerHTML = `<div dir="ltr">${fallbackText}</div>`;
  }

  // Trigger input event for Gmail
  const inputEvent = new Event('input', { bubbles: true });
  element.dispatchEvent(inputEvent);
};

// Settings management
let aiEnabled = true;
let globalBubble: HTMLDivElement | null = null;

// Check if bubble is enabled by reading from storage
const isBubbleEnabled = async (): Promise<boolean> => {
  try {
    const result = await chrome.storage.sync.get(['phrasebe_bubble_enabled']);
    return result.phrasebe_bubble_enabled !== false; // Default to true
  } catch (error) {
    return true; // Default to enabled if storage fails
  }
};


// Initialize extension
const initializeExtension = async (): Promise<void> => {
  if (!isGmail()) {
    return; // Only work in Gmail
  }

  const bubble = createBubble();
  globalBubble = bubble;

  // Show bubble when typing in Gmail compose
  const handleInput = async (event: Event): Promise<void> => {
    // Always check if bubble is enabled first
    const bubbleEnabled = await isBubbleEnabled();
    if (!bubbleEnabled) {
      bubble.style.setProperty('display', 'none', 'important');
      return;
    }

    const target = event.target as HTMLElement;

    // Check if the target is a Gmail compose div
    const isComposeDiv = target.hasAttribute('contenteditable') &&
      target.getAttribute('contenteditable') === 'true' &&
      target.hasAttribute('role') &&
      target.getAttribute('role') === 'textbox' &&
      target.hasAttribute('aria-multiline') &&
      target.getAttribute('aria-multiline') === 'true';

    if (isComposeDiv && target.textContent && target.textContent.trim().length > 0) {
      // Use the target element directly since it's the one being typed in
      positionBubbleAtCursor(bubble, target);
      bubble.style.setProperty('display', 'flex', 'important');
    } else {
      bubble.style.setProperty('display', 'none', 'important');
    }
  };

  // Handle bubble click
  const handleClick = async (event: Event): Promise<void> => {
    const target = event.target as HTMLElement;

    if (bubble.contains(target)) {
      event.preventDefault();
      event.stopPropagation();

      const composeDiv = getGmailComposeDiv();
      if (composeDiv) {
        // Show loading state with green border
        bubble.style.border = '2px solid #10b981';
        bubble.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';

        try {
          await replaceGmailText(composeDiv);
        } finally {
          // Remove loading state
          bubble.style.border = '1px solid rgba(255, 255, 255, 0.2)';
          bubble.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
          bubble.style.setProperty('display', 'none', 'important');
        }
      }
    } else if (!target.closest('[contenteditable="true"]')) {
      bubble.style.setProperty('display', 'none', 'important');
    }
  };

  // Add event listeners
  document.addEventListener('input', handleInput);
  document.addEventListener('click', handleClick);
};

// Start the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}