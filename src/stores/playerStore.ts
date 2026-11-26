import { create } from 'zustand';
import {
  EquipmentItem,
  INITIAL_EQUIPMENT,
  ALTERNATE_EQUIPMENT,
} from '../equipment/equipmentRegistry';
import {
  PlayerProgression,
  PlayerAttributes,
  DEFAULT_ATTRIBUTES,
  LevelUpRewardSummary,
  calculateXpRequired,
  checkLevelUp,
  getDerivedAttributeBonuses,
  getUnlockedSpellsForLevel,
  getUnlockedEquipmentForLevel,
} from '../progression/progressionRules';
import { Spell } from '../spells/types';
import { ALL_SPELLS, getInitialSpellbook } from '../spells/spellRegistry';

const PROFILE_STORAGE_KEY = 'petty_sorcerer_player_profile_v1';
const CURRENT_SCHEMA_VERSION = 2;

const DEFAULT_PREPARED_IDS = [
  'petty_spark',
  'arcane_dart',
  'frigid_snub',
  'ego_shield',
  'cursed_hex',
];

const INITIAL_UNLOCKED_SPELLS = getUnlockedSpellsForLevel(1, []);
const INITIAL_UNLOCKED_EQUIPMENT = INITIAL_EQUIPMENT.map((e) => e.id);

export interface EncounterRewardClaimResult {
  alreadyClaimed: boolean;
  xpEarned: number;
  goldEarned: number;
  leveledUp: boolean;
  levelSummary: LevelUpRewardSummary;
  isFirstBossVictory: boolean;
  unlockedBossItems: string[];
  unlockedBossSpells: string[];
}

function createDefaultProgression(): PlayerProgression {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    level: 1,
    currentXp: 0,
    xpToNextLevel: calculateXpRequired(1),
    totalXpEarned: 0,
    gold: 50,
    masteryPoints: 0,
    attributePoints: 0,
    attributes: { ...DEFAULT_ATTRIBUTES },
    battlesWon: 0,
    battlesFought: 0,
    respecTokens: 1,
    unlockedSpellIds: [...INITIAL_UNLOCKED_SPELLS],
    unlockedEquipmentIds: [...INITIAL_UNLOCKED_EQUIPMENT],
    firstBossVictories: [],
    completedEncounterIds: [],
    claimedBattleIds: [],
  };
}

interface PersistedProfile {
  schemaVersion: number;
  progression: PlayerProgression;
  equipment: EquipmentItem[];
  preparedSpellIds: string[];
  baseMaxHp: number;
  baseMaxMana: number;
  baseSpellPower: number;
  baseCritRate: number;
}

function loadPersistedProfile(): Partial<PersistedProfile> | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersistedProfile>;
      if (!parsed || !parsed.progression) return null;

      const defaults = createDefaultProgression();
      const mergedProg: PlayerProgression = {
        ...defaults,
        ...parsed.progression,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        attributes: {
          ...DEFAULT_ATTRIBUTES,
          ...(parsed.progression.attributes || {}),
        },
        unlockedSpellIds: getUnlockedSpellsForLevel(
          parsed.progression.level || 1,
          parsed.progression.unlockedSpellIds || INITIAL_UNLOCKED_SPELLS
        ),
        unlockedEquipmentIds: getUnlockedEquipmentForLevel(
          parsed.progression.level || 1,
          parsed.progression.unlockedEquipmentIds || INITIAL_UNLOCKED_EQUIPMENT
        ),
        firstBossVictories: parsed.progression.firstBossVictories || [],
        completedEncounterIds: parsed.progression.completedEncounterIds || [],
        claimedBattleIds: (parsed.progression.claimedBattleIds || []).slice(-100),
      };

      return {
        ...parsed,
        progression: mergedProg,
      };
    }
  } catch {
    // Fallback cleanly if storage is corrupted or unavailable
  }
  return null;
}

function persistProfile(state: {
  progression: PlayerProgression;
  equipment: EquipmentItem[];
  preparedSpellIds: string[];
  baseMaxHp: number;
  baseMaxMana: number;
  baseSpellPower: number;
  baseCritRate: number;
}): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const payload: PersistedProfile = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        progression: state.progression,
        equipment: state.equipment,
        preparedSpellIds: state.preparedSpellIds,
        baseMaxHp: state.baseMaxHp,
        baseMaxMana: state.baseMaxMana,
        baseSpellPower: state.baseSpellPower,
        baseCritRate: state.baseCritRate,
      };
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

interface PlayerState {
  progression: PlayerProgression;
  equipment: EquipmentItem[];
  spells: Spell[];
  preparedSpellIds: string[];
  baseMaxHp: number;
  baseMaxMana: number;
  baseSpellPower: number;
  baseCritRate: number;

  // Computed totals (base + level + attributes + equipment)
  getTotalMaxHp: () => number;
  getTotalMaxMana: () => number;
  getTotalSpellPower: () => number;
  getTotalCritRate: () => number;
  getMaxPreparedSpells: () => number;
  getUnlockedSpells: () => Spell[];
  getPreparedSpells: () => Spell[];
  getChargeCostReduction: () => number;
  getDodgeEfficiencyBonus: () => number;
  getPostureDamageMultiplier: () => number;
  getHealingBonusMultiplier: () => number;
  getSynergyBonusMultiplier: () => number;
  getDamageReduction: () => number;
  getManaRegenBonus: () => number;
  getAvailableEquipmentPool: () => EquipmentItem[];

  // Actions
  togglePrepareSpell: (spellId: string) => { success: boolean; reason?: string };
  allocateAttributes: (delta: Partial<PlayerAttributes>) => { success: boolean; reason?: string };
  respecAttributes: () => { success: boolean; reason?: string };
  addXp: (amount: number, options?: { countAsVictory?: boolean }) => {
    leveledUp: boolean;
    summary: LevelUpRewardSummary;
  };
  addGold: (amount: number) => void;
  claimEncounterRewards: (params: {
    battleId: string;
    encounterId: string;
    outcome: 'victory' | 'defeat' | 'fled' | 'draw' | 'abandoned';
    xpEarned: number;
    goldEarned: number;
    bossId?: string;
  }) => EncounterRewardClaimResult;
  equipItem: (item: EquipmentItem) => { success: boolean; reason?: string };
  resetPlayer: () => void;
}

const loaded = loadPersistedProfile();

export const usePlayerStore = create<PlayerState>((set, get) => ({
  progression: loaded?.progression || createDefaultProgression(),
  equipment: loaded?.equipment || [...INITIAL_EQUIPMENT],
  spells: getInitialSpellbook(),
  preparedSpellIds: loaded?.preparedSpellIds || [...DEFAULT_PREPARED_IDS],
  baseMaxHp: loaded?.baseMaxHp ?? 120,
  baseMaxMana: loaded?.baseMaxMana ?? 80,
  baseSpellPower: loaded?.baseSpellPower ?? 14,
  baseCritRate: loaded?.baseCritRate ?? 0.1,

  getTotalMaxHp: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusHp, 0);
    const attrBonus = getDerivedAttributeBonuses(get().progression.attributes).bonusHp;
    return Math.max(50, get().baseMaxHp + equipBonus + attrBonus);
  },

  getTotalMaxMana: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusMana, 0);
    const attrBonus = getDerivedAttributeBonuses(get().progression.attributes).bonusMana;
    return get().baseMaxMana + equipBonus + attrBonus;
  },

  getTotalSpellPower: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusSpellPower, 0);
    const attrBonus = getDerivedAttributeBonuses(get().progression.attributes).bonusSpellPower;
    return get().baseSpellPower + equipBonus + attrBonus;
  },

  getTotalCritRate: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusCritRate, 0);
    const attrBonus = getDerivedAttributeBonuses(get().progression.attributes).bonusCritRate;
    return Math.min(0.75, get().baseCritRate + equipBonus + attrBonus);
  },

  getMaxPreparedSpells: () => {
    const extra = get().equipment.reduce((acc, eq) => acc + (eq.extraSpellSlots || 0), 0);
    const level = get().progression.level;
    const levelBonus = (level >= 4 ? 1 : 0) + (level >= 8 ? 1 : 0);
    return 5 + extra + levelBonus;
  },

  getUnlockedSpells: () => {
    const unlocked = new Set(get().progression.unlockedSpellIds);
    return get().spells.filter((s) => unlocked.has(s.id));
  },

  getPreparedSpells: () => {
    const { preparedSpellIds } = get();
    const unlockedSpells = get().getUnlockedSpells();
    const limit = get().getMaxPreparedSpells();
    const prepared = unlockedSpells
      .filter((s) => preparedSpellIds.includes(s.id))
      .slice(0, limit);
    return prepared.length > 0 ? prepared : unlockedSpells.slice(0, limit);
  },

  getChargeCostReduction: () => {
    const eqRed = get().equipment.reduce((acc, eq) => acc + (eq.chargeCostReduction || 0), 0);
    const attrRed = getDerivedAttributeBonuses(get().progression.attributes).manaCostReduction;
    return eqRed + attrRed;
  },

  getDodgeEfficiencyBonus: () => {
    const eqBonus = get().equipment.reduce((acc, eq) => acc + (eq.dodgeEfficiencyBonus || 0), 0);
    const attrBonus = getDerivedAttributeBonuses(get().progression.attributes).dodgeEfficiencyBonus;
    return Math.min(0.35, eqBonus + attrBonus);
  },

  getPostureDamageMultiplier: () => {
    const eqMult = get().equipment.reduce((acc, eq) => acc * (eq.postureDamageMultiplier || 1), 1);
    const attrMult = getDerivedAttributeBonuses(get().progression.attributes).postureDamageMultiplier;
    return eqMult * attrMult;
  },

  getHealingBonusMultiplier: () =>
    get().equipment.reduce((acc, eq) => acc * (eq.healingBonusMultiplier || 1), 1),

  getSynergyBonusMultiplier: () =>
    getDerivedAttributeBonuses(get().progression.attributes).synergyBonusMultiplier,

  getDamageReduction: () =>
    getDerivedAttributeBonuses(get().progression.attributes).damageReduction,

  getManaRegenBonus: () =>
    getDerivedAttributeBonuses(get().progression.attributes).bonusManaRegen,

  getAvailableEquipmentPool: () => {
    const all = [...INITIAL_EQUIPMENT, ...ALTERNATE_EQUIPMENT];
    const unlocked = new Set(get().progression.unlockedEquipmentIds);
    return all.filter((item) => unlocked.has(item.id));
  },

  togglePrepareSpell: (spellId: string) => {
    const { preparedSpellIds, progression } = get();
    if (!progression.unlockedSpellIds.includes(spellId)) {
      return { success: false, reason: 'This spell is not yet unlocked.' };
    }
    const maxSlots = get().getMaxPreparedSpells();
    if (preparedSpellIds.includes(spellId)) {
      if (preparedSpellIds.length <= 1) {
        return { success: false, reason: 'At least 1 spell must remain prepared.' };
      }
      const next = preparedSpellIds.filter((id) => id !== spellId);
      set({ preparedSpellIds: next });
      persistProfile({ ...get(), preparedSpellIds: next });
      return { success: true };
    }
    if (preparedSpellIds.length >= maxSlots) {
      return {
        success: false,
        reason: `Spellbook limit reached (${maxSlots} slots). Unprepare a spell first.`,
      };
    }
    const next = [...preparedSpellIds, spellId];
    set({ preparedSpellIds: next });
    persistProfile({ ...get(), preparedSpellIds: next });
    return { success: true };
  },

  allocateAttributes: (delta: Partial<PlayerAttributes>) => {
    const { progression } = get();
    const keys: (keyof PlayerAttributes)[] = [
      'vitality',
      'intelligence',
      'mind',
      'dexterity',
      'arcane',
    ];
    let totalSpent = 0;
    for (const k of keys) {
      const add = Math.floor(delta[k] || 0);
      if (add < 0) return { success: false, reason: 'Cannot allocate negative attribute points.' };
      totalSpent += add;
    }

    if (totalSpent === 0) {
      return { success: false, reason: 'No attribute points selected.' };
    }
    if (totalSpent > progression.attributePoints) {
      return {
        success: false,
        reason: `Not enough attribute points (have ${progression.attributePoints}, need ${totalSpent}).`,
      };
    }

    const nextAttributes: PlayerAttributes = {
      vitality: progression.attributes.vitality + Math.floor(delta.vitality || 0),
      intelligence: progression.attributes.intelligence + Math.floor(delta.intelligence || 0),
      mind: progression.attributes.mind + Math.floor(delta.mind || 0),
      dexterity: progression.attributes.dexterity + Math.floor(delta.dexterity || 0),
      arcane: progression.attributes.arcane + Math.floor(delta.arcane || 0),
    };

    const nextProg: PlayerProgression = {
      ...progression,
      attributes: nextAttributes,
      attributePoints: progression.attributePoints - totalSpent,
    };

    set({ progression: nextProg });
    persistProfile({ ...get(), progression: nextProg });
    return { success: true };
  },

  respecAttributes: () => {
    const { progression } = get();
    const invested =
      progression.attributes.vitality -
      1 +
      (progression.attributes.intelligence - 1) +
      (progression.attributes.mind - 1) +
      (progression.attributes.dexterity - 1) +
      (progression.attributes.arcane - 1);

    if (invested <= 0) {
      return { success: false, reason: 'No invested attribute points to reset.' };
    }

    const RESPEC_GOLD_COST = 150;
    if (progression.respecTokens > 0) {
      const nextProg: PlayerProgression = {
        ...progression,
        respecTokens: progression.respecTokens - 1,
        attributes: { ...DEFAULT_ATTRIBUTES },
        attributePoints: progression.attributePoints + invested,
      };
      set({ progression: nextProg });
      persistProfile({ ...get(), progression: nextProg });
      return { success: true };
    }

    if (progression.gold >= RESPEC_GOLD_COST) {
      const nextProg: PlayerProgression = {
        ...progression,
        gold: progression.gold - RESPEC_GOLD_COST,
        attributes: { ...DEFAULT_ATTRIBUTES },
        attributePoints: progression.attributePoints + invested,
      };
      set({ progression: nextProg });
      persistProfile({ ...get(), progression: nextProg });
      return { success: true };
    }

    return {
      success: false,
      reason: `Respec requires 1 Respec Token or ${RESPEC_GOLD_COST} Gold.`,
    };
  },

  addXp: (amount: number, options?: { countAsVictory?: boolean }) => {
    const res = checkLevelUp(get().progression, amount, options);
    const nextMaxHp = res.statGains ? get().baseMaxHp + res.statGains.maxHp : get().baseMaxHp;
    const nextMaxMana = res.statGains ? get().baseMaxMana + res.statGains.maxMana : get().baseMaxMana;
    const nextSpellPower = res.statGains
      ? get().baseSpellPower + res.statGains.spellPower
      : get().baseSpellPower;

    set({
      progression: res.newProgression,
      baseMaxHp: nextMaxHp,
      baseMaxMana: nextMaxMana,
      baseSpellPower: nextSpellPower,
    });
    persistProfile({
      ...get(),
      progression: res.newProgression,
      baseMaxHp: nextMaxHp,
      baseMaxMana: nextMaxMana,
      baseSpellPower: nextSpellPower,
    });

    return { leveledUp: res.leveledUp, summary: res.summary };
  },

  addGold: (amount: number) => {
    const nextProg: PlayerProgression = {
      ...get().progression,
      gold: Math.max(0, get().progression.gold + amount),
    };
    set({ progression: nextProg });
    persistProfile({ ...get(), progression: nextProg });
  },

  claimEncounterRewards: ({
    battleId,
    encounterId,
    outcome,
    xpEarned,
    goldEarned,
    bossId,
  }) => {
    const state = get();
    const prog = state.progression;

    // Prevent duplicate reward claims for the same battle ID (even across page reloads)
    if (prog.claimedBattleIds.includes(battleId)) {
      return {
        alreadyClaimed: true,
        xpEarned: 0,
        goldEarned: 0,
        leveledUp: false,
        levelSummary: {
          previousLevel: prog.level,
          newLevel: prog.level,
          levelsGained: 0,
          attributePointsEarned: 0,
          unlockedSpells: [],
          unlockedEquipment: [],
          extraPreparedSlotsUnlocked: 0,
        },
        isFirstBossVictory: false,
        unlockedBossItems: [],
        unlockedBossSpells: [],
      };
    }

    const isVictory = outcome === 'victory';
    const isFirstBossVictory = Boolean(
      isVictory && bossId && !prog.firstBossVictories.includes(bossId)
    );

    const actualXp = outcome === 'fled' || outcome === 'abandoned' ? 0 : Math.max(0, xpEarned);
    const actualGold = isVictory ? Math.max(0, goldEarned) : 0;

    const lvlRes = checkLevelUp(
      {
        ...prog,
        battlesFought: prog.battlesFought + 1,
      },
      actualXp,
      { countAsVictory: isVictory }
    );

    const unlockedBossItems: string[] = [];
    const unlockedBossSpells: string[] = [];
    const nextSpells = new Set(lvlRes.newProgression.unlockedSpellIds);
    const nextEquip = new Set(lvlRes.newProgression.unlockedEquipmentIds);
    const nextBossVictories = [...lvlRes.newProgression.firstBossVictories];
    const nextCompleted = new Set(lvlRes.newProgression.completedEncounterIds);

    if (isVictory) {
      nextCompleted.add(encounterId);
      if (isFirstBossVictory && bossId) {
        nextBossVictories.push(bossId);
        if (bossId === 'vorath') {
          if (ALL_SPELLS.eternal_annihilation) {
            nextSpells.add('eternal_annihilation');
            unlockedBossSpells.push('eternal_annihilation');
          }
          nextEquip.add('crown_of_eternity');
          unlockedBossItems.push('crown_of_eternity');
        }
      }
    }

    const finalProgression: PlayerProgression = {
      ...lvlRes.newProgression,
      gold: lvlRes.newProgression.gold + actualGold,
      unlockedSpellIds: Array.from(nextSpells),
      unlockedEquipmentIds: Array.from(nextEquip),
      firstBossVictories: nextBossVictories,
      completedEncounterIds: Array.from(nextCompleted),
      claimedBattleIds: [...prog.claimedBattleIds.slice(-99), battleId],
    };

    const nextBaseHp = lvlRes.statGains ? state.baseMaxHp + lvlRes.statGains.maxHp : state.baseMaxHp;
    const nextBaseMana = lvlRes.statGains
      ? state.baseMaxMana + lvlRes.statGains.maxMana
      : state.baseMaxMana;
    const nextBasePow = lvlRes.statGains
      ? state.baseSpellPower + lvlRes.statGains.spellPower
      : state.baseSpellPower;

    set({
      progression: finalProgression,
      baseMaxHp: nextBaseHp,
      baseMaxMana: nextBaseMana,
      baseSpellPower: nextBasePow,
    });
    persistProfile({
      ...get(),
      progression: finalProgression,
      baseMaxHp: nextBaseHp,
      baseMaxMana: nextBaseMana,
      baseSpellPower: nextBasePow,
    });

    return {
      alreadyClaimed: false,
      xpEarned: actualXp,
      goldEarned: actualGold,
      leveledUp: lvlRes.leveledUp,
      levelSummary: lvlRes.summary,
      isFirstBossVictory,
      unlockedBossItems,
      unlockedBossSpells,
    };
  },

  equipItem: (item: EquipmentItem) => {
    const { progression } = get();
    if (item.minLevel && progression.level < item.minLevel) {
      return {
        success: false,
        reason: `Requires Level ${item.minLevel} to equip ${item.name}.`,
      };
    }
    const nextEquip = [...get().equipment.filter((e) => e.slot !== item.slot), item];
    set({ equipment: nextEquip });
    persistProfile({ ...get(), equipment: nextEquip });
    return { success: true };
  },

  resetPlayer: () => {
    const fresh = createDefaultProgression();
    const initial = {
      progression: fresh,
      equipment: [...INITIAL_EQUIPMENT],
      spells: getInitialSpellbook(),
      preparedSpellIds: [...DEFAULT_PREPARED_IDS],
      baseMaxHp: 120,
      baseMaxMana: 80,
      baseSpellPower: 14,
      baseCritRate: 0.1,
    };
    set(initial);
    persistProfile(initial);
  },
}));
