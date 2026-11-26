import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { useCombatStore } from '../stores/combatStore';
import { ENCOUNTERS } from '../encounters/EncounterDefinition';
import { soundEngine } from '../voice/soundEngine';
import { SettingsModal } from './SettingsModal';
import { GrimoireModal } from './GrimoireModal';
import { SpellPreparationModal } from './SpellPreparationModal';
import { BattleChronicle } from './BattleChronicle';
import { PlayerStatistics } from './PlayerStatistics';
import { BattleLeaderboards } from './BattleLeaderboards';
import {
  Swords,
  BookOpen,
  Sliders,
  ScrollText,
  Sparkles,
  X,
  Scroll,
  BarChart3,
  Award,
  Wand2,
} from 'lucide-react';

export function MainMenu() {
  const { setScene } = useGameStore();
  const playerStore = usePlayerStore();
  const { initBattle } = useCombatStore();

  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('solo_malakor');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardsOpen, setLeaderboardsOpen] = useState(false);

  const encounterList = Object.values(ENCOUNTERS);
  const activeEnc = ENCOUNTERS[selectedEncounterId] || ENCOUNTERS.solo_malakor;

  const handleStartGame = () => {
    soundEngine.playClick();
    initBattle(
      playerStore.getTotalMaxHp(),
      playerStore.getTotalMaxMana(),
      playerStore.getTotalSpellPower(),
      playerStore.getTotalCritRate(),
      playerStore.getPreparedSpells(),
      selectedEncounterId,
      {
        chargeCostReduction: playerStore.getChargeCostReduction(),
        dodgeEfficiencyBonus: playerStore.getDodgeEfficiencyBonus(),
        postureDamageMultiplier: playerStore.getPostureDamageMultiplier(),
        healingBonusMultiplier: playerStore.getHealingBonusMultiplier(),
      }
    );
    setScene('battle');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#080511] overflow-y-auto select-none">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl pixel-box-gold flex items-center justify-center mb-4 shadow-2xl animate-bounce">
          <Sparkles className="text-amber-400" size={28} />
        </div>

        <h1 className="font-pixel text-2xl sm:text-4xl text-amber-300 tracking-wider mb-1.5 drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
          THE PETTY SORCERER
        </h1>

        <p className="font-lore text-base sm:text-lg text-purple-200/90 mb-1">
          Every Spell Leaves a Memory
        </p>

        <p className="font-pixel text-[9px] text-gray-500 mb-5 tracking-widest uppercase">
          960 × 540 • Adaptive Tactical Wizard Combat
        </p>

        {/* Encounter Selector */}
        <div className="w-80 sm:w-96 pixel-box p-3 bg-[#120b21]/90 border border-purple-700/60 mb-4 text-left">
          <label className="font-pixel text-[9px] text-amber-300 block mb-1.5">
            SELECT ENCOUNTER
          </label>
          <select
            value={selectedEncounterId}
            onChange={(e) => {
              soundEngine.playClick();
              setSelectedEncounterId(e.target.value);
            }}
            className="w-full bg-[#090612] border border-purple-800 rounded px-2.5 py-1.5 font-pixel text-[10px] text-gray-200 cursor-pointer"
          >
            {encounterList.map((enc) => (
              <option key={enc.id} value={enc.id}>
                [{enc.difficulty.toUpperCase()}] {enc.name} ({enc.enemies.length}{' '}
                {enc.enemies.length === 1 ? 'foe' : 'foes'})
              </option>
            ))}
          </select>
          <p className="font-lore text-xs text-gray-400 mt-1.5">{activeEnc.description}</p>
        </div>

        {/* Menu Actions */}
        <div className="w-80 space-y-2.5 font-pixel text-xs relative z-20">
          <button
            type="button"
            onClick={handleStartGame}
            className="pixel-btn w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-amber-300 border-amber-600 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Swords size={16} />
            <span>ENTER ARENA</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setPrepOpen(true);
              }}
              className="pixel-btn py-2.5 px-2 flex items-center justify-center gap-1.5 text-[10px] text-purple-200 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <Wand2 size={14} />
              <span>PREPARE SPELLS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setGrimoireOpen(true);
              }}
              className="pixel-btn py-2.5 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <BookOpen size={14} />
              <span>GRIMOIRE</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setChronicleOpen(true);
            }}
            className="pixel-btn w-full py-2.5 px-4 flex items-center justify-center gap-2.5 text-purple-200 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Scroll size={16} />
            <span>BATTLE CHRONICLE</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStatsOpen(true);
              }}
              className="pixel-btn py-2.5 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <BarChart3 size={14} />
              <span>STATISTICS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setLeaderboardsOpen(true);
              }}
              className="pixel-btn py-2.5 px-2 flex items-center justify-center gap-1.5 text-[10px] text-amber-200 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <Award size={14} />
              <span>RECORDS</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setLoreOpen(true);
              }}
              className="pixel-btn py-2.5 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <ScrollText size={14} />
              <span>LORE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSettingsOpen(true);
              }}
              className="pixel-btn py-2.5 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-300 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <Sliders size={14} />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>

        <div className="mt-6 font-lore text-xs text-gray-500 max-w-md">
          "Never underestimate a wizard with an unreviewed dissertation and far too much spare time."
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <GrimoireModal isOpen={grimoireOpen} onClose={() => setGrimoireOpen(false)} />
      <SpellPreparationModal isOpen={prepOpen} onClose={() => setPrepOpen(false)} />
      <BattleChronicle isOpen={chronicleOpen} onClose={() => setChronicleOpen(false)} />
      <PlayerStatistics isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
      <BattleLeaderboards isOpen={leaderboardsOpen} onClose={() => setLeaderboardsOpen(false)} />

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
                The Petty Sorcerer has achieved none of these. Instead, he has spent forty-three years specializing exclusively in{' '}
                <strong className="text-purple-300">Minor Kinetic Irritations</strong> and{' '}
                <strong className="text-purple-300">Curses of Social Discomfort</strong>.
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
