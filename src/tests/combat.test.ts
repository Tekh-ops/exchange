import { describe, it, expect } from 'vitest';
import { calculateSpellDamage, processStatusEffects } from '../combat/damageCalculator';
import { CombatEntity } from '../combat/combatTypes';

describe('Combat System & Damage Calculations', () => {
  const dummyAttacker: CombatEntity = {
    id: 'player',
    name: 'Petty Sorcerer',
    title: 'Mage',
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    shield: 0,
    spellPower: 10,
    critRate: 0.0, // Force 0 crit for deterministic tests
    statusEffects: [],
  };

  const dummyDefender: CombatEntity = {
    id: 'enemy',
    name: 'Malakor',
    title: 'Nethermancer',
    hp: 150,
    maxHp: 150,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 10,
    critRate: 0.0,
    statusEffects: [],
  };

  it('calculates unshielded damage accurately', () => {
    const res = calculateSpellDamage(dummyAttacker, dummyDefender, 20);
    // baseValue (20) + spellPower (10) * 0.8 = 28
    expect(res.rawDamage).toBe(28);
    expect(res.finalDamage).toBe(28);
    expect(res.absorbedByShield).toBe(0);
    expect(res.remainingShield).toBe(0);
  });

  it('absorbs damage with barrier shields correctly', () => {
    const shieldedDefender: CombatEntity = {
      ...dummyDefender,
      shield: 40,
    };

    const res = calculateSpellDamage(dummyAttacker, shieldedDefender, 20);
    // Raw damage is 28, shield has 40
    expect(res.rawDamage).toBe(28);
    expect(res.finalDamage).toBe(0);
    expect(res.absorbedByShield).toBe(28);
    expect(res.remainingShield).toBe(12);
  });

  it('breaks barrier shields when damage exceeds shield value', () => {
    const weakShieldDefender: CombatEntity = {
      ...dummyDefender,
      shield: 10,
    };

    const res = calculateSpellDamage(dummyAttacker, weakShieldDefender, 20);
    // Raw damage is 28, shield has 10 -> absorbed 10, finalDamage 18, remainingShield 0
    expect(res.rawDamage).toBe(28);
    expect(res.absorbedByShield).toBe(10);
    expect(res.finalDamage).toBe(18);
    expect(res.remainingShield).toBe(0);
  });

  it('processes status effects and tick damage over turns', () => {
    const poisonedEntity: CombatEntity = {
      ...dummyDefender,
      hp: 100,
      statusEffects: [
        { id: 'p1', type: 'poison', name: 'Noxious Hex', turnsRemaining: 2, value: 12 },
      ],
    };

    const result = processStatusEffects(poisonedEntity);
    expect(result.tickDamage).toBe(12);
    expect(result.updatedEntity.hp).toBe(88);
    expect(result.updatedEntity.statusEffects[0].turnsRemaining).toBe(1);
    expect(result.expiredEffects.length).toBe(0);

    // Second turn: status effect expires
    const secondTurn = processStatusEffects(result.updatedEntity);
    expect(secondTurn.tickDamage).toBe(12);
    expect(secondTurn.updatedEntity.hp).toBe(76);
    expect(secondTurn.updatedEntity.statusEffects.length).toBe(0);
    expect(secondTurn.expiredEffects).toContain('Noxious Hex');
  });
});
