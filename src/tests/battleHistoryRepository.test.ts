import { describe, it, expect, beforeEach } from 'vitest';
import { BattleHistoryRepository } from '../history/BattleHistoryRepository';
import { BattleRecord, BATTLE_RECORD_SCHEMA_VERSION } from '../history/BattleRecord';
import { BossPersistenceManager } from '../ai/BossPersistence';

function makeRecord(overrides: Partial<BattleRecord> = {}): BattleRecord {
  return {
    id: `battle-${Math.random().toString(36).slice(2, 8)}`,
    schemaVersion: BATTLE_RECORD_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    gameMode: 'duel',
    opponentName: 'Arch-Mage Malakor',
    opponentId: 'malakor',
    bossName: 'Arch-Mage Malakor',
    bossId: 'malakor',
    durationMs: 12000,
    totalTurns: 4,
    outcome: 'victory',
    combat: {
      totalDamageDealt: 165,
      totalDamageReceived: 45,
      totalHealingPerformed: 16,
      totalLifesteal: 16,
      totalManaConsumed: 70,
      totalSpellsCast: 5,
      successfulAttacks: 4,
      blockedOrCounteredAttacks: 1,
      criticalHits: 1,
      statusEffectsApplied: 1,
    },
    spellUsage: {
      spellCastCounts: { petty_spark: 2, pyro_tantrum: 2 },
      elementDistribution: { fire: 2, ice: 0, lightning: 2, arcane: 0, poison: 0 },
      mostUsedSpell: { id: 'pyro_tantrum', name: "Sorcerer's Tantrum", count: 2 },
      mostUsedElement: { element: 'fire', count: 2 },
      uniqueSpellsUsed: 2,
      defensiveActions: 1,
    },
    adaptiveAI: {
      predictionsMade: 3,
      correctPredictions: 1,
      incorrectPredictions: 2,
      predictionAccuracy: 33,
      maxResistanceReached: { fire: 0.2, ice: 0, lightning: 0.1, arcane: 0, poison: 0 },
      timesEnemyAdapted: 2,
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
    ...overrides,
  };
}

describe('BattleHistoryRepository', () => {
  let repo: BattleHistoryRepository;

  beforeEach(() => {
    repo = new BattleHistoryRepository();
  });

  it('saves, retrieves, and deletes battle records', async () => {
    const rec = makeRecord({ id: 'test-1' });
    await repo.saveRecord(rec);

    const fetched = await repo.getRecordById('test-1');
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe('test-1');

    const count = await repo.getRecordCount();
    expect(count).toBe(1);

    await repo.deleteRecord('test-1');
    expect(await repo.getRecordCount()).toBe(0);
  });

  it('filters records by outcome and opponentId', async () => {
    await repo.saveRecord(makeRecord({ id: 'v1', outcome: 'victory', opponentId: 'malakor' }));
    await repo.saveRecord(makeRecord({ id: 'd1', outcome: 'defeat', opponentId: 'malakor' }));
    await repo.saveRecord(makeRecord({ id: 'v2', outcome: 'victory', opponentId: 'ignis' }));

    const victories = await repo.getRecordsByOutcome('victory');
    expect(victories).toHaveLength(2);

    const malakorBattles = await repo.getRecordsByOpponent('malakor');
    expect(malakorBattles).toHaveLength(2);
  });

  it('exports and imports JSON history cleanly', async () => {
    await repo.saveRecord(makeRecord({ id: 'exp-1' }));
    await repo.saveRecord(makeRecord({ id: 'exp-2', outcome: 'defeat' }));

    const json = await repo.exportHistoryJson();
    await repo.clearHistory();
    expect(await repo.getRecordCount()).toBe(0);

    const importedCount = await repo.importHistoryJson(json);
    expect(importedCount).toBe(2);
    expect(await repo.getRecordCount()).toBe(2);
  });

  it('clearing battle history does NOT destroy BossPersistence data', async () => {
    BossPersistenceManager.clearAll();
    BossPersistenceManager.recordEncounterOutcome('malakor', true, 'fire');

    await repo.saveRecord(makeRecord({ id: 'b-keep-boss' }));
    await repo.clearHistory();

    expect(await repo.getRecordCount()).toBe(0);
    const bossMem = BossPersistenceManager.loadBossMemory('malakor');
    expect(bossMem.totalEncounters).toBe(1);
    expect(bossMem.grudgeLevel).toBe(2);
  });
});
