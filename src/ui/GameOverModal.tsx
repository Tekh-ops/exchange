import { useCombatStore } from '../stores/combatStore';
import { usePlayerStore, EncounterRewardClaimResult } from '../stores/playerStore';
import { useGameStore } from '../stores/gameStore';
import { soundEngine } from '../voice/soundEngine';
import { VICTORY_BANTER, DEFEAT_BANTER } from '../dialogue/banterData';
import { getBattleHistoryRepository } from '../history/BattleHistoryRepository';
import { LeaderboardEngine } from '../history/LeaderboardEngine';
import { calculateBattleXp } from '../progression/progressionRules';
import { BattleRecordDetails } from './BattleRecordDetails';
import { BattleChronicle } from './BattleChronicle';
import { Trophy, Skull, RotateCcw, Home, FileText, Scroll, Award, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameOverModalProps {
  onRestart: () => void;
}

export function GameOverModal({ onRestart }: GameOverModalProps) {
  const { turnPhase, lastBattleRecord, activeEncounter, enemies } = useCombatStore();
  const { claimEncounterRewards, progression } = usePlayerStore();
  const { setScene } = useGameStore();

  const [claimResult, setClaimResult] = useState<EncounterRewardClaimResult | null>(null);
  const [flavorQuote, setFlavorQuote] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [newRecords, setNewRecords] = useState<string[]>([]);

  const isVictory = turnPhase === 'victory';
  const isDefeat = turnPhase === 'defeat';

  useEffect(() => {
    if ((isVictory || isDefeat) && lastBattleRecord && !claimResult) {
      const bossId = activeEncounter.enemies.find((e) => e.isBoss)?.bossId;
      const isFirstBoss = Boolean(
        isVictory && bossId && !progression.firstBossVictories.includes(bossId)
      );
      const xpEarned = calculateBattleXp({
        outcome: lastBattleRecord.outcome,
        baseEncounterXp: activeEncounter.rewards.xp,
        difficulty: activeEncounter.difficulty,
        enemiesDefeated:
          lastBattleRecord.advancedCombat?.enemiesDefeated ??
          enemies.filter((e) => e.entity.hp <= 0).length,
        totalEnemies: lastBattleRecord.advancedCombat?.totalEnemies ?? enemies.length,
        damageDealt: lastBattleRecord.combat.totalDamageDealt,
        dodgesSucceeded: lastBattleRecord.advancedCombat?.successfulDodges ?? 0,
        staggersTriggered: lastBattleRecord.advancedCombat?.enemiesStaggered ?? 0,
        isFirstBossVictory: isFirstBoss,
        bossFirstVictoryBonusXp: activeEncounter.firstVictoryRewards?.xp,
      });

      const goldEarned = isVictory
        ? activeEncounter.rewards.gold +
          (isFirstBoss ? activeEncounter.firstVictoryRewards?.gold ?? 0 : 0)
        : 0;

      const res = claimEncounterRewards({
        battleId: lastBattleRecord.id,
        encounterId: activeEncounter.id,
        outcome: lastBattleRecord.outcome,
        xpEarned,
        goldEarned,
        bossId,
      });
      setClaimResult(res);
      if (res.leveledUp) {
        soundEngine.playLevelUp();
      }

      if (isVictory) {
        const rand = VICTORY_BANTER[Math.floor(Math.random() * VICTORY_BANTER.length)];
        setFlavorQuote(rand);
      } else {
        const rand = DEFEAT_BANTER[Math.floor(Math.random() * DEFEAT_BANTER.length)];
        setFlavorQuote(rand);
      }
    }
  }, [
    isVictory,
    isDefeat,
    lastBattleRecord,
    claimResult,
    activeEncounter,
    enemies,
    progression.firstBossVictories,
    claimEncounterRewards,
  ]);

  useEffect(() => {
    if (lastBattleRecord) {
      getBattleHistoryRepository()
        .getAllRecords()
        .then((all) => {
          const prior = all.filter((r) => r.id !== lastBattleRecord.id);
          const broken = LeaderboardEngine.checkNewRecords(lastBattleRecord, prior);
          const firstPlace = broken
            .filter((b) => b.newRank === 1)
            .map((b) => b.category.replace(/_/g, ' ').toUpperCase());
          setNewRecords(firstPlace);
        })
        .catch(() => {});
    }
  }, [lastBattleRecord]);

  if (!isVictory && !isDefeat) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-[520px] max-w-[96%] max-h-[92vh] overflow-y-auto p-6 text-center ${
          isVictory ? 'pixel-box-gold' : 'pixel-box border-red-700/80'
        } animate-in zoom-in-95`}
      >
        <div className="flex justify-center mb-3">
          {isVictory ? (
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
              <Trophy size={28} />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-red-950/40 border-2 border-red-500 flex items-center justify-center text-red-400">
              <Skull size={28} />
            </div>
          )}
        </div>

        <h2 className={`font-pixel text-xl mb-1 ${isVictory ? 'text-amber-300' : 'text-red-400'}`}>
          {isVictory ? 'PETTY TRIUMPH!' : 'OUT-PETTIED!'}
        </h2>
        <p className="text-xs font-pixel text-gray-400 mb-3">
          {isVictory
            ? `${activeEncounter.name} has been vanquished`
            : `You were humbled by ${activeEncounter.name}`}
        </p>

        {/* Level Up Celebration Banner */}
        {claimResult?.leveledUp && (
          <div className="mb-3 p-3 rounded bg-gradient-to-r from-purple-900/80 to-amber-900/50 border-2 border-amber-400 text-left animate-pulse">
            <div className="font-pixel text-xs text-amber-300 flex items-center gap-1.5 mb-1">
              <Sparkles size={14} /> LEVEL UP! LVL {claimResult.levelSummary.previousLevel} → LVL{' '}
              {claimResult.levelSummary.newLevel}
            </div>
            <div className="font-lore text-xs text-purple-100 space-y-0.5">
              <div>• +{claimResult.levelSummary.attributePointsEarned} Attribute Points earned</div>
              {claimResult.levelSummary.unlockedSpells.length > 0 && (
                <div>• Unlocked Spells: {claimResult.levelSummary.unlockedSpells.join(', ')}</div>
              )}
              {claimResult.levelSummary.unlockedEquipment.length > 0 && (
                <div>
                  • Unlocked Gear: {claimResult.levelSummary.unlockedEquipment.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vorath / Boss First Victory Rewards */}
        {claimResult?.isFirstBossVictory && (
          <div className="mb-3 p-2.5 rounded bg-amber-500/15 border border-amber-400/70 font-pixel text-[9px] text-amber-200">
            👑 FIRST BOSS VICTORY BONUS UNLOCKED!
            {claimResult.unlockedBossSpells.length > 0 &&
              ` Spell: ${claimResult.unlockedBossSpells.join(', ')}`}
            {claimResult.unlockedBossItems.length > 0 &&
              ` • Gear: ${claimResult.unlockedBossItems.join(', ')}`}
          </div>
        )}

        {newRecords.length > 0 && (
          <div className="mb-3 p-2 rounded bg-amber-500/15 border border-amber-400/60 flex items-center justify-center gap-2 font-pixel text-[9px] text-amber-300">
            <Award size={14} />
            <span>NEW PERSONAL RECORD: {newRecords[0]}</span>
          </div>
        )}

        <div className="p-3 bg-purple-950/60 rounded border border-purple-800/50 mb-4 font-lore text-sm italic text-purple-200">
          "{flavorQuote}"
        </div>

        {lastBattleRecord && (
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#100a1d] rounded border border-purple-900/50 mb-4 font-pixel text-[9px]">
            <div>
              <span className="text-gray-500 block text-[8px]">DURATION</span>
              <span className="text-gray-200">{(lastBattleRecord.durationMs / 1000).toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[8px]">TURNS</span>
              <span className="text-gray-200">{lastBattleRecord.totalTurns}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[8px]">SPELLS CAST</span>
              <span className="text-purple-300">{lastBattleRecord.combat.totalSpellsCast}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[8px]">DMG DEALT</span>
              <span className="text-amber-300">{lastBattleRecord.combat.totalDamageDealt}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[8px]">DMG TAKEN</span>
              <span className="text-red-400">{lastBattleRecord.combat.totalDamageReceived}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[8px]">HEALING</span>
              <span className="text-emerald-400">{lastBattleRecord.combat.totalHealingPerformed}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 p-3 bg-amber-950/30 rounded border border-amber-600/40 mb-5 font-pixel text-[11px]">
          <div className="text-left">
            <span className="text-gray-400 block text-[9px]">EXPERIENCE GAINED</span>
            <span className="text-amber-300">+{claimResult?.xpEarned ?? 0} XP</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 block text-[9px]">LOOT EXTRACTED</span>
            <span className="text-amber-300">+{claimResult?.goldEarned ?? 0} GOLD</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-amber-900/40 text-left text-[10px] text-gray-300">
            LEVEL: <span className="text-purple-300">{progression.level}</span> ({progression.currentXp}/
            {progression.xpToNextLevel || 'MAX'} XP)
          </div>
        </div>

        <div className="flex flex-col gap-2 font-pixel text-xs">
          {lastBattleRecord && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setReportOpen(true);
                }}
                className="pixel-btn py-2.5 px-3 flex items-center justify-center gap-1.5 text-[10px] text-amber-300 cursor-pointer hover:scale-105 active:scale-95"
              >
                <FileText size={14} />
                <span>BATTLE REPORT</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setChronicleOpen(true);
                }}
                className="pixel-btn py-2.5 px-3 flex items-center justify-center gap-1.5 text-[10px] text-purple-200 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Scroll size={14} />
                <span>CHRONICLE</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setClaimResult(null);
              onRestart();
            }}
            className="pixel-btn py-3 px-4 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <RotateCcw size={16} />
            <span>{isVictory ? 'DUEL AGAIN' : 'DEMAND REMATCH'}</span>
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

      {reportOpen && lastBattleRecord && (
        <BattleRecordDetails record={lastBattleRecord} onClose={() => setReportOpen(false)} />
      )}

      <BattleChronicle isOpen={chronicleOpen} onClose={() => setChronicleOpen(false)} />
    </div>
  );
}
