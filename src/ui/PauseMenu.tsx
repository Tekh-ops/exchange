import { useGameStore } from '../stores/gameStore';
import { soundEngine } from '../voice/soundEngine';
import { Play, RotateCcw, Home, Sliders } from 'lucide-react';

interface PauseMenuProps {
  onOpenSettings: () => void;
  onRestartBattle: () => void;
}

export function PauseMenu({ onOpenSettings, onRestartBattle }: PauseMenuProps) {
  const { isPaused, togglePause, setScene } = useGameStore();

  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-box-gold w-96 p-6 text-center animate-in fade-in zoom-in-95">
        <h2 className="font-pixel text-xl text-amber-300 tracking-wider mb-2">
          COMBAT SUSPENDED
        </h2>
        <p className="font-lore text-gray-300 text-sm mb-6">
          The duel is temporarily frozen while you consider your bruised ego.
        </p>

        <div className="flex flex-col gap-3 font-pixel text-xs">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              togglePause();
            }}
            className="pixel-btn py-3 px-4 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Play size={16} />
            <span>RESUME DUEL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRestartBattle();
            }}
            className="pixel-btn py-3 px-4 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>RESTART BATTLE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="pixel-btn py-3 px-4 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sliders size={16} />
            <span>SETTINGS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              togglePause();
              setScene('main_menu');
            }}
            className="pixel-btn py-3 px-4 flex items-center justify-center gap-2 border-red-900 text-red-300 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Home size={16} />
            <span>ABANDON TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
