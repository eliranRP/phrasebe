// PhraseBE Content Script - Gmail Specific Implementation

// Constants
const CONSTANTS = {
  ICON_PATH: 'assets/icons/papaer_airplane.png',
  REPLACEMENT_TEXT: 'Call your mom',
} as const;

// Storage keys for content script
const CONTENT_STORAGE_KEYS = {
  TRANSLATION_ENABLED: 'phrasebe_translation_enabled',
  SOURCE_LANGUAGE: 'phrasebe_source_language',
  TARGET_LANGUAGE: 'phrasebe_target_language',
} as const;

// Check if translation feature is enabled
const isTranslationEnabled = async (): Promise<boolean> => {
  try {
    const result = await chrome.storage.sync.get([CONTENT_STORAGE_KEYS.TRANSLATION_ENABLED]);
    return result[CONTENT_STORAGE_KEYS.TRANSLATION_ENABLED] !== false; // Default to true
  } catch (error) {
    return true; // Default to enabled if error
  }
};

// Check if current site is blacklisted
const isSiteBlacklisted = async (): Promise<boolean> => {
  try {
    const result = await chrome.storage.sync.get(['phrasebe_site_blacklist']);
    const blacklist = result['phrasebe_site_blacklist'] || [];
    const currentDomain = window.location.hostname;
    return blacklist.includes(currentDomain);
  } catch (error) {
    return false; // Default to not blacklisted if error
  }
};

// Get user's preferred languages
const getUserLanguages = async (): Promise<{ source: string; target: string }> => {
  try {
    const result = await chrome.storage.sync.get([
      CONTENT_STORAGE_KEYS.SOURCE_LANGUAGE,
      CONTENT_STORAGE_KEYS.TARGET_LANGUAGE,
    ]);
    return {
      source: result[CONTENT_STORAGE_KEYS.SOURCE_LANGUAGE] || 'en',
      target: result[CONTENT_STORAGE_KEYS.TARGET_LANGUAGE] || 'he',
    };
  } catch (error) {
    return { source: 'en', target: 'he' }; // Default to English -> Hebrew
  }
};

// Convert language code to full language name
const getLanguageName = (languageCode: string): string => {
  const languageMap: { [key: string]: string } = {
    'en': 'English (American)',
    'he': 'Hebrew',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
  };
  return languageMap[languageCode] || 'English (American)';
};

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
    outputLanguage: "en", // Specify English as output language to prevent crashes
    monitor(m: LanguageModelMonitor) {
      m.addEventListener('downloadprogress', (e: LanguageModelDownloadProgressEvent) => {
        // Download progress
      });
    },
  });
};

const processTextWithAI = async (prompt: string, contextText?: string): Promise<string> => {
  try {
    const session = await createAISession();

    let fullPrompt: string;
    if (contextText) {
      fullPrompt = `Context text: "${contextText}"\n\nUser instruction: "${prompt}"\n\nProcess the context text according to the user instruction and return only the result.`;
    } else {
      fullPrompt = prompt;
    }

    const result = await session.prompt(fullPrompt);
    session.destroy();

    return result.trim();
  } catch (error) {
    return contextText || prompt; // Return original text if AI fails
  }
};

const detectLanguage = async (text: string): Promise<{ language: string; direction: 'ltr' | 'rtl' }> => {
  try {
    // Check if Language Detector API is available
    if ('LanguageDetector' in self) {
      // Check availability
      const availability = await LanguageDetector.availability();

      if (availability === 'downloadable') {
        // Model needs to be downloaded
        console.log('Downloading language detection model...');
      }

      // Create language detector with timeout protection
      const detectorPromise = LanguageDetector.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Language model downloaded ${e.loaded * 100}%`);
          });
        },
      });

      // Add timeout to prevent hanging during model download
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Language detection timeout')), 30000); // 30 second timeout
      });

      const detector = await Promise.race([detectorPromise, timeoutPromise]);

      // Detect language
      const results = await detector.detect(text);

      if (results.length > 0) {
        const topResult = results[0];
        const detectedLanguage = topResult.detectedLanguage;
        const confidence = topResult.confidence;

        // Only use result if confidence is high enough
        if (confidence > 0.5) {
          // Determine text direction based on detected language
          const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi']; // Arabic, Hebrew, Persian, Urdu, Yiddish
          const direction = rtlLanguages.includes(detectedLanguage) ? 'rtl' : 'ltr';

          // Map language codes to readable names
          const languageNames: { [key: string]: string } = {
            'en': 'English',
            'he': 'Hebrew',
            'ar': 'Arabic',
            'fa': 'Persian',
            'ur': 'Urdu',
            'yi': 'Yiddish',
            'de': 'German',
            'fr': 'French',
            'es': 'Spanish',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'hi': 'Hindi',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'no': 'Norwegian',
            'da': 'Danish',
            'fi': 'Finnish',
            'pl': 'Polish',
            'tr': 'Turkish',
            'cs': 'Czech',
            'sk': 'Slovak',
            'hu': 'Hungarian',
            'ro': 'Romanian',
            'bg': 'Bulgarian',
            'hr': 'Croatian',
            'sr': 'Serbian',
            'sl': 'Slovenian',
            'et': 'Estonian',
            'lv': 'Latvian',
            'lt': 'Lithuanian',
            'uk': 'Ukrainian',
            'be': 'Belarusian',
            'mk': 'Macedonian',
            'sq': 'Albanian',
            'mt': 'Maltese',
            'is': 'Icelandic',
            'ga': 'Irish',
            'cy': 'Welsh',
            'eu': 'Basque',
            'ca': 'Catalan',
            'gl': 'Galician'
          };

          const languageName = languageNames[detectedLanguage] || detectedLanguage.toUpperCase();

          return { language: languageName, direction };
        }
      }
    }

    // Fallback: simple heuristic detection
    const hebrewRegex = /[\u0590-\u05FF]/;
    const arabicRegex = /[\u0600-\u06FF]/;

    if (hebrewRegex.test(text)) {
      return { language: 'Hebrew', direction: 'rtl' };
    }

    if (arabicRegex.test(text)) {
      return { language: 'Arabic', direction: 'rtl' };
    }

    return { language: 'English', direction: 'ltr' };
  } catch (error) {
    console.log('Language detection failed, using fallback:', error);

    // Fallback: simple heuristic detection
    const hebrewRegex = /[\u0590-\u05FF]/;
    const arabicRegex = /[\u0600-\u06FF]/;

    if (hebrewRegex.test(text)) {
      return { language: 'Hebrew', direction: 'rtl' };
    }

    if (arabicRegex.test(text)) {
      return { language: 'Arabic', direction: 'rtl' };
    }

    return { language: 'English', direction: 'ltr' };
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


// Text Selection Feature
let selectionTimeout: NodeJS.Timeout | null = null;
let suggestionBox: HTMLDivElement | null = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let dragJustEnded = false;
let lastSelectedText: string | null = null;
let hasSelectionChanged = false;

// Helper function to replace selected text
const replaceSelectedText = (newText: string): void => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(newText));

  // Clear selection
  selection.removeAllRanges();
};

// Helper function to translate text using Chrome Translator API
const translateText = async (text: string, sourceLanguage: string, targetLanguage: string): Promise<string> => {
  // Check if Translator API is available
  if (!('Translator' in self)) {
    throw new Error('Translator API is not available');
  }

  // Convert language names to BCP 47 codes
  const sourceLanguageCode = getLanguageCode(sourceLanguage);
  const targetLanguageCode = getLanguageCode(targetLanguage);

  console.log('Language conversion:', {
    sourceLanguage,
    sourceLanguageCode,
    targetLanguage,
    targetLanguageCode
  });

  // Check availability for specific language pair
  const translatorCapabilities = await Translator.availability({
    sourceLanguage: sourceLanguageCode,
    targetLanguage: targetLanguageCode,
  });

  if (translatorCapabilities === 'downloadable') {
    console.log('Downloading translation model...');
  }

  // Create translator instance with specific language pair
  const translator = await Translator.create({
    sourceLanguage: sourceLanguageCode,
    targetLanguage: targetLanguageCode,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded * 100}%`);
      });
    },
  });

  // Translate text
  const translatedText = await translator.translate(text);

  return translatedText;
};

// Helper function to convert language names to BCP 47 codes
const getLanguageCode = (language: string): string => {
  const lang = language.toLowerCase();

  if (lang.includes('hebrew')) return 'he';
  if (lang.includes('spanish')) return 'es';
  if (lang.includes('french')) return 'fr';
  if (lang.includes('german')) return 'de';
  if (lang.includes('italian')) return 'it';
  if (lang.includes('portuguese')) return 'pt';
  if (lang.includes('russian')) return 'ru';
  if (lang.includes('japanese')) return 'ja';
  if (lang.includes('korean')) return 'ko';
  if (lang.includes('chinese')) return 'zh';
  if (lang.includes('arabic')) return 'ar';
  if (lang.includes('english')) return 'en';

  // Default fallback
  return 'en';
};

const createSuggestionBox = async (selectedText: string, position: { x: number; y: number }): Promise<HTMLDivElement> => {
  const box = document.createElement('div');
  box.className = 'phrasebe-suggestion-box';

  // Detect language and direction
  const { language, direction } = await detectLanguage(selectedText);

  // Determine translation target based on detected language
  const translationTarget = language.toLowerCase().includes('english') ? 'Hebrew' : 'English (American)';

  box.innerHTML = `
    <div class="suggestion-header">
      <div class="header-drag-handle"></div>
      <div class="header-accent"></div>
      <div class="header-content">
        <div class="header-title">Translation (Detecting language...)</div>
        <div class="skeleton-loader">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line long"></div>
        </div>
      </div>
      <button class="close-btn">×</button>
    </div>
    <div class="suggestion-content">
      <div class="action-buttons">
        <button class="copy-btn" title="Copy translation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
          </svg>
        </button>
        <button class="disable-site-btn" title="Disable translation on this site">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div class="language-dropdown">
        <select class="language-select">
          <option value="en">English (American)</option>
          <option value="he">Hebrew</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ru">Russian</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
          <option value="ar">Arabic</option>
        </select>
      </div>
    </div>
    <div class="suggestion-actions">
      <div class="whatsapp-input-container">
        <div class="whatsapp-input" contenteditable="true" role="textbox" aria-multiline="true"></div>
        <button class="whatsapp-send-btn" title="Send prompt" style="display: none;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Check if we're on WhatsApp Web for centered positioning
  const isWhatsAppWeb = window.location.hostname.includes('web.whatsapp.com');

  if (isWhatsAppWeb) {
    // For WhatsApp Web, center the box in the middle of the screen
    box.style.position = 'fixed';
    box.style.left = '50%';
    box.style.top = '50%';
    box.style.transform = 'translate(-50%, -50%)';
    box.style.zIndex = '10000';
  } else {
    // For other sites, use the original positioning logic
    const boxWidth = 350; // Approximate width of the box
    let leftPosition: number;

    if (direction === 'rtl') {
      // For RTL languages, position to the right of the selection
      leftPosition = Math.min(window.innerWidth - boxWidth - 10, position.x + 20);
    } else {
      // For LTR languages, position to the left of the selection
      leftPosition = Math.max(10, position.x - boxWidth - 20);
    }

    box.style.position = 'fixed';
    box.style.left = leftPosition + 'px';
    box.style.top = position.y + 'px';
    box.style.zIndex = '10000';
  }

  return box;
};

const showSuggestionBox = async (selectedText: string): Promise<void> => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Remove existing suggestion box
  if (suggestionBox) {
    suggestionBox.remove();
  }

  // Check if we're on WhatsApp Web
  const isWhatsAppWeb = window.location.hostname.includes('web.whatsapp.com');

  let position: { x: number; y: number };

  if (isWhatsAppWeb) {
    // For WhatsApp Web, center the box in the middle of the screen
    position = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  } else {
    // For other sites, use the original positioning near the selection
    position = {
      x: rect.left,
      y: rect.top
    };
  }

  // Create and show new suggestion box
  suggestionBox = await createSuggestionBox(selectedText, position);

  document.body.appendChild(suggestionBox);

  // Add drag functionality
  const dragHandle = suggestionBox.querySelector('.header-drag-handle') as HTMLElement;
  const header = suggestionBox.querySelector('.suggestion-header') as HTMLElement;

  const startDrag = (e: MouseEvent): void => {
    isDragging = true;
    const rect = suggestionBox!.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseup', stopDrag); // Also listen on window

    // Prevent text selection during drag
    e.preventDefault();
    e.stopPropagation();

    // Disable text selection on the document during drag
    document.body.style.userSelect = 'none';
  };

  const drag = (e: MouseEvent): void => {
    if (!isDragging || !suggestionBox) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep box within viewport bounds
    const maxX = window.innerWidth - suggestionBox.offsetWidth;
    const maxY = window.innerHeight - suggestionBox.offsetHeight;

    suggestionBox.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    suggestionBox.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
  };

  const stopDrag = (): void => {
    isDragging = false;
    dragJustEnded = true;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('mouseup', stopDrag); // Remove window listener too

    // Re-enable text selection
    document.body.style.userSelect = '';

    // Reset the flag after a short delay
    setTimeout(() => {
      dragJustEnded = false;
    }, 100);
  };

  // Add drag event listeners
  if (dragHandle) {
    dragHandle.addEventListener('mousedown', startDrag);
  }
  if (header) {
    header.addEventListener('mousedown', startDrag);
  }

  // Prevent mouseup events on the suggestion box from triggering text selection
  // But allow drag stop to work
  suggestionBox.addEventListener('mouseup', (e) => {
    // Only stop propagation if we're not dragging
    if (!isDragging) {
      e.stopPropagation();
    }
  });

  // Helper function to convert language name to language code
  const getLanguageCodeFromName = (languageName: string): string => {
    const lang = languageName.toLowerCase();

    if (lang.includes('english')) return 'en';
    if (lang.includes('hebrew')) return 'he';
    if (lang.includes('spanish')) return 'es';
    if (lang.includes('french')) return 'fr';
    if (lang.includes('german')) return 'de';
    if (lang.includes('italian')) return 'it';
    if (lang.includes('portuguese')) return 'pt';
    if (lang.includes('russian')) return 'ru';
    if (lang.includes('japanese')) return 'ja';
    if (lang.includes('korean')) return 'ko';
    if (lang.includes('chinese')) return 'zh';
    if (lang.includes('arabic')) return 'ar';

    // Default fallback
    return 'en';
  };

  // Auto-translate on text selection (show in box, don't replace text yet)
  const autoTranslate = async () => {
    try {
      // Detect the language of the selected text with fallback
      let detectedLanguage: string;
      try {
        const detectionResult = await detectLanguage(selectedText);
        detectedLanguage = detectionResult.language;
      } catch (error) {
        console.warn('Language detection failed, using fallback:', error);
        // Fallback: assume English if detection fails
        detectedLanguage = 'English';
      }

      // Get user's preferred languages
      const userLanguages = await getUserLanguages();
      const motherTongue = userLanguages.source;
      const secondLanguage = userLanguages.target;

      // Determine target language based on detected language and user preferences
      let targetLanguage: string;
      let sourceLanguageName: string;
      let targetLanguageName: string;

      // Convert detected language to language code for comparison
      const detectedLanguageCode = getLanguageCodeFromName(detectedLanguage);

      if (detectedLanguageCode === motherTongue) {
        // If detected language is mother tongue, translate to second language
        targetLanguage = secondLanguage;
        sourceLanguageName = detectedLanguage;
        targetLanguageName = getLanguageName(secondLanguage);
      } else if (detectedLanguageCode === secondLanguage) {
        // If detected language is second language, translate to mother tongue
        targetLanguage = motherTongue;
        sourceLanguageName = detectedLanguage;
        targetLanguageName = getLanguageName(motherTongue);
      } else {
        // If detected language is neither preferred language, translate to mother tongue
        targetLanguage = motherTongue;
        sourceLanguageName = detectedLanguage;
        targetLanguageName = getLanguageName(motherTongue);
      }

      console.log('Auto-translation decision:', {
        detectedLanguage,
        detectedLanguageCode,
        motherTongue,
        secondLanguage,
        targetLanguage,
        sourceLanguageName,
        targetLanguageName
      });

      const translatedText = await translateText(selectedText, sourceLanguageName, targetLanguageName);

      // Determine direction based on the output language (translated text)
      const outputDirection = targetLanguage === 'he' || targetLanguage === 'ar' ? 'rtl' : 'ltr';

      // Update the suggestion box content with the translation
      if (suggestionBox) {
        // Replace skeleton loader with actual translation
        const headerContent = suggestionBox.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          headerContent.innerHTML = `
            <div class="header-title">Translation (${detectedLanguage} → ${getLanguageName(targetLanguage)})</div>
            <div class="header-text" dir="${outputDirection}">${translatedText}</div>
          `;
        }

        // Translation is ready (no button needed since it's automatic)

        // Set the default language in dropdown
        const languageSelect = suggestionBox.querySelector('.language-select') as HTMLSelectElement;
        if (languageSelect) {
          languageSelect.value = targetLanguage;
        }
      }
    } catch (error) {
      console.error('Auto-translation failed:', error);
      // Show error state
      if (suggestionBox) {
        // Replace skeleton with error message
        const headerContent = suggestionBox.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          headerContent.innerHTML = `
            <div class="header-title">Translation Failed</div>
            <div class="header-text">Unable to translate the selected text</div>
          `;
        }

        // Error state shown in header (no button needed)
      }
    }
  };

  // Start auto-translation in background
  autoTranslate();

  // Add event listeners
  const languageSelect = suggestionBox.querySelector('.language-select') as HTMLSelectElement;
  const customInput = suggestionBox.querySelector('.custom-input') as HTMLInputElement;

  // Language dropdown change event listener (auto-translate when language changes)
  if (languageSelect) {
    languageSelect.addEventListener('change', async () => {
      // Show loading state in the header
      const headerContent = suggestionBox?.querySelector('.header-content') as HTMLElement;
      if (headerContent) {
        headerContent.innerHTML = `
          <div class="header-title">Translation (Translating...)</div>
          <div class="skeleton-loader">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line long"></div>
          </div>
        `;
      }

      // Disable dropdown during translation
      languageSelect.disabled = true;
      languageSelect.style.opacity = '0.7';

      try {
        // Get the current text from the suggestion box (could be original or AI response)
        const headerText = suggestionBox?.querySelector('.header-text') as HTMLElement;
        const currentText = headerText ? headerText.textContent || selectedText : selectedText;

        // Detect language with fallback
        let sourceLanguage: string;
        try {
          const detectionResult = await detectLanguage(currentText);
          sourceLanguage = detectionResult.language;
        } catch (error) {
          console.warn('Language detection failed in dropdown change, using fallback:', error);
          // Fallback: assume English if detection fails
          sourceLanguage = 'English';
        }
        const targetLanguageCode = languageSelect.value;
        const targetLanguageName = languageSelect.options[languageSelect.selectedIndex].text;

        console.log('Language dropdown translation request:', {
          currentText,
          sourceLanguage,
          targetLanguageCode,
          targetLanguageName
        });

        const translatedText = await translateText(currentText, sourceLanguage, targetLanguageName);

        // Update the suggestion box with new translation
        if (suggestionBox && headerContent) {
          const outputDirection = targetLanguageCode === 'he' || targetLanguageCode === 'ar' ? 'rtl' : 'ltr';
          headerContent.innerHTML = `
            <div class="header-title">Translation (${sourceLanguage} → ${targetLanguageName})</div>
            <div class="header-text" dir="${outputDirection}">${translatedText}</div>
          `;
        }

        // Restore dropdown state
        languageSelect.disabled = false;
        languageSelect.style.opacity = '1';
      } catch (error) {
        console.error('Auto-translation failed:', error);

        // Show error state
        if (suggestionBox && headerContent) {
          headerContent.innerHTML = `
            <div class="header-title">Translation Failed</div>
            <div class="header-text">Unable to translate the selected text</div>
          `;
        }

        // Restore dropdown state
        languageSelect.disabled = false;
        languageSelect.style.opacity = '1';
      }
    });
  }

  // Copy button event listener
  const copyBtn = suggestionBox?.querySelector('.copy-btn') as HTMLButtonElement;
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const headerText = suggestionBox?.querySelector('.header-text') as HTMLElement;
      const textToCopy = headerText ? headerText.textContent || '' : '';

      if (!textToCopy.trim()) {
        console.log('No text to copy');
        return;
      }

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Show feedback
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
          </svg>
        `;
        copyBtn.style.background = '#10b981';

        // Restore after 2 seconds
        setTimeout(() => {
          copyBtn.innerHTML = originalContent;
          copyBtn.style.background = '';
        }, 2000);

        console.log('Text copied to clipboard:', textToCopy);
      } catch (error) {
        console.error('Failed to copy text:', error);

        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        // Show feedback
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
          </svg>
        `;
        copyBtn.style.background = '#10b981';

        setTimeout(() => {
          copyBtn.innerHTML = originalContent;
          copyBtn.style.background = '';
        }, 2000);
      }
    });
  }

  // Disable site button event listener
  const disableSiteBtn = suggestionBox?.querySelector('.disable-site-btn') as HTMLButtonElement;
  if (disableSiteBtn) {
    disableSiteBtn.addEventListener('click', async () => {
      try {
        // Get current site domain
        const currentDomain = window.location.hostname;

        // Add to blacklist
        const result = await chrome.storage.sync.get(['phrasebe_site_blacklist']);
        const blacklist = result['phrasebe_site_blacklist'] || [];

        if (!blacklist.includes(currentDomain)) {
          blacklist.push(currentDomain);
          await chrome.storage.sync.set({ 'phrasebe_site_blacklist': blacklist });
        }

        // Show feedback
        const originalContent = disableSiteBtn.innerHTML;
        disableSiteBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
          </svg>
        `;
        disableSiteBtn.style.background = '#10b981';
        disableSiteBtn.title = 'Translation disabled on this site';

        // Hide the suggestion box
        hideSuggestionBox();

        console.log('Translation disabled on site:', currentDomain);
      } catch (error) {
        console.error('Failed to disable translation on site:', error);
      }
    });
  }

  // WhatsApp input event listener
  const whatsappInput = suggestionBox?.querySelector('.whatsapp-input') as HTMLDivElement;
  const whatsappSendBtn = suggestionBox?.querySelector('.whatsapp-send-btn') as HTMLButtonElement;

  if (whatsappInput) {
    // Function to ensure placeholder appears when input is empty
    const ensurePlaceholderVisible = () => {
      const text = whatsappInput.textContent?.trim() || '';
      if (!text) {
        // Force the element to be recognized as empty
        whatsappInput.innerHTML = '';
        whatsappInput.setAttribute('dir', 'ltr');
        console.log('Placeholder should be visible (empty input)');
      }
    };

    // Function to detect RTL languages and update text direction
    const detectAndSetTextDirection = (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText) {
        // Reset to default when empty
        whatsappInput.setAttribute('dir', 'ltr');
        console.log('Text direction reset to LTR (empty input)');
        return;
      }

      // RTL language detection patterns
      const rtlPatterns = [
        /[\u0590-\u05FF]/, // Hebrew
        /[\u0600-\u06FF]/, // Arabic
        /[\u0750-\u077F]/, // Arabic Supplement
        /[\u08A0-\u08FF]/, // Arabic Extended-A
        /[\uFB1D-\uFDFF]/, // Arabic Presentation Forms-A
        /[\uFE70-\uFEFF]/, // Arabic Presentation Forms-B
        /[\u200F]/, // Right-to-left mark
        /[\u202E]/, // Right-to-left override
      ];

      // Check if text contains RTL characters
      const isRTL = rtlPatterns.some(pattern => pattern.test(trimmedText));

      // Set text direction
      whatsappInput.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

      console.log('Text direction detected:', isRTL ? 'RTL' : 'LTR', 'for text:', trimmedText.substring(0, 20) + '...');
    };

    // Show/hide send button based on input content
    const toggleSendButton = () => {
      if (whatsappSendBtn) {
        const text = whatsappInput.textContent?.trim() || '';
        if (text.length > 0) {
          whatsappSendBtn.style.display = 'flex';
        } else {
          whatsappSendBtn.style.display = 'none';
        }
      }
    };

    // Handle input changes
    whatsappInput.addEventListener('input', () => {
      const text = whatsappInput.textContent || '';
      detectAndSetTextDirection(text);
      ensurePlaceholderVisible();
      toggleSendButton();
    });
    whatsappInput.addEventListener('keyup', () => {
      const text = whatsappInput.textContent || '';
      detectAndSetTextDirection(text);
      ensurePlaceholderVisible();
      toggleSendButton();
    });

    const handleCustomPrompt = async () => {
      const customPrompt = whatsappInput.textContent?.trim() || '';
      if (!customPrompt) return;

      // Get the current translated text from the suggestion box
      const headerText = suggestionBox?.querySelector('.header-text') as HTMLElement;
      const translatedText = headerText ? headerText.textContent || '' : selectedText;

      // Show loading state
      const originalContent = whatsappSendBtn?.innerHTML || '';
      whatsappInput.contentEditable = 'false'; // Disable editing during processing
      if (whatsappSendBtn) {
        whatsappSendBtn.innerHTML = '<div class="loading-spinner"></div>';
        whatsappSendBtn.disabled = true;
        whatsappSendBtn.style.opacity = '0.6';
        whatsappSendBtn.classList.add('loading'); // Add green border animation
      }

      try {
        console.log('Custom prompt request:', {
          customPrompt,
          translatedText,
          selectedText
        });

        const aiResponse = await processTextWithAI(customPrompt, translatedText);

        // Detect language of AI response and set appropriate text direction
        const { language: responseLanguage, direction: responseDirection } = await detectLanguage(aiResponse);

        // Update the suggestion box with the AI response
        if (suggestionBox && headerText) {
          headerText.textContent = aiResponse;
          headerText.setAttribute('dir', responseDirection);

          // Update the dropdown to show the detected language of the AI response
          const languageSelect = suggestionBox.querySelector('.language-select') as HTMLSelectElement;
          if (languageSelect) {
            const responseLanguageCode = getLanguageCodeFromName(responseLanguage);
            languageSelect.value = responseLanguageCode;
          }

          // Clear the input
          whatsappInput.textContent = '';
          whatsappInput.innerHTML = ''; // Ensure completely empty
          ensurePlaceholderVisible(); // Ensure placeholder appears
          toggleSendButton(); // Hide send button
        }
      } catch (error) {
        console.error('AI processing failed:', error);
        // Show error in the suggestion box
        if (suggestionBox && headerText) {
          headerText.textContent = 'Error processing your request. Please try again.';
          headerText.setAttribute('dir', 'ltr'); // Error messages are always LTR
        }
      } finally {
        // Restore input state
        whatsappInput.contentEditable = 'true'; // Re-enable editing
        if (whatsappSendBtn) {
          whatsappSendBtn.innerHTML = originalContent;
          whatsappSendBtn.disabled = false;
          whatsappSendBtn.style.opacity = '1';
          whatsappSendBtn.classList.remove('loading'); // Remove green border animation
        }
      }
    };

    // Handle Enter key in contenteditable
    whatsappInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Shift+Enter: Allow new line (default behavior)
          return;
        } else {
          // Enter: Send prompt
          e.preventDefault();
          handleCustomPrompt();
        }
      }
    });
  }

  // WhatsApp send button event listener
  if (whatsappSendBtn) {
    whatsappSendBtn.addEventListener('click', async () => {
      const customPrompt = whatsappInput?.textContent?.trim() || '';
      if (!customPrompt) return;

      // Get the current translated text from the suggestion box
      const headerText = suggestionBox?.querySelector('.header-text') as HTMLElement;
      const translatedText = headerText ? headerText.textContent || '' : selectedText;

      // Show loading state with green border animation
      const originalContent = whatsappSendBtn.innerHTML;
      whatsappSendBtn.innerHTML = '<div class="loading-spinner"></div>';
      whatsappSendBtn.disabled = true;
      whatsappSendBtn.style.opacity = '0.6';
      whatsappSendBtn.classList.add('loading'); // Add green border animation
      if (whatsappInput) {
        whatsappInput.contentEditable = 'false'; // Disable editing during processing
      }

      try {
        console.log('WhatsApp send button prompt request:', {
          customPrompt,
          translatedText,
          selectedText
        });

        const aiResponse = await processTextWithAI(customPrompt, translatedText);

        // Detect language of AI response and set appropriate text direction
        const { language: responseLanguage, direction: responseDirection } = await detectLanguage(aiResponse);

        // Update the suggestion box with the AI response
        if (suggestionBox && headerText) {
          headerText.textContent = aiResponse;
          headerText.setAttribute('dir', responseDirection);

          // Update the dropdown to show the detected language of the AI response
          const languageSelect = suggestionBox.querySelector('.language-select') as HTMLSelectElement;
          if (languageSelect) {
            const responseLanguageCode = getLanguageCodeFromName(responseLanguage);
            languageSelect.value = responseLanguageCode;
          }

          // Clear the input
          if (whatsappInput) {
            whatsappInput.textContent = '';
            whatsappInput.innerHTML = ''; // Ensure completely empty
            whatsappInput.setAttribute('dir', 'ltr'); // Reset to default direction
            whatsappSendBtn.style.display = 'none'; // Hide send button
          }
        }
      } catch (error) {
        console.error('AI processing failed:', error);
        // Show error in the suggestion box
        if (suggestionBox && headerText) {
          headerText.textContent = 'Error processing your request. Please try again.';
          headerText.setAttribute('dir', 'ltr'); // Error messages are always LTR
        }
      } finally {
        // Restore button state
        whatsappSendBtn.innerHTML = originalContent;
        whatsappSendBtn.disabled = false;
        whatsappSendBtn.style.opacity = '1';
        whatsappSendBtn.classList.remove('loading'); // Remove green border animation
        if (whatsappInput) {
          whatsappInput.contentEditable = 'true'; // Re-enable editing
        }
      }
    });
  }

  // Add close button event listener
  const closeBtn = suggestionBox.querySelector('.close-btn') as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideSuggestionBox();
    });
  }

  // Hide suggestion box when clicking outside
  document.addEventListener('click', (e) => {
    if (suggestionBox && !suggestionBox.contains(e.target as Node)) {
      hideSuggestionBox();
    }
  }, { once: true });
};

const hideSuggestionBox = (): void => {
  if (suggestionBox) {
    // Track the last selected text before hiding
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      lastSelectedText = selection.toString().trim();
      hasSelectionChanged = false; // Reset selection change flag
      console.log('Tracked last selected text:', lastSelectedText);
    }

    suggestionBox.remove();
    suggestionBox = null;
  }

  // Reset drag state
  isDragging = false;
  dragJustEnded = false;
  document.body.style.userSelect = '';
};

const handleTextSelection = async (): Promise<void> => {
  // Check if translation feature is enabled
  const translationEnabled = await isTranslationEnabled();
  if (!translationEnabled) {
    return; // Don't show suggestion box if translation is disabled
  }

  // Check if current site is blacklisted
  const siteBlacklisted = await isSiteBlacklisted();
  if (siteBlacklisted) {
    return; // Don't show suggestion box if site is blacklisted
  }

  // Don't handle text selection if we're currently dragging or just finished dragging
  if (isDragging || dragJustEnded) {
    return;
  }

  // Don't hide the suggestion box if user is interacting with it
  if (suggestionBox && document.body.contains(suggestionBox)) {
    // Check if the mouse is over the suggestion box or if an input is focused
    const activeElement = document.activeElement;
    if (activeElement && suggestionBox.contains(activeElement)) {
      return; // User is interacting with the suggestion box
    }

    // Check if mouse is over the suggestion box
    const mouseOverBox = suggestionBox.matches(':hover') ||
      (suggestionBox.querySelector(':hover') !== null);
    if (mouseOverBox) {
      return; // Mouse is over the suggestion box
    }
  }

  const selection = window.getSelection();

  // If no selection or empty selection, hide box and clear timeout
  if (!selection || selection.toString().trim().length === 0) {
    // Clear any pending timeout
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
      selectionTimeout = null;
    }
    hideSuggestionBox();
    hasSelectionChanged = true; // Mark that selection has changed (to empty)
    lastSelectedText = null; // Clear last selected text when selection is empty
    return;
  }

  const selectedText = selection.toString().trim();
  if (selectedText.length === 0) {
    // Clear any pending timeout
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
      selectionTimeout = null;
    }
    hideSuggestionBox();
    lastSelectedText = null; // Clear last selected text when selection is empty
    return;
  }

  // Check if this is the same text that was selected when the box was last closed
  // AND the selection hasn't changed (user didn't unselect and reselect)
  if (lastSelectedText && selectedText === lastSelectedText && !hasSelectionChanged) {
    console.log('Same text selected as last time without selection change, not reopening box:', selectedText);
    return; // Don't reopen the box for the same text without selection change
  }

  // Mark that we have a new selection
  hasSelectionChanged = true;

  // Don't recreate the box if it already exists and user is interacting with it
  if (suggestionBox && document.body.contains(suggestionBox)) {
    return;
  }

  // Clear existing timeout
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  // Set 2.5-second delay
  selectionTimeout = setTimeout(async () => {
    // Double-check that selection still exists and hasn't been cleared
    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.toString().trim().length === 0) {
      return; // Selection was cleared, don't show box
    }

    // Clear the last selected text since we're showing the box for new text
    lastSelectedText = null;
    hasSelectionChanged = false; // Reset selection change flag
    await showSuggestionBox(selectedText);
  }, 2500);
};

// Initialize extension
const initializeExtension = async (): Promise<void> => {
  // Add text selection listener for all websites
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);

  // Add additional listeners for better text selection handling
  document.addEventListener('input', handleTextSelection); // Handle text deletion/typing
  document.addEventListener('selectionchange', handleTextSelection); // Handle selection changes

  // Enhanced keyboard selection handling
  document.addEventListener('keydown', (e) => {
    // Handle keyboard selection commands
    const isSelectionKey = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
      e.key === 'Home' || e.key === 'End' ||
      e.key === 'PageUp' || e.key === 'PageDown';

    // Handle Ctrl+A (Select All) and other selection shortcuts
    const isSelectAll = e.ctrlKey && e.key === 'a';

    // Handle Ctrl+Shift+Arrow (Word selection)
    const isWordSelection = e.ctrlKey && e.shiftKey &&
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight');

    // Handle Shift+Home/End (Line selection)
    const isLineSelection = e.shiftKey && (e.key === 'Home' || e.key === 'End');

    if ((isSelectionKey && e.shiftKey) || isSelectAll || isWordSelection || isLineSelection) {
      // Small delay to allow selection to complete
      setTimeout(() => {
        handleTextSelection();
      }, 10);
    }
  });

  if (!isGmail()) {
    return; // Only work in Gmail for bubble feature
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