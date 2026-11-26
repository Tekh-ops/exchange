import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { useCombatStore } from '../stores/combatStore';
import { soundEngine } from '../voice/soundEngine';
import { SettingsModal } from './SettingsModal';
import { GrimoireModal } from './GrimoireModal';
import { Swords, BookOpen, Sliders, ScrollText, Sparkles, X } from 'lucide-react';

export function MainMenu() {
  const { setScene } = useGameStore();
  const playerStore = usePlayerStore();
  const { initBattle } = useCombatStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);

  const handleStartGame = () => {
    soundEngine.playClick();
    initBattle(
      playerStore.getTotalMaxHp(),
      playerStore.getTotalMaxMana(),
      playerStore.getTotalSpellPower(),
      playerStore.getTotalCritRate(),
      playerStore.spells
    );
    setScene('battle');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#080511] overflow-hidden select-none">
      {/* Background Ambient Glows & Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Main Content Box */}
      <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
        {/* Crest Icon */}
        <div className="w-16 h-16 rounded-2xl pixel-box-gold flex items-center justify-center mb-6 shadow-2xl animate-bounce">
          <Sparkles className="text-amber-400" size={32} />
        </div>

        {/* Game Title */}
        <h1 className="font-pixel text-2xl sm:text-4xl text-amber-300 tracking-wider mb-2 drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
          THE PETTY SORCERER
        </h1>

        <p className="font-lore text-lg sm:text-xl text-purple-200/90 mb-2">
          A Tale of Grudges, Spite, and Minor Arcana
        </p>

        <p className="font-pixel text-[10px] text-gray-500 mb-8 tracking-widest uppercase">
          960 × 540 • 2D Pixel-Art Wizard Duel Engine
        </p>

        {/* Menu Actions */}
        <div className="w-72 space-y-3 font-pixel text-xs relative z-20">
          <button
            type="button"
            onClick={handleStartGame}
            className="pixel-btn w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-amber-300 border-amber-600 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Swords size={16} />
            <span>START DUEL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setGrimoireOpen(true);
            }}
            className="pixel-btn w-full py-3 px-4 flex items-center justify-center gap-2.5 text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <BookOpen size={16} />
            <span>GRIMOIRE & STATS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setLoreOpen(true);
            }}
            className="pixel-btn w-full py-3 px-4 flex items-center justify-center gap-2.5 text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <ScrollText size={16} />
            <span>ACADEMIC LORE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSettingsOpen(true);
            }}
            className="pixel-btn w-full py-3 px-4 flex items-center justify-center gap-2.5 text-gray-300 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Sliders size={16} />
            <span>CONFIG & AUDIO</span>
          </button>
        </div>

        {/* Footer Lore note */}
        <div className="mt-10 font-lore text-xs text-gray-500 max-w-md">
          "Never underestimate a wizard with an unreviewed dissertation and far too much spare time."
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Grimoire Modal */}
      <GrimoireModal
        isOpen={grimoireOpen}
        onClose={() => setGrimoireOpen(false)}
      />

      {/* Lore Modal */}
      {loreOpen && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="pixel-box-gold w-[540px] max-w-[95%] p-6 relative">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setLoreOpen(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
            >
              <X size={18} />
            </button>

            <h2 className="font-pixel text-base text-amber-300 tracking-wider mb-4 flex items-center gap-2">
              <ScrollText size={18} /> THE CAUSE OF COMBAT
            </h2>

            <div className="font-lore text-sm text-gray-300 space-y-3 leading-relaxed">
              <p>
                In the grand Citadel of Nethermancy, respect is earned through catastrophic planar invocations and continent-sundering curses.
              </p>
              <p>
                The Petty Sorcerer has achieved none of these. Instead, he has spent forty-three years specializing exclusively in <strong className="text-purple-300">Minor Kinetic Irritations</strong> and <strong className="text-purple-300">Curses of Social Discomfort</strong>.
              </p>
              <p>
                Earlier this afternoon, Arch-Mage Malakor failed to acknowledge him in the enchanted hallway, took the last buttered scone from the high table, and omitted his paper from the footnote of the Citadel Quarterly.
              </p>
              <p className="text-amber-300 font-pixel text-xs pt-2 border-t border-purple-900/60">
                BLOOD SHALL PAY FOR SCONES.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setLoreOpen(false);
              }}
              className="pixel-btn w-full mt-6 py-2.5 font-pixel text-xs text-amber-300 cursor-pointer hover:scale-105 active:scale-95"
            >
              RETURN TO TITLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
