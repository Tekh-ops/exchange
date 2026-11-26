import { describe, it, expect } from 'vitest';
import { LeaderboardEngine } from '../history/LeaderboardEngine';
import { BattleRecord, BATTLE_RECORD_SCHEMA_VERSION } from '../history/BattleRecord';

function mockBattle(
  id: string,
  createdAt: string,
  durationMs: number,
  damage: number,
  outcome: BattleRecord['outcome'] = 'victory'
): BattleRecord {
  return {
    id,
    schemaVersion: BATTLE_RECORD_SCHEMA_VERSION,
    createdAt,
    gameMode: 'duel',
    opponentName: 'Arch-Mage Malakor',
    opponentId: 'malakor',
    durationMs,
    totalTurns: Math.max(1, Math.floor(durationMs / 2000)),
    outcome,
    combat: {
      totalDamageDealt: damage,
      totalDamageReceived: 20,
      totalHealingPerformed: 10,
      totalLifesteal: 0,
      totalManaConsumed: 30,
      totalSpellsCast: 3,
      successfulAttacks: 3,
      blockedOrCounteredAttacks: 0,
      criticalHits: 2,
      statusEffectsApplied: 0,
    },
    spellUsage: {
      spellCastCounts: {},
      elementDistribution: { fire: 1, ice: 1, lightning: 1, arcane: 0, poison: 0 },
      mostUsedSpell: null,
      mostUsedElement: null,
      uniqueSpellsUsed: 3,
      defensiveActions: 0,
    },
    adaptiveAI: {
      predictionsMade: 3,
      correctPredictions: 1,
      incorrectPredictions: 2,
      predictionAccuracy: 33,
      maxResistanceReached: { fire: 0, ice: 0, lightning: 0, arcane: 0, poison: 0 },
      timesEnemyAdapted: 0,
      successfulPunishments: 0,
      strategyChangesAfterAdaptation: 1,
    },
    progression: {
      xpEarned: 60,
      goldEarned: 35,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    },
    timeline: [],
  };
}

describe('LeaderboardEngine', () => {
  it('ranks fastest victories ascending and excludes defeats', () => {
    const records = [
      mockBattle('slow', '2026-01-01T10:00:00Z', 20000, 160, 'victory'),
      mockBattle('fast', '2026-01-01T10:05:00Z', 5000, 160, 'victory'),
      mockBattle('defeat-fast', '2026-01-01T10:10:00Z', 2000, 50, 'defeat'),
    ];

    const board = LeaderboardEngine.buildLeaderboard(records, 'fastest_victory');
    expect(board.entries).toHaveLength(2);
    expect(board.entries[0].battleId).toBe('fast');
    expect(board.entries[0].rank).toBe(1);
    expect(board.entries[1].battleId).toBe('slow');
  });

  it('applies deterministic tie-breaking by earlier date then battleId', () => {
    const records = [
      mockBattle('b-later', '2026-01-02T10:00:00Z', 10000, 200, 'victory'),
      mockBattle('b-earlier', '2026-01-01T10:00:00Z', 10000, 200, 'victory'),
    ];

    const board = LeaderboardEngine.buildLeaderboard(records, 'highest_damage');
    expect(board.entries[0].battleId).toBe('b-earlier');
    expect(board.entries[1].battleId).toBe('b-later');
  });

  it('detects new #1 personal records accurately', () => {
    const existing = [
      mockBattle('old', '2026-01-01T10:00:00Z', 12000, 160, 'victory'),
    ];
    const newcomer = mockBattle('new-best', '2026-01-02T10:00:00Z', 4000, 250, 'victory');

    const broken = LeaderboardEngine.checkNewRecords(newcomer, existing);
    const fastest = broken.find((b) => b.category === 'fastest_victory');
    const highestDmg = broken.find((b) => b.category === 'highest_damage');

    expect(fastest?.newRank).toBe(1);
    expect(highestDmg?.newRank).toBe(1);
  });
});
