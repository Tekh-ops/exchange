import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateXpRequired,
  checkLevelUp,
  calculateBattleXp,
  getDerivedAttributeBonuses,
  DEFAULT_ATTRIBUTES,
} from '../progression/progressionRules';
import { usePlayerStore } from '../stores/playerStore';

describe('Progression & Leveling Rules', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it('follows the configured XP curve for levels 1..9', () => {
    expect(calculateXpRequired(1)).toBe(100);
    expect(calculateXpRequired(2)).toBe(180);
    expect(calculateXpRequired(3)).toBe(280);
    expect(calculateXpRequired(9)).toBe(1410);
  });

  it('carries over excess XP and handles multiple level-ups', () => {
    const start = usePlayerStore.getState().progression;
    // Level 1 needs 100, Level 2 needs 180 -> 300 XP = Level 3 with 20 excess XP
    const res = checkLevelUp(start, 300);
    expect(res.leveledUp).toBe(true);
    expect(res.newProgression.level).toBe(3);
    expect(res.newProgression.currentXp).toBe(20);
    expect(res.newProgression.attributePoints).toBe(4);
    expect(res.newProgression.unlockedSpellIds).toContain('siphon_pride');
    expect(res.newProgression.unlockedSpellIds).toContain('pyro_tantrum');
  });

  it('awards 0 XP for abandoned/fled battles', () => {
    const fledXp = calculateBattleXp({
      outcome: 'fled',
      baseEncounterXp: 100,
      difficulty: 'boss',
      enemiesDefeated: 0,
      totalEnemies: 1,
      damageDealt: 50,
      dodgesSucceeded: 1,
      staggersTriggered: 0,
      isFirstBossVictory: false,
    });
    expect(fledXp).toBe(0);
  });

  it('allocates attributes, recalculates derived stats, and respecs via token', () => {
    const store = usePlayerStore.getState();
    store.addXp(120); // Level 2 (+2 attribute points)

    const baseHp = usePlayerStore.getState().getTotalMaxHp();
    const alloc = usePlayerStore.getState().allocateAttributes({ vitality: 2 });
    expect(alloc.success).toBe(true);
    expect(usePlayerStore.getState().getTotalMaxHp()).toBe(baseHp + 24);

    const derived = getDerivedAttributeBonuses({ ...DEFAULT_ATTRIBUTES, dexterity: 4 });
    expect(derived.dodgeEfficiencyBonus).toBeCloseTo(0.06);

    const respec = usePlayerStore.getState().respecAttributes();
    expect(respec.success).toBe(true);
    expect(usePlayerStore.getState().progression.attributePoints).toBe(2);
  });

  it('prevents duplicate encounter reward claims for the same battleId', () => {
    const first = usePlayerStore.getState().claimEncounterRewards({
      battleId: 'battle-unique-1',
      encounterId: 'solo_malakor',
      outcome: 'victory',
      xpEarned: 100,
      goldEarned: 35,
      bossId: 'malakor',
    });
    expect(first.alreadyClaimed).toBe(false);
    expect(first.xpEarned).toBe(100);

    const dup = usePlayerStore.getState().claimEncounterRewards({
      battleId: 'battle-unique-1',
      encounterId: 'solo_malakor',
      outcome: 'victory',
      xpEarned: 100,
      goldEarned: 35,
      bossId: 'malakor',
    });
    expect(dup.alreadyClaimed).toBe(true);
    expect(dup.xpEarned).toBe(0);
  });
});
