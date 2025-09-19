# PhraseBE (Chrome Extension)

A TypeScript-powered Manifest V3 Chrome extension that opens a popup with a textarea when the extension icon is clicked. The extension automatically captures text selections made on web pages and displays them in the popup textarea, plus provides a floating chat interface for text rephrasing.

## Features

- **Text Selection Capture**: Automatically captures text selections from any webpage
- **Popup Interface**: Clean popup with textarea for text input/output
- **Floating Chat**: In-page floating bubble and chat interface for quick text rephrasing
- **TypeScript**: Full TypeScript implementation with proper typing
- **Webpack Build**: Modern build system with hot reloading and optimization

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked" and select the `dist` folder
   - The extension icon will appear in your toolbar

## Development Commands

- `npm run build` - Build for production
- `npm run build:dev` - Build for development (with source maps)
- `npm run watch` - Build and watch for changes
- `npm run clean` - Clean the dist folder
- `npm run zip` - Build and create a zip file for distribution
- `npm run legacy-build` - Use the old shell script build

## How It Works

1. **Text Selection**: Select any text on any webpage (mouse drag or keyboard selection)
2. **Automatic Capture**: The content script detects the selection and sends it to the background script
3. **Display in Popup**: When you click the extension icon, the popup automatically shows the selected text in the textarea
4. **Floating Interface**: Hover over editable elements to see a "Rephrase" bubble
5. **Quick Actions**: Click the bubble to open a floating chat for text rephrasing

## Project Structure

```
phrasebe/
├── src/
│   ├── background.ts      # Service worker (background script)
│   ├── content.ts         # Content script with floating UI
│   ├── popup.ts          # Popup script
│   ├── popup.html        # Popup UI
│   ├── popup.css         # Popup styles
│   ├── content.css       # Content script styles
│   └── assets/icons/     # Extension icons
├── dist/                 # Built extension (generated)
├── webpack.config.js     # Webpack configuration
├── tsconfig.json         # TypeScript configuration
├── manifest.json         # Extension manifest
└── package.json          # Dependencies and scripts
```

## Debugging

- **Popup DevTools**: Open popup → right-click inside → Inspect
- **Background Worker**: `chrome://extensions/` → PhraseBE card → click "Service worker"
- **Content Script**: Use browser DevTools on any webpage → Console tab
- **After Changes**: Reload the extension from `chrome://extensions/`

## TypeScript Features

- Full type safety with Chrome extension APIs
- Proper interfaces for message passing
- Type-safe DOM manipulation
- IntelliSense support in modern editors

## Next Steps

- Add Google AI API integration for text rephrasing
- Implement options page for API key configuration
- Add context menu actions
- Enhance floating chat with more features
- Add internationalization support

## Build Output

The build process creates a `dist` folder containing:
- Compiled JavaScript files (`background.js`, `content.js`, `popup.js`)
- Copied static assets (HTML, CSS, icons)
- Updated manifest.json with correct file paths
- Source maps for debugging (in development mode)
