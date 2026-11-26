import { useState, useEffect } from 'react';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
import { usePlayerStore } from '../stores/playerStore';
import { SpellTooltip } from './SpellTooltip';
import { DialogueBox } from './DialogueBox';
import { CombatLogPanel } from './CombatLogPanel';
import { PauseMenu } from './PauseMenu';
import { GameOverModal } from './GameOverModal';
import { SettingsModal } from './SettingsModal';
import { AdaptiveIntelligencePanel } from './AdaptiveIntelligencePanel';
import { soundEngine } from '../voice/soundEngine';
import { Spell } from '../spells/types';
import { 
  Pause, 
  Scroll, 
  Sparkles, 
  ShieldAlert, 
  MessageSquare, 
  Footprints,
  Flame,
  Zap,
  Shield,
  Skull,
  Droplet,
  Snowflake,
  Brain
} from 'lucide-react';

export function BattleHUD() {
  const {
    player,
    enemy,
    turnNumber,
    turnPhase,
    enemyIntent,
    activeSpells,
    currentEnemyEmotion,
    contextualRivalBanter,
    showAdaptivePanel,
    toggleAdaptivePanel,
    castSpell,
    initBattle,
    fleeBattle,
  } = useCombatStore();

  const { togglePause } = useGameStore();
  const playerStore = usePlayerStore();

  const [hoveredSpell, setHoveredSpell] = useState<Spell | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize or restart battle
  const handleRestartBattle = () => {
    initBattle(
      playerStore.getTotalMaxHp(),
      playerStore.getTotalMaxMana(),
      playerStore.getTotalSpellPower(),
      playerStore.getTotalCritRate(),
      playerStore.spells
    );
  };

  // Keyboard shortcut listener (1-6 keys for spells)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (turnPhase !== 'player_turn') return;
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= activeSpells.length) {
        const spell = activeSpells[keyNum - 1];
        if (spell && player.mana >= spell.manaCost && spell.currentCooldown === 0) {
          castSpell(spell.id);
        }
      }
      if (e.key === 'Escape') {
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnPhase, activeSpells, player.mana, castSpell, togglePause]);

  const getSpellIcon = (anim: string) => {
    switch (anim) {
      case 'fire': return <Flame size={18} className="text-red-400" />;
      case 'ice': return <Snowflake size={18} className="text-cyan-400" />;
      case 'missile': return <Zap size={18} className="text-purple-400" />;
      case 'shield': return <Shield size={18} className="text-blue-400" />;
      case 'hex': return <Skull size={18} className="text-emerald-400" />;
      case 'drain': return <Droplet size={18} className="text-cyan-400" />;
      default: return <Sparkles size={18} className="text-amber-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* ================= TOP STATUS BAR ================= */}
      <div className="w-full flex items-start justify-between gap-4 pointer-events-auto z-40">
        {/* Player Stats Panel */}
        <div className="pixel-box p-2.5 w-72 bg-[#130d22]/90 border border-purple-500/60">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[11px] text-amber-300">
              {player.name}
            </span>
            {player.shield > 0 && (
              <span className="font-pixel text-[9px] text-blue-300 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-600/60 flex items-center gap-1">
                <Shield size={10} /> {player.shield}
              </span>
            )}
          </div>

          {/* Player HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-pixel text-gray-400">
              <span>HP</span>
              <span className="text-green-400">{player.hp} / {player.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-[#08060c] border border-purple-900/60 rounded-xs overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-green-500 transition-all duration-300"
                style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Player Mana Bar */}
          <div className="space-y-1 mt-1.5">
            <div className="flex justify-between text-[9px] font-pixel text-gray-400">
              <span>MANA</span>
              <span className="text-blue-400">{player.mana} / {player.maxMana}</span>
            </div>
            <div className="w-full h-2.5 bg-[#08060c] border border-purple-900/60 rounded-xs overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-700 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.max(0, (player.mana / player.maxMana) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Control Badge & Turn Indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="pixel-box px-3 py-1 bg-[#1a1429] border border-amber-600/70 flex items-center gap-3">
            <span className="font-pixel text-[10px] text-amber-300 tracking-wider">
              TURN {turnNumber}
            </span>

            <div className="h-3 w-px bg-purple-900/80" />

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  toggleAdaptivePanel();
                }}
                className={`p-1 transition cursor-pointer hover:scale-110 active:scale-95 ${showAdaptivePanel ? 'text-purple-300' : 'text-gray-300 hover:text-purple-300'}`}
                title="Adaptive Intelligence Panel"
              >
                <Brain size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setLogOpen(!logOpen);
                }}
                className="p-1 text-gray-300 hover:text-amber-300 transition cursor-pointer hover:scale-110 active:scale-95"
                title="Combat Log"
              >
                <Scroll size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  useCombatStore.setState((s) => ({ dialogueOpen: !s.dialogueOpen }));
                }}
                className="p-1 text-gray-300 hover:text-purple-300 transition cursor-pointer hover:scale-110 active:scale-95"
                title="Toggle Banter"
              >
                <MessageSquare size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  togglePause();
                }}
                className="p-1 text-gray-300 hover:text-red-300 transition cursor-pointer hover:scale-110 active:scale-95"
                title="Pause Game"
              >
                <Pause size={14} />
              </button>
            </div>
          </div>

          {/* Turn phase indicator */}
          <div className="font-pixel text-[9px] px-2.5 py-0.5 rounded-full border tracking-widest uppercase transition-all duration-300 bg-[#0c0915]/90 border-purple-800/80">
            {turnPhase === 'player_turn' && (
              <span className="text-amber-300 animate-pulse">⚡ YOUR ACTION</span>
            )}
            {turnPhase === 'player_casting' && (
              <span className="text-purple-300">WEAVING SPELL...</span>
            )}
            {turnPhase === 'enemy_turn' && (
              <span className="text-emerald-400">MALAKOR PREPARING...</span>
            )}
            {turnPhase === 'enemy_casting' && (
              <span className="text-red-400 animate-pulse">MALAKOR UNLEASHING!</span>
            )}
          </div>
        </div>

        {/* Enemy Stats & Intent Panel */}
        <div className="pixel-box p-2.5 w-72 bg-[#130d22]/90 border border-emerald-600/60">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[11px] text-emerald-400">
              {enemy.name}
            </span>
            {enemy.shield > 0 && (
              <span className="font-pixel text-[9px] text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 flex items-center gap-1">
                <Shield size={10} /> {enemy.shield}
              </span>
            )}
          </div>

          {/* Enemy HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-pixel text-gray-400">
              <span>HP</span>
              <span className="text-red-400">{enemy.hp} / {enemy.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-[#08060c] border border-emerald-950 rounded-xs overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-700 to-rose-500 transition-all duration-300"
                style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Enemy Intent Badge */}
          {enemyIntent && (
            <div className="mt-2 pt-1.5 border-t border-purple-950 flex items-center justify-between text-[9px] font-pixel">
              <span className="text-gray-400 flex items-center gap-1">
                <ShieldAlert size={11} className="text-amber-400" />
                <span>INTENT:</span>
              </span>
              <span className="text-amber-300 truncate max-w-[150px]" title={enemyIntent.description}>
                {enemyIntent.spellName}
              </span>
            </div>
          )}

          {/* Enemy Emotion Display */}
          <div className="mt-1.5 pt-1 border-t border-purple-950 flex items-center justify-between text-[9px] font-pixel">
            <span className="text-gray-400">EMOTION:</span>
            <span className="text-amber-300 uppercase px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800/60">
              {currentEnemyEmotion}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual In-Battle Rival Speech Banner */}
      {contextualRivalBanter && (
        <div className="absolute top-22 right-8 z-30 max-w-xs animate-in fade-in slide-in-from-top-2 pointer-events-none">
          <div className="pixel-box p-2 bg-[#170e28]/95 border border-purple-500 text-purple-200 text-[11px] font-lore shadow-xl">
            <span className="font-pixel text-[8px] text-amber-300 block mb-0.5">MALAKOR TAUNT:</span>
            "{contextualRivalBanter}"
          </div>
        </div>
      )}

      {/* ================= DIALOGUE BANTER BOX ================= */}
      <DialogueBox />

      {/* ================= BOTTOM ACTION BAR ================= */}
      <div className="w-full flex items-end justify-center pointer-events-auto z-40">
        <div className="pixel-box-gold px-4 py-2.5 bg-[#140e24]/95 flex items-center gap-3 relative shadow-2xl">
          {/* Active Spell Buttons */}
          <div className="flex items-center gap-2">
            {activeSpells.map((spell, index) => {
              const notEnoughMana = player.mana < spell.manaCost;
              const onCooldown = spell.currentCooldown > 0;
              const isDisabled = turnPhase !== 'player_turn' || notEnoughMana || onCooldown;

              return (
                <div key={spell.id} className="relative">
                  {/* Tooltip */}
                  {hoveredSpell?.id === spell.id && (
                    <SpellTooltip spell={spell} />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!isDisabled) castSpell(spell.id);
                    }}
                    onMouseEnter={() => setHoveredSpell(spell)}
                    onMouseLeave={() => setHoveredSpell(null)}
                    disabled={isDisabled}
                    className={`pixel-btn w-20 h-20 p-1.5 flex flex-col items-center justify-between relative group cursor-pointer ${
                      isDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                    }`}
                  >
                    {/* Hotkey Tag */}
                    <span className="absolute top-1 left-1.5 font-pixel text-[8px] text-gray-400 group-hover:text-amber-300">
                      {index + 1}
                    </span>

                    {/* Mana Cost Tag */}
                    <span className={`absolute top-1 right-1.5 font-pixel text-[8px] ${spell.manaCost > 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {spell.manaCost > 0 ? `${spell.manaCost}` : '0'}
                    </span>

                    {/* Spell Icon */}
                    <div className="flex-1 flex items-center justify-center mt-2">
                      {getSpellIcon(spell.castAnimation)}
                    </div>

                    {/* Spell Name */}
                    <span className="font-pixel text-[8px] text-amber-200 tracking-tighter truncate w-full text-center">
                      {spell.name}
                    </span>

                    {/* Cooldown Overlay */}
                    {onCooldown && (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center font-pixel text-amber-400 text-xs pointer-events-none">
                        <span>{spell.currentCooldown}</span>
                        <span className="text-[7px] text-gray-400 mt-0.5">TURNS</span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="h-14 w-px bg-purple-900/70" />

          {/* Flee / Surrender Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              fleeBattle();
            }}
            disabled={turnPhase !== 'player_turn'}
            className="pixel-btn h-20 px-3 flex flex-col items-center justify-center gap-1 text-red-300 border-red-900 hover:text-red-200 hover:border-red-600 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Declare a tactical grievance retreat"
          >
            <Footprints size={18} />
            <span className="font-pixel text-[8px] text-center">
              FLEE<br />BATTLE
            </span>
          </button>
        </div>
      </div>

      {/* ================= MODALS & OVERLAYS ================= */}
      <AdaptiveIntelligencePanel
        isOpen={showAdaptivePanel}
        onClose={toggleAdaptivePanel}
      />

      <CombatLogPanel
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
      />

      <PauseMenu
        onOpenSettings={() => setSettingsOpen(true)}
        onRestartBattle={handleRestartBattle}
      />

      <GameOverModal
        onRestart={handleRestartBattle}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
