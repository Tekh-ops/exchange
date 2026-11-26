import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { soundEngine } from '../voice/soundEngine';
import { loadVoiceSettings, saveVoiceSettings, VoiceSettingsConfig } from '../voice/VoiceSettings';
import { Volume2, VolumeX, Monitor, Zap, X, Mic } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    settings,
    setVolume,
    toggleMute,
    toggleCrtOverlay,
    toggleScreenShake,
    setVfxQuality,
  } = useGameStore();

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsConfig>(() => loadVoiceSettings());

  if (!isOpen) return null;

  const updateVoice = (patch: Partial<VoiceSettingsConfig>) => {
    const next = { ...voiceSettings, ...patch };
    setVoiceSettings(next);
    saveVoiceSettings(next);
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[460px] max-w-[95%] max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
        >
          <X size={18} />
        </button>

        <h2 className="font-pixel text-base text-amber-300 tracking-wider mb-6 flex items-center gap-2">
          <span>ARCANE CONFIGURATION</span>
        </h2>

        <div className="space-y-4 font-lore text-sm">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between items-center mb-1 text-gray-200">
              <span className="flex items-center gap-2 font-pixel text-xs text-purple-300">
                <Volume2 size={16} /> MASTER VOLUME
              </span>
              <span className="font-pixel text-xs text-amber-300">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-purple-950 rounded-lg appearance-none"
            />
          </div>

          {/* Sound Mute Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
            <span className="flex items-center gap-2 text-gray-200">
              {settings.isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-green-400" />}
              <span className="font-pixel text-[11px]">MUTE ALL SOUNDS</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                toggleMute();
              }}
              className={`pixel-btn px-3 py-1 text-[10px] font-pixel cursor-pointer hover:scale-105 active:scale-95 ${settings.isMuted ? 'text-red-400' : 'text-green-400'}`}
            >
              {settings.isMuted ? 'MUTED' : 'ENABLED'}
            </button>
          </div>

          {/* CRT Scanline Filter Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
            <span className="flex items-center gap-2 text-gray-200">
              <Monitor size={16} className="text-amber-400" />
              <span className="font-pixel text-[11px]">CRT SCANLINE FILTER</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                toggleCrtOverlay();
              }}
              className={`pixel-btn px-3 py-1 text-[10px] font-pixel cursor-pointer hover:scale-105 active:scale-95 ${settings.crtOverlay ? 'text-green-400' : 'text-gray-400'}`}
            >
              {settings.crtOverlay ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Screen Shake Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
            <span className="flex items-center gap-2 text-gray-200">
              <Zap size={16} className="text-purple-400" />
              <span className="font-pixel text-[11px]">CAMERA IMPACT SHAKE</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                toggleScreenShake();
              }}
              className={`pixel-btn px-3 py-1 text-[10px] font-pixel cursor-pointer hover:scale-105 active:scale-95 ${settings.screenShake ? 'text-green-400' : 'text-gray-400'}`}
            >
              {settings.screenShake ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* VFX Quality Selector */}
          <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
            <span className="flex items-center gap-2 text-gray-200">
              <Zap size={16} className="text-amber-400" />
              <span className="font-pixel text-[11px]">VFX QUALITY</span>
            </span>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setVfxQuality(q);
                  }}
                  className={`pixel-btn px-2 py-1 text-[9px] font-pixel uppercase cursor-pointer ${
                    settings.vfxQuality === q ? 'text-amber-300 border-amber-400' : 'text-gray-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Casting Section */}
          <div className="pt-2 border-t border-purple-900/60 space-y-2.5">
            <div className="flex items-center gap-2 font-pixel text-[11px] text-amber-300">
              <Mic size={15} /> VOICE SPELLCASTING
            </div>

            <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
              <span className="font-pixel text-[10px] text-gray-200">ENABLE VOICE CAST</span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  updateVoice({ enabled: !voiceSettings.enabled });
                }}
                className={`pixel-btn px-3 py-1 text-[10px] font-pixel cursor-pointer ${
                  voiceSettings.enabled ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                {voiceSettings.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
              <span className="font-pixel text-[10px] text-gray-200">MIC ACTIVATION</span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  updateVoice({
                    mode: voiceSettings.mode === 'push-to-talk' ? 'toggle' : 'push-to-talk',
                  });
                }}
                className="pixel-btn px-3 py-1 text-[10px] font-pixel text-purple-200 cursor-pointer uppercase"
              >
                {voiceSettings.mode === 'push-to-talk' ? 'HOLD (PTT)' : 'CLICK TOGGLE'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-purple-950/40 rounded border border-purple-900/50">
              <span className="font-pixel text-[10px] text-gray-200">LANGUAGE</span>
              <select
                value={voiceSettings.language}
                onChange={(e) => updateVoice({ language: e.target.value })}
                className="bg-[#090612] border border-purple-800 rounded px-2 py-1 font-pixel text-[10px] text-amber-200"
              >
                <option value="en-US">en-US</option>
                <option value="en-GB">en-GB</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="pixel-btn w-full mt-6 py-2.5 font-pixel text-xs text-amber-300 cursor-pointer hover:scale-105 active:scale-95"
        >
          CONFIRM SETTINGS
        </button>
      </div>
    </div>
  );
}
