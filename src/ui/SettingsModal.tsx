import { useGameStore } from '../stores/gameStore';
import { soundEngine } from '../voice/soundEngine';
import { Volume2, VolumeX, Monitor, Zap, X } from 'lucide-react';

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
  } = useGameStore();

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[420px] p-6 relative">
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

        <div className="space-y-5 font-lore text-sm">
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
