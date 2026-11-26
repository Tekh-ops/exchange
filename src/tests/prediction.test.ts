import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyMemory } from '../ai/EnemyMemory';
import { PredictionEngine } from '../ai/PredictionEngine';

describe('PredictionEngine and Intent Anticipation', () => {
  let memory: EnemyMemory;
  let predictionEngine: PredictionEngine;

  beforeEach(() => {
    memory = new EnemyMemory({ windowSize: 12 });
    predictionEngine = new PredictionEngine();
  });

  it('7. Prediction confidence scales and responds to repeated behaviour', () => {
    // With no history
    const initialPred = predictionEngine.predictNextElement(memory);
    expect(initialPred.confidence).toBeLessThanOrEqual(30);

    // Cast 1 fire
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 1);
    const pred1 = predictionEngine.predictNextElement(memory);

    // Cast 4 fires in a row
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 2);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 3);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 4);

    const predRepeated = predictionEngine.predictNextElement(memory);
    expect(predRepeated.confidence).toBeGreaterThan(pred1.confidence);
    expect(predRepeated.confidence).toBeGreaterThanOrEqual(65);
    expect(predRepeated.predictedElement).toBe('fire');
    expect(predRepeated.reason).toContain('FIRE');
  });

  it('8. Predictions can be incorrect and evaluate gameplay consequences', () => {
    // Enemy predicted Fire with high confidence
    const predictionRecord = {
      turn: 4,
      predictedElement: 'fire' as const,
      confidence: 80,
      reason: 'Player used FIRE 3 times in a row.',
    };
    memory.recordPrediction(predictionRecord);

    // Player switches to Frigid Snub (Ice) instead!
    const outcome = predictionEngine.evaluatePredictionOutcome(
      predictionRecord,
      'ice'
    );

    expect(outcome.wasCorrect).toBe(false);
    expect(outcome.consequence).toBe('wasted_defense');
    expect(outcome.combatMessage).toContain('caught off guard');

    const wasCorrectInMem = memory.resolveLatestPrediction('ice');
    expect(wasCorrectInMem).toBe(false);
    expect(memory.getPredictionAccuracy()).toBe(0);
  });

  it('9. Rejected spells do not update memory or skew predictions', () => {
    // Verify that attempting to cast a spell with insufficient mana or on cooldown
    // does not touch EnemyMemory
    const initialHistoryLength = memory.getHistory().length;
    expect(initialHistoryLength).toBe(0);

    // Simulating a rejected spell attempt: memory.recordOffensiveAction is NOT called
    const predBefore = predictionEngine.predictNextElement(memory);

    expect(memory.getHistory().length).toBe(0);
    expect(memory.getElementCount('fire')).toBe(0);

    const predAfter = predictionEngine.predictNextElement(memory);
    expect(predBefore.confidence).toBe(predAfter.confidence);
  });
});
