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

const createAISession = async (outputLanguage: string = "en"): Promise<LanguageModelSession> => {
  const availability = await LanguageModel.availability();

  if (availability === 'downloadable') {
    // Model needs to be downloaded
  }

  return await LanguageModel.create({
    initialPrompts: [{
      role: "system",
      content: "You are a professional email writing assistant. You help users write concise, email body content based on their instructions. Always respond with only the email body content - no subject lines, no placeholders like [Name] or [Your Name], and no explanations. Keep responses brief and to the point."
    }],
    outputLanguage: outputLanguage, // Specify output language to prevent crashes
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

// Intelligent Task Classification and Routing System
const createClassificationSession = async (): Promise<LanguageModelSession> => {
  const availability = await LanguageModel.availability();

  if (availability === 'downloadable') {
    // Model needs to be downloaded
  }

  return await LanguageModel.create({
    initialPrompts: [{
      role: "system",
      content: "You are an intelligent task classifier that analyzes user requests and context to determine the most appropriate AI task. You excel at understanding user intent, considering context, and choosing the right approach (rewrite, write, translate, summarize). Focus on what the user actually wants to achieve rather than rigid keyword matching. Always respond with valid JSON format only."
    }],
    outputLanguage: "en", // Specify English as output language
    monitor(m: LanguageModelMonitor) {
      m.addEventListener('downloadprogress', (e: LanguageModelDownloadProgressEvent) => {
        // Download progress
      });
    },
  });
};

const classifyTask = async (userPrompt: string, contextText?: string): Promise<TaskClassification> => {
  try {
    const session = await createClassificationSession();

    const classificationPrompt = `You are an intelligent task classifier. Analyze the user's request and the context to determine the most appropriate task type.

TASK TYPE DEFINITIONS:
- "rewrite": Modify, improve, rephrase, or restructure the EXISTING selected text while keeping the same core content
- "write": Create NEW content, responses, answers, or original text based on instructions or context
- "translate": Convert text from one language to another
- "summarize": Condense, extract key points, or create a shorter version of the text
- "unknown": Request doesn't clearly fit any category

CRITICAL DISTINCTION:
- If user wants to MODIFY the selected text → "rewrite"
- If user wants to CREATE a response TO the selected text → "write"

ANALYSIS APPROACH:
1. Read the user prompt carefully
2. Consider the context text (the selected text)
3. Determine: Does user want to modify the selected text OR create a response to it?
4. Choose the task that best matches their goal

EXAMPLES OF CORRECT CLASSIFICATION:
- "make this more professional" → rewrite (modifying the selected text)
- "rephrase this to be clearer" → rewrite (restructuring the selected text)
- "answer this message" → write (creating a response TO the selected text)
- "write a reply to this" → write (creating new content in response to selected text)
- "respond to this email" → write (creating a response TO the selected text)
- "what should I say to this?" → write (creating a suggested response)
- "how do I reply to this?" → write (creating a suggested response)
- "translate this to Hebrew" → translate
- "summarize this text" → summarize

User prompt: "${userPrompt}"
${contextText ? `Context text (selected text): "${contextText}"` : ''}

KEY ANALYSIS QUESTIONS:
1. Is the user asking to modify the selected text itself?
2. Is the user asking to create a response/reply/answer to the selected text?
3. What would be the most helpful outcome for the user?

CONFIDENCE GUIDELINES:
- Only use high confidence (0.95+) when the task type is clearly obvious
- If there's any ambiguity between rewrite/translate/write, use lower confidence
- Consider edge cases like "make this better" (could be rewrite or write)
- When uncertain, it's better to use lower confidence and let the system fall back to Prompt API

Respond with ONLY a JSON object in this exact format (no markdown formatting, no code blocks):
{
  "taskType": "write",
  "confidence": 0.98,
  "reasoning": "Detailed explanation focusing on whether user wants to modify selected text or create response to it",
  "suggestedOptions": {
    "tone": "casual",
    "format": "plain-text", 
    "length": "short"
  }
}

IMPORTANT: For suggestedOptions, select ONLY ONE value from these options:
- tone: "formal", "neutral", or "casual" (for Writer API) / "more-formal", "as-is", or "more-casual" (for Rewriter API)
- format: "markdown" or "plain-text" (for Writer API) / "as-is", "markdown", or "plain-text" (for Rewriter API)
- length: "short", "medium", or "long" (for Writer API) / "shorter", "as-is", or "longer" (for Rewriter API)

PREFERENCES: Unless user specifies otherwise, prefer:
- Writer API: "casual" tone, "plain-text" format, "short" length
- Rewriter API: "as-is" tone, "as-is" format, "as-is" length`;

    const result = await session.prompt(classificationPrompt);
    session.destroy();

    try {
      // Clean the result to remove markdown formatting and extract JSON
      let cleanedResult = result.trim();

      // Remove markdown code blocks if present
      if (cleanedResult.includes('```json')) {
        cleanedResult = cleanedResult.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedResult.includes('```')) {
        cleanedResult = cleanedResult.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      // Find JSON object boundaries
      const jsonStart = cleanedResult.indexOf('{');
      const jsonEnd = cleanedResult.lastIndexOf('}') + 1;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanedResult = cleanedResult.substring(jsonStart, jsonEnd);
      }

      console.log('Cleaned classification result:', cleanedResult);

      const classification = JSON.parse(cleanedResult);
      return classification as TaskClassification;
    } catch (parseError) {
      console.warn('Failed to parse classification result:', result);
      console.warn('Parse error:', parseError);
      return {
        taskType: 'unknown',
        confidence: 0,
        reasoning: 'Failed to parse AI response',
      };
    }
  } catch (error) {
    console.error('Task classification failed:', error);
    return {
      taskType: 'unknown',
      confidence: 0,
      reasoning: 'Classification failed due to error',
    };
  }
};

// Rewriter API integration
const createRewriter = async (options?: RewriterOptions): Promise<Rewriter> => {
  const availability = await Rewriter.availability();

  if (availability === 'unavailable') {
    throw new Error('Rewriter API is not available');
  }

  if (availability === 'downloadable') {
    throw new Error('Rewriter model needs to be downloaded with user gesture. Please try again after the model is downloaded.');
  }

  return await Rewriter.create({
    tone: options?.tone || 'as-is',
    format: options?.format || 'as-is',
    length: options?.length || 'as-is',
    sharedContext: options?.sharedContext,
    signal: options?.signal,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Rewriter model downloaded ${e.loaded * 100}%`);
      });
    },
  });
};

// Writer API integration  
const createWriter = async (options?: WriterOptions): Promise<Writer> => {
  const availability = await Writer.availability();

  if (availability === 'unavailable') {
    throw new Error('Writer API is not available');
  }

  if (availability === 'downloadable') {
    throw new Error('Writer model needs to be downloaded with user gesture. Please try again after the model is downloaded.');
  }

  return await Writer.create({
    tone: options?.tone || 'casual', // Prefer friendly tone
    format: options?.format || 'plain-text', // Prefer plain-text
    length: options?.length || 'short', // Prefer short answers
    sharedContext: options?.sharedContext,
    signal: options?.signal,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Writer model downloaded ${e.loaded * 100}%`);
      });
    },
  });
};

// Trigger model downloads with user gesture
const triggerModelDownloads = async (): Promise<void> => {
  try {
    // Check Rewriter availability
    const rewriterAvailability = await Rewriter.availability();
    if (rewriterAvailability === 'downloadable') {
      console.log('Triggering Rewriter model download...');
      await Rewriter.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Rewriter model downloaded ${e.loaded * 100}%`);
          });
        },
      });
    }

    // Check Writer availability
    const writerAvailability = await Writer.availability();
    if (writerAvailability === 'downloadable') {
      console.log('Triggering Writer model download...');
      await Writer.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Writer model downloaded ${e.loaded * 100}%`);
          });
        },
      });
    }
  } catch (error) {
    console.warn('Model download trigger failed:', error);
  }
};

// Validate and sanitize classification options
const validateClassificationOptions = (options: any, taskType: string) => {
  if (taskType === 'write') {
    // Writer API values according to documentation
    const validWriterTones = ['formal', 'neutral', 'casual'];
    const validWriterFormats = ['markdown', 'plain-text'];
    const validWriterLengths = ['short', 'medium', 'long'];

    return {
      tone: validWriterTones.includes(options?.tone) ? options.tone : 'casual', // Prefer friendly tone
      format: validWriterFormats.includes(options?.format) ? options.format : 'plain-text', // Prefer plain-text
      length: validWriterLengths.includes(options?.length) ? options.length : 'short' // Prefer short answers
    };
  } else {
    // Rewriter API values (keeping existing logic)
    const validRewriterTones = ['more-formal', 'as-is', 'more-casual'];
    const validRewriterFormats = ['as-is', 'markdown', 'plain-text'];
    const validRewriterLengths = ['shorter', 'as-is', 'longer'];

    return {
      tone: validRewriterTones.includes(options?.tone) ? options.tone : 'as-is',
      format: validRewriterFormats.includes(options?.format) ? options.format : 'as-is',
      length: validRewriterLengths.includes(options?.length) ? options.length : 'as-is'
    };
  }
};

// Intelligent text processing with API routing
const processTextIntelligently = async (userPrompt: string, contextText?: string): Promise<string> => {
  try {
    // Step 1: Classify the task
    const classification = await classifyTask(userPrompt, contextText);
    console.log('Task classification:', classification);

    // Step 2: Check confidence threshold - fall back to Prompt API if below 95%
    if (classification.confidence < 0.95) {
      console.log(`Classification confidence (${classification.confidence}) below 95% threshold, falling back to Prompt API`);
      return await processTextWithAI(userPrompt, contextText);
    }

    // Step 3: Route to appropriate API based on classification
    switch (classification.taskType) {
      case 'rewrite':
        if (!contextText) {
          throw new Error('Rewrite task requires context text');
        }

        const validatedOptions = validateClassificationOptions(classification.suggestedOptions, 'rewrite');
        console.log('Validated rewrite options:', validatedOptions);

        const rewriter = await createRewriter({
          tone: validatedOptions.tone as any,
          format: validatedOptions.format as any,
          length: validatedOptions.length as any,
          sharedContext: `User wants to rewrite this text: "${contextText}". Instructions: "${userPrompt}"`,
        });

        const rewrittenText = await rewriter.rewrite(contextText, {
          context: `Original text: "${contextText}". User instruction: "${userPrompt}"`,
          tone: validatedOptions.tone as any,
        });

        rewriter.destroy();
        return rewrittenText;

      case 'write':
        const validatedWriteOptions = validateClassificationOptions(classification.suggestedOptions, 'write');
        console.log('Validated write options:', validatedWriteOptions);

        // Create a proper prompt for response generation
        const responsePrompt = contextText
          ? `Write a response to this message: "${contextText}". ${userPrompt}`
          : userPrompt;

        const writer = await createWriter({
          tone: validatedWriteOptions.tone as any,
          format: validatedWriteOptions.format as any,
          length: validatedWriteOptions.length as any,
          sharedContext: contextText ? `You are writing a response to this message: "${contextText}". User instruction: "${userPrompt}"` : undefined,
        });

        const writtenText = await writer.write(responsePrompt, {
          context: contextText ? `Original message: "${contextText}". User wants: "${userPrompt}"` : undefined,
          tone: validatedWriteOptions.tone as any,
        });

        writer.destroy();
        return writtenText;

      case 'translate':
        // Use existing translation logic with enhanced context
        if (!contextText) {
          throw new Error('Translation task requires context text');
        }
        return await processTextWithAI(`Translate this text: "${contextText}". ${userPrompt}`, contextText);

      case 'summarize':
        // Use existing AI logic for summarization with enhanced context
        if (!contextText) {
          throw new Error('Summarization task requires context text');
        }
        return await processTextWithAI(`Summarize this text: "${contextText}". ${userPrompt}`, contextText);

      default:
        // Fallback to original AI processing
        console.log('Using fallback AI processing for unknown task type');
        return await processTextWithAI(userPrompt, contextText);
    }
  } catch (error) {
    console.error('Intelligent processing failed, falling back to original AI:', error);
    // Fallback to original AI processing
    return await processTextWithAI(userPrompt, contextText);
  }
};

// Gmail detection
const isGmail = (): boolean => {
  return window.location.hostname.includes('mail.google.com');
};

// Gmail PDF viewer detection
const isGmailPDFViewer = (): boolean => {
  const isGmailSite = isGmail();
  const pdfViewer = document.querySelector('div.aLF-aPX[role="dialog"]');
  const hasPDFViewer = pdfViewer !== null;

  console.log('PDF Viewer Detection:', {
    isGmailSite,
    hasPDFViewer,
    pdfViewer: pdfViewer ? 'Found' : 'Not found',
    url: window.location.href
  });

  return isGmailSite && hasPDFViewer;
};

// Create magic stick bubble for PDF translation
const createPDFMagicStickBubble = (): void => {
  // Remove existing bubble if it exists
  const existingBubble = document.querySelector('.phrasebe-pdf-magic-stick');
  if (existingBubble) {
    existingBubble.remove();
  }

  // Create the magic stick bubble
  const bubble = document.createElement('div');
  bubble.className = 'phrasebe-pdf-magic-stick';
  bubble.innerHTML = `
    <div class="magic-stick-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <!-- Pencil -->
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#8b5cf6"/>
        <!-- Sparkles -->
        <path d="M19 3l-1.5 1.5L16 3l1.5-1.5L19 3z" fill="#10b981"/>
        <path d="M21 7l-1 1L19 7l1-1L21 7z" fill="#10b981"/>
        <path d="M17 5l-0.5 0.5L16 5l0.5-0.5L17 5z" fill="#10b981"/>
      </svg>
    </div>
  `;

  // Position the bubble on the right side
  bubble.style.position = 'fixed';
  bubble.style.top = '20px';
  bubble.style.right = '20px';
  bubble.style.zIndex = '999999';
  bubble.style.cursor = 'pointer';

  // Add click event listener
  bubble.addEventListener('click', async () => {
    console.log('Magic stick clicked, extracting PDF content');
    await extractAndTranslatePDFContent();
  });

  // Add to document
  document.body.appendChild(bubble);
  console.log('PDF magic stick bubble created');
};

// Remove PDF magic stick bubble
const removePDFMagicStickBubble = (): void => {
  const existingBubble = document.querySelector('.phrasebe-pdf-magic-stick');
  if (existingBubble) {
    existingBubble.remove();
    console.log('PDF magic stick bubble removed');
  }
};

// Extract PDF content and show translation
// Check if PDF translation is allowed
const isPDFTranslationAllowed = async (): Promise<boolean> => {
  const translationEnabled = await isTranslationEnabled();
  if (!translationEnabled) {
    console.log('Translation disabled, skipping PDF translation');
    return false;
  }

  const siteBlacklisted = await isSiteBlacklisted();
  if (siteBlacklisted) {
    console.log('Site blacklisted, skipping PDF translation');
    return false;
  }

  return true;
};

// Extract text from PDF text elements
const extractTextFromElements = (pdfViewer: Element): string => {
  const textElements = pdfViewer.querySelectorAll('.aLF-aPX-aPF-aPE-a1J-Ji');
  if (textElements.length === 0) return '';

  const textParts = Array.from(textElements)
    .map(el => el.textContent?.trim())
    .filter(text => text && text.length > 0);

  return textParts.join(' ').trim();
};

// Extract text from PDF viewer
const extractPDFText = (pdfViewer: Element): string => {
  let pdfText = extractTextFromElements(pdfViewer);

  if (!pdfText || pdfText.length === 0) {
    pdfText = pdfViewer.textContent?.trim() || '';
  }

  return pdfText;
};

// Extract and translate PDF content
const extractAndTranslatePDFContent = async (): Promise<void> => {
  console.log('Extracting PDF content for translation');

  if (!(await isPDFTranslationAllowed())) return;

  const pdfViewer = document.querySelector('div.aLF-aPX[role="dialog"]');
  if (!pdfViewer) {
    console.log('PDF viewer not found');
    return;
  }

  const pdfText = extractPDFText(pdfViewer);
  console.log('Extracted PDF text:', pdfText);

  if (pdfText && pdfText.length > 0) {
    await showSuggestionBoxForPDF(pdfText);
  } else {
    console.log('No PDF text found to translate');
  }
};

// Helper function to get position for suggestion box
const getSuggestionBoxPosition = (): { x: number; y: number } => {
  // Check if we're on WhatsApp Web
  const isWhatsAppWeb = window.location.hostname.includes('web.whatsapp.com');

  if (isWhatsAppWeb) {
    // For WhatsApp Web, center the box in the middle of the screen
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  } else {
    // For PDF, position near the magic stick button
    const magicStick = document.querySelector('.phrasebe-pdf-magic-stick') as HTMLElement;
    if (magicStick) {
      const magicStickRect = magicStick.getBoundingClientRect();
      return {
        x: magicStickRect.left,
        y: magicStickRect.bottom + 10 // 10px gap below the button
      };
    } else {
      // Fallback to center of screen
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };
    }
  }
};

// Helper function to add drag functionality to suggestion box
const addDragFunctionality = (box: HTMLDivElement): void => {
  const dragHandle = box.querySelector('.header-drag-handle') as HTMLElement;
  const header = box.querySelector('.suggestion-header') as HTMLElement;

  const startDrag = (e: MouseEvent): void => {
    isDragging = true;
    const rect = box.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseup', stopDrag);

    e.preventDefault();
    e.stopPropagation();
    document.body.style.userSelect = 'none';
  };

  const drag = (e: MouseEvent): void => {
    if (!isDragging || !box) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - box.offsetWidth;
    const maxY = window.innerHeight - box.offsetHeight;

    box.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    box.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
  };

  const stopDrag = (): void => {
    isDragging = false;
    dragJustEnded = true;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('mouseup', stopDrag);

    document.body.style.userSelect = '';

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
  box.addEventListener('mouseup', (e) => {
    if (!isDragging) {
      e.stopPropagation();
    }
  });
};

// Show skeleton loader in suggestion box
const showSkeletonLoader = (box: HTMLDivElement, title: string = 'Translation (Detecting language...)'): void => {
  const headerContent = box.querySelector('.header-content') as HTMLElement;
  if (headerContent) {
    headerContent.innerHTML = `
      <div class="header-title">${title}</div>
      <div class="skeleton-loader">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line long"></div>
      </div>
    `;
  }
};

// Helper function to add all event listeners to suggestion box
const addSuggestionBoxEventListeners = (box: HTMLDivElement, selectedText: string): void => {
  const languageSelect = box.querySelector('.language-select') as HTMLSelectElement;
  const whatsappInput = box.querySelector('.whatsapp-input') as HTMLElement;
  const whatsappSendBtn = box.querySelector('.whatsapp-send-btn') as HTMLButtonElement;
  const copyBtn = box.querySelector('.copy-btn') as HTMLButtonElement;
  const disableSiteBtn = box.querySelector('.disable-site-btn') as HTMLButtonElement;
  const closeBtn = box.querySelector('.close-btn') as HTMLButtonElement;

  // Language dropdown change handler
  if (languageSelect) {
    languageSelect.addEventListener('change', async () => {
      const selectedLanguage = languageSelect.value;
      const languageName = getLanguageName(selectedLanguage);

      // Check if user selected the original language
      if (originalDetectedLanguage && languageName.toLowerCase().includes(originalDetectedLanguage.toLowerCase())) {
        const headerContent = box?.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          const originalDirection = originalDetectedLanguage.toLowerCase().includes('hebrew') ||
            originalDetectedLanguage.toLowerCase().includes('arabic') ? 'rtl' : 'ltr';
          headerContent.innerHTML = `
            <div class="header-title">Original Text (${originalDetectedLanguage})</div>
            <div class="header-text" dir="${originalDirection}">
              <div class="text-content">${selectedText}</div>
            </div>
          `;
        }
        return;
      }

      // Show skeleton loader while translating
      showSkeletonLoader(box, `Translation (${originalDetectedLanguage || 'English'} → ${languageName})`);

      try {
        const translatedText = await translateText(selectedText, originalDetectedLanguage || 'English', languageName);
        const outputDirection = selectedLanguage === 'he' || selectedLanguage === 'ar' ? 'rtl' : 'ltr';

        const headerContent = box?.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          const isLongText = translatedText.length > 200;
          let formattedTranslation;
          try {
            formattedTranslation = await formatTextWithPromptAPI(translatedText, selectedLanguage);
          } catch (formatError) {
            console.warn('AI formatting failed, using fallback:', formatError);
            formattedTranslation = formatTextForDisplay(translatedText);
          }

          headerContent.innerHTML = `
            <div class="header-title">Translation (${originalDetectedLanguage || 'English'} → ${languageName})</div>
            <div class="header-text ${isLongText ? 'long-text' : ''}" dir="${outputDirection}">
              <div class="text-content">${formattedTranslation.replace(/\n/g, '<br>')}</div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Translation failed:', error);
        // Show error message in the suggestion box
        const headerContent = box?.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          headerContent.innerHTML = `
            <div class="header-title">Translation Error</div>
            <div class="header-text">
              <div class="text-content">Failed to translate text. Please try again.</div>
            </div>
          `;
        }
      }
    });
  }

  // Copy button handler
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const textContent = box?.querySelector('.text-content') as HTMLElement;
      if (textContent) {
        navigator.clipboard.writeText(textContent.textContent || '');
      }
    });
  }

  // Disable site button handler
  if (disableSiteBtn) {
    disableSiteBtn.addEventListener('click', async () => {
      const currentDomain = window.location.hostname;
      const blacklistedSites = await getBlacklistedSites();
      blacklistedSites.push(currentDomain);
      await chrome.storage.sync.set({ blacklistedSites });
      hideSuggestionBox();
    });
  }

  // WhatsApp input handlers
  if (whatsappInput && whatsappSendBtn) {
    whatsappInput.addEventListener('input', () => {
      const hasText = whatsappInput.textContent && whatsappInput.textContent.trim().length > 0;
      whatsappSendBtn.style.display = hasText ? 'flex' : 'none';
    });

    whatsappInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        whatsappSendBtn.click();
      }
    });

    whatsappSendBtn.addEventListener('click', async () => {
      const prompt = whatsappInput.textContent?.trim();
      if (!prompt) return;

      const originalContent = whatsappSendBtn.innerHTML;
      whatsappSendBtn.innerHTML = `<div class="spinner"></div>`;
      whatsappSendBtn.disabled = true;
      whatsappInput.contentEditable = 'false';

      try {
        const response = await sendPromptToAI(prompt, selectedText);
        const responseLanguage = await detectLanguage(response);
        const responseDirection = responseLanguage.direction;

        const headerContent = box?.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          headerContent.innerHTML = `
            <div class="header-title">AI Response</div>
            <div class="header-text" dir="${responseDirection}">
              <div class="text-content">${response}</div>
            </div>
          `;
        }

        whatsappInput.textContent = '';
        whatsappSendBtn.style.display = 'none';

      } catch (error) {
        console.error('AI processing failed:', error);
        const headerContent = box.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          headerContent.innerHTML = `
            <div class="header-title">Error</div>
            <div class="header-text">
              <div class="text-content">Failed to process your request. Please try again.</div>
            </div>
          `;
        }
      } finally {
        whatsappSendBtn.innerHTML = originalContent;
        whatsappSendBtn.disabled = false;
        whatsappInput.contentEditable = 'true';
      }
    });
  }

  // Close button handler
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideSuggestionBox();
    });
  }

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (box && !box.contains(e.target as Node)) {
      hideSuggestionBox();
    }
  }, { once: true });
};

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

  return 'en';
};

// Reusable auto-translate function
const autoTranslate = async (selectedText: string): Promise<void> => {
  // Add timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Auto-translation timeout')), 45000)
  );

  const translationPromise = (async () => {
    try {
      // Detect the language of the selected text with fallback
      let detectedLanguage: string;
      try {
        const detectionResult = await detectLanguage(selectedText);
        detectedLanguage = detectionResult.language;
      } catch (error) {
        console.warn('Language detection failed, using fallback:', error);
        detectedLanguage = 'English';
      }

      // Store the original detected language for comparison
      originalDetectedLanguage = detectedLanguage;

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

      const translatedText = await translateText(selectedText, sourceLanguageName, targetLanguageName);

      // Determine direction based on the output language (translated text)
      const outputDirection = targetLanguage === 'he' || targetLanguage === 'ar' ? 'rtl' : 'ltr';

      // Update the suggestion box content with the translation
      if (suggestionBox) {
        // Replace skeleton loader with actual translation
        const headerContent = suggestionBox.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          const isLongText = translatedText.length > 200;

          // Format the translated text using Prompt API
          let formattedTranslation;
          try {
            formattedTranslation = await formatTextWithPromptAPI(translatedText, targetLanguage);
          } catch (formatError) {
            console.warn('AI formatting failed, using fallback:', formatError);
            formattedTranslation = formatTextForDisplay(translatedText);
          }

          headerContent.innerHTML = `
          <div class="header-title">Translation (${sourceLanguageName} → ${targetLanguageName})</div>
          <div class="header-text ${isLongText ? 'long-text' : ''}" dir="${outputDirection}">
            <div class="text-content">${formattedTranslation.replace(/\n/g, '<br>')}</div>
          </div>
        `;
        }

        // Update language dropdown to show detected language
        const languageSelect = suggestionBox.querySelector('.language-select') as HTMLSelectElement;
        if (languageSelect) {
          languageSelect.value = targetLanguage;
        }
      }
    } catch (error) {
      console.error('Auto-translation failed:', error);
      // Show error in the suggestion box
      if (suggestionBox) {
        const headerContent = suggestionBox.querySelector('.header-content') as HTMLElement;
        if (headerContent) {
          headerContent.innerHTML = `
          <div class="header-title">Translation Error</div>
          <div class="header-text">
            <div class="text-content">Failed to translate text. Please try again.</div>
          </div>
        `;
        }
      }
    }
  })();

  try {
    await Promise.race([translationPromise, timeoutPromise]);
  } catch (error) {
    console.error('Auto-translation failed:', error);
    // Show error in the suggestion box
    if (suggestionBox) {
      const headerContent = suggestionBox.querySelector('.header-content') as HTMLElement;
      if (headerContent) {
        headerContent.innerHTML = `
          <div class="header-title">Translation Error</div>
          <div class="header-text">
            <div class="text-content">Translation timed out or failed. Please try again.</div>
          </div>
        `;
      }
    }
  }
};

// Show suggestion box for PDF content (reuses existing functions)
const showSuggestionBoxForPDF = async (selectedText: string): Promise<void> => {
  console.log('showSuggestionBoxForPDF called with text:', selectedText);

  // Remove existing suggestion box
  if (suggestionBox) {
    suggestionBox.remove();
  }

  // Get position for the box
  const position = getSuggestionBoxPosition();

  // Create and show new suggestion box
  suggestionBox = await createSuggestionBox(selectedText, position);
  document.body.appendChild(suggestionBox);

  // Add drag functionality
  addDragFunctionality(suggestionBox);

  // Add all event listeners
  addSuggestionBoxEventListeners(suggestionBox, selectedText);

  // Start auto-translation
  autoTranslate(selectedText);
};

// Helper function to get blacklisted sites
const getBlacklistedSites = async (): Promise<string[]> => {
  const result = await chrome.storage.sync.get(['blacklistedSites']);
  return result.blacklistedSites || [];
};

// Helper function to send prompt to AI
const sendPromptToAI = async (prompt: string, context: string): Promise<string> => {
  try {
    const model = await LanguageModel.create({
      outputLanguage: "en"
    });

    const fullPrompt = `Context: ${context}\n\nUser request: ${prompt}\n\nPlease provide a helpful response based on the context. Keep it concise and relevant.`;
    const response = await model.prompt(fullPrompt);

    return response || 'No response generated';
  } catch (error) {
    console.error('AI prompt failed:', error);
    throw new Error('Failed to get AI response');
  }
};

// Check if PDF viewer is closed
const isPDFViewerClosed = (element: Element): boolean => {
  return element.classList &&
    element.classList.contains('aLF-aPX') &&
    element.getAttribute('role') === 'dialog';
};

// Handle PDF viewer closure detection
const handlePDFViewerClosure = (node: Node): void => {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  if (isPDFViewerClosed(element)) {
    console.log('PDF viewer closed, removing magic stick bubble');
    removePDFMagicStickBubble();
  }
};

// Create observer for PDF viewer closure
const createPDFClosureObserver = (): MutationObserver => {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        handlePDFViewerClosure(node);
      });
    });
  });
};

// Add PDF magic stick bubble when PDF viewer opens
const addPDFViewerListeners = (): void => {
  const pdfViewer = document.querySelector('div.aLF-aPX[role="dialog"]');
  if (!pdfViewer) return;

  console.log('PDF viewer detected, creating magic stick bubble');
  createPDFMagicStickBubble();

  const observer = createPDFClosureObserver();
  observer.observe(document.body, { childList: true, subtree: true });
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
let originalDetectedLanguage: string | null = null;

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
  let translator: any = null;

  try {
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
    translator = await Translator.create({
      sourceLanguage: sourceLanguageCode,
      targetLanguage: targetLanguageCode,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          console.log(`Downloaded ${e.loaded * 100}%`);
        });
      },
    });

    // Translate text with timeout
    const translationPromise = translator.translate(text);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Translation timeout')), 30000)
    );

    const translatedText = await Promise.race([translationPromise, timeoutPromise]);
    console.log('Translation completed successfully');

    return translatedText as string;
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  } finally {
    // Clean up translator instance
    if (translator) {
      try {
        translator.destroy();
        console.log('Translator instance destroyed');
      } catch (cleanupError) {
        console.warn('Failed to destroy translator:', cleanupError);
      }
    }
  }
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

// Format text using Prompt API to get properly formatted HTML
const formatTextWithPromptAPI = async (text: string, targetLanguage: string = 'en'): Promise<string> => {
  try {
    const prompt = `Please format the following text for better readability with proper line breaks and structure. 

Requirements:
- Add line breaks where appropriate for better readability
- Preserve numbered lists and bullet points
- Keep the original structure and formatting
- Make the text more readable and well-organized
- Return only the formatted plain text, no HTML tags, no explanations

Text to format:
${text}`;

    // Use the existing LanguageModel for formatting with dynamic output language
    const model = await LanguageModel.create({
      outputLanguage: targetLanguage // Use the target language dynamically
    });
    const response = await model.prompt(prompt);

    // Strip any HTML tags that might be returned
    const cleanText = (response || text).replace(/<[^>]*>/g, '');
    return cleanText;
  } catch (error) {
    console.warn('Failed to format text with Prompt API, using fallback:', error);
    return formatTextForDisplay(text);
  }
};

// Simple fallback formatting (only used when AI formatting fails)
const formatTextForDisplay = (text: string): string => {
  // Simple line break preservation - return plain text
  return text.replace(/\n/g, '\n');
};

const createSuggestionBox = async (selectedText: string, position: { x: number; y: number }): Promise<HTMLDivElement> => {
  const box = document.createElement('div');
  const isLongText = selectedText.length > 200;
  box.className = `phrasebe-suggestion-box ${isLongText ? 'long-text' : ''}`;

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

  // Always use fixed positioning with maximum z-index for consistent behavior
  box.style.position = 'fixed';
  box.style.zIndex = '2147483647'; // Maximum z-index value

  if (isWhatsAppWeb) {
    // For WhatsApp Web, center the box in the middle of the screen
    box.style.left = '50%';
    box.style.top = '50%';
    box.style.transform = 'translate(-50%, -50%)';
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

    box.style.left = leftPosition + 'px';
    box.style.top = position.y + 'px';
  }

  return box;
};

const showSuggestionBox = async (selectedText: string): Promise<void> => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Get plain text for translation
  const selectedTextForTranslation = selection.toString().trim();

  // Remove existing suggestion box
  if (suggestionBox) {
    suggestionBox.remove();
  }

  // Get position for the box
  let position: { x: number; y: number };
  const isWhatsAppWeb = window.location.hostname.includes('web.whatsapp.com');

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
  suggestionBox = await createSuggestionBox(selectedTextForTranslation, position);
  document.body.appendChild(suggestionBox);

  // Add drag functionality
  addDragFunctionality(suggestionBox);

  // Add all event listeners
  addSuggestionBoxEventListeners(suggestionBox, selectedTextForTranslation);

  // Start auto-translation
  autoTranslate(selectedTextForTranslation);
};

const hideSuggestionBox = (): void => {
  if (suggestionBox) {
    // Track the last selected text before hiding
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      lastSelectedText = selection.toString().trim();
    }
    suggestionBox.remove();
    suggestionBox = null;
  }
  isDragging = false;
  dragJustEnded = false;
  document.body.style.userSelect = '';
};

const handleTextSelection = async (): Promise<void> => {
  console.log('handleTextSelection called');

  // Check if translation feature is enabled
  const translationEnabled = await isTranslationEnabled();
  console.log('Translation enabled:', translationEnabled);
  if (!translationEnabled) {
    console.log('Translation disabled, skipping');
    return; // Don't show suggestion box if translation is disabled
  }

  // Check if current site is blacklisted
  const siteBlacklisted = await isSiteBlacklisted();
  console.log('Site blacklisted:', siteBlacklisted);
  if (siteBlacklisted) {
    console.log('Site blacklisted, skipping');
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
  console.log('Selection object:', selection);
  console.log('Selection text:', selection ? selection.toString() : 'No selection');

  // If no selection or empty selection, hide box and clear timeout
  if (!selection || selection.toString().trim().length === 0) {
    console.log('No selection or empty selection');
    // Clear any pending timeout
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
      selectionTimeout = null;
    }
    hideSuggestionBox();
    return;
  }

  const selectedText = selection.toString().trim();
  console.log('Selected text:', selectedText);

  // Check if this is the same selection as before
  if (selectedText === lastSelectedText && !hasSelectionChanged) {
    console.log('Same selection as before, not showing box');
    return;
  }

  // Update tracking variables
  lastSelectedText = selectedText;
  hasSelectionChanged = false;

  // Clear any existing timeout
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  // Set new timeout to show suggestion box after 2.5 seconds
  selectionTimeout = setTimeout(async () => {
    console.log('Timeout reached, showing suggestion box');
    await showSuggestionBox(selectedText);
  }, 2500);
};

// Check if a node is a PDF viewer dialog
const isPDFViewerDialog = (element: Element): boolean => {
  return element.classList &&
    element.classList.contains('aLF-aPX') &&
    element.getAttribute('role') === 'dialog';
};

// Check if a node contains a nested PDF viewer
const containsPDFViewer = (element: Element): boolean => {
  return element.querySelector &&
    element.querySelector('div.aLF-aPX[role="dialog"]') !== null;
};

// Handle PDF viewer detection in mutation
const handlePDFViewerDetection = (node: Node): void => {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;

  if (isPDFViewerDialog(element)) {
    console.log('PDF viewer opened dynamically, adding magic stick bubble');
    addPDFViewerListeners();
    return;
  }

  if (containsPDFViewer(element)) {
    console.log('Nested PDF viewer detected, adding magic stick bubble');
    addPDFViewerListeners();
  }
};

// Create mutation observer for PDF viewer monitoring
const createPDFViewerObserver = (): MutationObserver => {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        handlePDFViewerDetection(node);
      });
    });
  });
};

// Start monitoring for PDF viewers opening dynamically
const startPDFViewerMonitoring = (): void => {
  const pdfObserver = createPDFViewerObserver();
  pdfObserver.observe(document.body, { childList: true, subtree: true });
  console.log('PDF viewer monitoring started');
};

// Initialize extension
const initializeExtension = async (): Promise<void> => {
  console.log('Initializing extension on:', window.location.href);

  // Add text selection listener for all websites
  document.addEventListener('mouseup', (e) => {
    console.log('Mouseup event triggered on:', e.target);
    handleTextSelection();
  });
  document.addEventListener('keyup', (e) => {
    console.log('Keyup event triggered on:', e.target);
    handleTextSelection();
  });

  // Add additional listeners for better text selection handling
  document.addEventListener('input', handleTextSelection); // Handle text deletion/typing
  document.addEventListener('selectionchange', (e) => {
    console.log('Selection change event triggered');
    handleTextSelection();
  }); // Handle selection changes

  // Special handling for Gmail PDF viewer
  if (isGmailPDFViewer()) {
    console.log('Gmail PDF viewer detected at startup, adding specific event listeners');
    addPDFViewerListeners();
  } else {
    console.log('No Gmail PDF viewer detected at startup');
  }

  // Start monitoring for PDF viewers
  startPDFViewerMonitoring();

  // Track text selection changes to update hasSelectionChanged flag
  document.addEventListener('selectionchange', () => {
    console.log('Selection changed, setting hasSelectionChanged to true');
    hasSelectionChanged = true;
  });

  // Handle keyboard shortcuts
  chrome.commands.onCommand.addListener((command) => {
    console.log('Command received:', command);
    if (command === 'open-translate-box') {
      handleTextSelection();
    }
  });

  // Initialize Chrome Extension keyboard commands handler
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Message received:', message);
      if (message.action === 'openTranslateBox') {
        console.log('Opening translate box via keyboard shortcut');
        setTimeout(() => {
          handleTextSelection();
        }, 10);
      }
    });
  }

  if (!isGmail()) {
    return; // Only work in Gmail for bubble feature
  }

  const bubble = createBubble();
  globalBubble = bubble;

  // Set up typing listeners for Gmail compose areas  
  const handleInput = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isNewEmailCompose(target) && globalBubble) {
      console.log('Input in Gmail compose detected');
      positionBubbleAtCursor(globalBubble, target);
    }
  };

  const handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (isNewEmailCompose(target) && globalBubble) {
      console.log('Click in Gmail compose detected');
      positionBubbleAtCursor(globalBubble, target);
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
