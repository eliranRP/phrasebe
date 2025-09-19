// Functional Popup Script for PhraseBE Chrome Extension

// Type definitions
interface GetSelectedTextMessage {
  type: 'getSelectedText';
}

interface SelectedTextResponse {
  selectedText: string;
}

interface DiagnosticMessage {
  type: 'runDiagnostic';
}

interface DiagnosticResponse {
  success: boolean;
  results: string[];
  error?: string;
}

// Constants
const POPUP_CONSTANTS = {
  ELEMENT_IDS: {
    INPUT: 'input',
    CLEAR: 'clear',
    RUN_DIAGNOSTIC: 'runDiagnostic',
    DIAGNOSTIC_RESULTS: 'diagnosticResults',
  },
  MESSAGE_TYPES: {
    GET_SELECTED_TEXT: 'getSelectedText',
    RUN_DIAGNOSTIC: 'runDiagnostic',
  },
} as const;

// DOM element references
let textarea: HTMLTextAreaElement | null = null;
let clearButton: HTMLButtonElement | null = null;
let diagnosticButton: HTMLButtonElement | null = null;
let diagnosticResults: HTMLDivElement | null = null;

// Element initialization
const initializeElements = (): void => {
  textarea = document.getElementById(POPUP_CONSTANTS.ELEMENT_IDS.INPUT) as HTMLTextAreaElement;
  clearButton = document.getElementById(POPUP_CONSTANTS.ELEMENT_IDS.CLEAR) as HTMLButtonElement;
  diagnosticButton = document.getElementById(POPUP_CONSTANTS.ELEMENT_IDS.RUN_DIAGNOSTIC) as HTMLButtonElement;
  diagnosticResults = document.getElementById(POPUP_CONSTANTS.ELEMENT_IDS.DIAGNOSTIC_RESULTS) as HTMLDivElement;
};

// Event handlers
const handleClearClick = (): void => {
  if (textarea) {
    textarea.value = '';
    textarea.focus();
  }
};

const handleDiagnosticClick = (): void => {
  if (diagnosticResults) {
    diagnosticResults.innerHTML = '<div class="status info">Running diagnostic...</div>';
  }
  
  chrome.runtime.sendMessage({ type: 'runDiagnostic' }, (response: DiagnosticResponse) => {
    displayDiagnosticResults(response);
  });
};

// UI functions
const displayDiagnosticResults = (response: DiagnosticResponse): void => {
  if (!diagnosticResults) return;

  if (!response) {
    diagnosticResults.innerHTML = '<div class="status error">No response received</div>';
    return;
  }

  let html = '';
  for (const result of response.results) {
    let className = 'status info';
    if (result.includes('✅')) className = 'status success';
    else if (result.includes('❌')) className = 'status error';
    else if (result.includes('⚠️') || result.includes('💡')) className = 'status warning';
    
    html += `<div class="${className}">${result}</div>`;
  }

  diagnosticResults.innerHTML = html;
};

const appendText = (text: string): void => {
  if (!textarea || !text.trim()) {
    return;
  }

  const currentText = textarea.value || '';
  const newText = currentText ? `${currentText}\n\n${text}` : text;
  textarea.value = newText;
  textarea.focus();
};

// Message handling
const sendMessage = (message: GetSelectedTextMessage): Promise<SelectedTextResponse | undefined> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: SelectedTextResponse | undefined) => {
      resolve(response);
    });
  });
};

const getSelectedText = async (): Promise<void> => {
  try {
    const message: GetSelectedTextMessage = { 
      type: POPUP_CONSTANTS.MESSAGE_TYPES.GET_SELECTED_TEXT 
    };

    const response = await sendMessage(message);
    
    if (response?.selectedText) {
      appendText(response.selectedText);
    }
  } catch (error) {
    // Silently handle errors to prevent extension crashes
  }
};

// Event listener setup
const setupEventListeners = (): void => {
  if (clearButton) {
    clearButton.addEventListener('click', handleClearClick);
  }
  
  if (diagnosticButton) {
    diagnosticButton.addEventListener('click', handleDiagnosticClick);
  }
  
  if (textarea) {
    textarea.focus();
  }
};

// Main initialization
const initializePopup = (): void => {
  initializeElements();
  setupEventListeners();
  getSelectedText();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);