// Functional Background Script for PhraseBE Chrome Extension

import { aiService } from './ai-service';

// Type definitions
interface TextSelectedMessage {
  type: 'textSelected';
  payload: string;
}

interface GetSelectedTextMessage {
  type: 'getSelectedText';
}

interface SelectedTextResponse {
  selectedText: string;
}

interface RephraseTextMessage {
  type: 'rephraseText';
  payload: string;
}

interface RephraseTextResponse {
  success: boolean;
  rephrasedText?: string;
  error?: string;
}

interface DiagnosticMessage {
  type: 'runDiagnostic';
}

interface DiagnosticResponse {
  success: boolean;
  results: string[];
  error?: string;
}

interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  skipWaiting(): Promise<void>;
  clients: Clients;
}

interface Clients {
  claim(): Promise<void>;
  get(id: string): Promise<Client | undefined>;
  matchAll(options?: ClientQueryOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient | null>;
}

interface ClientQueryOptions {
  includeUncontrolled?: boolean;
  type?: 'window' | 'worker' | 'sharedworker' | 'all';
}

interface Client {
  id: string;
  type: 'window' | 'worker' | 'sharedworker';
  url: string;
  postMessage(message: any): void;
}

interface WindowClient extends Client {
  type: 'window';
  focused: boolean;
  visibilityState: 'hidden' | 'visible';
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient | null>;
}

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

// Constants
const BACKGROUND_CONSTANTS = {
  MESSAGE_TYPES: {
    TEXT_SELECTED: 'textSelected',
    GET_SELECTED_TEXT: 'getSelectedText',
  },
} as const;

// State management
let lastSelectedText = '';

// Message validation
const isValidMessage = (message: unknown): message is TextSelectedMessage | GetSelectedTextMessage | RephraseTextMessage | DiagnosticMessage => {
  return typeof message === 'object' && 
         message !== null && 
         'type' in message && 
         typeof (message as any).type === 'string';
};

// Message handlers
const handleTextSelected = (message: TextSelectedMessage): void => {
  lastSelectedText = message.payload || '';
};

const handleGetSelectedText = (sendResponse: (response?: any) => void): void => {
  const response: SelectedTextResponse = {
    selectedText: lastSelectedText
  };
  sendResponse(response);
};

const handleRephraseText = async (
  message: RephraseTextMessage, 
  sendResponse: (response?: any) => void
): Promise<void> => {
  try {
    const text = message.payload || '';
    if (!text.trim()) {
      sendResponse({
        success: false,
        error: 'Text cannot be empty'
      });
      return;
    }

    const rephrasedText = await aiService.rephraseText(text);
    
    sendResponse({
      success: true,
      rephrasedText: rephrasedText
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const runDiagnostic = async (sendResponse: (response?: any) => void): Promise<void> => {
  const results: string[] = [];

  try {
    // Check Chrome version
    const userAgent = navigator.userAgent;
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    
    if (chromeVersion >= 138) {
      results.push(`Chrome version ${chromeVersion} is compatible (requires 138+)`);
    } else {
      results.push(`Chrome version ${chromeVersion} is too old (requires 138+)`);
      sendResponse({ success: false, results, error: 'Chrome version too old' });
      return;
    }
    
    // Check if LanguageModel is available
    if (typeof LanguageModel === 'undefined') {
      results.push('LanguageModel API is not available in this context');
      results.push('This might be because:');
      results.push('• You\'re not running this in a Chrome extension context');
      results.push('• The extension doesn\'t have the "language-model" permission');
      results.push('• Chrome version is too old');
      sendResponse({ success: false, results, error: 'LanguageModel API not available' });
      return;
    }
    
    results.push('LanguageModel API is available');
    
    // Check availability
    results.push('Checking LanguageModel availability...');
    const availability = await LanguageModel.availability();
    results.push(`LanguageModel availability: ${availability}`);
    
    if (availability === 'unavailable') {
      results.push('LanguageModel is not available on this device');
      results.push('Possible reasons:');
      results.push('• Hardware requirements not met (4GB+ VRAM, 22GB+ storage)');
      results.push('• Operating system not supported');
      results.push('• Chrome flags not enabled');
      sendResponse({ success: false, results, error: 'LanguageModel unavailable on device' });
      return;
    }
    
    // Get model parameters
    results.push('Getting model parameters...');
    const params = await LanguageModel.params();
    results.push(`Model parameters: ${JSON.stringify(params, null, 2)}`);
    
    if (availability === 'downloadable') {
      results.push('LanguageModel needs to be downloaded');
      results.push('Note: Download requires user activation and may take time');
    } else {
      results.push('LanguageModel is ready to use');
    }
    
    // Try to create a session
    results.push('Attempting to create LanguageModel session...');
    const session = await LanguageModel.create();
    results.push('LanguageModel session created successfully');
    
    // Test a simple prompt
    results.push('Testing AI with a simple prompt...');
    const testPrompt = 'Say "Hello, World!"';
    const response = await session.prompt(testPrompt);
    results.push(`AI Response: "${response}"`);
    
    // Clean up
    session.destroy();
    results.push('Session cleaned up');
    
    results.push('All tests passed! LanguageModel is working correctly.');
    
    sendResponse({ success: true, results });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    results.push(`Error during diagnostic: ${errorMessage}`);
    results.push(`Error details: ${errorStack}`);
    sendResponse({ success: false, results, error: errorMessage });
  }
};

// Main message handler
const handleMessage = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean => {
  try {
    if (!isValidMessage(message)) {
      return false;
    }

    switch (message.type) {
      case BACKGROUND_CONSTANTS.MESSAGE_TYPES.TEXT_SELECTED:
        handleTextSelected(message as TextSelectedMessage);
        break;
      case BACKGROUND_CONSTANTS.MESSAGE_TYPES.GET_SELECTED_TEXT:
        handleGetSelectedText(sendResponse);
        return true; // Keep message channel open for async response
      case 'rephraseText':
        handleRephraseText(message as RephraseTextMessage, sendResponse);
        return true; // Keep message channel open for async response
      case 'runDiagnostic':
        runDiagnostic(sendResponse);
        return true; // Keep message channel open for async response
      default:
        return false;
    }
  } catch (error) {
    // Silently handle errors to prevent extension crashes
    return false;
  }

  return false;
};

// Service Worker event handlers
const handleInstall = (): void => {
  const sw = self as unknown as ServiceWorkerGlobalScope;
  sw.skipWaiting();
};

const handleActivate = (event: Event): void => {
  const sw = self as unknown as ServiceWorkerGlobalScope;
  const extendableEvent = event as ExtendableEvent;
  extendableEvent.waitUntil(sw.clients.claim());
};

// Initialize service worker
const initializeServiceWorker = (): void => {
  // Setup event listeners
  self.addEventListener('install', handleInstall);
  self.addEventListener('activate', handleActivate);
  
  // Setup message listener
  chrome.runtime.onMessage.addListener(handleMessage);
};

// Start the service worker
initializeServiceWorker();