import { useState, useEffect } from 'react';
import { getBattleHistoryRepository } from '../history/BattleHistoryRepository';
import { rebuildStatisticsFromRecords, LifetimeStatistics } from '../history/BattleStatistics';
import { OFFENSIVE_ELEMENTS } from '../spells/types';
import { soundEngine } from '../voice/soundEngine';
import { X, BarChart3, RefreshCw, Swords, Brain, Trophy, Sparkles } from 'lucide-react';

interface PlayerStatisticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerStatistics({ isOpen, onClose }: PlayerStatisticsProps) {
  const [stats, setStats] = useState<LifetimeStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  const computeStats = async () => {
    setLoading(true);
    try {
      const records = await getBattleHistoryRepository().getAllRecords();
      setStats(rebuildStatisticsFromRecords(records));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      computeStats();
    }
  }, [isOpen]);

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
          aria-label="Close statistics"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-between mb-4 pr-8">
          <h2 className="font-pixel text-base text-amber-300 flex items-center gap-2">
            <BarChart3 size={18} /> LIFETIME STATISTICS
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              computeStats();
            }}
            className="pixel-btn px-2.5 py-1 font-pixel text-[9px] flex items-center gap-1 text-purple-200 cursor-pointer"
          >
            <RefreshCw size={11} /> REBUILD
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading || !stats ? (
            <div className="py-16 text-center font-pixel text-xs text-gray-400">
              COMPUTING ARCHIVAL TOTALS...
            </div>
          ) : stats.totalBattles === 0 ? (
            <div className="py-16 text-center space-y-2">
              <BarChart3 size={32} className="mx-auto text-purple-700/60" />
              <p className="font-pixel text-xs text-gray-400">NO COMBAT DATA YET</p>
              <p className="font-lore text-sm text-gray-500 italic">
                Fight your first duel to begin tracking lifetime sorcery metrics.
              </p>
            </div>
          ) : (
            <>
              {/* Overall Record */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-pixel text-[10px]">
                <div className="p-3 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">BATTLES</span>
                  <span className="text-white text-sm">{stats.totalBattles}</span>
                </div>
                <div className="p-3 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">WIN RATE</span>
                  <span className="text-amber-300 text-sm">{stats.winRate}%</span>
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    {stats.victories}W / {stats.defeats}L
                  </span>
                </div>
                <div className="p-3 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">WIN STREAK</span>
                  <span className="text-emerald-400 text-sm">{stats.currentWinStreak}</span>
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    BEST: {stats.longestWinStreak}
                  </span>
                </div>
                <div className="p-3 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">AVG DURATION</span>
                  <span className="text-purple-300 text-sm">
                    {(stats.averageBattleDurationMs / 1000).toFixed(1)}s
                  </span>
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    {stats.averageTurnsPerBattle} TURNS
                  </span>
                </div>
              </div>

              {/* Combat Totals */}
              <div className="p-3.5 rounded bg-[#110a20] border border-purple-900/50">
                <h3 className="font-pixel text-[10px] text-amber-300 mb-2.5 flex items-center gap-1.5">
                  <Swords size={12} /> COMBAT TOTALS
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-lore text-gray-300">
                  <div>Total DMG Dealt: <span className="text-amber-300">{stats.totalDamageDealt}</span></div>
                  <div>Total DMG Taken: <span className="text-red-400">{stats.totalDamageReceived}</span></div>
                  <div>Total Healing: <span className="text-emerald-400">{stats.totalHealingPerformed}</span></div>
                  <div>Spells Cast: <span className="text-purple-300">{stats.totalSpellsCast}</span></div>
                  <div>Critical Hits: <span className="text-yellow-300">{stats.totalCriticalHits}</span></div>
                  <div>Highest Hit: <span className="text-amber-300">{stats.highestSingleHitDamage}</span></div>
                </div>
              </div>

              {/* Spell & Element Affinity */}
              <div className="p-3.5 rounded bg-[#110a20] border border-purple-900/50">
                <h3 className="font-pixel text-[10px] text-purple-300 mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={12} /> SPELL & ELEMENT AFFINITY
                </h3>
                <div className="flex flex-wrap gap-4 text-xs font-lore text-gray-300 mb-3">
                  <div>
                    Signature Spell:{' '}
                    <span className="text-amber-300">
                      {stats.mostUsedSpell
                        ? `${stats.mostUsedSpell.name} (${stats.mostUsedSpell.totalCasts})`
                        : 'None'}
                    </span>
                  </div>
                  <div>
                    Favorite Element:{' '}
                    <span className="text-amber-300 uppercase">
                      {stats.mostUsedElement
                        ? `${stats.mostUsedElement.element} (${stats.mostUsedElement.totalCasts})`
                        : 'None'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center font-pixel text-[9px]">
                  {OFFENSIVE_ELEMENTS.map((el) => (
                    <div key={el} className="p-2 rounded bg-black/40 border border-purple-900/40">
                      <div className="text-gray-400 uppercase mb-1">{el}</div>
                      <div className="text-purple-200 text-xs">{stats.totalElementCounts[el]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adaptive Combat Stats */}
              <div className="p-3.5 rounded bg-[#110a20] border border-purple-900/50">
                <h3 className="font-pixel text-[10px] text-indigo-300 mb-2.5 flex items-center gap-1.5">
                  <Brain size={12} /> ADAPTIVE RIVAL TELEMETRY
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-lore text-gray-300">
                  <div>Enemy Predictions: <span className="text-white">{stats.totalPredictions}</span></div>
                  <div>Enemy Accuracy: <span className="text-amber-300">{stats.overallPredictionAccuracy}%</span></div>
                  <div>Punishments Taken: <span className="text-red-400">{stats.totalPunishments}</span></div>
                  <div>Strategy Shifts: <span className="text-emerald-300">{stats.totalStrategyChanges}</span></div>
                  <div>Total Dodges: <span className="text-sky-300">{stats.totalSuccessfulDodges}</span></div>
                  <div>Perfect Dodges: <span className="text-amber-300">{stats.totalPerfectDodges}</span></div>
                  <div>DMG Avoided: <span className="text-emerald-300">{stats.totalDamageAvoided}</span></div>
                  <div>Staggers / Charged: <span className="text-yellow-300">{stats.totalEnemiesStaggered} / {stats.totalChargedSpells}</span></div>
                </div>
              </div>

              {/* Boss Records */}
              {Object.values(stats.bossRecords).length > 0 && (
                <div className="p-3.5 rounded bg-[#110a20] border border-purple-900/50">
                  <h3 className="font-pixel text-[10px] text-amber-300 mb-2.5 flex items-center gap-1.5">
                    <Trophy size={12} /> BOSS RECORDS
                  </h3>
                  <div className="space-y-2">
                    {Object.values(stats.bossRecords).map((br) => (
                      <div
                        key={br.bossId}
                        className="p-2.5 rounded bg-black/40 border border-purple-900/40 flex flex-wrap items-center justify-between gap-2 text-xs font-lore"
                      >
                        <div>
                          <span className="text-amber-200 font-semibold">{br.bossName}</span>
                          <span className="text-gray-400 ml-2">
                            ({br.victories}W - {br.defeats}L, {br.winRate}%)
                          </span>
                        </div>
                        <div className="flex gap-3 font-pixel text-[9px] text-gray-300">
                          <span>
                            FASTEST: {br.fastestVictoryMs !== null ? `${(br.fastestVictoryMs / 1000).toFixed(1)}s` : '—'}
                          </span>
                          <span>
                            FEWEST TURNS: {br.fewestTurnsVictory ?? '—'}
                          </span>
                          <span className="text-amber-300">MAX DMG: {br.highestDamageDealt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
