import { describe, it, expect } from 'vitest';
import { BattleRecorder } from '../history/BattleRecorder';

describe('BattleRecorder', () => {
  it('creates an immutable BattleRecord on victory with accurate combat and spell stats', () => {
    const recorder = new BattleRecorder({
      gameMode: 'duel',
      opponentName: 'Arch-Mage Malakor',
      opponentId: 'malakor',
      bossName: 'Arch-Mage Malakor',
      bossId: 'malakor',
    });

    recorder.setTurn(1);
    recorder.recordPlayerSpellCast('pyro_tantrum', "Sorcerer's Tantrum", 'fire', 35, true);
    recorder.recordDamageDealt(52, true, 'fire');
    recorder.recordEnemySpellCast('Void Bolt');
    recorder.recordDamageReceived(18, false, false);

    recorder.setTurn(2);
    recorder.recordPlayerSpellCast('siphon_pride', 'Siphon Pride', 'arcane', 15, true);
    recorder.recordDamageDealt(22, false, 'arcane');
    recorder.recordHealing(16, true);
    recorder.recordPlayerSpellCast('ego_shield', 'Ego Shield', 'defense', 18, false);

    const record = recorder.finalize('victory', 2, {
      xpEarned: 60,
      goldEarned: 35,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    });

    expect(record).not.toBeNull();
    expect(record!.outcome).toBe('victory');
    expect(record!.totalTurns).toBe(2);
    expect(record!.combat.totalDamageDealt).toBe(74);
    expect(record!.combat.totalDamageReceived).toBe(18);
    expect(record!.combat.totalHealingPerformed).toBe(16);
    expect(record!.combat.totalLifesteal).toBe(16);
    expect(record!.combat.totalManaConsumed).toBe(68);
    expect(record!.combat.totalSpellsCast).toBe(3);
    expect(record!.combat.criticalHits).toBe(1);
    expect(record!.spellUsage.uniqueSpellsUsed).toBe(2);
    expect(record!.spellUsage.defensiveActions).toBe(1);
    expect(record!.spellUsage.elementDistribution.fire).toBe(1);
    expect(record!.spellUsage.elementDistribution.arcane).toBe(1);
  });

  it('records defeat outcomes and adaptive AI telemetry accurately', () => {
    const recorder = new BattleRecorder();
    recorder.recordPrediction('fire', 75);
    recorder.recordPredictionOutcome(true, 'fire');
    recorder.recordResistanceUpdate({ fire: 0.3, ice: 0, lightning: 0, arcane: 0, poison: 0 });
    recorder.recordPunishment('Reactive Fire Ward');
    recorder.recordStrategyChange();

    const record = recorder.finalize('defeat', 4, {
      xpEarned: 0,
      goldEarned: 0,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    });

    expect(record).not.toBeNull();
    expect(record!.outcome).toBe('defeat');
    expect(record!.adaptiveAI.predictionsMade).toBe(1);
    expect(record!.adaptiveAI.correctPredictions).toBe(1);
    expect(record!.adaptiveAI.predictionAccuracy).toBe(100);
    expect(record!.adaptiveAI.maxResistanceReached.fire).toBe(0.3);
    expect(record!.adaptiveAI.timesEnemyAdapted).toBe(1);
    expect(record!.adaptiveAI.successfulPunishments).toBe(1);
    expect(record!.adaptiveAI.strategyChangesAfterAdaptation).toBe(1);
  });

  it('prevents duplicate finalization and ignores post-finalization events', () => {
    const recorder = new BattleRecorder();
    recorder.recordDamageDealt(30, false, 'arcane');

    const first = recorder.finalize('victory', 1, {
      xpEarned: 60,
      goldEarned: 35,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    });

    expect(recorder.isFinalized()).toBe(true);
    expect(first).not.toBeNull();

    // Post-finalization mutations should be ignored
    recorder.recordDamageDealt(999, true, 'fire');
    const second = recorder.finalize('defeat', 2, {
      xpEarned: 0,
      goldEarned: 0,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    });

    expect(second).toBeNull();
    expect(first!.combat.totalDamageDealt).toBe(30);
  });

  it('preserves chronological timeline event order from battle_started to battle_ended', () => {
    const recorder = new BattleRecorder();
    recorder.setTurn(1);
    recorder.recordPlayerSpellCast('petty_spark', 'Petty Spark', 'lightning', 0, true);
    recorder.recordDamageDealt(15, false, 'lightning');
    recorder.recordEnemySpellCast('Void Bolt');

    const record = recorder.finalize('victory', 1, {
      xpEarned: 60,
      goldEarned: 35,
      itemsEarned: [],
      levelBefore: 1,
      levelAfter: 1,
      unlocksEarned: [],
    });

    const types = record!.timeline.map((e) => e.type);
    expect(types[0]).toBe('battle_started');
    expect(types).toContain('player_cast_spell');
    expect(types).toContain('damage_dealt');
    expect(types).toContain('enemy_cast_spell');
    expect(types[types.length - 1]).toBe('battle_ended');
  });
});
