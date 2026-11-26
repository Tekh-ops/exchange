import { OffensiveElement, OFFENSIVE_ELEMENTS } from '../spells/types';
import { EnemyMemory, PredictionRecord } from './EnemyMemory';

export interface PredictionResult {
  predictedElement: OffensiveElement;
  confidence: number; // 0 to 100 percentage
  reason: string;
  preparedCounter?: {
    type: 'elemental_ward' | 'reflective_counter' | 'anticipate_strike';
    targetElement: OffensiveElement;
    description: string;
  };
}

export class PredictionEngine {
  /**
   * Generates a probabilistic, imperfect prediction of the player's next offensive element.
   * Never accesses unsubmitted player input.
   */
  public predictNextElement(memory: EnemyMemory): PredictionResult {
    const history = memory.getHistory();

    // Default baseline when no history exists
    if (history.length === 0) {
      return {
        predictedElement: 'arcane',
        confidence: 25,
        reason: 'No combat history yet. Guessing baseline arcane magic.',
      };
    }

    const consecutiveCount = memory.getConsecutiveElementCount();
    const consecutiveElement = memory.getConsecutiveElement();

    // Weights per element
    const weights: Record<OffensiveElement, number> = {
      fire: 10,
      ice: 10,
      lightning: 10,
      arcane: 10,
      poison: 10,
    };

    let primaryReason = '';
    let baseConfidence = 30;

    // 1. Consecutive Repetition Signal (strongest signal)
    if (consecutiveElement && consecutiveCount >= 2) {
      const streakMultiplier = Math.min(5, consecutiveCount);
      weights[consecutiveElement] += streakMultiplier * 35;
      baseConfidence += streakMultiplier * 12;
      primaryReason = `Player used ${consecutiveElement.toUpperCase()} ${consecutiveCount} times in a row.`;
    }

    // 2. Frequency Dominance Signal
    const { element: topElement, frequency: topFreq } = memory.getMostFrequentElement();
    if (topElement && topFreq > 0.35) {
      weights[topElement] += topFreq * 40;
      if (!primaryReason) {
        primaryReason = `${topElement.toUpperCase()} constitutes ${Math.round(topFreq * 100)}% of recent actions.`;
      }
      baseConfidence += Math.round(topFreq * 20);
    }

    // 3. Sequence / Transition Signal (Check bigram transitions)
    const recentSequences = memory.getRecentElementSequences(2);
    const lastElement = history[history.length - 1]?.element;
    if (lastElement && recentSequences.length >= 2) {
      const transitionsFromLast = recentSequences.filter((seq) => seq[0] === lastElement);
      if (transitionsFromLast.length >= 2) {
        const nextCount: Record<string, number> = {};
        for (const tr of transitionsFromLast) {
          nextCount[tr[1]] = (nextCount[tr[1]] || 0) + 1;
        }

        let bestNext: OffensiveElement | null = null;
        let bestNextCount = 0;
        for (const [el, count] of Object.entries(nextCount) as [OffensiveElement, number][]) {
          if (count > bestNextCount) {
            bestNextCount = count;
            bestNext = el;
          }
        }

        if (bestNext && bestNextCount >= 2) {
          weights[bestNext] += 25;
          if (!primaryReason) {
            primaryReason = `Observed habitual sequence from ${lastElement.toUpperCase()} to ${bestNext.toUpperCase()}.`;
          }
        }
      }
    }

    // 4. Select top candidate based on accumulated pattern signals
    const sorted = OFFENSIVE_ELEMENTS.map((el) => ({
      element: el,
      weight: weights[el],
    })).sort((a, b) => b.weight - a.weight);

    const finalPredicted = sorted[0].element;
    const confidence = Math.min(90, Math.max(25, baseConfidence));

    if (!primaryReason) {
      primaryReason = `Anticipating ${finalPredicted.toUpperCase()} based on general combat cadence.`;
    }

    // Prepare counter stance when confidence is high
    const preparedCounter = confidence >= 60 ? {
      type: 'elemental_ward' as const,
      targetElement: finalPredicted,
      description: `Primed a ward to absorb and retaliate against ${finalPredicted.toUpperCase()}!`,
    } : undefined;

    return {
      predictedElement: finalPredicted,
      confidence,
      reason: primaryReason,
      preparedCounter,
    };
  }

  /**
   * Evaluates the outcome of a prediction and returns the combat consequence.
   */
  public evaluatePredictionOutcome(
    prediction: PredictionRecord,
    actualElement: OffensiveElement
  ): {
    wasCorrect: boolean;
    consequence: 'punished_predictability' | 'wasted_defense' | 'neutral';
    combatMessage: string;
  } {
    const wasCorrect = prediction.predictedElement === actualElement;

    if (wasCorrect) {
      return {
        wasCorrect: true,
        consequence: 'punished_predictability',
        combatMessage: `🎯 Malakor accurately predicted your ${actualElement.toUpperCase()}! His prepared ward absorbs the shock.`,
      };
    } else {
      return {
        wasCorrect: false,
        consequence: 'wasted_defense',
        combatMessage: `💨 Malakor braced for ${prediction.predictedElement.toUpperCase()}, but was caught off guard by your ${actualElement.toUpperCase()}!`,
      };
    }
  }
}
