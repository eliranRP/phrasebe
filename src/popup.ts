// PhraseBE Popup Script - Simple and Clean

// Storage keys
const STORAGE_KEYS = {
  BUBBLE_ENABLED: 'phrasebe_bubble_enabled',
  TRANSLATION_ENABLED: 'phrasebe_translation_enabled',
  COPY_TRIGGER_ENABLED: 'phrasebe_copy_trigger_enabled',
  SOURCE_LANGUAGE: 'phrasebe_source_language',
  TARGET_LANGUAGE: 'phrasebe_target_language',
} as const;

// Load and display blacklisted sites
const loadBlacklistedSites = async (): Promise<void> => {
  try {
    const result = await chrome.storage.sync.get(['phrasebe_site_blacklist']);
    const blacklist = result['phrasebe_site_blacklist'] || [];

    const blacklistSites = document.getElementById('blacklistSites') as HTMLElement;
    const noBlacklistedSites = document.getElementById('noBlacklistedSites') as HTMLElement;

    if (blacklist.length === 0) {
      blacklistSites.style.display = 'none';
      noBlacklistedSites.style.display = 'block';
    } else {
      blacklistSites.style.display = 'flex';
      noBlacklistedSites.style.display = 'none';

      blacklistSites.innerHTML = blacklist.map((domain: string) => `
        <div class="blacklist-site-item">
          <span class="blacklist-site-domain">${domain}</span>
          <button class="blacklist-remove-btn" data-domain="${domain}" title="Remove from blacklist">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      `).join('');

      // Add event listeners to remove buttons
      blacklistSites.querySelectorAll('.blacklist-remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const target = e.target as HTMLElement;
          const domain = target.closest('.blacklist-remove-btn')?.getAttribute('data-domain');
          if (domain) {
            await removeFromBlacklist(domain);
          }
        });
      });
    }
  } catch (error) {
    console.error('Failed to load blacklisted sites:', error);
  }
};

// Remove site from blacklist
const removeFromBlacklist = async (domain: string): Promise<void> => {
  try {
    const result = await chrome.storage.sync.get(['phrasebe_site_blacklist']);
    const blacklist = result['phrasebe_site_blacklist'] || [];

    const updatedBlacklist = blacklist.filter((d: string) => d !== domain);

    await chrome.storage.sync.set({ 'phrasebe_site_blacklist': updatedBlacklist });

    await loadBlacklistedSites(); // Refresh the display
  } catch (error) {
    console.error('Failed to remove site from blacklist:', error);
  }
};

// Initialize popup
const initializePopup = (): void => {
  // Load saved settings
  loadSettings();

  // Load blacklisted sites
  loadBlacklistedSites();

  // Setup event listeners
  setupEventListeners();
};

// Load settings from storage
const loadSettings = async (): Promise<void> => {
  try {
    const result = await chrome.storage.sync.get([
      STORAGE_KEYS.BUBBLE_ENABLED,
      STORAGE_KEYS.TRANSLATION_ENABLED,
      STORAGE_KEYS.COPY_TRIGGER_ENABLED,
      STORAGE_KEYS.SOURCE_LANGUAGE,
      STORAGE_KEYS.TARGET_LANGUAGE,
    ]);

    // Set bubble toggle
    const bubbleToggle = document.getElementById('bubbleToggle') as HTMLInputElement;
    if (bubbleToggle) {
      bubbleToggle.checked = result[STORAGE_KEYS.BUBBLE_ENABLED] !== false; // Default to true
    }

    // Set translation toggle
    const translationToggle = document.getElementById('translationToggle') as HTMLInputElement;
    if (translationToggle) {
      translationToggle.checked = result[STORAGE_KEYS.TRANSLATION_ENABLED] !== false; // Default to true
    }

    // Set copy trigger toggle
    const copyTriggerToggle = document.getElementById('copyTriggerToggle') as HTMLInputElement;
    if (copyTriggerToggle) {
      copyTriggerToggle.checked = result[STORAGE_KEYS.COPY_TRIGGER_ENABLED] !== false; // Default to true
    }

    // Set source language
    const sourceLanguage = document.getElementById('sourceLanguage') as HTMLSelectElement;
    if (sourceLanguage) {
      sourceLanguage.value = result[STORAGE_KEYS.SOURCE_LANGUAGE] || 'en'; // Default to English
    }

    // Set target language
    const targetLanguage = document.getElementById('targetLanguage') as HTMLSelectElement;
    if (targetLanguage) {
      targetLanguage.value = result[STORAGE_KEYS.TARGET_LANGUAGE] || 'he'; // Default to Hebrew
    }
  } catch (error) {
    // Handle error silently
  }
};

// Save settings to storage
const saveSettings = async (key: string, value: boolean | string): Promise<void> => {
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

  // Translation toggle
  const translationToggle = document.getElementById('translationToggle') as HTMLInputElement;
  if (translationToggle) {
    translationToggle.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      saveSettings(STORAGE_KEYS.TRANSLATION_ENABLED, target.checked);
    });
  }

  // Copy trigger toggle
  const copyTriggerToggle = document.getElementById('copyTriggerToggle') as HTMLInputElement;
  if (copyTriggerToggle) {
    copyTriggerToggle.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      saveSettings(STORAGE_KEYS.COPY_TRIGGER_ENABLED, target.checked);
    });
  }

  // Source language dropdown
  const sourceLanguage = document.getElementById('sourceLanguage') as HTMLSelectElement;
  if (sourceLanguage) {
    sourceLanguage.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      saveSettings(STORAGE_KEYS.SOURCE_LANGUAGE, target.value);
    });
  }

  // Target language dropdown
  const targetLanguage = document.getElementById('targetLanguage') as HTMLSelectElement;
  if (targetLanguage) {
    targetLanguage.addEventListener('change', (event) => {
      const target = event.target as HTMLSelectElement;
      saveSettings(STORAGE_KEYS.TARGET_LANGUAGE, target.value);
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}