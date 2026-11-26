import { describe, it, expect } from 'vitest';
import { ChargingSystem, ChargedSpellState } from '../combat/ChargingSystem';
import { getInitialSpellbook } from '../spells/spellRegistry';
import { CombatEntity } from '../combat/combatTypes';

function makeTarget(): CombatEntity {
  return {
    id: 'enemy',
    name: 'Target',
    title: 'Rival',
    hp: 100,
    maxHp: 100,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 12,
    critRate: 0.1,
    statusEffects: [],
  };
}

describe('ChargingSystem', () => {
  it('validates chargeable spells and charge cost reduction', () => {
    const spells = getInitialSpellbook();
    const arcaneDart = spells.find((s) => s.id === 'arcane_dart')!;
    const pettySpark = spells.find((s) => s.id === 'petty_spark')!;

    expect(ChargingSystem.canStartCharge(pettySpark, 100).valid).toBe(false);
    const ok = ChargingSystem.canStartCharge(arcaneDart, 50, 4);
    expect(ok.valid).toBe(true);
    expect(ok.totalCost).toBeLessThan(arcaneDart.manaCost + (arcaneDart.chargeManaBonus ?? 10));
  });

  it('interrupts charge only when unshielded and taking damage', () => {
    const charged: ChargedSpellState = {
      spellId: 'arcane_dart',
      spellName: 'Arcane Dart',
      targetId: 'enemy',
      bonusManaPaid: 10,
      turnsRemaining: 1,
    };

    expect(ChargingSystem.shouldInterruptCharge(charged, 20, 10)).toBe(false);
    expect(ChargingSystem.shouldInterruptCharge(charged, 0, 0)).toBe(false);
    expect(ChargingSystem.shouldInterruptCharge(charged, 0, 15)).toBe(true);
  });

  it('evaluates elemental and stagger synergies', () => {
    const frosted = {
      ...makeTarget(),
      statusEffects: [{ id: 'f1', type: 'frost' as const, name: 'FROST', turnsRemaining: 2, value: 1 }],
    };
    const thermal = ChargingSystem.evaluateSynergy('fire', frosted);
    expect(thermal.triggered).toBe(true);
    expect(thermal.name).toBe('Thermal Shatter');
    expect(thermal.bonusMultiplier).toBeGreaterThan(1);

    const staggered = { ...makeTarget(), isStaggered: true };
    const punish = ChargingSystem.evaluateSynergy('arcane', staggered);
    expect(punish.triggered).toBe(true);
    expect(punish.name).toBe('Stagger Punish');
  });
});
