import { OffensiveElement } from '../spells/types';

export interface LongTermBossMemory {
  bossId: string;
  totalEncounters: number;
  victories: number;
  defeats: number;
  historicalPlayerElementCounts: Record<OffensiveElement, number>;
  favoriteElementCountered?: OffensiveElement;
  grudgeLevel: number;
}

export class BossPersistenceManager {
  private static STORAGE_PREFIX = 'petty_sorcerer_boss_';
  private static inMemoryStore: Record<string, LongTermBossMemory> = {};

  public static getInitialBossMemory(bossId: string): LongTermBossMemory {
    return {
      bossId,
      totalEncounters: 0,
      victories: 0,
      defeats: 0,
      historicalPlayerElementCounts: {
        fire: 0,
        ice: 0,
        lightning: 0,
        arcane: 0,
        poison: 0,
      },
      grudgeLevel: 1,
    };
  }

  public static loadBossMemory(bossId: string): LongTermBossMemory {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(this.STORAGE_PREFIX + bossId);
        if (item) {
          return JSON.parse(item);
        }
      }
    } catch {
      // Fallback to in-memory
    }

    if (this.inMemoryStore[bossId]) {
      return { ...this.inMemoryStore[bossId] };
    }

    const initial = this.getInitialBossMemory(bossId);
    this.inMemoryStore[bossId] = initial;
    return initial;
  }

  public static saveBossMemory(memory: LongTermBossMemory): void {
    this.inMemoryStore[memory.bossId] = { ...memory };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          this.STORAGE_PREFIX + memory.bossId,
          JSON.stringify(memory)
        );
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  public static recordEncounterOutcome(
    bossId: string,
    playerWon: boolean,
    mostUsedElement: OffensiveElement | null
  ): LongTermBossMemory {
    const memory = this.loadBossMemory(bossId);
    memory.totalEncounters += 1;
    if (playerWon) {
      memory.defeats += 1;
      memory.grudgeLevel += 1;
    } else {
      memory.victories += 1;
    }

    if (mostUsedElement) {
      memory.historicalPlayerElementCounts[mostUsedElement] = 
        (memory.historicalPlayerElementCounts[mostUsedElement] || 0) + 1;
      memory.favoriteElementCountered = mostUsedElement;
    }

    this.saveBossMemory(memory);
    return memory;
  }

  public static clearAll(): void {
    this.inMemoryStore = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(this.STORAGE_PREFIX)) {
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch {
      // Ignored
    }
  }
}
