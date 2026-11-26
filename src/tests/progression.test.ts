import { describe, it, expect } from 'vitest';
import { calculateXpRequired, checkLevelUp } from '../progression/progressionRules';

describe('Player Progression & Level Up System', () => {
  it('calculates scaling XP thresholds across levels', () => {
    const lvl1 = calculateXpRequired(1);
    const lvl2 = calculateXpRequired(2);
    const lvl3 = calculateXpRequired(3);

    expect(lvl1).toBe(100);
    expect(lvl2).toBeGreaterThan(lvl1);
    expect(lvl3).toBeGreaterThan(lvl2);
  });

  it('triggers level up and stat gains when XP threshold is reached', () => {
    const initialProgression = {
      level: 1,
      currentXp: 80,
      xpToNextLevel: 100,
      gold: 20,
      masteryPoints: 0,
      battlesWon: 0,
    };

    const res = checkLevelUp(initialProgression, 50);
    expect(res.leveledUp).toBe(true);
    expect(res.newProgression.level).toBe(2);
    expect(res.newProgression.currentXp).toBe(30);
    expect(res.statGains).toBeDefined();
    expect(res.statGains?.maxHp).toBeGreaterThan(0);
  });
});
