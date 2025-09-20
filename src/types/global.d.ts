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

// Chrome AI APIs type definitions
declare global {
  interface RewriterOptions {
    tone?: 'more-formal' | 'as-is' | 'more-casual';
    format?: 'as-is' | 'markdown' | 'plain-text';
    length?: 'shorter' | 'as-is' | 'longer';
    sharedContext?: string;
    signal?: AbortSignal;
    monitor?: (m: RewriterMonitor) => void;
  }

  interface RewriterContext {
    context?: string;
    tone?: 'more-formal' | 'as-is' | 'more-casual';
    signal?: AbortSignal;
  }

  interface RewriterMonitor {
    addEventListener(type: 'downloadprogress', listener: (event: { loaded: number; total: number }) => void): void;
  }

  interface Rewriter {
    rewrite(text: string, context?: RewriterContext): Promise<string>;
    rewriteStreaming(text: string, context?: RewriterContext): AsyncIterable<string>;
    destroy(): void;
    addEventListener(type: 'downloadprogress', listener: (event: { loaded: number; total: number }) => void): void;
  }

  interface WriterOptions {
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    sharedContext?: string;
    signal?: AbortSignal;
    monitor?: (m: WriterMonitor) => void;
  }

  interface WriterContext {
    context?: string;
    tone?: 'formal' | 'neutral' | 'casual';
    signal?: AbortSignal;
  }

  interface WriterMonitor {
    addEventListener(type: 'downloadprogress', listener: (event: { loaded: number; total: number }) => void): void;
  }

  interface Writer {
    write(prompt: string, context?: WriterContext): Promise<string>;
    writeStreaming(prompt: string, context?: WriterContext): AsyncIterable<string>;
    destroy(): void;
    addEventListener(type: 'downloadprogress', listener: (event: { loaded: number; total: number }) => void): void;
  }

  interface RewriterConstructor {
    availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
    create(options?: RewriterOptions): Promise<Rewriter>;
  }

  interface WriterConstructor {
    availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
    create(options?: WriterOptions): Promise<Writer>;
  }

  const Rewriter: RewriterConstructor;
  const Writer: WriterConstructor;

  // Task classification types
  type TaskType = 'rewrite' | 'write' | 'translate' | 'summarize' | 'unknown';

  interface TaskClassification {
    taskType: TaskType;
    confidence: number;
    reasoning: string;
    suggestedOptions?: {
      tone?: string;
      format?: string;
      length?: string;
    };
  }
}

// Export to make this a module
export { };
