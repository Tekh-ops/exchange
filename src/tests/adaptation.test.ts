import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyMemory } from '../ai/EnemyMemory';
import { AdaptationEngine } from '../ai/AdaptationEngine';
import { calculateSpellDamage } from '../combat/damageCalculator';
import { CombatEntity } from '../combat/combatTypes';

describe('AdaptationEngine and Elemental Resistance', () => {
  let memory: EnemyMemory;
  let adaptation: AdaptationEngine;

  const mockAttacker: CombatEntity = {
    id: 'player',
    name: 'Petty Sorcerer',
    title: 'Mage',
    hp: 100,
    maxHp: 100,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 10,
    critRate: 0.0,
    statusEffects: [],
  };

  const mockDefender: CombatEntity = {
    id: 'enemy',
    name: 'Malakor',
    title: 'Nethermancer',
    hp: 160,
    maxHp: 160,
    mana: 100,
    maxMana: 100,
    shield: 0,
    spellPower: 10,
    critRate: 0.0,
    statusEffects: [],
  };

  beforeEach(() => {
    memory = new EnemyMemory({ windowSize: 12 });
    adaptation = new AdaptationEngine({ maxResistance: 0.45, frequencyThreshold: 0.2, scalingDivisor: 0.8 });
  });

  it('1. Repeated Fire increases Fire resistance', () => {
    // Cast 1 fire (1/1 = 100%, but frequency threshold is 0.2)
    // Formula: min(0.45, 0.45 * (1.0 - 0.2) / 0.8) = 0.45
    // Let's test progression:
    // With 1 fire and 4 other spells: Fire freq = 1/5 = 0.20 -> resistance = 0
    memory.recordOffensiveAction('arcane_dart', 'arcane', 1);
    memory.recordOffensiveAction('petty_spark', 'lightning', 2);
    memory.recordOffensiveAction('frigid_snub', 'ice', 3);
    memory.recordOffensiveAction('cursed_hex', 'poison', 4);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 5);

    expect(memory.getElementFrequency('fire')).toBeCloseTo(0.20, 2);
    expect(adaptation.calculateResistance('fire', memory)).toBe(0);

    // Now repeat Fire: 3 more fires
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 6);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 7);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 8);

    // Fire count: 4 out of 8 actions = 0.50 frequency
    // (0.50 - 0.20) / 0.8 = 0.3 / 0.8 = 0.375
    // 0.45 * 0.375 = 0.16875 (~17% resistance)
    const midResistance = adaptation.calculateResistance('fire', memory);
    expect(midResistance).toBeGreaterThan(0.15);
    expect(midResistance).toBeLessThanOrEqual(0.45);

    // Add more fire casts until frequency is high
    for (let i = 9; i <= 16; i++) {
      memory.recordOffensiveAction('pyro_tantrum', 'fire', i);
    }
    // Now window has mostly fire
    const highResistance = adaptation.calculateResistance('fire', memory);
    expect(highResistance).toBeCloseTo(0.45, 2);
  });

  it('2. Fire resistance directly affects actual Fire damage', () => {
    // Fill memory with Fire to reach high resistance
    for (let i = 1; i <= 12; i++) {
      memory.recordOffensiveAction('pyro_tantrum', 'fire', i);
    }

    const fireResistance = adaptation.calculateResistance('fire', memory);
    expect(fireResistance).toBeCloseTo(0.45, 2);

    // Baseline damage with 0 resistance
    const unresisted = calculateSpellDamage(mockAttacker, mockDefender, 40, 0);
    // baseValue (40) + spellPower (10) * 0.8 = 48
    expect(unresisted.finalDamage).toBe(48);
    expect(unresisted.resistedAmount).toBe(0);

    // Resisted damage with 45% fire resistance
    const resisted = calculateSpellDamage(mockAttacker, mockDefender, 40, fireResistance);
    // 48 * (1 - 0.45) = 48 * 0.55 = 26.4 -> ~26 damage, resisted ~22
    expect(resisted.resistedAmount).toBe(22);
    expect(resisted.finalDamage).toBe(26);
    expect(resisted.finalDamage).toBeLessThan(unresisted.finalDamage);
  });

  it('3. Other elemental resistances remain unaffected when only Fire is repeated', () => {
    for (let i = 1; i <= 12; i++) {
      memory.recordOffensiveAction('pyro_tantrum', 'fire', i);
    }

    const allRes = adaptation.getAllResistances(memory);
    expect(allRes.fire).toBeCloseTo(0.45, 2);
    expect(allRes.ice).toBe(0);
    expect(allRes.lightning).toBe(0);
    expect(allRes.arcane).toBe(0);
    expect(allRes.poison).toBe(0);
  });

  it('4. Switching elements gradually softens previous resistance', () => {
    // Initially build 45% Fire resistance
    for (let i = 1; i <= 12; i++) {
      memory.recordOffensiveAction('pyro_tantrum', 'fire', i);
    }
    expect(adaptation.calculateResistance('fire', memory)).toBeCloseTo(0.45, 2);

    // Switch strategy to Ice and Arcane
    for (let i = 13; i <= 18; i++) {
      memory.recordOffensiveAction('frigid_snub', 'ice', i);
    }

    // Fire now only has 6 of 12 slots = 50% frequency
    const softenedResistance = adaptation.calculateResistance('fire', memory);
    expect(softenedResistance).toBeLessThan(0.45);
    expect(softenedResistance).toBeCloseTo(0.16875, 2);

    // Continue casting other elements
    for (let i = 19; i <= 24; i++) {
      memory.recordOffensiveAction('arcane_dart', 'arcane', i);
    }

    // Fire pushed completely out of rolling window -> 0% resistance!
    expect(adaptation.calculateResistance('fire', memory)).toBe(0);
  });

  it('5. Memory strictly respects its configurable rolling window', () => {
    // Window size is 12
    for (let i = 1; i <= 20; i++) {
      memory.recordOffensiveAction(`spell_${i}`, i <= 10 ? 'fire' : 'poison', i);
    }

    const history = memory.getHistory();
    expect(history.length).toBe(12);
    expect(history[0].turn).toBe(9);
    expect(history[history.length - 1].turn).toBe(20);
  });

  it('6. Defensive actions do not increase offensive elemental frequency', () => {
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 1);
    memory.recordOffensiveAction('pyro_tantrum', 'fire', 2);

    const initialFreq = memory.getElementFrequency('fire');
    expect(initialFreq).toBe(1.0);

    // Cast 4 defensive shields
    memory.recordDefensiveAction(3);
    memory.recordDefensiveAction(4);
    memory.recordDefensiveAction(5);

    // Offensive history remains unchanged (defensive actions do NOT inflate offensive count)
    expect(memory.getHistory().length).toBe(2);
    expect(memory.getElementCount('fire')).toBe(2);
    expect(memory.getDefensiveActionsCount()).toBe(3);
    expect(memory.wasLastActionDefensive()).toBe(true);
    // Streak was reset
    expect(memory.getConsecutiveElementCount()).toBe(0);
  });
});
