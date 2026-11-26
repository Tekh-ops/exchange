import { useCombatStore } from '../stores/combatStore';
import { usePlayerStore } from '../stores/playerStore';
import { useGameStore } from '../stores/gameStore';
import { soundEngine } from '../voice/soundEngine';
import { VICTORY_BANTER, DEFEAT_BANTER } from '../dialogue/banterData';
import { Trophy, Skull, RotateCcw, Home } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameOverModalProps {
  onRestart: () => void;
}

export function GameOverModal({ onRestart }: GameOverModalProps) {
  const { turnPhase } = useCombatStore();
  const { addXp, addGold, progression } = usePlayerStore();
  const { setScene } = useGameStore();

  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [flavorQuote, setFlavorQuote] = useState('');

  const isVictory = turnPhase === 'victory';
  const isDefeat = turnPhase === 'defeat';

  useEffect(() => {
    if (isVictory && !rewardClaimed) {
      addXp(60);
      addGold(35);
      setRewardClaimed(true);
      const rand = VICTORY_BANTER[Math.floor(Math.random() * VICTORY_BANTER.length)];
      setFlavorQuote(rand);
    } else if (isDefeat) {
      const rand = DEFEAT_BANTER[Math.floor(Math.random() * DEFEAT_BANTER.length)];
      setFlavorQuote(rand);
    }
  }, [turnPhase, isVictory, isDefeat, rewardClaimed, addXp, addGold]);

  if (!isVictory && !isDefeat) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-[460px] p-6 text-center ${isVictory ? 'pixel-box-gold' : 'pixel-box border-red-700/80'} animate-in zoom-in-95`}>
        {/* Emblem */}
        <div className="flex justify-center mb-3">
          {isVictory ? (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
              <Trophy size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-950/40 border-2 border-red-500 flex items-center justify-center text-red-400">
              <Skull size={32} />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className={`font-pixel text-xl mb-1 ${isVictory ? 'text-amber-300' : 'text-red-400'}`}>
          {isVictory ? 'PETTY TRIUMPH!' : 'OUT-PETTIED!'}
        </h2>
        <p className="text-xs font-pixel text-gray-400 mb-4">
          {isVictory ? 'Arch-Mage Malakor has retreated in utter humiliation' : 'You were humbled by a pretentious nethermancer'}
        </p>

        {/* Banter quote */}
        <div className="p-3 bg-purple-950/60 rounded border border-purple-800/50 mb-5 font-lore text-sm italic text-purple-200">
          "{flavorQuote}"
        </div>

        {/* Rewards / Stats */}
        {isVictory && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-amber-950/30 rounded border border-amber-600/40 mb-6 font-pixel text-[11px]">
            <div className="text-left">
              <span className="text-gray-400 block text-[9px]">EXPERIENCE GAINED</span>
              <span className="text-amber-300">+60 XP</span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block text-[9px]">LOOT EXTRACTED</span>
              <span className="text-amber-300">+35 GOLD</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-amber-900/40 text-left text-[10px] text-gray-300">
              CURRENT LEVEL: <span className="text-purple-300">{progression.level}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 font-pixel text-xs">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="pixel-btn py-3 px-4 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>{isVictory ? 'DUEL AGAIN (RUB IT IN)' : 'DEMAND REMATCH (FILE APPEAL)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setScene('main_menu');
            }}
            className="pixel-btn py-2.5 px-4 flex items-center justify-center gap-2 border-purple-800 text-gray-300 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Home size={14} />
            <span>RETURN TO SANCTUM</span>
          </button>
        </div>
      </div>
    </div>
  );
}
