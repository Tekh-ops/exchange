import { useCombatStore } from '../stores/combatStore';
import { LANES } from '../combat/LaneSystem';
import { Lane } from '../combat/combatTypes';
import { soundEngine } from '../voice/soundEngine';
import { ArrowLeft, ArrowRight, Crosshair } from 'lucide-react';

export function LaneControls() {
  const { player, enemies, turnPhase, moveLane } = useCombatStore();
  const currentLane: Lane = player.lane ?? 'center';
  const stamina = player.stamina ?? 100;

  // Lanes currently targeted by living enemies' telegraphs
  const dangerousLanes = new Set<Lane>();
  enemies.forEach((inst) => {
    if (inst.entity.hp > 0 && inst.currentIntent?.telegraph) {
      inst.currentIntent.telegraph.targetLanes.forEach((l) => dangerousLanes.add(l));
    }
  });

  const handleMove = (dir: 'left' | 'right' | 'center') => {
    if (turnPhase !== 'player_turn') return;
    soundEngine.playClick();
    moveLane(dir);
  };

  return (
    <div className="pixel-box px-2.5 py-1.5 bg-[#120c21]/90 border border-purple-700/60 flex items-center gap-2">
      <span className="font-pixel text-[8px] text-purple-300 uppercase tracking-wider">LANE</span>

      <button
        type="button"
        disabled={turnPhase !== 'player_turn' || currentLane === 'left' || stamina < 10}
        onClick={() => handleMove('left')}
        className="pixel-btn p-1 text-gray-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
        title="Shift Left (-10 Stamina)"
      >
        <ArrowLeft size={12} />
      </button>

      <div className="flex items-center gap-1">
        {LANES.map((lane) => {
          const isCurrent = lane === currentLane;
          const isDanger = dangerousLanes.has(lane);
          return (
            <button
              key={lane}
              type="button"
              disabled={turnPhase !== 'player_turn' || isCurrent || stamina < 10}
              onClick={() => handleMove(lane)}
              className={`px-2 py-0.5 rounded font-pixel text-[8px] uppercase border transition cursor-pointer ${
                isCurrent
                  ? isDanger
                    ? 'bg-red-900/70 border-red-400 text-amber-200'
                    : 'bg-purple-700/80 border-amber-400 text-amber-200'
                  : isDanger
                  ? 'bg-red-950/50 border-red-700/70 text-red-300 hover:border-red-400'
                  : 'bg-[#090612] border-purple-900/60 text-gray-400 hover:text-gray-200'
              } disabled:cursor-default`}
              title={isDanger ? `${lane.toUpperCase()} lane is telegraphed!` : `Move to ${lane.toUpperCase()} lane (-10 STA)`}
            >
              <span className="flex items-center gap-0.5">
                {isCurrent && <Crosshair size={9} />}
                {lane[0]}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={turnPhase !== 'player_turn' || currentLane === 'right' || stamina < 10}
        onClick={() => handleMove('right')}
        className="pixel-btn p-1 text-gray-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
        title="Shift Right (-10 Stamina)"
      >
        <ArrowRight size={12} />
      </button>
    </div>
  );
}
