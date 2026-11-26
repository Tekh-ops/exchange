import { CombatEntity } from './combatTypes';
import { Spell, OffensiveElement } from '../spells/types';

export interface ChargedSpellState {
  spellId: string;
  spellName: string;
  targetId: string | null;
  bonusManaPaid: number;
  turnsRemaining: number;
}

export interface SynergyBonus {
  triggered: boolean;
  name: string;
  bonusMultiplier: number;
  description: string;
}

export class ChargingSystem {
  /**
   * Begins charging a chargeable spell. Returns updated mana and charged state.
   */
  public static canStartCharge(
    spell: Spell,
    playerMana: number,
    chargeCostReduction: number = 0
  ): { valid: boolean; totalCost: number; reason?: string } {
    if (!spell.chargeable) {
      return { valid: false, totalCost: spell.manaCost, reason: `${spell.name} cannot be charged.` };
    }
    const extraCost = Math.max(0, (spell.chargeManaBonus ?? 10) - chargeCostReduction);
    const totalCost = spell.manaCost + extraCost;
    if (playerMana < totalCost) {
      return {
        valid: false,
        totalCost,
        reason: `Not enough mana to charge ${spell.name} (need ${totalCost} MP).`,
      };
    }
    return { valid: true, totalCost };
  }

  /**
   * Checks if an incoming hit interrupts a charged spell.
   * Having an active shield protects the charged spell from interruption!
   */
  public static shouldInterruptCharge(
    chargedState: ChargedSpellState | null,
    playerShieldBeforeHit: number,
    damageTaken: number
  ): boolean {
    if (!chargedState) return false;
    if (damageTaken <= 0) return false;
    // Shield protects concentration
    if (playerShieldBeforeHit > 0) return false;
    return true;
  }

  /**
   * Evaluates elemental/status spell synergies on the target.
   */
  public static evaluateSynergy(
    spellElement: OffensiveElement | 'defense',
    target: CombatEntity
  ): SynergyBonus {
    if (spellElement === 'fire' && target.statusEffects.some((s) => s.type === 'frost')) {
      return {
        triggered: true,
        name: 'Thermal Shatter',
        bonusMultiplier: 1.35,
        description: 'Fire shattered Frost for +35% bonus damage!',
      };
    }

    if (spellElement === 'lightning' && target.statusEffects.some((s) => s.type === 'frost')) {
      return {
        triggered: true,
        name: 'Cryo-Conduction',
        bonusMultiplier: 1.25,
        description: 'Lightning conducted through Frost for +25% bonus damage!',
      };
    }

    if (
      (spellElement === 'fire' || spellElement === 'arcane') &&
      target.statusEffects.some((s) => s.type === 'poison' || s.type === 'weaken')
    ) {
      return {
        triggered: true,
        name: 'Hex Detonation',
        bonusMultiplier: 1.2,
        description: 'Cursed vulnerability amplified impact by +20%!',
      };
    }

    if (target.isStaggered) {
      return {
        triggered: true,
        name: 'Stagger Punish',
        bonusMultiplier: 1.3,
        description: 'Staggered target took +30% critical vulnerability damage!',
      };
    }

    return { triggered: false, name: '', bonusMultiplier: 1.0, description: '' };
  }
}
