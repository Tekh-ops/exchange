export type VoicePermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';
export type VoiceSessionState = 'inactive' | 'listening' | 'recognizing' | 'denied' | 'unsupported' | 'error';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [altIndex: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultEvent {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export class VoiceCommandManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private listening = false;
  private sessionId = 0;
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

  private cleanupRecognition(rec: SpeechRecognitionInstance | null): void {
    if (!rec) return;
    rec.onstart = null;
    rec.onaudiostart = null;
    rec.onspeechstart = null;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
  }

  public startListening(
    language: string,
    callbacks: {
      onStateChange?: (state: VoiceSessionState) => void;
      onTranscript: (transcript: string, isFinal: boolean, alternatives: string[]) => void;
      onError: (message: string, code?: string) => void;
      onEnd: () => void;
    }
  ): boolean {
    if (!this.isSupported()) {
      this.permissionStatus = 'unsupported';
      callbacks.onStateChange?.('unsupported');
      callbacks.onError(
        'Voice casting is not supported in this browser (requires Chrome, Edge, or Safari SpeechRecognition). Use mouse or keys 1-6.',
        'unsupported'
      );
      return false;
    }

    // Prevent multiple simultaneous recognition sessions
    if (this.listening) {
      return false;
    }

    this.sessionId += 1;
    const activeSession = this.sessionId;
    let finalDispatched = false;

    try {
      const w = window as unknown as Record<string, new () => SpeechRecognitionInstance>;
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      const rec = new Ctor();
      rec.lang = language || 'en-US';
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.continuous = false;

      rec.onstart = () => {
        if (activeSession !== this.sessionId) return;
        this.permissionStatus = 'granted';
        callbacks.onStateChange?.('listening');
      };

      rec.onspeechstart = () => {
        if (activeSession !== this.sessionId) return;
        callbacks.onStateChange?.('recognizing');
      };

      rec.onresult = (event) => {
        if (activeSession !== this.sessionId || finalDispatched) return;
        const lastIdx = event.results.length - 1;
        if (lastIdx < 0) return;

        const result = event.results[lastIdx];
        const alternatives: string[] = [];
        const altCount = result.length ?? 1;
        for (let i = 0; i < altCount; i++) {
          const t = result[i]?.transcript?.trim();
          if (t) alternatives.push(t);
        }

        const primaryText = alternatives[0] || '';
        this.permissionStatus = 'granted';

        if (result.isFinal) {
          finalDispatched = true;
        } else {
          callbacks.onStateChange?.('recognizing');
        }

        callbacks.onTranscript(primaryText, Boolean(result.isFinal), alternatives);
      };

      rec.onerror = (event) => {
        if (activeSession !== this.sessionId) return;
        this.listening = false;
        this.cleanupRecognition(rec);
        this.recognition = null;

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.permissionStatus = 'denied';
          callbacks.onStateChange?.('denied');
          callbacks.onError(
            'Microphone permission denied. Allow microphone access in browser settings or use mouse/keys 1-6.',
            event.error
          );
        } else if (event.error === 'no-speech') {
          callbacks.onStateChange?.('inactive');
          callbacks.onError('No speech detected. Press Voice Cast and speak a spell name clearly.', 'no-speech');
        } else if (event.error === 'aborted') {
          callbacks.onStateChange?.('inactive');
        } else {
          callbacks.onStateChange?.('error');
          callbacks.onError(`Voice recognition error: ${event.error}`, event.error);
        }
      };

      rec.onend = () => {
        if (activeSession !== this.sessionId) return;
        this.listening = false;
        this.cleanupRecognition(rec);
        this.recognition = null;
        callbacks.onStateChange?.('inactive');
        callbacks.onEnd();
      };

      this.recognition = rec;
      this.listening = true;
      callbacks.onStateChange?.('listening');
      rec.start();
      return true;
    } catch {
      this.listening = false;
      this.cleanupRecognition(this.recognition);
      this.recognition = null;
      callbacks.onStateChange?.('error');
      callbacks.onError('Unable to initialize browser speech recognition.', 'init-failed');
      return false;
    }
  }

  public stopListening(): void {
    const rec = this.recognition;
    if (rec && this.listening) {
      try {
        rec.stop();
      } catch {
        this.listening = false;
        this.cleanupRecognition(rec);
        this.recognition = null;
      }
    } else {
      this.listening = false;
    }
  }

  public cancel(): void {
    this.sessionId += 1;
    const rec = this.recognition;
    this.recognition = null;
    this.listening = false;
    if (rec) {
      this.cleanupRecognition(rec);
      try {
        rec.abort();
      } catch {
        // Ignored
      }
    }
  }
}

export const voiceCommandManager = new VoiceCommandManager();
