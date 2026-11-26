import { CombatEntity } from './combatTypes';

export interface PostureResult {
  updatedEntity: CombatEntity;
  postureDamageDealt: number;
  triggeredStagger: boolean;
}

export class PostureSystem {
  /**
   * Applies posture damage to an entity. When posture >= maxPosture,
   * the entity becomes staggered (loses next action & takes +25% damage) and posture resets.
   */
  public static applyPostureDamage(
    entity: CombatEntity,
    amount: number,
    postureBonusMultiplier: number = 1.0
  ): PostureResult {
    if (amount <= 0 || entity.hp <= 0) {
      return { updatedEntity: entity, postureDamageDealt: 0, triggeredStagger: false };
    }

    const maxPosture = entity.maxPosture ?? 50;
    const currentPosture = entity.posture ?? 0;
    const scaledDamage = Math.round(amount * postureBonusMultiplier);
    const nextPosture = currentPosture + scaledDamage;

    if (nextPosture >= maxPosture) {
      return {
        updatedEntity: {
          ...entity,
          posture: 0,
          isStaggered: true,
        },
        postureDamageDealt: scaledDamage,
        triggeredStagger: true,
      };
    }

    return {
      updatedEntity: {
        ...entity,
        posture: nextPosture,
      },
      postureDamageDealt: scaledDamage,
      triggeredStagger: false,
    };
  }

  /**
   * Recovers a portion of posture (e.g., on defensive action or turn end).
   */
  public static recoverPosture(entity: CombatEntity, amount: number): CombatEntity {
    const current = entity.posture ?? 0;
    return {
      ...entity,
      posture: Math.max(0, current - amount),
    };
  }

  /**
   * Clears stagger after the staggered entity misses its turn.
   */
  public static clearStagger(entity: CombatEntity): CombatEntity {
    return {
      ...entity,
      isStaggered: false,
      posture: 0,
    };
  }
}
