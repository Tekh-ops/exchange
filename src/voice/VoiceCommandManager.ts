export type VoicePermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionResultEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: { transcript: string; confidence: number };
    };
  };
}

export class VoiceCommandManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private listening = false;
  private permissionStatus: VoicePermissionStatus = 'unsupported';

  constructor() {
    if (this.isSupported()) {
      this.permissionStatus = 'prompt';
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  public getPermissionStatus(): VoicePermissionStatus {
    return this.permissionStatus;
  }

  public isListening(): boolean {
    return this.listening;
  }

  public startListening(
    language: string,
    callbacks: {
      onTranscript: (transcript: string, isFinal: boolean) => void;
      onError: (message: string) => void;
      onEnd: () => void;
    }
  ): boolean {
    if (!this.isSupported()) {
      this.permissionStatus = 'unsupported';
      callbacks.onError('Voice casting is not supported in this browser. Use mouse or hotkeys.');
      return false;
    }

    if (this.listening) return true;

    try {
      const w = window as unknown as Record<string, new () => SpeechRecognitionInstance>;
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      const rec = new Ctor();
      rec.lang = language || 'en-US';
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.continuous = false;

      rec.onresult = (event) => {
        const lastIdx = event.results.length - 1;
        if (lastIdx >= 0) {
          const result = event.results[lastIdx];
          const text = result[0]?.transcript || '';
          this.permissionStatus = 'granted';
          callbacks.onTranscript(text, result.isFinal);
        }
      };

      rec.onerror = (event) => {
        this.listening = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.permissionStatus = 'denied';
          callbacks.onError('Microphone permission denied. You can still cast spells with mouse or keys 1-6.');
        } else if (event.error === 'no-speech') {
          callbacks.onError('No speech detected. Hold and speak a spell name clearly.');
        } else {
          callbacks.onError(`Voice recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        this.listening = false;
        callbacks.onEnd();
      };

      this.recognition = rec;
      this.listening = true;
      rec.start();
      return true;
    } catch {
      this.listening = false;
      callbacks.onError('Unable to initialize browser speech recognition.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }
    this.listening = false;
  }

  public cancel(): void {
    if (this.recognition && this.listening) {
      try {
        this.recognition.abort();
      } catch {
        // Ignored
      }
    }
    this.listening = false;
  }
}

export const voiceCommandManager = new VoiceCommandManager();
