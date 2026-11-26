import { BattleRecord } from './BattleRecord';
import { OffensiveElement, OFFENSIVE_ELEMENTS } from '../spells/types';

// ─── Lifetime Statistics ──────────────────────────────────────────────
export interface LifetimeStatistics {
  totalBattles: number;
  victories: number;
  defeats: number;
  draws: number;
  fled: number;
  abandoned: number;
  winRate: number;        // 0–100
  currentWinStreak: number;
  longestWinStreak: number;
  currentLoseStreak: number;

  // Combat totals
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalHealingPerformed: number;
  totalLifesteal: number;
  totalManaConsumed: number;
  totalSpellsCast: number;
  totalCriticalHits: number;
  totalStatusEffects: number;
  highestSingleHitDamage: number;
  highestSingleBattleDamage: number;

  // Spell usage
  mostUsedSpell: { id: string; name: string; totalCasts: number } | null;
  mostUsedElement: { element: OffensiveElement; totalCasts: number } | null;
  totalElementCounts: Record<OffensiveElement, number>;

  // Adaptive combat
  totalPredictions: number;
  totalCorrectPredictions: number;
  overallPredictionAccuracy: number;
  totalPunishments: number;
  totalStrategyChanges: number;

  // Duration
  totalPlayTimeMs: number;
  averageBattleDurationMs: number;
  averageTurnsPerBattle: number;

  // Phase 9 totals
  totalSuccessfulDodges: number;
  totalPerfectDodges: number;
  totalDamageAvoided: number;
  totalEnemiesDefeated: number;
  totalChargedSpells: number;
  totalEnemiesStaggered: number;

  // Boss records
  bossRecords: Record<string, BossRecord>;
}

export interface BossRecord {
  bossId: string;
  bossName: string;
  encounters: number;
  victories: number;
  defeats: number;
  winRate: number;
  fastestVictoryMs: number | null;
  fewestTurnsVictory: number | null;
  highestDamageDealt: number;
  bestBattleId: string | null;
}

// ─── Build Functions ──────────────────────────────────────────────────

export function rebuildStatisticsFromRecords(records: BattleRecord[]): LifetimeStatistics {
  // Sort by creation time
  const sorted = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const stats: LifetimeStatistics = {
    totalBattles: 0,
    victories: 0,
    defeats: 0,
    draws: 0,
    fled: 0,
    abandoned: 0,
    winRate: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    currentLoseStreak: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    totalHealingPerformed: 0,
    totalLifesteal: 0,
    totalManaConsumed: 0,
    totalSpellsCast: 0,
    totalCriticalHits: 0,
    totalStatusEffects: 0,
    highestSingleHitDamage: 0,
    highestSingleBattleDamage: 0,
    mostUsedSpell: null,
    mostUsedElement: null,
    totalElementCounts: { fire: 0, ice: 0, lightning: 0, arcane: 0, poison: 0 },
    totalPredictions: 0,
    totalCorrectPredictions: 0,
    overallPredictionAccuracy: 0,
    totalPunishments: 0,
    totalStrategyChanges: 0,
    totalPlayTimeMs: 0,
    averageBattleDurationMs: 0,
    averageTurnsPerBattle: 0,
    totalSuccessfulDodges: 0,
    totalPerfectDodges: 0,
    totalDamageAvoided: 0,
    totalEnemiesDefeated: 0,
    totalChargedSpells: 0,
    totalEnemiesStaggered: 0,
    bossRecords: {},
  };

  if (sorted.length === 0) return stats;

  // Aggregate spell counts across all battles
  const globalSpellCounts: Record<string, { name: string; count: number }> = {};
  let winStreak = 0;
  let loseStreak = 0;
  let totalTurns = 0;

  for (const record of sorted) {
    stats.totalBattles += 1;

    // Outcome
    switch (record.outcome) {
      case 'victory': stats.victories += 1; break;
      case 'defeat': stats.defeats += 1; break;
      case 'draw': stats.draws += 1; break;
      case 'fled': stats.fled += 1; break;
      case 'abandoned': stats.abandoned += 1; break;
    }

    // Streaks
    if (record.outcome === 'victory') {
      winStreak += 1;
      loseStreak = 0;
      stats.longestWinStreak = Math.max(stats.longestWinStreak, winStreak);
    } else if (record.outcome === 'defeat') {
      loseStreak += 1;
      winStreak = 0;
    } else {
      winStreak = 0;
      loseStreak = 0;
    }

    // Combat stats
    stats.totalDamageDealt += record.combat.totalDamageDealt;
    stats.totalDamageReceived += record.combat.totalDamageReceived;
    stats.totalHealingPerformed += record.combat.totalHealingPerformed;
    stats.totalLifesteal += record.combat.totalLifesteal;
    stats.totalManaConsumed += record.combat.totalManaConsumed;
    stats.totalSpellsCast += record.combat.totalSpellsCast;
    stats.totalCriticalHits += record.combat.criticalHits;
    stats.totalStatusEffects += record.combat.statusEffectsApplied;
    stats.highestSingleBattleDamage = Math.max(stats.highestSingleBattleDamage, record.combat.totalDamageDealt);

    // Find highest single hit in timeline
    for (const event of record.timeline) {
      if (event.type === 'damage_dealt' && event.value) {
        stats.highestSingleHitDamage = Math.max(stats.highestSingleHitDamage, event.value);
      }
    }

    // Spell usage
    for (const [id, count] of Object.entries(record.spellUsage.spellCastCounts)) {
      if (!globalSpellCounts[id]) {
        // Try to find the name from the record's mostUsedSpell
        const name = record.spellUsage.mostUsedSpell?.id === id
          ? record.spellUsage.mostUsedSpell.name
          : id;
        globalSpellCounts[id] = { name, count: 0 };
      }
      globalSpellCounts[id].count += count;
    }

    for (const el of OFFENSIVE_ELEMENTS) {
      stats.totalElementCounts[el] += record.spellUsage.elementDistribution[el] || 0;
    }

    // Adaptive AI
    stats.totalPredictions += record.adaptiveAI.predictionsMade;
    stats.totalCorrectPredictions += record.adaptiveAI.correctPredictions;
    stats.totalPunishments += record.adaptiveAI.successfulPunishments;
    stats.totalStrategyChanges += record.adaptiveAI.strategyChangesAfterAdaptation;

    // Duration
    stats.totalPlayTimeMs += record.durationMs;
    totalTurns += record.totalTurns;

    // Phase 9 optional advanced telemetry
    if (record.advancedCombat) {
      stats.totalSuccessfulDodges += record.advancedCombat.successfulDodges || 0;
      stats.totalPerfectDodges += record.advancedCombat.perfectDodges || 0;
      stats.totalDamageAvoided += record.advancedCombat.damageAvoided || 0;
      stats.totalEnemiesDefeated += record.advancedCombat.enemiesDefeated || 0;
      stats.totalChargedSpells += record.advancedCombat.chargedSpellsCast || 0;
      stats.totalEnemiesStaggered += record.advancedCombat.enemiesStaggered || 0;
    }

    // Boss records
    const bossKey = record.bossId || record.opponentId;
    if (!stats.bossRecords[bossKey]) {
      stats.bossRecords[bossKey] = {
        bossId: bossKey,
        bossName: record.bossName || record.opponentName,
        encounters: 0,
        victories: 0,
        defeats: 0,
        winRate: 0,
        fastestVictoryMs: null,
        fewestTurnsVictory: null,
        highestDamageDealt: 0,
        bestBattleId: null,
      };
    }

    const br = stats.bossRecords[bossKey];
    br.encounters += 1;
    if (record.outcome === 'victory') {
      br.victories += 1;
      if (br.fastestVictoryMs === null || record.durationMs < br.fastestVictoryMs) {
        br.fastestVictoryMs = record.durationMs;
      }
      if (br.fewestTurnsVictory === null || record.totalTurns < br.fewestTurnsVictory) {
        br.fewestTurnsVictory = record.totalTurns;
      }
    } else if (record.outcome === 'defeat') {
      br.defeats += 1;
    }
    if (record.combat.totalDamageDealt > br.highestDamageDealt) {
      br.highestDamageDealt = record.combat.totalDamageDealt;
      br.bestBattleId = record.id;
    }
    br.winRate = br.encounters > 0 ? Math.round((br.victories / br.encounters) * 100) : 0;
  }

  // Final stats
  stats.currentWinStreak = winStreak;
  stats.currentLoseStreak = loseStreak;
  stats.winRate = stats.totalBattles > 0
    ? Math.round((stats.victories / stats.totalBattles) * 100)
    : 0;
  stats.overallPredictionAccuracy = stats.totalPredictions > 0
    ? Math.round((stats.totalCorrectPredictions / stats.totalPredictions) * 100)
    : 0;
  stats.averageBattleDurationMs = stats.totalBattles > 0
    ? Math.round(stats.totalPlayTimeMs / stats.totalBattles)
    : 0;
  stats.averageTurnsPerBattle = stats.totalBattles > 0
    ? Math.round((totalTurns / stats.totalBattles) * 10) / 10
    : 0;

  // Most used spell
  let topSpell: LifetimeStatistics['mostUsedSpell'] = null;
  for (const [id, data] of Object.entries(globalSpellCounts)) {
    if (!topSpell || data.count > topSpell.totalCasts) {
      topSpell = { id, name: data.name, totalCasts: data.count };
    }
  }
  stats.mostUsedSpell = topSpell;

  // Most used element
  let topEl: LifetimeStatistics['mostUsedElement'] = null;
  for (const el of OFFENSIVE_ELEMENTS) {
    if (stats.totalElementCounts[el] > 0 && (!topEl || stats.totalElementCounts[el] > topEl.totalCasts)) {
      topEl = { element: el, totalCasts: stats.totalElementCounts[el] };
    }
  }
  stats.mostUsedElement = topEl;

  return stats;
}
