import { describe, it, expect } from 'vitest';
import { BossPhaseManager } from '../encounters/BossPhaseManager';
import { CombatEntity } from '../combat/combatTypes';

function makeMalakor(hp: number, maxHp = 160): CombatEntity {
  return {
    id: 'enemy',
    name: 'Arch-Mage Malakor',
    title: 'Boss',
    hp,
    maxHp,
    mana: 100,
    maxMana: 100,
    shield: 0,
    spellPower: 16,
    critRate: 0.12,
    statusEffects: [],
    isBoss: true,
    bossId: 'malakor',
    bossStage: 1,
  };
}

describe('BossPhaseManager', () => {
  it('transitions boss stages when HP drops below stage thresholds', () => {
    const full = makeMalakor(160);
    expect(BossPhaseManager.evaluateStageTransition(full).transitioned).toBe(false);

    const mid = makeMalakor(90); // 56% <= 65%
    const stage2 = BossPhaseManager.evaluateStageTransition(mid);
    expect(stage2.transitioned).toBe(true);
    expect(stage2.newStage).toBe(2);
    expect(stage2.updatedEntity.spellPower).toBe(20);

    const low = makeMalakor(40); // 25% <= 32%
    const stage3 = BossPhaseManager.evaluateStageTransition(low);
    expect(stage3.transitioned).toBe(true);
    expect(stage3.newStage).toBe(3);
  });

  it('exposes stage-specific spell pools', () => {
    const s1 = BossPhaseManager.getAllowedSpellsForStage('malakor', 1);
    const s3 = BossPhaseManager.getAllowedSpellsForStage('malakor', 3);
    expect(s1).toContain('void_bolt');
    expect(s3).toContain('cataclysm_blast');
  });
});
