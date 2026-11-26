import { BattleRecord } from './BattleRecord';

// ─── Leaderboard Types ────────────────────────────────────────────────

export type LeaderboardCategory =
  | 'fastest_victory'
  | 'highest_damage'
  | 'most_spells_cast'
  | 'most_crits'
  | 'highest_healing'
  | 'fewest_turns_victory'
  | 'best_prediction_accuracy'
  | 'most_strategy_changes'
  | 'highest_single_battle_damage';

export interface LeaderboardEntry {
  rank: number;
  battleId: string;
  opponentName: string;
  date: string;
  value: number;
  formattedValue: string;
  outcome: string;
}

export interface LeaderboardResult {
  category: LeaderboardCategory;
  title: string;
  description: string;
  entries: LeaderboardEntry[];
  unit: string;
}

// ─── Category Definitions ─────────────────────────────────────────────

interface CategoryDef {
  title: string;
  description: string;
  unit: string;
  extract: (r: BattleRecord) => number;
  filter?: (r: BattleRecord) => boolean;
  sortOrder: 'asc' | 'desc';
  format: (val: number) => string;
}

const CATEGORY_DEFS: Record<LeaderboardCategory, CategoryDef> = {
  fastest_victory: {
    title: 'Fastest Victory',
    description: 'Shortest battle duration to defeat the enemy',
    unit: 'seconds',
    filter: (r) => r.outcome === 'victory',
    extract: (r) => r.durationMs,
    sortOrder: 'asc',
    format: (v) => `${(v / 1000).toFixed(1)}s`,
  },
  fewest_turns_victory: {
    title: 'Fewest Turns Victory',
    description: 'Lowest number of turns to achieve victory',
    unit: 'turns',
    filter: (r) => r.outcome === 'victory',
    extract: (r) => r.totalTurns,
    sortOrder: 'asc',
    format: (v) => `${v} turns`,
  },
  highest_damage: {
    title: 'Highest Damage Dealt',
    description: 'Most total damage dealt in a single battle',
    unit: 'damage',
    extract: (r) => r.combat.totalDamageDealt,
    sortOrder: 'desc',
    format: (v) => `${v} DMG`,
  },
  highest_single_battle_damage: {
    title: 'Biggest Single Hit',
    description: 'Highest damage from a single spell in one battle',
    unit: 'damage',
    extract: (r) => {
      let max = 0;
      for (const event of r.timeline) {
        if (event.type === 'damage_dealt' && event.value && event.value > max) {
          max = event.value;
        }
      }
      return max;
    },
    sortOrder: 'desc',
    format: (v) => `${v} DMG`,
  },
  most_spells_cast: {
    title: 'Most Spells Cast',
    description: 'Maximum number of spells cast in a single battle',
    unit: 'spells',
    extract: (r) => r.combat.totalSpellsCast,
    sortOrder: 'desc',
    format: (v) => `${v} spells`,
  },
  most_crits: {
    title: 'Most Critical Hits',
    description: 'Maximum critical strikes in one battle',
    unit: 'crits',
    extract: (r) => r.combat.criticalHits,
    sortOrder: 'desc',
    format: (v) => `${v} crits`,
  },
  highest_healing: {
    title: 'Most Healing Done',
    description: 'Maximum healing performed in a single battle',
    unit: 'HP',
    extract: (r) => r.combat.totalHealingPerformed,
    sortOrder: 'desc',
    format: (v) => `${v} HP`,
  },
  best_prediction_accuracy: {
    title: 'Enemy Prediction Accuracy',
    description: 'Highest enemy prediction accuracy against you',
    unit: '%',
    filter: (r) => r.adaptiveAI.predictionsMade >= 3,
    extract: (r) => r.adaptiveAI.predictionAccuracy,
    sortOrder: 'desc',
    format: (v) => `${v}%`,
  },
  most_strategy_changes: {
    title: 'Most Strategy Adaptations',
    description: 'Maximum strategy changes after enemy adapted',
    unit: 'changes',
    extract: (r) => r.adaptiveAI.strategyChangesAfterAdaptation,
    sortOrder: 'desc',
    format: (v) => `${v} shifts`,
  },
};

// ─── Engine ───────────────────────────────────────────────────────────

export class LeaderboardEngine {
  /**
   * Builds a ranked leaderboard for a specific category.
   * Deterministic tie-breaking: by date (earlier wins), then by battleId.
   */
  public static buildLeaderboard(
    records: BattleRecord[],
    category: LeaderboardCategory,
    maxEntries = 10
  ): LeaderboardResult {
    const def = CATEGORY_DEFS[category];

    let candidates = records.filter((r) =>
      r.outcome !== 'abandoned' && (!def.filter || def.filter(r))
    );

    // Sort by primary value, then tie-break by date, then by id
    candidates.sort((a, b) => {
      const valA = def.extract(a);
      const valB = def.extract(b);

      if (def.sortOrder === 'asc') {
        if (valA !== valB) return valA - valB;
      } else {
        if (valA !== valB) return valB - valA;
      }

      // Tie-break: earlier date wins
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (dateA !== dateB) return dateA - dateB;

      // Final tie-break: lexicographic battle ID
      return a.id.localeCompare(b.id);
    });

    // Filter out zero-value entries for certain categories
    if (['highest_damage', 'most_crits', 'highest_healing', 'most_strategy_changes', 'highest_single_battle_damage'].includes(category)) {
      candidates = candidates.filter((r) => def.extract(r) > 0);
    }

    const entries: LeaderboardEntry[] = candidates
      .slice(0, maxEntries)
      .map((r, i) => ({
        rank: i + 1,
        battleId: r.id,
        opponentName: r.opponentName,
        date: r.createdAt,
        value: def.extract(r),
        formattedValue: def.format(def.extract(r)),
        outcome: r.outcome,
      }));

    return {
      category,
      title: def.title,
      description: def.description,
      entries,
      unit: def.unit,
    };
  }

  /**
   * Builds all leaderboards at once.
   */
  public static buildAllLeaderboards(
    records: BattleRecord[],
    maxEntries = 10
  ): LeaderboardResult[] {
    return (Object.keys(CATEGORY_DEFS) as LeaderboardCategory[]).map((cat) =>
      this.buildLeaderboard(records, cat, maxEntries)
    );
  }

  /**
   * Checks if a new battle record establishes any personal records.
   */
  public static checkNewRecords(
    newRecord: BattleRecord,
    existingRecords: BattleRecord[]
  ): { category: LeaderboardCategory; newRank: number; previousBest?: number }[] {
    const results: { category: LeaderboardCategory; newRank: number; previousBest?: number }[] = [];

    for (const [cat, def] of Object.entries(CATEGORY_DEFS) as [LeaderboardCategory, CategoryDef][]) {
      if (def.filter && !def.filter(newRecord)) continue;

      const newVal = def.extract(newRecord);
      if (newVal === 0 && def.sortOrder === 'desc') continue;

      const board = this.buildLeaderboard(existingRecords, cat, 10);

      let rank = 1;
      for (const entry of board.entries) {
        if (def.sortOrder === 'asc') {
          if (newVal < entry.value) break;
        } else {
          if (newVal > entry.value) break;
        }
        rank += 1;
      }

      if (rank <= 3) {
        results.push({
          category: cat,
          newRank: rank,
          previousBest: board.entries[0]?.value,
        });
      }
    }

    return results;
  }

  /**
   * Returns all available category keys.
   */
  public static getCategories(): LeaderboardCategory[] {
    return Object.keys(CATEGORY_DEFS) as LeaderboardCategory[];
  }
}
