import { describe, it, expect } from 'vitest';
import { PostureSystem } from '../combat/PostureSystem';
import { CombatEntity } from '../combat/combatTypes';

function makeEnemy(posture = 0, maxPosture = 50): CombatEntity {
  return {
    id: 'enemy',
    name: 'Enemy',
    title: 'Boss',
    hp: 100,
    maxHp: 100,
    mana: 80,
    maxMana: 80,
    shield: 0,
    spellPower: 14,
    critRate: 0.1,
    statusEffects: [],
    posture,
    maxPosture,
    isStaggered: false,
  };
}

describe('PostureSystem', () => {
  it('accumulates posture damage and triggers stagger at maxPosture', () => {
    const e1 = makeEnemy(0, 50);
    const r1 = PostureSystem.applyPostureDamage(e1, 30);
    expect(r1.triggeredStagger).toBe(false);
    expect(r1.updatedEntity.posture).toBe(30);

    const r2 = PostureSystem.applyPostureDamage(r1.updatedEntity, 25);
    expect(r2.triggeredStagger).toBe(true);
    expect(r2.updatedEntity.isStaggered).toBe(true);
    expect(r2.updatedEntity.posture).toBe(0);
  });

  it('recovers and clears stagger state cleanly', () => {
    const e = { ...makeEnemy(30, 50), isStaggered: true };
    const recovered = PostureSystem.recoverPosture(e, 15);
    expect(recovered.posture).toBe(15);

    const cleared = PostureSystem.clearStagger(recovered);
    expect(cleared.isStaggered).toBe(false);
    expect(cleared.posture).toBe(0);
  });
});
