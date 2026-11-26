import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { useCombatStore } from '../stores/combatStore';
import { ENCOUNTERS } from '../encounters/EncounterDefinition';
import { soundEngine } from '../voice/soundEngine';
import { SettingsModal } from './SettingsModal';
import { GrimoireModal } from './GrimoireModal';
import { SpellPreparationModal } from './SpellPreparationModal';
import { CharacterProfileModal } from './CharacterProfileModal';
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
  User,
  Crown,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export function MainMenu() {
  const { setScene } = useGameStore();
  const playerStore = usePlayerStore();
  const { initBattle } = useCombatStore();

  const [selectedEncounterId, setSelectedEncounterId] = useState<string>('solo_malakor');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardsOpen, setLeaderboardsOpen] = useState(false);

  const encounterList = Object.values(ENCOUNTERS);
  const activeEnc = ENCOUNTERS[selectedEncounterId] || ENCOUNTERS.solo_malakor;
  const { progression } = playerStore;

  const isLocked = Boolean(activeEnc.minLevel && progression.level < activeEnc.minLevel);
  const bossId = activeEnc.enemies.find((e) => e.isBoss)?.bossId;
  const alreadyDefeated = Boolean(bossId && progression.firstBossVictories.includes(bossId));

  const handleStartGame = () => {
    if (isLocked) return;
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
        synergyBonusMultiplier: playerStore.getSynergyBonusMultiplier(),
        damageReduction: playerStore.getDamageReduction(),
        manaRegenBonus: playerStore.getManaRegenBonus(),
        manaCostReduction: Math.min(4, Math.floor(Math.max(0, progression.attributes.intelligence - 1) / 3)),
        playerLevel: progression.level,
      }
    );
    setScene('battle');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-5 bg-[#080511] overflow-y-auto select-none">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl pixel-box-gold flex items-center justify-center mb-3 shadow-2xl animate-bounce">
          <Sparkles className="text-amber-400" size={24} />
        </div>

        <h1 className="font-pixel text-2xl sm:text-4xl text-amber-300 tracking-wider mb-1 drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
          THE PETTY SORCERER
        </h1>

        <p className="font-lore text-base text-purple-200/90 mb-1">
          Every Spell Leaves a Memory
        </p>

        <p className="font-pixel text-[9px] text-amber-200/80 mb-4 tracking-widest uppercase">
          LVL {progression.level} • {progression.currentXp}/{progression.xpToNextLevel || 'MAX'} XP •{' '}
          {progression.gold} GOLD
        </p>

        {/* Encounter & Boss Selector */}
        <div
          className={`w-80 sm:w-[440px] pixel-box p-3 mb-4 text-left ${
            activeEnc.isLegendaryBoss
              ? 'bg-[#1a0a2e]/95 border-amber-400/80'
              : 'bg-[#120b21]/90 border-purple-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-pixel text-[9px] text-amber-300 flex items-center gap-1.5">
              {activeEnc.isLegendaryBoss && <Crown size={12} className="text-amber-300" />}
              SELECT ENCOUNTER
            </label>
            {alreadyDefeated && (
              <span className="font-pixel text-[8px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={10} /> DEFEATED
              </span>
            )}
          </div>

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
                [{enc.difficulty.toUpperCase()}] {enc.name}
                {enc.recommendedLevel ? ` (Rec Lv.${enc.recommendedLevel})` : ''}
              </option>
            ))}
          </select>

          <p className="font-lore text-xs text-gray-300 mt-1.5">{activeEnc.description}</p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px] text-purple-200">
            <span>
              REWARD: +{activeEnc.rewards.xp} XP, +{activeEnc.rewards.gold}G
              {!alreadyDefeated && activeEnc.firstVictoryRewards
                ? ` (+${activeEnc.firstVictoryRewards.xp} FIRST CLEAR!)`
                : ''}
            </span>
            {activeEnc.recommendedLevel && (
              <span className="text-amber-300">REC LVL {activeEnc.recommendedLevel}</span>
            )}
          </div>

          {activeEnc.warningText && (
            <div className="mt-2 p-2 rounded bg-amber-950/50 border border-amber-500/60 font-lore text-[11px] text-amber-200 flex items-start gap-1.5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span>{activeEnc.warningText}</span>
            </div>
          )}

          {isLocked && (
            <div className="mt-2 p-2 rounded bg-red-950/60 border border-red-600/60 font-pixel text-[8px] text-red-300 flex items-center gap-1.5">
              <Lock size={12} />
              <span>UNLOCKS AT PLAYER LEVEL {activeEnc.minLevel}</span>
            </div>
          )}
        </div>

        {/* Menu Actions */}
        <div className="w-80 space-y-2 font-pixel text-xs relative z-20">
          <button
            type="button"
            disabled={isLocked}
            onClick={handleStartGame}
            className="pixel-btn w-full py-3 px-4 flex items-center justify-center gap-2.5 text-amber-300 border-amber-600 cursor-pointer hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Swords size={16} />
            <span>{isLocked ? `LOCKED (LVL ${activeEnc.minLevel})` : 'ENTER ARENA'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setProfileOpen(true);
            }}
            className="pixel-btn w-full py-2.5 px-4 flex items-center justify-center gap-2 text-emerald-300 border-emerald-700/70 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <User size={15} />
            <span>
              CHARACTER PROFILE
              {progression.attributePoints > 0 ? ` (${progression.attributePoints} PTS!)` : ''}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setPrepOpen(true);
              }}
              className="pixel-btn py-2 px-2 flex items-center justify-center gap-1.5 text-[10px] text-purple-200 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <Wand2 size={14} />
              <span>PREPARE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setGrimoireOpen(true);
              }}
              className="pixel-btn py-2 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
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
            className="pixel-btn w-full py-2 px-4 flex items-center justify-center gap-2 text-[10px] text-purple-200 cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Scroll size={14} />
            <span>BATTLE CHRONICLE</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStatsOpen(true);
              }}
              className="pixel-btn py-2 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
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
              className="pixel-btn py-2 px-2 flex items-center justify-center gap-1.5 text-[10px] text-amber-200 cursor-pointer hover:scale-105 active:scale-95 transition"
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
              className="pixel-btn py-2 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-200 cursor-pointer hover:scale-105 active:scale-95 transition"
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
              className="pixel-btn py-2 px-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-300 cursor-pointer hover:scale-105 active:scale-95 transition"
            >
              <Sliders size={14} />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <GrimoireModal isOpen={grimoireOpen} onClose={() => setGrimoireOpen(false)} />
      <SpellPreparationModal isOpen={prepOpen} onClose={() => setPrepOpen(false)} />
      <CharacterProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
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
