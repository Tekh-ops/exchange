import { create } from 'zustand';
import { EquipmentItem, INITIAL_EQUIPMENT } from '../equipment/equipmentRegistry';
import { PlayerProgression, checkLevelUp } from '../progression/progressionRules';
import { Spell } from '../spells/types';
import { getInitialSpellbook } from '../spells/spellRegistry';

interface PlayerState {
  progression: PlayerProgression;
  equipment: EquipmentItem[];
  spells: Spell[];
  baseMaxHp: number;
  baseMaxMana: number;
  baseSpellPower: number;
  baseCritRate: number;

  // Computed totals
  getTotalMaxHp: () => number;
  getTotalMaxMana: () => number;
  getTotalSpellPower: () => number;
  getTotalCritRate: () => number;

  addXp: (amount: number) => { leveledUp: boolean };
  addGold: (amount: number) => void;
  equipItem: (item: EquipmentItem) => void;
  resetPlayer: () => void;
}

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
  baseMaxHp: 120,
  baseMaxMana: 80,
  baseSpellPower: 14,
  baseCritRate: 0.1,

  getTotalMaxHp: () => {
    const equipBonus = get().equipment.reduce((acc, eq) => acc + eq.bonusHp, 0);
    return get().baseMaxHp + equipBonus;
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
      baseMaxHp: 120,
      baseMaxMana: 80,
      baseSpellPower: 14,
      baseCritRate: 0.1,
    });
  },
}));
