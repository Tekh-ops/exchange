import { describe, it, expect } from 'vitest';
import { VoiceCommandParser } from '../voice/VoiceCommandParser';
import { getInitialSpellbook } from '../spells/spellRegistry';

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

  it('parses charge modifier and fuzzy recognition errors', () => {
    const charged = VoiceCommandParser.parse('charge arcane dark', spells);
    expect(charged.kind).toBe('spell');
    if (charged.kind === 'spell') {
      expect(charged.spellId).toBe('arcane_dart');
      expect(charged.charge).toBe(true);
    }
  });

  it('parses dodge and lane movement commands', () => {
    const dodge = VoiceCommandParser.parse('perfect dodge', spells);
    expect(dodge.kind).toBe('dodge');
    if (dodge.kind === 'dodge') expect(dodge.dodgeType).toBe('perfect_dodge');

    const blink = VoiceCommandParser.parse('arcane blink left', spells);
    expect(blink.kind).toBe('dodge');
    if (blink.kind === 'dodge') {
      expect(blink.dodgeType).toBe('arcane_blink');
      expect(blink.targetLane).toBe('left');
    }

    const move = VoiceCommandParser.parse('move right', spells);
    expect(move.kind).toBe('move_lane');
    if (move.kind === 'move_lane') expect(move.direction).toBe('right');
  });

  it('returns unknown for unrecognized speech', () => {
    const res = VoiceCommandParser.parse('order a pepperoni pizza', spells);
    expect(res.kind).toBe('unknown');
  });
});
