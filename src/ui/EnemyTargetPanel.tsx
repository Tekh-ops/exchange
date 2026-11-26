import { useCombatStore } from '../stores/combatStore';
import { soundEngine } from '../voice/soundEngine';
import { Shield, ShieldAlert, Target, Zap } from 'lucide-react';

export function EnemyTargetPanel() {
  const { enemies, selectedTargetId, selectTarget } = useCombatStore();

  return (
    <div className="flex flex-col gap-1.5 w-80">
      {enemies.map((inst) => {
        const e = inst.entity;
        const isDead = e.hp <= 0;
        const isSelected = e.id === selectedTargetId;
        const posturePct = e.maxPosture ? Math.min(100, ((e.posture ?? 0) / e.maxPosture) * 100) : 0;

        return (
          <button
            key={e.id}
            type="button"
            disabled={isDead}
            onClick={() => {
              soundEngine.playClick();
              selectTarget(e.id);
            }}
            className={`pixel-box p-2 text-left transition cursor-pointer ${
              isDead
                ? 'opacity-40 grayscale cursor-not-allowed bg-[#0c0814]/80 border-gray-800'
                : isSelected
                ? 'bg-[#1a1030]/95 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                : 'bg-[#130d22]/90 border-emerald-700/50 hover:border-amber-500/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {isSelected && !isDead && <Target size={11} className="text-amber-400 shrink-0" />}
                <span className="font-pixel text-[10px] text-emerald-300 truncate">{e.name}</span>
                {e.isBoss && (
                  <span className="font-pixel text-[7px] px-1 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300">
                    STG {e.bossStage ?? 1}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="font-pixel text-[7px] px-1 py-0.5 rounded bg-purple-950 border border-purple-700/60 text-purple-200 uppercase">
                  {e.lane ?? 'center'}
                </span>
                {e.shield > 0 && (
                  <span className="font-pixel text-[8px] text-emerald-300 px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 flex items-center gap-0.5">
                    <Shield size={9} /> {e.shield}
                  </span>
                )}
                {e.isStaggered && (
                  <span className="font-pixel text-[7px] px-1 py-0.5 rounded bg-yellow-500/20 border border-yellow-400 text-yellow-300 flex items-center gap-0.5 animate-pulse">
                    <Zap size={8} /> STAGGER
                  </span>
                )}
              </div>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-[#08060c] border border-emerald-950 rounded-xs overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-700 to-rose-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` }}
                />
              </div>
              <span className="font-pixel text-[8px] text-red-400 w-16 text-right">
                {e.hp}/{e.maxHp}
              </span>
            </div>

            {/* Posture & Intent Row */}
            {!isDead && (
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[8px] font-pixel">
                <div className="flex items-center gap-1.5 w-24">
                  <span className="text-gray-500">POS</span>
                  <div className="flex-1 h-1.5 bg-black/70 rounded-xs overflow-hidden border border-amber-900/40">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${posturePct}%` }}
                    />
                  </div>
                </div>

                {inst.currentIntent && (
                  <span
                    className="text-amber-300 truncate flex items-center gap-1"
                    title={inst.currentIntent.telegraph?.warningText || inst.currentIntent.description}
                  >
                    <ShieldAlert size={9} className="text-amber-400 shrink-0" />
                    {inst.currentIntent.spellName}
                  </span>
                )}

                <span className="text-purple-300 uppercase shrink-0">{inst.currentEmotion}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
