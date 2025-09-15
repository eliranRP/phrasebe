/// <reference lib="webworker" />

// Minimal Chrome types used in this project
// For full types, install @types/chrome in a Node environment.
declare const chrome: any;

declare interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  skipWaiting: () => void;
  clients: Clients;
}

declare interface Clients {
  claim: () => Promise<void>;
}
