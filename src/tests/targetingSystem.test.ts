import { describe, it, expect } from 'vitest';
import { resolveSpellTargets } from '../combat/TargetingSystem';
import { getInitialSpellbook } from '../spells/spellRegistry';
import { CombatEntity } from '../combat/combatTypes';

function makeEnemy(id: string, lane: 'left' | 'center' | 'right', hp = 50): CombatEntity {
  return {
    id,
    name: id,
    title: 'Foe',
    hp,
    maxHp: 50,
    mana: 50,
    maxMana: 50,
    shield: 0,
    spellPower: 10,
    critRate: 0.1,
    statusEffects: [],
    lane,
  };
}

describe('TargetingSystem', () => {
  const spells = getInitialSpellbook();
  const singleSpell = spells.find((s) => s.id === 'arcane_dart')!;
  const allSpell = spells.find((s) => s.id === 'pyro_tantrum')!;
  const defSpell = spells.find((s) => s.id === 'ego_shield')!;

  it('resolves single, all_enemies, lane, and self rules', () => {
    const enemies = [makeEnemy('e1', 'left'), makeEnemy('e2', 'center'), makeEnemy('e3', 'right')];

    const single = resolveSpellTargets(singleSpell, 'center', enemies, 'e2');
    expect(single.valid).toBe(true);
    expect(single.targets.map((t) => t.id)).toEqual(['e2']);

    const all = resolveSpellTargets(allSpell, 'center', enemies, 'e2', 'all_enemies');
    expect(all.valid).toBe(true);
    expect(all.targets).toHaveLength(3);

    const laneHit = resolveSpellTargets(singleSpell, 'left', enemies, 'e1', 'lane');
    expect(laneHit.valid).toBe(true);
    expect(laneHit.targets.map((t) => t.id)).toEqual(['e1']);

    const laneMiss = resolveSpellTargets(singleSpell, 'center', [makeEnemy('e1', 'left')], 'e1', 'lane');
    expect(laneMiss.valid).toBe(false);

    const selfRes = resolveSpellTargets(defSpell, 'center', enemies, 'e1');
    expect(selfRes.valid).toBe(true);
    expect(selfRes.targets).toHaveLength(0);
  });
});
