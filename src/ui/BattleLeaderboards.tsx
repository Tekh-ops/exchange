import { useState, useEffect, useMemo } from 'react';
import { BattleRecord } from '../history/BattleRecord';
import { getBattleHistoryRepository } from '../history/BattleHistoryRepository';
import { LeaderboardEngine, LeaderboardCategory } from '../history/LeaderboardEngine';
import { soundEngine } from '../voice/soundEngine';
import { X, Award, Medal } from 'lucide-react';

interface BattleLeaderboardsProps {
  isOpen: boolean;
  onClose: () => void;
}

type LeaderboardGroup = 'overall' | 'boss' | 'combat' | 'adaptive';

const GROUP_CATEGORIES: Record<LeaderboardGroup, LeaderboardCategory[]> = {
  overall: ['fastest_victory', 'fewest_turns_victory'],
  boss: ['fastest_victory', 'highest_damage'],
  combat: ['highest_damage', 'highest_single_battle_damage', 'most_crits', 'highest_healing', 'most_spells_cast'],
  adaptive: ['most_strategy_changes', 'best_prediction_accuracy'],
};

export function BattleLeaderboards({ isOpen, onClose }: BattleLeaderboardsProps) {
  const [records, setRecords] = useState<BattleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<LeaderboardGroup>('overall');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getBattleHistoryRepository()
        .getAllRecords()
        .then(setRecords)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const leaderboards = useMemo(() => {
    const cats = GROUP_CATEGORIES[activeGroup];
    return cats.map((cat) => LeaderboardEngine.buildLeaderboard(records, cat, 5));
  }, [records, activeGroup]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[740px] max-w-[96%] max-h-[90vh] flex flex-col p-5 relative">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
          aria-label="Close leaderboards"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-between mb-3 pr-8">
          <div>
            <h2 className="font-pixel text-base text-amber-300 flex items-center gap-2">
              <Award size={18} /> PERSONAL LEADERBOARDS
            </h2>
            <p className="font-pixel text-[8px] text-gray-400 mt-1">
              LOCAL HALL OF PETTY RECORDS • DERIVED FROM YOUR BATTLE CHRONICLE
            </p>
          </div>
        </div>

        {/* Category Group Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-purple-900/60 pb-2 font-pixel text-[10px]">
          {(['overall', 'boss', 'combat', 'adaptive'] as LeaderboardGroup[]).map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveGroup(grp);
              }}
              className={`px-3 py-1.5 rounded uppercase cursor-pointer transition ${
                activeGroup === grp
                  ? 'bg-purple-800/80 text-amber-300 border border-amber-500/50'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        {/* Boards */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-16 text-center font-pixel text-xs text-gray-400">
              RANKING YOUR DEEDS...
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Award size={32} className="mx-auto text-purple-700/60" />
              <p className="font-pixel text-xs text-gray-400">NO PERSONAL RECORDS YET</p>
              <p className="font-lore text-sm text-gray-500 italic">
                Complete duels to establish your local leaderboard rankings.
              </p>
            </div>
          ) : (
            leaderboards.map((board) => (
              <div
                key={board.category}
                className="p-3.5 rounded bg-[#110a20] border border-purple-900/50"
              >
                <div className="mb-2.5">
                  <h3 className="font-pixel text-xs text-amber-300">{board.title}</h3>
                  <p className="font-lore text-xs text-gray-400">{board.description}</p>
                </div>

                {board.entries.length === 0 ? (
                  <p className="font-lore text-xs text-gray-500 italic py-2">
                    No qualifying duels recorded in this category yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {board.entries.map((entry) => (
                      <div
                        key={entry.battleId}
                        className="flex items-center justify-between p-2 rounded bg-black/40 border border-purple-900/30 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 text-center font-pixel text-[10px] ${
                            entry.rank === 1
                              ? 'text-amber-300'
                              : entry.rank === 2
                              ? 'text-gray-300'
                              : entry.rank === 3
                              ? 'text-amber-600'
                              : 'text-gray-500'
                          }`}>
                            {entry.rank <= 3 ? <Medal size={14} className="inline" /> : `#${entry.rank}`}
                          </span>
                          <div>
                            <span className="font-lore text-gray-200">
                              vs {entry.opponentName}
                            </span>
                            <span className="font-pixel text-[8px] text-gray-500 ml-2">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <span className="font-pixel text-[10px] text-amber-300">
                          {entry.formattedValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
