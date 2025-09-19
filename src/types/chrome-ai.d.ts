// Chrome AI Prompt API TypeScript declarations

declare global {
    interface LanguageModel {
        availability(): Promise<'available' | 'downloadable' | 'unavailable' | 'downloading'>;
        create(options?: {
            initialPrompts?: Array<{
                role: string;
                content: string;
            }>;
            monitor?: (monitor: LanguageModelMonitor) => void;
        }): Promise<LanguageModelSession>;
        params(): Promise<{
            defaultTopK: number;
            maxTopK: number;
            defaultTemperature: number;
            maxTemperature: number;
        }>;
    }

    interface LanguageModelSession {
        prompt(text: string, options?: {
            signal?: AbortSignal;
            responseConstraint?: any;
            omitResponseConstraintInput?: boolean;
        }): Promise<string>;
        promptStreaming(text: string, options?: {
            signal?: AbortSignal;
            responseConstraint?: any;
            omitResponseConstraintInput?: boolean;
        }): ReadableStream<string>;
        clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
        destroy(): void;
    }

    interface LanguageModelMonitor {
        addEventListener(type: 'downloadprogress', listener: (event: LanguageModelDownloadProgressEvent) => void): void;
    }

    interface LanguageModelDownloadProgressEvent {
        loaded: number;
        total: number;
    }

    const LanguageModel: LanguageModel;

    // Language Detector API
    interface LanguageDetector {
        availability(): Promise<'available' | 'downloadable' | 'unavailable' | 'downloading'>;
        create(options?: {
            monitor?: (monitor: LanguageDetectorMonitor) => void;
        }): Promise<LanguageDetectorInstance>;
    }

    interface LanguageDetectorInstance {
        detect(text: string): Promise<Array<{
            detectedLanguage: string;
            confidence: number;
        }>>;
    }

    interface LanguageDetectorMonitor {
        addEventListener(type: 'downloadprogress', listener: (event: LanguageDetectorDownloadProgressEvent) => void): void;
    }

    interface LanguageDetectorDownloadProgressEvent {
        loaded: number;
        total: number;
    }

    const LanguageDetector: LanguageDetector;

    // Translator API
    interface Translator {
        availability(options: {
            sourceLanguage: string;
            targetLanguage: string;
        }): Promise<'available' | 'downloadable' | 'unavailable' | 'downloading'>;
        create(options: {
            sourceLanguage: string;
            targetLanguage: string;
            monitor?: (monitor: TranslatorMonitor) => void;
        }): Promise<TranslatorInstance>;
    }

    interface TranslatorInstance {
        translate(text: string): Promise<string>;
        translateStreaming(text: string): AsyncIterable<string>;
    }

    interface TranslatorMonitor {
        addEventListener(type: 'downloadprogress', listener: (event: TranslatorDownloadProgressEvent) => void): void;
    }

    interface TranslatorDownloadProgressEvent {
        loaded: number;
        total: number;
    }

    const Translator: Translator;
}

export { };
