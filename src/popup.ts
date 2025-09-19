// PhraseBE Popup Script - Simple and Clean

// Storage keys
const STORAGE_KEYS = {
  BUBBLE_ENABLED: 'phrasebe_bubble_enabled',
} as const;

// Initialize popup
const initializePopup = (): void => {
  // Load saved settings
  loadSettings();

  // Setup event listeners
  setupEventListeners();
};

// Load settings from storage
const loadSettings = async (): Promise<void> => {
  try {
    const result = await chrome.storage.sync.get([
      STORAGE_KEYS.BUBBLE_ENABLED,
    ]);

    // Set bubble toggle
    const bubbleToggle = document.getElementById('bubbleToggle') as HTMLInputElement;
    if (bubbleToggle) {
      bubbleToggle.checked = result[STORAGE_KEYS.BUBBLE_ENABLED] !== false; // Default to true
    }
  } catch (error) {
    // Handle error silently
  }
};

// Save settings to storage
const saveSettings = async (key: string, value: boolean): Promise<void> => {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    // Handle error silently
  }
};

// Setup event listeners
const setupEventListeners = (): void => {
  // Bubble toggle - simple change event listener
  const bubbleToggle = document.getElementById('bubbleToggle') as HTMLInputElement;
  if (bubbleToggle) {
    bubbleToggle.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      saveSettings(STORAGE_KEYS.BUBBLE_ENABLED, target.checked);
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}