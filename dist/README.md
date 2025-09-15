# PhraseBE (Chrome Extension)

Minimal Manifest V3 Chrome extension that opens a popup with a textarea when the extension icon is clicked.

## Install (Load Unpacked)

1. Build step not required. Files are ready as-is.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" (top-right).
4. Click "Load unpacked" and select this folder: `phrasebe`.
5. The extension icon will appear. Click it to open the popup.

## Debugging

- Popup DevTools: Open popup → right-click inside → Inspect.
- Background worker: `chrome://extensions/` → PhraseBE card → click "Service worker".
- After file edits: On `chrome://extensions/`, click the circular Reload icon on the PhraseBE card, then reopen the popup.

## Build a Zip (no Node required)

Option A: Using Make (recommended)

1. Run `make build` in the project root.
2. Output: `dist/phrasebe.zip`.

Option B: Using the script directly

1. Run `./build.sh`.
2. Output: `dist/phrasebe.zip`.

## Files

- `manifest.json`: Extension metadata and configuration.
- `src/popup.html`: Popup UI.
- `src/popup.css`: Popup styles.
- `src/popup.js`: Popup logic.
- `src/background.js`: Service worker (background script).
- `build.sh`, `Makefile`: Build utilities to zip the extension.

## Next Steps (Google AI API)

- Add an options page for API key configuration.
- Call Google AI APIs to rephrase text from source to destination language.
- Add content scripts for in-page selection and context menu actions.

## Development

- No build tooling is required.
- Edit files and reload the extension from `chrome://extensions/`.
