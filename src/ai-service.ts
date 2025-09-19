// Functional AI Service for Chrome Prompt API Integration
// Based on: https://developer.chrome.com/docs/ai/prompt-api

// Type definitions
interface LanguageModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

interface LanguageModelSession {
  prompt(prompt: string, options?: { signal?: AbortSignal; responseConstraint?: any; omitResponseConstraintInput?: boolean }): Promise<string>;
  promptStreaming(prompt: string, options?: { signal?: AbortSignal; responseConstraint?: any; omitResponseConstraintInput?: boolean }): ReadableStream<string>;
  destroy(): void;
  clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
}

interface LanguageModel {
  availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
  create(options?: { 
    monitor?: (model: any) => void;
    topK?: number;
    temperature?: number;
    expectedInputs?: Array<{ type: 'text' | 'audio' | 'image' }>;
  }): Promise<LanguageModelSession>;
  params(): Promise<LanguageModelParams>;
}

interface AIServiceState {
  session: LanguageModelSession | null;
  isInitialized: boolean;
  initializationPromise: Promise<void> | null;
}

interface RephraseResult {
  success: boolean;
  text?: string;
  error?: string;
}

// Declare global LanguageModel
declare global {
  const LanguageModel: LanguageModel;
}

// Constants
const AI_CONSTANTS = {
  REPHRASE_PROMPT: `You are a professional writing assistant. Your task is to understand the user's request and provide the appropriate response.

CRITICAL UNDERSTANDING:
- Users can write in ANY language and request responses in ANY other language
- Focus on UNDERSTANDING THE USER'S INTENT, not just translating their words
- If they ask you to "draft", "write", "create", "compose" something, CREATE that content
- If they provide context about what they want to communicate, USE that context to create the requested content
- Only translate if the user explicitly asks for translation

EXAMPLES OF WHAT TO DO:
- User writes in Hebrew: "Write me an email in English about declining an invitation" → CREATE the actual English email
- User writes in Spanish: "Draft a message in French for my boss" → CREATE the actual French message
- User writes in Arabic: "Compose a letter in German for my landlord" → CREATE the actual German letter
- User writes in Chinese: "Write a response in Japanese to my colleague" → CREATE the actual Japanese response

EXAMPLES OF WHAT NOT TO DO:
- User writes in Hebrew asking for English email → DON'T translate their Hebrew request
- User writes in Spanish asking for French message → DON'T translate their Spanish request
- User provides context in any language → DON'T just translate their context

Instructions:
- Understand the user's intent and create the requested content in the target language
- Make it professional, clear, and appropriate for the context
- Maintain the original meaning and intent from their context
- Keep the appropriate tone (formal, casual, etc.)
- Make it suitable for professional communication (emails, documents, etc.)
- Do not add explanations, introductions, or conclusions
- Return only the requested content
- If the text is already well-written, make minor improvements for clarity

User request:`,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
} as const;

// Response cleaning prefixes and suffixes
const RESPONSE_PREFIXES = [
  // English
  'Here is the rephrased text:', 'Rephrased text:', 'Here\'s the rephrased version:',
  'The rephrased text is:', 'Rephrased:', 'Here is the email:', 'Here\'s the email:',
  'Here is the message:', 'Here\'s the message:', 'Here is the draft:', 'Here\'s the draft:',
  'Here is the content:', 'Here\'s the content:', 'Here is what you can write:',
  'Here\'s what you can write:', 'Here is the response:', 'Here\'s the response:',
  'Here is the letter:', 'Here\'s the letter:',
  // Spanish
  'Aquí está el texto:', 'Aquí está el email:', 'Aquí está el mensaje:',
  'Aquí está la carta:', 'Aquí está el borrador:',
  // French
  'Voici le texte:', 'Voici l\'email:', 'Voici le message:',
  'Voici la lettre:', 'Voici le brouillon:',
  // German
  'Hier ist der Text:', 'Hier ist die E-Mail:', 'Hier ist die Nachricht:',
  'Hier ist der Brief:', 'Hier ist der Entwurf:',
  // Hebrew
  'הנה הטקסט:', 'הנה האימייל:', 'הנה ההודעה:', 'הנה המכתב:', 'הנה הטיוטה:',
  // Arabic
  'إليك النص:', 'إليك البريد الإلكتروني:', 'إليك الرسالة:', 'إليك الخطاب:', 'إليك المسودة:',
] as const;

const RESPONSE_SUFFIXES = [
  // English
  'I hope this helps!', 'Hope this helps!', 'Let me know if you need any changes.',
  'Feel free to modify as needed.', 'You can adjust this as needed.',
  // Spanish
  '¡Espero que esto ayude!', 'Espero que esto ayude!', 'Déjame saber si necesitas cambios.',
  'Siéntete libre de modificar según sea necesario.',
  // French
  'J\'espère que cela aide!', 'J\'espère que cela vous aide!',
  'Faites-moi savoir si vous avez besoin de modifications.',
  'N\'hésitez pas à modifier selon vos besoins.',
  // German
  'Ich hoffe, das hilft!', 'Ich hoffe, das hilft Ihnen!',
  'Lassen Sie mich wissen, wenn Sie Änderungen benötigen.',
  'Fühlen Sie sich frei, nach Bedarf zu ändern.',
] as const;

// State management
let aiState: AIServiceState = {
  session: null,
  isInitialized: false,
  initializationPromise: null,
};

// Utility functions
const validateText = (text: string): boolean => {
  return text.trim().length > 0;
};

const createTimeoutController = (timeoutMs: number): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
};

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Response cleaning functions
const cleanResponsePrefixes = (text: string): string => {
  let cleaned = text.trim();
  
  for (const prefix of RESPONSE_PREFIXES) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
      break;
    }
  }
  
  return cleaned;
};

const cleanResponseSuffixes = (text: string): string => {
  let cleaned = text.trim();
  
  for (const suffix of RESPONSE_SUFFIXES) {
    if (cleaned.toLowerCase().endsWith(suffix.toLowerCase())) {
      cleaned = cleaned.substring(0, cleaned.length - suffix.length).trim();
      break;
    }
  }
  
  return cleaned;
};

const removeQuotes = (text: string): string => {
  let cleaned = text.trim();
  
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  return cleaned;
};

const cleanResponse = (response: string): string => {
  return removeQuotes(
    cleanResponseSuffixes(
      cleanResponsePrefixes(response)
    )
  ).trim();
};

// LanguageModel availability check
const checkLanguageModelAvailability = async (): Promise<boolean> => {
  try {
    if (typeof LanguageModel === 'undefined') {
      return false;
    }

    const availability = await LanguageModel.availability();
    return availability !== 'unavailable';
  } catch (error) {
    return false;
  }
};

// Session initialization
const initializeSession = async (): Promise<void> => {
  if (aiState.isInitialized && aiState.session) {
    return;
  }
  
  if (aiState.initializationPromise) {
    return aiState.initializationPromise;
  }

  aiState.initializationPromise = performInitialization();
  return aiState.initializationPromise;
};

const performInitialization = async (): Promise<void> => {
  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('LanguageModel API is not available in this context');
    }

    const availability = await LanguageModel.availability();
    
    if (availability === 'unavailable') {
      throw new Error('LanguageModel is not available on this device. Please check your Chrome version and hardware requirements.');
    }

    if (availability === 'downloadable') {
      aiState.session = await LanguageModel.create({
        monitor: (model) => {
          model.addEventListener('downloadprogress', (e: any) => {
            // Download progress monitoring (silent)
          });
        }
      });
    } else {
      aiState.session = await LanguageModel.create();
    }

    aiState.isInitialized = true;
  } catch (error) {
    throw error;
  }
};

// Main rephrase function
const rephraseText = async (text: string): Promise<string> => {
  if (!validateText(text)) {
    throw new Error('Text cannot be empty');
  }

  try {
    const isAvailable = await checkLanguageModelAvailability();
    if (!isAvailable) {
      throw new Error('LanguageModel is not available. Please check your Chrome version and hardware requirements.');
    }
    
    await initializeSession();

    if (!aiState.session) {
      throw new Error('AI session not available');
    }

    const fullPrompt = `${AI_CONSTANTS.REPHRASE_PROMPT}\n\n"${text}"`;
    const controller = createTimeoutController(AI_CONSTANTS.TIMEOUT);

    try {
      const response = await aiState.session.prompt(fullPrompt, {
        signal: controller.signal
      });

      return cleanResponse(response);
    } catch (error) {
      if ((error as Error).name === 'AbortError' || (error as Error).message.includes('aborted')) {
        throw new Error('AI request timed out. The LanguageModel may not be available or responding.');
      }
      
      throw error;
    }
  } catch (error) {
    throw new Error(`Failed to rephrase text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Retry mechanism
const rephraseTextWithRetry = async (text: string): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= AI_CONSTANTS.MAX_RETRIES; attempt++) {
    try {
      const result = await rephraseText(text);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (error instanceof Error && error.message.includes('LanguageModel is not available')) {
        throw new Error('LanguageModel is not available. Please check:\n' +
          '1. Chrome version (requires Chrome 138+)\n' +
          '2. Hardware requirements (22GB+ storage, 4GB+ VRAM)\n' +
          '3. Operating system (Windows 10/11, macOS 13+, Linux, or ChromeOS)\n' +
          '4. Chrome flags (enable #optimization-guide-on-device-model)');
      }

      if (attempt < AI_CONSTANTS.MAX_RETRIES) {
        await delay(AI_CONSTANTS.RETRY_DELAY);
        destroySession();
        await initializeSession();
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
};

// Session management
const destroySession = (): void => {
  if (aiState.session) {
    aiState.session.destroy();
    aiState.session = null;
  }
  aiState.isInitialized = false;
  aiState.initializationPromise = null;
};

const getModelParams = async (): Promise<LanguageModelParams | null> => {
  try {
    if (typeof LanguageModel === 'undefined') {
      return null;
    }

    return await LanguageModel.params();
  } catch (error) {
    return null;
  }
};

// Public API
export const aiService = {
  rephraseText: rephraseTextWithRetry,
  isAvailable: checkLanguageModelAvailability,
  getModelParams,
  destroy: destroySession,
} as const;

// Initialize on module load
initializeSession().catch(() => {
  // Silently handle initialization errors
});