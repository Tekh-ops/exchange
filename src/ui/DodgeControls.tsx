import { ReactNode } from 'react';
import { useCombatStore } from '../stores/combatStore';
import { DodgeSystem, DodgeType, DODGE_COSTS } from '../combat/DodgeSystem';
import { soundEngine } from '../voice/soundEngine';
import { Wind, Sparkles, ShieldCheck } from 'lucide-react';

export function DodgeControls() {
  const { player, turnPhase, performDodge, enemyIntent, perfectDodgeBuff } = useCombatStore();
  const stamina = player.stamina ?? 100;

  const dodgeButtons: {
    type: DodgeType;
    label: string;
    short: string;
    icon: ReactNode;
    desc: string;
  }[] = [
    {
      type: 'quickstep',
      label: 'QUICKSTEP',
      short: `${DODGE_COSTS.quickstep.staminaCost} STA`,
      icon: <Wind size={12} className="text-sky-300" />,
      desc: 'Standard dodge stance. Consumes Stamina.',
    },
    {
      type: 'arcane_blink',
      label: 'BLINK',
      short: `${DODGE_COSTS.arcane_blink.staminaCost}S/${DODGE_COSTS.arcane_blink.manaCost}M`,
      icon: <Sparkles size={12} className="text-purple-300" />,
      desc: 'Teleport to a safer lane and evade.',
    },
    {
      type: 'perfect_dodge',
      label: 'PERFECT',
      short: `${DODGE_COSTS.perfect_dodge.staminaCost}S/${DODGE_COSTS.perfect_dodge.manaCost}M`,
      icon: <ShieldCheck size={12} className="text-amber-300" />,
      desc: 'High-risk counter-evade against telegraphs (+12 MP & +25% next spell).',
    },
  ];

  const telegraphWarning = enemyIntent?.telegraph?.warningText;

  return (
    <div className="pixel-box px-2.5 py-1.5 bg-[#120c21]/90 border border-sky-800/60 flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {dodgeButtons.map((btn) => {
          const check = DodgeSystem.canAffordDodge(btn.type, stamina, player.mana);
          const disabled = turnPhase !== 'player_turn' || !check.canAfford;
          return (
            <button
              key={btn.type}
              type="button"
              disabled={disabled}
              onClick={() => {
                soundEngine.playClick();
                performDodge(btn.type);
              }}
              title={`${btn.label}: ${btn.desc}${!check.canAfford ? ` (${check.reason})` : ''}`}
              className={`pixel-btn px-2 py-1 flex items-center gap-1 font-pixel text-[8px] cursor-pointer transition ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95 text-gray-200'
              }`}
            >
              {btn.icon}
              <span>{btn.label}</span>
              <span className="text-sky-300/90 text-[7px]">{btn.short}</span>
            </button>
          );
        })}
      </div>

      {perfectDodgeBuff && (
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400 font-pixel text-[8px] text-amber-300 animate-pulse">
          +25% SPELL
        </span>
      )}

      {telegraphWarning && (
        <span
          className="hidden lg:inline-block font-lore text-[10px] text-amber-300/90 max-w-[180px] truncate"
          title={telegraphWarning}
        >
          ⚠ {telegraphWarning}
        </span>
      )}
    </div>
  );
}
