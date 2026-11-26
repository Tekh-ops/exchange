import { describe, it, expect } from 'vitest';
import { VoiceCommandParser } from '../voice/VoiceCommandParser';
import { getInitialSpellbook } from '../spells/spellRegistry';
import { CombatEntity } from '../combat/combatTypes';

function makeEnemy(id: string, name: string): CombatEntity {
  return {
    id,
    name,
    title: 'Foe',
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    shield: 0,
    spellPower: 12,
    critRate: 0.1,
    statusEffects: [],
  };
}

describe('VoiceCommandParser', () => {
  const spells = getInitialSpellbook();

  it('parses exact and natural-prefix spell commands', () => {
    const exact = VoiceCommandParser.parse('Arcane Dart', spells);
    expect(exact.kind).toBe('spell');
    if (exact.kind === 'spell') expect(exact.spellId).toBe('arcane_dart');

    const prefixed = VoiceCommandParser.parse('cast Petty Spark', spells);
    expect(prefixed.kind).toBe('spell');
    if (prefixed.kind === 'spell') expect(prefixed.spellId).toBe('petty_spark');
  });

  it('parses charge modifier, strongest elemental query, and fuzzy errors', () => {
    const charged = VoiceCommandParser.parse('charge arcane dark', spells);
    expect(charged.kind).toBe('spell');
    if (charged.kind === 'spell') {
      expect(charged.spellId).toBe('arcane_dart');
      expect(charged.charge).toBe(true);
    }

    const strongestFire = VoiceCommandParser.parse('use my strongest fire spell', spells);
    expect(strongestFire.kind).toBe('spell');
    if (strongestFire.kind === 'spell') expect(strongestFire.spellId).toBe('pyro_tantrum');
  });

  it('rejects ambiguous elemental commands and resolves targets safely', () => {
    const ambigSpell = VoiceCommandParser.parse('cast arcane spell', spells);
    expect(ambigSpell.kind).toBe('ambiguous');

    const foes = [
      makeEnemy('malakor_0', 'Arch-Mage Malakor'),
      makeEnemy('fire_1', 'Ignis Apprentice'),
      makeEnemy('ice_2', 'Glacies Apprentice'),
    ];
    const singleTarget = VoiceCommandParser.resolveVoiceTarget('Malakor', foes);
    expect(singleTarget?.status).toBe('matched');

    const ambigTarget = VoiceCommandParser.resolveVoiceTarget('Apprentice', foes);
    expect(ambigTarget?.status).toBe('ambiguous');

    const allTarget = VoiceCommandParser.resolveVoiceTarget('all enemies', foes);
    expect(allTarget?.status).toBe('all');
  });

  it('parses dodge, lane commands, alternatives, and rejects unrelated speech', () => {
    const dodge = VoiceCommandParser.parse('perfect dodge', spells);
    expect(dodge.kind).toBe('dodge');

    const move = VoiceCommandParser.parse('move right', spells);
    expect(move.kind).toBe('move_lane');

    const alts = VoiceCommandParser.parseAlternatives(['arcane dart', 'something else'], spells);
    expect(alts.kind).toBe('spell');

    const unknown = VoiceCommandParser.parse('order a pepperoni pizza', spells);
    expect(unknown.kind).toBe('unknown');
  });
});
