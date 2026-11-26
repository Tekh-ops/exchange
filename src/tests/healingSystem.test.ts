import { describe, it, expect } from 'vitest';
import { HealingSystem } from '../combat/HealingSystem';
import { CombatEntity } from '../combat/combatTypes';

function makeEntity(hp: number, maxHp: number): CombatEntity {
  return {
    id: 'player',
    name: 'Test Sorcerer',
    title: 'Tester',
    hp,
    maxHp,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 14,
    critRate: 0.1,
    statusEffects: [],
  };
}

describe('HealingSystem', () => {
  it('caps healing at maxHp and tracks wasted overheal', () => {
    const entity = makeEntity(90, 100);
    const res = HealingSystem.applyHealing(entity, 25);
    expect(res.actualHealed).toBe(10);
    expect(res.wastedHealing).toBe(15);
    expect(res.newHp).toBe(100);
  });

  it('applies healingBonusMultiplier', () => {
    const entity = makeEntity(50, 100);
    const res = HealingSystem.applyHealing(entity, 20, 1.5);
    expect(res.actualHealed).toBe(30);
    expect(res.newHp).toBe(80);
  });

  it('calculates lifesteal from actual damage dealt', () => {
    const attacker = makeEntity(60, 100);
    const res = HealingSystem.applyLifesteal(attacker, 20, 0.5);
    expect(res.actualHealed).toBe(10);
    expect(res.newHp).toBe(70);

    const zeroRes = HealingSystem.applyLifesteal(attacker, 0, 0.5);
    expect(zeroRes.actualHealed).toBe(0);
  });

  it('calculates reversal heal with minimum floor', () => {
    expect(HealingSystem.calculateReversalHeal(0, 0.7, 15)).toBe(15);
    expect(HealingSystem.calculateReversalHeal(50, 0.7, 15)).toBe(35);
  });
});
