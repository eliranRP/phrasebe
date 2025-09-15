# PhraseBE (Chrome Extension)

Minimal Manifest V3 Chrome extension that opens a popup with a textarea when the extension icon is clicked. The extension automatically captures text selections made on web pages and displays them in the popup textarea.

## Install (Load Unpacked)

1. Build step not required. Files are ready as-is.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" (top-right).
4. Click "Load unpacked" and select this folder: `phrasebe`.
5. The extension icon will appear. Click it to open the popup.

## How It Works

1. **Text Selection**: Select any text on any webpage (mouse drag or keyboard selection)
2. **Automatic Capture**: The content script detects the selection and sends it to the background script
3. **Display in Popup**: When you click the extension icon, the popup automatically shows the selected text in the textarea
4. **Multiple Selections**: Each new selection appends to the existing text in the textarea

## Debugging

- Popup DevTools: Open popup → right-click inside → Inspect.
- Background worker: `chrome://extensions/` → PhraseBE card → click "Service worker".
- Content script: Use browser DevTools on any webpage → Console tab (content script logs appear here).
- After file edits: On `chrome://extensions/`, click the circular Reload icon on the PhraseBE card, then reopen the popup.

## Build a Zip (no Node required)

Option A: Using Make (recommended)

1. Run `make build` in the project root.
2. Output: `dist/phrasebe.zip`.

Option B: Using the script directly

1. Run `./build.sh`.
2. Output: `dist/phrasebe.zip`.

## TypeScript (optional)

If you have Node installed, you can compile TypeScript sources:

1. Install TypeScript globally or locally:
   - Global: `npm i -g typescript`
   - Local (in project): `npm i -D typescript`
2. Sources live in `src/ts/`. Output JS goes to `src/` (to match manifest paths).
3. Compile: `tsc -p tsconfig.json`.
4. Load the extension from the project root (`phrasebe/`) or rebuild the zip as above.

## Files

- `manifest.json`: Extension metadata and configuration.
- `src/popup.html`: Popup UI.
- `src/popup.css`: Popup styles.
- `src/popup.js`: Popup logic (generated from TS if you compile, otherwise hand-written).
- `src/background.js`: Service worker (generated from TS if you compile, otherwise hand-written).
- `src/content.js`: Content script (generated from TS if you compile, otherwise hand-written).
- `src/ts/*`: TypeScript sources.
- `build.sh`, `Makefile`: Build utilities to zip the extension.

## Next Steps (Google AI API)

- Add an options page for API key configuration.
- Call Google AI APIs to rephrase text from source to destination language.
- Add content scripts for in-page selection and context menu actions.

## Development

- Without Node: edit files and reload the extension from `chrome://extensions/`.
- With Node: compile TS via `tsc` and then reload or rebuild.
