import { create } from 'zustand';
import { EquipmentItem, INITIAL_EQUIPMENT } from '../equipment/equipmentRegistry';
import { PlayerProgression, checkLevelUp } from '../progression/progressionRules';
import { Spell } from '../spells/types';
import { getInitialSpellbook } from '../spells/spellRegistry';

interface PlayerState {
  progression: PlayerProgression;
  equipment: EquipmentItem[];
  spells: Spell[];
  preparedSpellIds: string[];
  baseMaxHp: number;
  baseMaxMana: number;
  baseSpellPower: number;
  baseCritRate: number;

  // Computed totals
  getTotalMaxHp: () => number;
  getTotalMaxMana: () => number;
  getTotalSpellPower: () => number;
  getTotalCritRate: () => number;
  getMaxPreparedSpells: () => number;
  getPreparedSpells: () => Spell[];
  getChargeCostReduction: () => number;
  getDodgeEfficiencyBonus: () => number;
  getPostureDamageMultiplier: () => number;
  getHealingBonusMultiplier: () => number;

  togglePrepareSpell: (spellId: string) => { success: boolean; reason?: string };
  addXp: (amount: number) => { leveledUp: boolean };
  addGold: (amount: number) => void;
  equipItem: (item: EquipmentItem) => void;
  resetPlayer: () => void;
}

const DEFAULT_PREPARED_IDS = [
  'petty_spark',
  'arcane_dart',
  'frigid_snub',
  'pyro_tantrum',
  'ego_shield',
  'siphon_pride',
];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  progression: {
    level: 1,
    currentXp: 0,
    xpToNextLevel: 100,
    gold: 50,
    masteryPoints: 0,
    battlesWon: 0,
  },
  equipment: [...INITIAL_EQUIPMENT],
  spells: getInitialSpellbook(),
  preparedSpellIds: [...DEFAULT_PREPARED_IDS],
  baseMaxHp: 120,
  baseMaxMana: 80,
  baseSpellPower: 14,
  baseCritRate: 0.1,

  getTotalMaxHp: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusHp, 0);
    return Math.max(50, get().baseMaxHp + equipBonus);
  },

  getTotalMaxMana: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusMana, 0);
    return get().baseMaxMana + equipBonus;
  },

  getTotalSpellPower: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusSpellPower, 0);
    return get().baseSpellPower + equipBonus;
  },

  getTotalCritRate: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusCritRate, 0);
    return Math.min(0.75, get().baseCritRate + equipBonus);
  },

  getMaxPreparedSpells: () => {
    const extra = get().equipment.reduce((acc, eq) => acc + (eq.extraSpellSlots || 0), 0);
    return 5 + extra;
  },

  getPreparedSpells: () => {
    const { spells, preparedSpellIds } = get();
    const limit = get().getMaxPreparedSpells();
    const prepared = spells.filter((s) => preparedSpellIds.includes(s.id)).slice(0, limit);
    return prepared.length > 0 ? prepared : spells.slice(0, limit);
  },

  getChargeCostReduction: () =>
    get().equipment.reduce((acc, eq) => acc + (eq.chargeCostReduction || 0), 0),

  getDodgeEfficiencyBonus: () =>
    get().equipment.reduce((acc, eq) => acc + (eq.dodgeEfficiencyBonus || 0), 0),

  getPostureDamageMultiplier: () =>
    get().equipment.reduce((acc, eq) => acc * (eq.postureDamageMultiplier || 1), 1),

  getHealingBonusMultiplier: () =>
    get().equipment.reduce((acc, eq) => acc * (eq.healingBonusMultiplier || 1), 1),

  togglePrepareSpell: (spellId: string) => {
    const { preparedSpellIds } = get();
    const maxSlots = get().getMaxPreparedSpells();
    if (preparedSpellIds.includes(spellId)) {
      if (preparedSpellIds.length <= 1) {
        return { success: false, reason: 'At least 1 spell must remain prepared.' };
      }
      set({ preparedSpellIds: preparedSpellIds.filter((id) => id !== spellId) });
      return { success: true };
    }
    if (preparedSpellIds.length >= maxSlots) {
      return {
        success: false,
        reason: `Spellbook limit reached (${maxSlots} slots). Unprepare a spell first.`,
      };
    }
    set({ preparedSpellIds: [...preparedSpellIds, spellId] });
    return { success: true };
  },

  addXp: (amount: number) => {
    const res = checkLevelUp(get().progression, amount);
    set({ progression: res.newProgression });
    if (res.statGains) {
      set((state) => ({
        baseMaxHp: state.baseMaxHp + res.statGains!.maxHp,
        baseMaxMana: state.baseMaxMana + res.statGains!.maxMana,
        baseSpellPower: state.baseSpellPower + res.statGains!.spellPower,
      }));
    }
    return { leveledUp: res.leveledUp };
  },

  addGold: (amount: number) => {
    set((state) => ({
      progression: {
        ...state.progression,
        gold: state.progression.gold + amount,
      },
    }));
  },

  equipItem: (item: EquipmentItem) => {
    set((state) => ({
      equipment: [...state.equipment.filter((e) => e.slot !== item.slot), item],
    }));
  },

  resetPlayer: () => {
    set({
      progression: {
        level: 1,
        currentXp: 0,
        xpToNextLevel: 100,
        gold: 50,
        masteryPoints: 0,
        battlesWon: 0,
      },
      equipment: [...INITIAL_EQUIPMENT],
      spells: getInitialSpellbook(),
      preparedSpellIds: [...DEFAULT_PREPARED_IDS],
      baseMaxHp: 120,
      baseMaxMana: 80,
      baseSpellPower: 14,
      baseCritRate: 0.1,
    });
  },
}));
