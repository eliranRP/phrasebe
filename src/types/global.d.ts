// Global type declarations for Chrome Extension APIs
declare global {
  // Import chrome-types for comprehensive Chrome API support
  import * as ChromeTypes from 'chrome-types';
  
  // Extend the global chrome object with proper typing
  const chrome: typeof chrome;
  
  // Service Worker global scope extensions
  interface ServiceWorkerGlobalScope {
    skipWaiting(): Promise<void>;
    clients: Clients;
  }
  
  // ExtendableEvent for service worker events
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }
  
  // Clients interface for service worker
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
}

// Chrome Extension specific types
interface ChromeExtensionMessage {
  type: string;
  payload?: any;
}

interface ChromeExtensionResponse {
  [key: string]: any;
}

// Declare PNG modules
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

// Export to make this a module
export {};
