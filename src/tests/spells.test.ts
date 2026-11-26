import { describe, it, expect } from 'vitest';
import { ALL_SPELLS, getInitialSpellbook } from '../spells/spellRegistry';

describe('Spell Registry & Incantations', () => {
  it('verifies all registered spells have valid configurations', () => {
    const spells = Object.values(ALL_SPELLS);
    expect(spells.length).toBeGreaterThanOrEqual(6);

    spells.forEach((spell) => {
      expect(spell.id).toBeTruthy();
      expect(spell.name).toBeTruthy();
      expect(spell.manaCost).toBeGreaterThanOrEqual(0);
      expect(spell.cooldownTurns).toBeGreaterThanOrEqual(0);
      expect(spell.effects.length).toBeGreaterThan(0);
      expect(spell.pettyComment).toBeTruthy();
    });
  });

  it('ensures initial spellbook contains essential starter incantations', () => {
    const book = getInitialSpellbook();
    const spellIds = book.map((s) => s.id);

    expect(spellIds).toContain('petty_spark');
    expect(spellIds).toContain('arcane_dart');
    expect(spellIds).toContain('ego_shield');
  });
});
