import { useState } from 'react';
import { BattleRecord } from '../history/BattleRecord';
import { OFFENSIVE_ELEMENTS } from '../spells/types';
import { BattleTimeline } from './BattleTimeline';
import { X, Trophy, Skull, Swords, Brain, Clock, Sparkles, History, Shield } from 'lucide-react';
import { soundEngine } from '../voice/soundEngine';

interface BattleRecordDetailsProps {
  record: BattleRecord;
  onClose: () => void;
}

export function BattleRecordDetails({ record, onClose }: BattleRecordDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'adaptive' | 'advanced' | 'timeline'>('overview');
  const isVictory = record.outcome === 'victory';

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="pixel-box-gold w-[680px] max-w-[96%] max-h-[90vh] flex flex-col p-5 relative">
        {/* Close */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer p-1"
          aria-label="Close battle report"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            isVictory
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-red-950/50 border-red-600 text-red-400'
          }`}>
            {isVictory ? <Trophy size={20} /> : <Skull size={20} />}
          </div>
          <div>
            <h2 className="font-pixel text-sm sm:text-base text-amber-300 uppercase">
              {record.outcome} VS {record.opponentName}
            </h2>
            <p className="font-pixel text-[9px] text-gray-400 mt-0.5">
              {new Date(record.createdAt).toLocaleString()} • {record.totalTurns} Turns • {(record.durationMs / 1000).toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-purple-900/60 pb-2 font-pixel text-[10px]">
          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setActiveTab('overview'); }}
            className={`px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'overview'
                ? 'bg-purple-800/80 text-amber-300 border border-amber-500/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Swords size={12} /> COMBAT
          </button>
          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setActiveTab('adaptive'); }}
            className={`px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'adaptive'
                ? 'bg-purple-800/80 text-amber-300 border border-amber-500/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Brain size={12} /> ADAPTIVE AI
          </button>
          {record.advancedCombat && (
            <button
              type="button"
              onClick={() => { soundEngine.playClick(); setActiveTab('advanced'); }}
              className={`px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 transition ${
                activeTab === 'advanced'
                  ? 'bg-purple-800/80 text-amber-300 border border-amber-500/50'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shield size={12} /> TACTICAL
            </button>
          )}
          <button
            type="button"
            onClick={() => { soundEngine.playClick(); setActiveTab('timeline'); }}
            className={`px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'timeline'
                ? 'bg-purple-800/80 text-amber-300 border border-amber-500/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <History size={12} /> TIMELINE ({record.timeline.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-pixel text-[10px]">
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">DMG DEALT</span>
                  <span className="text-amber-300 text-xs">{record.combat.totalDamageDealt}</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">DMG RECEIVED</span>
                  <span className="text-red-400 text-xs">{record.combat.totalDamageReceived}</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">HEALING DONE</span>
                  <span className="text-emerald-400 text-xs">{record.combat.totalHealingPerformed}</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">CRITICAL HITS</span>
                  <span className="text-yellow-300 text-xs">{record.combat.criticalHits}</span>
                </div>
              </div>

              {/* Spell & Resource Stats */}
              <div className="p-3 rounded bg-[#110a20] border border-purple-900/50 space-y-2">
                <h3 className="font-pixel text-[10px] text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={12} /> SPELLCRAFT & RESOURCES
                </h3>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs font-lore text-gray-300">
                  <div>Spells Cast: <span className="text-white">{record.combat.totalSpellsCast}</span></div>
                  <div>Mana Consumed: <span className="text-sky-300">{record.combat.totalManaConsumed}</span></div>
                  <div>Defensive Actions: <span className="text-sky-300">{record.spellUsage.defensiveActions}</span></div>
                  <div>Unique Spells: <span className="text-purple-300">{record.spellUsage.uniqueSpellsUsed}</span></div>
                  <div>
                    Favorite Spell:{' '}
                    <span className="text-amber-300">
                      {record.spellUsage.mostUsedSpell
                        ? `${record.spellUsage.mostUsedSpell.name} (${record.spellUsage.mostUsedSpell.count})`
                        : 'None'}
                    </span>
                  </div>
                  <div>
                    Top Element:{' '}
                    <span className="text-amber-300 uppercase">
                      {record.spellUsage.mostUsedElement
                        ? `${record.spellUsage.mostUsedElement.element} (${record.spellUsage.mostUsedElement.count})`
                        : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Element Distribution */}
              <div className="p-3 rounded bg-[#110a20] border border-purple-900/50">
                <h3 className="font-pixel text-[10px] text-purple-300 mb-2">ELEMENT DISTRIBUTION</h3>
                <div className="grid grid-cols-5 gap-2 text-center font-pixel text-[9px]">
                  {OFFENSIVE_ELEMENTS.map((el) => (
                    <div key={el} className="p-2 rounded bg-black/40 border border-purple-900/40">
                      <div className="text-gray-400 uppercase mb-1">{el}</div>
                      <div className="text-amber-300 text-xs">{record.spellUsage.elementDistribution[el] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards */}
              <div className="p-3 rounded bg-amber-950/20 border border-amber-700/40 flex items-center justify-between font-pixel text-[10px]">
                <span className="text-amber-200 flex items-center gap-1.5">
                  <Clock size={12} /> REWARDS EXTRACTED
                </span>
                <div className="flex gap-4">
                  <span className="text-amber-300">+{record.progression.xpEarned} XP</span>
                  <span className="text-yellow-400">+{record.progression.goldEarned} GOLD</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'adaptive' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-pixel text-[10px]">
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">PREDICTIONS MADE</span>
                  <span className="text-indigo-300 text-xs">{record.adaptiveAI.predictionsMade}</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">ENEMY ACCURACY</span>
                  <span className="text-amber-300 text-xs">{record.adaptiveAI.predictionAccuracy}%</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">PUNISHMENTS</span>
                  <span className="text-red-400 text-xs">{record.adaptiveAI.successfulPunishments}</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">CORRECT / MISSED</span>
                  <span className="text-gray-200 text-xs">
                    {record.adaptiveAI.correctPredictions} / {record.adaptiveAI.incorrectPredictions}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">ADAPTATIONS</span>
                  <span className="text-purple-300 text-xs">{record.adaptiveAI.timesEnemyAdapted}</span>
                </div>
                <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                  <span className="text-gray-400 block text-[8px] mb-1">STRATEGY SHIFTS</span>
                  <span className="text-emerald-300 text-xs">{record.adaptiveAI.strategyChangesAfterAdaptation}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-[#110a20] border border-purple-900/50">
                <h3 className="font-pixel text-[10px] text-purple-300 mb-2">PEAK ENEMY RESISTANCES</h3>
                <div className="space-y-2">
                  {OFFENSIVE_ELEMENTS.map((el) => {
                    const pct = Math.round((record.adaptiveAI.maxResistanceReached[el] || 0) * 100);
                    return (
                      <div key={el} className="flex items-center gap-3 text-[10px] font-pixel">
                        <span className="w-20 uppercase text-gray-300">{el}</span>
                        <div className="flex-1 h-2.5 bg-black/60 rounded overflow-hidden border border-purple-900/40">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-amber-400"
                            style={{ width: `${Math.min(100, (pct / 45) * 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-amber-300">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && record.advancedCombat && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-pixel text-[10px]">
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">DODGES</span>
                <span className="text-sky-300 text-xs">
                  {record.advancedCombat.successfulDodges} / {record.advancedCombat.dodgeAttempts}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">PERFECT DODGES</span>
                <span className="text-amber-300 text-xs">{record.advancedCombat.perfectDodges}</span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">DMG AVOIDED</span>
                <span className="text-emerald-300 text-xs">{record.advancedCombat.damageAvoided}</span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">CHARGED SPELLS</span>
                <span className="text-purple-300 text-xs">{record.advancedCombat.chargedSpellsCast}</span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">STAGGERS</span>
                <span className="text-yellow-300 text-xs">{record.advancedCombat.enemiesStaggered}</span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">ENEMIES SLAIN</span>
                <span className="text-rose-300 text-xs">
                  {record.advancedCombat.enemiesDefeated} / {record.advancedCombat.totalEnemies}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">VOICE CASTS</span>
                <span className="text-sky-200 text-xs">
                  {record.advancedCombat.voiceCasts} ({record.advancedCombat.voiceFailures} failed)
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">LANE SHIFTS</span>
                <span className="text-gray-200 text-xs">{record.advancedCombat.laneChanges}</span>
              </div>
              <div className="p-2.5 rounded bg-[#110a20] border border-purple-900/50">
                <span className="text-gray-400 block text-[8px] mb-1">POSTURE DMG</span>
                <span className="text-amber-200 text-xs">{record.advancedCombat.postureDamageDealt}</span>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <BattleTimeline events={record.timeline} />
          )}
        </div>
      </div>
    </div>
  );
}
