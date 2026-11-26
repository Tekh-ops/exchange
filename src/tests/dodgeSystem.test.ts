import { describe, it, expect, vi, afterEach } from 'vitest';
import { DodgeSystem } from '../combat/DodgeSystem';
import { AttackTelegraph } from '../combat/combatTypes';

describe('DodgeSystem', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates stamina and mana affordability for each dodge type', () => {
    expect(DodgeSystem.canAffordDodge('quickstep', 25, 0).canAfford).toBe(true);
    expect(DodgeSystem.canAffordDodge('quickstep', 10, 50).canAfford).toBe(false);
    expect(DodgeSystem.canAffordDodge('arcane_blink', 15, 14).canAfford).toBe(true);
    expect(DodgeSystem.canAffordDodge('arcane_blink', 15, 5).canAfford).toBe(false);
    expect(DodgeSystem.canAffordDodge('perfect_dodge', 35, 8).canAfford).toBe(true);
  });

  it('evades lane-targeted attacks automatically when player is outside targetLanes', () => {
    const telegraph: AttackTelegraph = {
      targetLanes: ['center'],
      attackType: 'single_lane',
      dangerLevel: 'high',
      canDodge: true,
      canBlock: true,
      canInterrupt: false,
      warningText: 'Center beam incoming!',
    };

    const res = DodgeSystem.resolveIncomingAttack(null, 'left', telegraph, 30, 0);
    expect(res.evaded).toBe(true);
    expect(res.damageMultiplier).toBe(0);
    expect(res.damageAvoided).toBe(30);
  });

  it('grants mana and next-turn spell buff on successful perfect dodge', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const telegraph: AttackTelegraph = {
      targetLanes: ['center'],
      attackType: 'homing',
      dangerLevel: 'high',
      canDodge: true,
      canBlock: true,
      canInterrupt: false,
      warningText: 'Heavy strike!',
    };

    const res = DodgeSystem.resolveIncomingAttack('perfect_dodge', 'center', telegraph, 40, 1);
    expect(res.evaded).toBe(true);
    expect(res.isPerfectDodge).toBe(true);
    expect(res.manaRecovered).toBe(12);
    expect(res.grantsNextTurnBonus).toBe(true);
  });

  it('applies partial graze damage when undodgeable attack is met with a dodge', () => {
    const telegraph: AttackTelegraph = {
      targetLanes: ['left', 'center', 'right'],
      attackType: 'all_lanes',
      dangerLevel: 'extreme',
      canDodge: false,
      canBlock: true,
      canInterrupt: false,
      warningText: 'Undodgeable burst!',
    };

    const res = DodgeSystem.resolveIncomingAttack('quickstep', 'center', telegraph, 40, 1);
    expect(res.evaded).toBe(false);
    expect(res.damageMultiplier).toBe(0.65);
    expect(res.damageAvoided).toBe(14);
  });
});
