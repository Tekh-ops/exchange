import { OffensiveElement } from '../spells/types';
import { EnemyMemory } from './EnemyMemory';

export type PredictabilityStage = 
  | 'unpredictable'
  | 'noticed'
  | 'adapting'
  | 'counter_primed'
  | 'punishing';

export interface PunishmentTriggerResult {
  triggered: boolean;
  type?: 'elemental_shield' | 'damage_deflection' | 'counterattack' | 'taunt';
  shieldBonus?: number;
  deflectionPercent?: number; // e.g. 0.15 (15% additional damage reduction)
  counterDamage?: number;
  reason: string;
}

export interface PredictabilityConfig {
  noticedThreshold: number; // default 2
  adaptingThreshold: number; // default 3
  counterPrimedThreshold: number; // default 4
  punishThreshold: number; // default 5
  maxTotalReduction: number; // default 0.60 (player always does at least 40% damage)
}

export const DEFAULT_PREDICTABILITY_CONFIG: PredictabilityConfig = {
  noticedThreshold: 2,
  adaptingThreshold: 3,
  counterPrimedThreshold: 4,
  punishThreshold: 5,
  maxTotalReduction: 0.60,
};

export class PredictabilitySystem {
  private config: PredictabilityConfig;

  constructor(config?: Partial<PredictabilityConfig>) {
    this.config = {
      ...DEFAULT_PREDICTABILITY_CONFIG,
      ...config,
    };
  }

  /**
   * Calculates predictability score from 0 to 100%.
   */
  public calculatePredictabilityScore(memory: EnemyMemory): number {
    const history = memory.getHistory();
    if (history.length < 2) return 0;

    const consecutiveCount = memory.getConsecutiveElementCount();
    const { frequency } = memory.getMostFrequentElement();

    // Consecutive repetitions heavily drive predictability
    let consecutiveScore = 0;
    if (consecutiveCount >= 5) consecutiveScore = 95;
    else if (consecutiveCount === 4) consecutiveScore = 80;
    else if (consecutiveCount === 3) consecutiveScore = 60;
    else if (consecutiveCount === 2) consecutiveScore = 35;

    // Frequency concentration contributes up to 40 points
    const frequencyScore = Math.min(40, frequency * 45);

    return Math.min(100, Math.round(consecutiveScore * 0.7 + frequencyScore));
  }

  /**
   * Returns the current pattern recognition stage.
   */
  public getStage(memory: EnemyMemory): PredictabilityStage {
    const consecutiveCount = memory.getConsecutiveElementCount();

    if (consecutiveCount >= this.config.punishThreshold) {
      return 'punishing';
    }
    if (consecutiveCount >= this.config.counterPrimedThreshold) {
      return 'counter_primed';
    }
    if (consecutiveCount >= this.config.adaptingThreshold) {
      return 'adapting';
    }
    if (consecutiveCount >= this.config.noticedThreshold) {
      return 'noticed';
    }

    return 'unpredictable';
  }

  /**
   * Evaluates if a punishment should trigger against a repeated spell.
   * Punishments are probabilistic and threshold-based, never guaranteed 100% every time.
   */
  public evaluatePunishment(
    element: OffensiveElement,
    memory: EnemyMemory,
    baseResistance: number
  ): PunishmentTriggerResult {
    const consecutiveCount = memory.getConsecutiveElementCount();
    const consecutiveElement = memory.getConsecutiveElement();

    // Only punish if the incoming spell matches the repeated element streak
    if (consecutiveElement !== element || consecutiveCount < this.config.counterPrimedThreshold) {
      return {
        triggered: false,
        reason: 'Player maintains acceptable elemental variety.',
      };
    }

    // Stage 4: 4 consecutive casts -> 50% chance of defensive ward
    if (consecutiveCount === this.config.counterPrimedThreshold) {
      const roll = Math.random();
      if (roll < 0.60) {
        return {
          triggered: true,
          type: 'elemental_shield',
          shieldBonus: 20,
          reason: `Repetition Detected: 4 consecutive ${element.toUpperCase()} casts! Malakor wove a reactive ${element.toUpperCase()} shield (+20 Shield).`,
        };
      }
    }

    // Stage 5+: 5 or more consecutive casts -> 75% chance of severe punishment
    if (consecutiveCount >= this.config.punishThreshold) {
      const roll = Math.random();
      if (roll < 0.75) {
        // Calculate capped deflection to avoid unfair total damage reduction
        const remainingAllowed = Math.max(0, this.config.maxTotalReduction - baseResistance);
        const deflection = Math.min(remainingAllowed, 0.20);

        if (roll < 0.40) {
          return {
            triggered: true,
            type: 'counterattack',
            counterDamage: 14,
            deflectionPercent: deflection,
            reason: `Extreme Predictability: ${consecutiveCount} ${element.toUpperCase()} casts! Malakor parried the repetition and countered for 14 damage!`,
          };
        } else {
          return {
            triggered: true,
            type: 'damage_deflection',
            deflectionPercent: deflection,
            shieldBonus: 15,
            reason: `Severe Predictability: ${consecutiveCount} consecutive ${element.toUpperCase()} casts! Deflecting incoming magic and reinforcing barrier!`,
          };
        }
      }
    }

    return {
      triggered: false,
      reason: `Malakor braced for ${element.toUpperCase()}, but spared a full counter this turn.`,
    };
  }

  public getConfig(): PredictabilityConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<PredictabilityConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
