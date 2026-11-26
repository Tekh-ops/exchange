import { CombatEntity } from './combatTypes';

export interface HealResult {
  actualHealed: number;
  wastedHealing: number;
  newHp: number;
}

export class HealingSystem {
  /**
   * Applies direct healing capped at entity.maxHp, tracking wasted overheal.
   */
  public static applyHealing(
    entity: CombatEntity,
    rawAmount: number,
    healingBonusMultiplier: number = 1.0
  ): HealResult {
    const scaledAmount = Math.max(0, Math.round(rawAmount * healingBonusMultiplier));
    const missingHp = Math.max(0, entity.maxHp - entity.hp);
    const actualHealed = Math.min(missingHp, scaledAmount);
    const wastedHealing = Math.max(0, scaledAmount - actualHealed);

    return {
      actualHealed,
      wastedHealing,
      newHp: entity.hp + actualHealed,
    };
  }

  /**
   * Calculates lifesteal based on ACTUAL damage dealt (after enemy resistance & shield).
   */
  public static applyLifesteal(
    attacker: CombatEntity,
    actualDamageDealt: number,
    lifestealRatio: number,
    healingBonusMultiplier: number = 1.0
  ): HealResult {
    if (actualDamageDealt <= 0 || lifestealRatio <= 0) {
      return { actualHealed: 0, wastedHealing: 0, newHp: attacker.hp };
    }
    const rawSteal = Math.max(1, Math.round(actualDamageDealt * lifestealRatio));
    return this.applyHealing(attacker, rawSteal, healingBonusMultiplier);
  }

  /**
   * Calculates Reversal of Misfortune heal based on recent damage taken.
   */
  public static calculateReversalHeal(
    recentDamageTaken: number,
    ratio: number = 0.6,
    minimumHeal: number = 15
  ): number {
    return Math.max(minimumHeal, Math.round(recentDamageTaken * ratio));
  }
}
