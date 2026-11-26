import { AttackTelegraph, Lane } from './combatTypes';

export type DodgeType = 'quickstep' | 'arcane_blink' | 'perfect_dodge';

export interface DodgeState {
  activeDodge: DodgeType | null;
  targetLane: Lane;
  consecutiveDodges: number;
  lastDodgeDirection: 'left' | 'right' | 'center' | null;
  perfectDodgeBuffActive: boolean;
}

export interface DodgeCost {
  staminaCost: number;
  manaCost: number;
}

export interface DodgeResolution {
  evaded: boolean;
  isPerfectDodge: boolean;
  damageMultiplier: number; // 0 = full evade, 0.45 = partial graze, 1.0 = failed
  damageAvoided: number;
  manaRecovered: number;
  grantsNextTurnBonus: boolean;
  reason: string;
}

export const DODGE_COSTS: Record<DodgeType, DodgeCost> = {
  quickstep: { staminaCost: 25, manaCost: 0 },
  arcane_blink: { staminaCost: 15, manaCost: 14 },
  perfect_dodge: { staminaCost: 35, manaCost: 8 },
};

export class DodgeSystem {
  public static canAffordDodge(
    type: DodgeType,
    stamina: number,
    mana: number
  ): { canAfford: boolean; reason?: string } {
    const cost = DODGE_COSTS[type];
    if (stamina < cost.staminaCost) {
      return { canAfford: false, reason: `Need ${cost.staminaCost} Stamina (have ${stamina}).` };
    }
    if (mana < cost.manaCost) {
      return { canAfford: false, reason: `Need ${cost.manaCost} Mana (have ${mana}).` };
    }
    return { canAfford: true };
  }

  /**
   * Resolves an incoming attack against the player's chosen dodge stance and lane.
   */
  public static resolveIncomingAttack(
    dodgeType: DodgeType | null,
    playerLane: Lane,
    telegraph: AttackTelegraph | undefined,
    incomingDamage: number,
    consecutiveDodges: number,
    dodgeEfficiencyBonus: number = 0
  ): DodgeResolution {
    // Check lane avoidance first: if attack targets specific lanes and player is NOT in them!
    if (
      telegraph &&
      telegraph.attackType !== 'homing' &&
      telegraph.targetLanes.length > 0 &&
      !telegraph.targetLanes.includes(playerLane)
    ) {
      return {
        evaded: true,
        isPerfectDodge: false,
        damageMultiplier: 0,
        damageAvoided: incomingDamage,
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: `Evaded by positioning in ${playerLane.toUpperCase()} lane!`,
      };
    }

    if (!dodgeType) {
      return {
        evaded: false,
        isPerfectDodge: false,
        damageMultiplier: 1.0,
        damageAvoided: 0,
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: 'Took direct hit.',
      };
    }

    // Undodgeable attacks (e.g., all-lane crystalline burst) cannot be fully dodged
    if (telegraph && !telegraph.canDodge) {
      const grazeMultiplier = 0.65;
      const avoided = Math.round(incomingDamage * (1 - grazeMultiplier));
      return {
        evaded: false,
        isPerfectDodge: false,
        damageMultiplier: grazeMultiplier,
        damageAvoided: avoided,
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: 'Attack is undodgeable! Braced to reduce impact by 35%.',
      };
    }

    // Penalty for predictable consecutive dodging
    const spamPenalty = Math.max(0, (consecutiveDodges - 1) * 0.22);

    if (dodgeType === 'perfect_dodge') {
      // Perfect dodge requires responding to an active high/extreme/single-lane telegraph
      const isValidTelegraph =
        telegraph &&
        (telegraph.dangerLevel === 'high' ||
          telegraph.dangerLevel === 'extreme' ||
          telegraph.targetLanes.includes(playerLane));

      const successChance = Math.max(0.25, (isValidTelegraph ? 0.85 : 0.45) - spamPenalty + dodgeEfficiencyBonus);
      if (Math.random() < successChance) {
        return {
          evaded: true,
          isPerfectDodge: true,
          damageMultiplier: 0,
          damageAvoided: incomingDamage,
          manaRecovered: 12,
          grantsNextTurnBonus: true,
          reason: 'PERFECT DODGE! Slipped through the telegraph (+12 Mana & +25% Next Spell)!',
        };
      } else {
        const graze = 0.5;
        return {
          evaded: false,
          isPerfectDodge: false,
          damageMultiplier: graze,
          damageAvoided: Math.round(incomingDamage * 0.5),
          manaRecovered: 0,
          grantsNextTurnBonus: false,
          reason: 'Mistimed Perfect Dodge — grazed for 50% damage.',
        };
      }
    }

    if (dodgeType === 'arcane_blink') {
      const successChance = Math.max(0.35, 0.9 - spamPenalty + dodgeEfficiencyBonus);
      if (Math.random() < successChance) {
        return {
          evaded: true,
          isPerfectDodge: false,
          damageMultiplier: 0,
          damageAvoided: incomingDamage,
          manaRecovered: 0,
          grantsNextTurnBonus: false,
          reason: `Arcane Blink into ${playerLane.toUpperCase()} lane evaded the strike!`,
        };
      }
      return {
        evaded: false,
        isPerfectDodge: false,
        damageMultiplier: 0.4,
        damageAvoided: Math.round(incomingDamage * 0.6),
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: 'Arcane Blink clipped by residual magic (40% damage).',
      };
    }

    // Quickstep
    const quickstepChance = Math.max(0.25, 0.72 - spamPenalty + dodgeEfficiencyBonus);
    if (Math.random() < quickstepChance) {
      return {
        evaded: true,
        isPerfectDodge: false,
        damageMultiplier: 0,
        damageAvoided: incomingDamage,
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: 'Quickstepped cleanly out of harm’s way!',
      };
    }

    return {
      evaded: false,
      isPerfectDodge: false,
      damageMultiplier: 0.55,
      damageAvoided: Math.round(incomingDamage * 0.45),
      manaRecovered: 0,
      grantsNextTurnBonus: false,
      reason: 'Quickstep partially grazed (55% damage).',
    };
  }
}
