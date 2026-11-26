import { describe, it, expect } from 'vitest';
import { rebuildStatisticsFromRecords } from '../history/BattleStatistics';
import { BattleRecord, BATTLE_RECORD_SCHEMA_VERSION } from '../history/BattleRecord';

function createMockRecord(
  id: string,
  outcome: BattleRecord['outcome'],
  createdAt: string,
  overrides: Partial<BattleRecord> = {}
): BattleRecord {
  return {
    id,
    schemaVersion: BATTLE_RECORD_SCHEMA_VERSION,
    createdAt,
    gameMode: 'duel',
    opponentName: 'Arch-Mage Malakor',
    opponentId: 'malakor',
    bossName: 'Arch-Mage Malakor',
    bossId: 'malakor',
    durationMs: 10000,
    totalTurns: 5,
    outcome,
    combat: {
      totalDamageDealt: 100,
      totalDamageReceived: 40,
      totalHealingPerformed: 20,
      totalLifesteal: 10,
      totalManaConsumed: 50,
      totalSpellsCast: 4,
      successfulAttacks: 4,
      blockedOrCounteredAttacks: 0,
      criticalHits: 1,
      statusEffectsApplied: 0,
    },
    spellUsage: {
      spellCastCounts: { arcane_dart: 4 },
      elementDistribution: { fire: 0, ice: 0, lightning: 0, arcane: 4, poison: 0 },
      mostUsedSpell: { id: 'arcane_dart', name: 'Arcane Dart', count: 4 },
      mostUsedElement: { element: 'arcane', count: 4 },
      uniqueSpellsUsed: 1,
      defensiveActions: 0,
    },
    adaptiveAI: {
      predictionsMade: 4,
      correctPredictions: 2,
      incorrectPredictions: 2,
      predictionAccuracy: 50,
      maxResistanceReached: { fire: 0, ice: 0, lightning: 0, arcane: 0.25, poison: 0 },
      timesEnemyAdapted: 1,
      successfulPunishments: 1,
      strategyChangesAfterAdaptation: 1,
    },
    progression: {
      xpEarned: outcome === 'victory' ? 60 : 0,
      goldEarned: outcome === 'victory' ? 35 : 0,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    },
    timeline: [
      { timestamp: 1000, turn: 1, type: 'damage_dealt', actor: 'player', description: 'Hit', value: 42 },
    ],
    ...overrides,
  };
}

describe('BattleStatistics', () => {
  it('handles empty record arrays gracefully', () => {
    const stats = rebuildStatisticsFromRecords([]);
    expect(stats.totalBattles).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.mostUsedSpell).toBeNull();
    expect(stats.mostUsedElement).toBeNull();
  });

  it('calculates lifetime totals, win rates, and streaks accurately', () => {
    const records: BattleRecord[] = [
      createMockRecord('b1', 'victory', '2026-01-01T10:00:00Z'),
      createMockRecord('b2', 'victory', '2026-01-01T10:05:00Z'),
      createMockRecord('b3', 'defeat', '2026-01-01T10:10:00Z'),
      createMockRecord('b4', 'victory', '2026-01-01T10:15:00Z', {
        durationMs: 6000,
        totalTurns: 3,
        timeline: [{ timestamp: 500, turn: 1, type: 'damage_dealt', actor: 'player', description: 'Crit', value: 88 }],
      }),
    ];

    const stats = rebuildStatisticsFromRecords(records);

    expect(stats.totalBattles).toBe(4);
    expect(stats.victories).toBe(3);
    expect(stats.defeats).toBe(1);
    expect(stats.winRate).toBe(75);
    expect(stats.longestWinStreak).toBe(2);
    expect(stats.currentWinStreak).toBe(1);
    expect(stats.totalDamageDealt).toBe(400);
    expect(stats.highestSingleHitDamage).toBe(88);
    expect(stats.mostUsedElement?.element).toBe('arcane');
    expect(stats.mostUsedElement?.totalCasts).toBe(16);
    expect(stats.overallPredictionAccuracy).toBe(50);

    // Boss record check
    const malakor = stats.bossRecords['malakor'];
    expect(malakor).toBeDefined();
    expect(malakor.encounters).toBe(4);
    expect(malakor.fastestVictoryMs).toBe(6000);
    expect(malakor.fewestTurnsVictory).toBe(3);
  });
});
