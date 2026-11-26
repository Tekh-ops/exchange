export const MAX_PLAYER_LEVEL = 50;

export interface PlayerAttributes {
  vitality: number;     // +Max HP & slight damage reduction
  intelligence: number; // +Spell Power & minor mana efficiency
  mind: number;         // +Max Mana & mana regen
  dexterity: number;    // +Dodge efficiency & crit rate
  arcane: number;       // +Status/synergy effectiveness & posture damage
}

export const DEFAULT_ATTRIBUTES: PlayerAttributes = {
  vitality: 1,
  intelligence: 1,
  mind: 1,
  dexterity: 1,
  arcane: 1,
};

export interface PlayerProgression {
  schemaVersion: number;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXpEarned: number;
  gold: number;
  masteryPoints: number;
  attributePoints: number;
  attributes: PlayerAttributes;
  battlesWon: number;
  battlesFought: number;
  respecTokens: number;
  unlockedSpellIds: string[];
  unlockedEquipmentIds: string[];
  firstBossVictories: string[];
  completedEncounterIds: string[];
  claimedBattleIds: string[];
}

// Configurable starting XP table for levels 1..9, then smooth quadratic-exponential curve up to 50
const EARLY_XP_CURVE: Record<number, number> = {
  1: 100,
  2: 180,
  3: 280,
  4: 400,
  5: 550,
  6: 720,
  7: 920,
  8: 1150,
  9: 1410,
};

export function calculateXpRequired(level: number): number {
  if (level >= MAX_PLAYER_LEVEL) return 0;
  if (EARLY_XP_CURVE[level] !== undefined) {
    return EARLY_XP_CURVE[level];
  }
  // Smooth continuation from level 9 (1410)
  return Math.floor(1410 + (level - 9) * 300 + Math.pow(level - 9, 2) * 35);
}

export interface LevelUpRewardSummary {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  attributePointsEarned: number;
  unlockedSpells: string[];
  unlockedEquipment: string[];
  extraPreparedSlotsUnlocked: number;
}

export const SPELL_UNLOCK_LEVELS: Record<string, number> = {
  petty_spark: 1,
  arcane_dart: 1,
  frigid_snub: 1,
  ego_shield: 1,
  cursed_hex: 1,
  mend_minor_miracles: 1,
  siphon_pride: 1,
  pyro_tantrum: 3,
  reversal_of_misfortune: 5,
};

export const EQUIPMENT_UNLOCK_LEVELS: Record<string, number> = {
  catalyst_of_hubris: 3,
  slippers_of_haste: 4,
};

export function getUnlockedSpellsForLevel(level: number, currentUnlocked: string[]): string[] {
  const set = new Set(currentUnlocked);
  for (const [spellId, reqLevel] of Object.entries(SPELL_UNLOCK_LEVELS)) {
    if (level >= reqLevel) set.add(spellId);
  }
  return Array.from(set);
}

export function getUnlockedEquipmentForLevel(level: number, currentUnlocked: string[]): string[] {
  const set = new Set(currentUnlocked);
  for (const [eqId, reqLevel] of Object.entries(EQUIPMENT_UNLOCK_LEVELS)) {
    if (level >= reqLevel) set.add(eqId);
  }
  return Array.from(set);
}

export function checkLevelUp(
  current: PlayerProgression,
  gainedXp: number,
  options?: { countAsVictory?: boolean }
): {
  newProgression: PlayerProgression;
  leveledUp: boolean;
  summary: LevelUpRewardSummary;
  statGains?: { maxHp: number; maxMana: number; spellPower: number };
} {
  const countVictory = options?.countAsVictory ?? true;
  const safeXp = Math.max(0, Math.floor(gainedXp));
  const previousLevel = current.level;

  let {
    level,
    currentXp,
    xpToNextLevel,
    totalXpEarned,
    masteryPoints,
    attributePoints,
    battlesWon,
    unlockedSpellIds,
    unlockedEquipmentIds,
  } = current;

  currentXp += safeXp;
  totalXpEarned += safeXp;
  if (countVictory) {
    battlesWon += 1;
  }

  let leveledUp = false;
  let levelsGained = 0;

  while (level < MAX_PLAYER_LEVEL && xpToNextLevel > 0 && currentXp >= xpToNextLevel) {
    currentXp -= xpToNextLevel;
    level += 1;
    levelsGained += 1;
    masteryPoints += 1;
    attributePoints += 2; // 2 attribute points per level-up
    xpToNextLevel = calculateXpRequired(level);
    leveledUp = true;
  }

  if (level >= MAX_PLAYER_LEVEL) {
    currentXp = 0;
    xpToNextLevel = 0;
  }

  const nextSpells = getUnlockedSpellsForLevel(level, unlockedSpellIds);
  const newSpells = nextSpells.filter((id) => !unlockedSpellIds.includes(id));

  const nextEquip = getUnlockedEquipmentForLevel(level, unlockedEquipmentIds);
  const newEquip = nextEquip.filter((id) => !unlockedEquipmentIds.includes(id));

  const prevBonusSlots = (previousLevel >= 4 ? 1 : 0) + (previousLevel >= 8 ? 1 : 0);
  const newBonusSlots = (level >= 4 ? 1 : 0) + (level >= 8 ? 1 : 0);

  return {
    newProgression: {
      ...current,
      level,
      currentXp,
      xpToNextLevel,
      totalXpEarned,
      masteryPoints,
      attributePoints,
      battlesWon,
      unlockedSpellIds: nextSpells,
      unlockedEquipmentIds: nextEquip,
    },
    leveledUp,
    summary: {
      previousLevel,
      newLevel: level,
      levelsGained,
      attributePointsEarned: levelsGained * 2,
      unlockedSpells: newSpells,
      unlockedEquipment: newEquip,
      extraPreparedSlotsUnlocked: Math.max(0, newBonusSlots - prevBonusSlots),
    },
    statGains: leveledUp
      ? {
          maxHp: 12 * levelsGained,
          maxMana: 8 * levelsGained,
          spellPower: 2 * levelsGained,
        }
      : undefined,
  };
}

export interface BattleXpInput {
  outcome: 'victory' | 'defeat' | 'fled' | 'draw' | 'abandoned';
  baseEncounterXp: number;
  difficulty: 'duel' | 'skirmish' | 'hard' | 'boss' | 'legendary';
  enemiesDefeated: number;
  totalEnemies: number;
  damageDealt: number;
  dodgesSucceeded: number;
  staggersTriggered: number;
  isFirstBossVictory: boolean;
  bossFirstVictoryBonusXp?: number;
}

/**
 * Calculates XP awarded for an encounter.
 * Abandoned/fled battles award 0 XP to prevent quit-farming.
 * Defeats award small partial XP only if meaningful combat progress occurred.
 */
export function calculateBattleXp(input: BattleXpInput): number {
  if (input.outcome === 'fled' || input.outcome === 'abandoned') return 0;

  if (input.outcome === 'defeat') {
    if (input.damageDealt < 25 && input.enemiesDefeated === 0) return 0;
    return Math.min(40, Math.floor(input.baseEncounterXp * 0.15) + input.enemiesDefeated * 10);
  }

  const diffMult =
    input.difficulty === 'legendary'
      ? 1.5
      : input.difficulty === 'boss'
      ? 1.25
      : input.difficulty === 'hard'
      ? 1.15
      : input.difficulty === 'skirmish'
      ? 1.05
      : 1.0;

  const performanceBonus = Math.min(
    80,
    input.enemiesDefeated * 12 + input.dodgesSucceeded * 5 + input.staggersTriggered * 8
  );

  const firstClearBonus = input.isFirstBossVictory ? (input.bossFirstVictoryBonusXp ?? 150) : 0;
  return Math.round(input.baseEncounterXp * diffMult) + performanceBonus + firstClearBonus;
}

/**
 * Computes derived combat modifiers from player attributes.
 */
export function getDerivedAttributeBonuses(attr: PlayerAttributes) {
  const vit = Math.max(0, attr.vitality - 1);
  const intel = Math.max(0, attr.intelligence - 1);
  const mnd = Math.max(0, attr.mind - 1);
  const dex = Math.max(0, attr.dexterity - 1);
  const arc = Math.max(0, attr.arcane - 1);

  return {
    bonusHp: vit * 12,
    damageReduction: Math.min(0.2, vit * 0.015),
    bonusSpellPower: intel * 2,
    manaCostReduction: Math.min(4, Math.floor(intel / 3)),
    bonusMana: mnd * 10,
    bonusManaRegen: Math.floor(mnd / 2),
    dodgeEfficiencyBonus: Math.min(0.2, dex * 0.02),
    bonusCritRate: Math.min(0.2, dex * 0.015),
    synergyBonusMultiplier: 1 + Math.min(0.35, arc * 0.03),
    postureDamageMultiplier: 1 + Math.min(0.4, arc * 0.03),
  };
}
