export type VoiceInputMode = 'push-to-talk' | 'toggle';

export interface VoiceSettingsConfig {
  enabled: boolean;
  mode: VoiceInputMode;
  language: string;
  spokenFeedback: boolean;
}

const STORAGE_KEY = 'petty_sorcerer_voice_settings';

export const DEFAULT_VOICE_SETTINGS: VoiceSettingsConfig = {
  enabled: true,
  mode: 'toggle',
  language: 'en-US',
  spokenFeedback: false,
};

export function loadVoiceSettings(): VoiceSettingsConfig {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
      }
    }
  } catch {
    // Fallback
  }
  return { ...DEFAULT_VOICE_SETTINGS };
}

export function saveVoiceSettings(settings: VoiceSettingsConfig): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    // Ignored
  }
}

export function speakFeedback(text: string, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.pitch = 0.9;
      window.speechSynthesis.speak(utter);
    }
  } catch {
    // Ignored
  }
}
