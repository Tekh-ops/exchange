export interface PlayerProgression {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  gold: number;
  masteryPoints: number;
  battlesWon: number;
}

export function calculateXpRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.3, level - 1));
}

export function checkLevelUp(current: PlayerProgression, gainedXp: number): {
  newProgression: PlayerProgression;
  leveledUp: boolean;
  statGains?: { maxHp: number; maxMana: number; spellPower: number };
} {
  let { level, currentXp, xpToNextLevel, masteryPoints, battlesWon } = current;
  currentXp += gainedXp;
  battlesWon += 1;
  let leveledUp = false;

  while (currentXp >= xpToNextLevel) {
    currentXp -= xpToNextLevel;
    level += 1;
    masteryPoints += 1;
    xpToNextLevel = calculateXpRequired(level);
    leveledUp = true;
  }

  return {
    newProgression: {
      ...current,
      level,
      currentXp,
      xpToNextLevel,
      masteryPoints,
      battlesWon,
    },
    leveledUp,
    statGains: leveledUp ? { maxHp: 15, maxMana: 10, spellPower: 4 } : undefined,
  };
}
