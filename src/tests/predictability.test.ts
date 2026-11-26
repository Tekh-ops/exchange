import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyMemory } from '../ai/EnemyMemory';
import { PredictabilitySystem } from '../ai/PredictabilitySystem';

describe('PredictabilitySystem and Anti-Repetition Mechanics', () => {
  let memory: EnemyMemory;
  let predictability: PredictabilitySystem;

  beforeEach(() => {
    memory = new EnemyMemory({ windowSize: 12 });
    predictability = new PredictabilitySystem();
  });

  it('10. Pattern recognition thresholds trigger at specified consecutive usages', () => {
    // 0 actions -> unpredictable
    expect(predictability.getStage(memory)).toBe('unpredictable');
    expect(predictability.calculatePredictabilityScore(memory)).toBe(0);

    // 1 cast -> unpredictable
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 1);
    expect(predictability.getStage(memory)).toBe('unpredictable');

    // 2 consecutive casts -> noticed
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 2);
    expect(predictability.getStage(memory)).toBe('noticed');
    expect(predictability.calculatePredictabilityScore(memory)).toBeGreaterThanOrEqual(30);

    // 3 consecutive casts -> adapting
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 3);
    expect(predictability.getStage(memory)).toBe('adapting');

    // 4 consecutive casts -> counter_primed
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 4);
    expect(predictability.getStage(memory)).toBe('counter_primed');

    // 5 consecutive casts -> punishing
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 5);
    expect(predictability.getStage(memory)).toBe('punishing');
    expect(predictability.calculatePredictabilityScore(memory)).toBeGreaterThanOrEqual(80);
  });

  it('11. Punishments are threshold-based and not guaranteed on every single repetition', () => {
    // At 2 or 3 casts, counter punishment does NOT trigger
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 1);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 2);
    const result2 = predictability.evaluatePunishment('fire', memory, 0.1);
    expect(result2.triggered).toBe(false);

    memory.recordOffensiveAction('pyro_tantrum', 'fire', 3);
    const result3 = predictability.evaluatePunishment('fire', memory, 0.2);
    expect(result3.triggered).toBe(false);

    // At 4 casts, triggers probabilistically (~60% chance)
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 4);
    let triggeredCount = 0;
    const trials = 100;
    for (let i = 0; i < trials; i++) {
      const res = predictability.evaluatePunishment('fire', memory, 0.25);
      if (res.triggered) triggeredCount++;
    }

    // Must be probabilistic: neither 0 nor 100%
    expect(triggeredCount).toBeGreaterThan(20);
    expect(triggeredCount).toBeLessThan(100);
  });

  it('12. Changing elements immediately drops consecutive streak and recovers strategic flexibility', () => {
    // Build 5 fire repetitions
    for (let i = 1; i <= 5; i++) {
      memory.recordOffensiveAction('pyro_tantrum', 'fire', i);
    }
    expect(predictability.getStage(memory)).toBe('punishing');

    // Switch to Ice
    memory.recordOffensiveAction('frigid_snub', 'ice', 6);

    // Consecutive element count resets to 1
    expect(memory.getConsecutiveElementCount()).toBe(1);
    expect(memory.getConsecutiveElement()).toBe('ice');

    // Stage resets back to unpredictable
    expect(predictability.getStage(memory)).toBe('unpredictable');

    // Predictability score drops significantly
    const newScore = predictability.calculatePredictabilityScore(memory);
    expect(newScore).toBeLessThan(60);

    // Punishments no longer trigger for the new element
    const punishIce = predictability.evaluatePunishment('ice', memory, 0);
    expect(punishIce.triggered).toBe(false);
  });
});
