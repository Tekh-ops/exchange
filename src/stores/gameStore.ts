import { create } from 'zustand';
import { GameScene } from '../engine/types';
import { soundEngine } from '../voice/soundEngine';

export type VfxQuality = 'low' | 'medium' | 'high';

interface GameSettings {
  masterVolume: number;
  isMuted: boolean;
  crtOverlay: boolean;
  screenShake: boolean;
  showDamageNumbers: boolean;
  vfxQuality: VfxQuality;
}

interface GameState {
  currentScene: GameScene;
  isPaused: boolean;
  settings: GameSettings;
  setScene: (scene: GameScene) => void;
  togglePause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleCrtOverlay: () => void;
  toggleScreenShake: () => void;
  setVfxQuality: (quality: VfxQuality) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentScene: 'main_menu',
  isPaused: false,
  settings: {
    masterVolume: 0.7,
    isMuted: false,
    crtOverlay: true,
    screenShake: true,
    showDamageNumbers: true,
    vfxQuality: 'high',
  },
  setScene: (scene: GameScene) => set({ currentScene: scene }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setVolume: (volume: number) => {
    soundEngine.setVolume(volume);
    set((state) => ({
      settings: { ...state.settings, masterVolume: volume },
    }));
  },
  toggleMute: () => {
    set((state) => {
      const nextMuted = !state.settings.isMuted;
      soundEngine.setMuted(nextMuted);
      return {
        settings: { ...state.settings, isMuted: nextMuted },
      };
    });
  },
  toggleCrtOverlay: () => {
    set((state) => ({
      settings: { ...state.settings, crtOverlay: !state.settings.crtOverlay },
    }));
  },
  toggleScreenShake: () => {
    set((state) => ({
      settings: { ...state.settings, screenShake: !state.settings.screenShake },
    }));
  },
  setVfxQuality: (vfxQuality: VfxQuality) => {
    set((state) => ({
      settings: { ...state.settings, vfxQuality },
    }));
  },
}));
