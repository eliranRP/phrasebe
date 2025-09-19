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
}

export { };
