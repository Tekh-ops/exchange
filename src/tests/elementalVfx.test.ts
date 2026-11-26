import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVfxElementForSpell,
  VFX_QUALITY_BUDGETS,
} from '../effects/ElementalEffects';
import { VfxParticlePool } from '../effects/ParticlePresets';
import { ALL_SPELLS } from '../spells/spellRegistry';
import { gameEvents } from '../engine/eventBus';
import { useCombatStore } from '../stores/combatStore';
import { ProjectileEventPayload } from '../engine/types';

describe('Elemental VFX & Spell Effects', () => {
  beforeEach(() => {
    gameEvents.clear();
  });

  it('maps every registered spell to its distinct elemental VFX identity', () => {
    expect(getVfxElementForSpell('petty_spark', ALL_SPELLS.petty_spark.element)).toBe('lightning');
    expect(getVfxElementForSpell('arcane_dart', ALL_SPELLS.arcane_dart.element)).toBe('arcane');
    expect(getVfxElementForSpell('frigid_snub', ALL_SPELLS.frigid_snub.element)).toBe('ice');
    expect(getVfxElementForSpell('pyro_tantrum', ALL_SPELLS.pyro_tantrum.element)).toBe('fire');
    expect(getVfxElementForSpell('cursed_hex', ALL_SPELLS.cursed_hex.element)).toBe('poison');
    expect(getVfxElementForSpell('siphon_pride', ALL_SPELLS.siphon_pride.element)).toBe('arcane');
    expect(getVfxElementForSpell('ego_shield', ALL_SPELLS.ego_shield.element)).toBe('defense');
    expect(getVfxElementForSpell('mend_minor_miracles', ALL_SPELLS.mend_minor_miracles.element)).toBe('heal');
    expect(getVfxElementForSpell('reversal_of_misfortune', ALL_SPELLS.reversal_of_misfortune.element)).toBe('heal');
    expect(getVfxElementForSpell('eternal_annihilation', ALL_SPELLS.eternal_annihilation.element)).toBe('arcane');
  });

  it('bounds particle pool size and cleans up expired particles', () => {
    const pool = new VfxParticlePool();
    const lowBudget = VFX_QUALITY_BUDGETS.low;
    const highBudget = VFX_QUALITY_BUDGETS.high;

    expect(lowBudget.particleScale).toBeLessThan(highBudget.particleScale);
    expect(lowBudget.maxParticles).toBeLessThan(highBudget.maxParticles);

    pool.spawnBurst(100, 100, 120, lowBudget.maxParticles, () => ({
      x: 100,
      y: 100,
      vx: 1,
      vy: -1,
      size: 4,
      color: 0xf97316,
      alpha: 1,
      maxLife: 10,
      rotation: 0,
      rotSpeed: 0,
      shape: 'flame',
      gravity: 0,
      drag: 0.95,
    }));

    expect(pool.count).toBe(lowBudget.maxParticles);

    pool.update(12);
    expect(pool.count).toBe(0);
  });

  it('emits element-tagged projectiles for all targets in multi-target spells', () => {
    const fired: ProjectileEventPayload[] = [];
    gameEvents.on('PROJECTILE_FIRED', (p) => fired.push(p));

    const spells = Object.values(ALL_SPELLS);
    useCombatStore.getState().initBattle(150, 150, 18, 0.1, spells, 'masters_disciples');

    const res = useCombatStore.getState().castSpell('eternal_annihilation');
    expect(res.success).toBe(true);
    // masters_disciples has 3 enemies across all 3 lanes
    expect(fired).toHaveLength(3);
    expect(fired.every((p) => p.spellId === 'eternal_annihilation' && p.element === 'arcane')).toBe(true);
    // Distinct target Y coordinates for left/center/right lanes
    const uniqueTargets = new Set(fired.map((p) => `${p.targetX},${p.targetY}`));
    expect(uniqueTargets.size).toBe(3);
  });

  it('emits distinct defense and heal SPELL_CAST_EFFECT events without confusing healing with poison', () => {
    const castEvents: Array<{ spellId: string; element?: string }> = [];
    gameEvents.on('SPELL_CAST_EFFECT', (e) =>
      castEvents.push({ spellId: e.spellId, element: e.element })
    );

    const spells = Object.values(ALL_SPELLS);
    useCombatStore.getState().initBattle(150, 150, 18, 0.1, spells, 'solo_malakor');

    useCombatStore.getState().castSpell('ego_shield');
    expect(castEvents.some((e) => e.spellId === 'ego_shield' && e.element === 'defense')).toBe(true);

    useCombatStore.setState({ turnPhase: 'player_turn' });
    useCombatStore.getState().castSpell('mend_minor_miracles');
    expect(castEvents.some((e) => e.spellId === 'mend_minor_miracles' && e.element === 'heal')).toBe(true);
  });
});
