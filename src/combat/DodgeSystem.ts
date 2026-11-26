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
   * Computes the probability (0..1) that an active dodge stance cleanly evades an incoming attack.
   * Always capped below 1.0 so dodging is never guaranteed.
   */
  public static getDodgeSuccessChance(
    dodgeType: DodgeType,
    playerLane: Lane,
    telegraph: AttackTelegraph | undefined,
    consecutiveDodges: number,
    dodgeEfficiencyBonus: number = 0
  ): number {
    if (telegraph && !telegraph.canDodge) {
      return 0;
    }

    const spamPenalty = Math.max(0, (consecutiveDodges - 1) * 0.22);
    const dangerPenalty =
      dodgeType === 'perfect_dodge'
        ? 0
        : telegraph?.dangerLevel === 'extreme'
          ? 0.08
          : telegraph?.dangerLevel === 'high'
            ? 0.04
            : 0;

    if (dodgeType === 'perfect_dodge') {
      const isValidTelegraph =
        telegraph &&
        (telegraph.dangerLevel === 'high' ||
          telegraph.dangerLevel === 'extreme' ||
          telegraph.targetLanes.includes(playerLane));
      const base = isValidTelegraph ? 0.52 : 0.3;
      return Math.min(0.8, Math.max(0.15, base - spamPenalty + dodgeEfficiencyBonus));
    }

    if (dodgeType === 'arcane_blink') {
      return Math.min(0.88, Math.max(0.25, 0.68 - spamPenalty - dangerPenalty + dodgeEfficiencyBonus));
    }

    // quickstep
    return Math.min(0.85, Math.max(0.2, 0.58 - spamPenalty - dangerPenalty + dodgeEfficiencyBonus));
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
    // Passive lane avoidance: if attack targets specific lanes and player was already outside them
    // (Arcane Blink resolves via its own probability roll so blinking is not a guaranteed evade).
    if (
      dodgeType !== 'arcane_blink' &&
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

    const successChance = this.getDodgeSuccessChance(
      dodgeType,
      playerLane,
      telegraph,
      consecutiveDodges,
      dodgeEfficiencyBonus
    );
    const pct = Math.round(successChance * 100);

    if (dodgeType === 'perfect_dodge') {
      if (Math.random() < successChance) {
        return {
          evaded: true,
          isPerfectDodge: true,
          damageMultiplier: 0,
          damageAvoided: incomingDamage,
          manaRecovered: 12,
          grantsNextTurnBonus: true,
          reason: `PERFECT DODGE! (${pct}% roll) Slipped through the telegraph (+12 Mana & +25% Next Spell)!`,
        };
      }
      const graze = 0.5;
      return {
        evaded: false,
        isPerfectDodge: false,
        damageMultiplier: graze,
        damageAvoided: Math.round(incomingDamage * 0.5),
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: `Mistimed Perfect Dodge (${pct}% chance) — grazed for 50% damage.`,
      };
    }

    if (dodgeType === 'arcane_blink') {
      if (Math.random() < successChance) {
        return {
          evaded: true,
          isPerfectDodge: false,
          damageMultiplier: 0,
          damageAvoided: incomingDamage,
          manaRecovered: 0,
          grantsNextTurnBonus: false,
          reason: `Arcane Blink into ${playerLane.toUpperCase()} lane evaded the strike (${pct}% roll)!`,
        };
      }
      return {
        evaded: false,
        isPerfectDodge: false,
        damageMultiplier: 0.4,
        damageAvoided: Math.round(incomingDamage * 0.6),
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: `Arcane Blink clipped by residual magic (${pct}% chance — 40% damage).`,
      };
    }

    // Quickstep
    if (Math.random() < successChance) {
      return {
        evaded: true,
        isPerfectDodge: false,
        damageMultiplier: 0,
        damageAvoided: incomingDamage,
        manaRecovered: 0,
        grantsNextTurnBonus: false,
        reason: `Quickstepped cleanly out of harm’s way (${pct}% roll)!`,
      };
    }

    return {
      evaded: false,
      isPerfectDodge: false,
      damageMultiplier: 0.55,
      damageAvoided: Math.round(incomingDamage * 0.45),
      manaRecovered: 0,
      grantsNextTurnBonus: false,
      reason: `Quickstep partially grazed (${pct}% chance — 55% damage).`,
    };
  }
}
