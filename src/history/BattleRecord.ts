import { OffensiveElement } from '../spells/types';

// ─── Schema Version ───────────────────────────────────────────────────
export const BATTLE_RECORD_SCHEMA_VERSION = 1;

// ─── Enums ────────────────────────────────────────────────────────────
export type BattleOutcome = 'victory' | 'defeat' | 'draw' | 'fled' | 'abandoned';
export type GameMode = 'duel' | 'campaign' | 'practice';
export type TimelineEventType =
  | 'battle_started'
  | 'player_cast_spell'
  | 'enemy_cast_spell'
  | 'player_healed'
  | 'lifesteal_triggered'
  | 'shield_applied'
  | 'damage_dealt'
  | 'damage_received'
  | 'status_effect_applied'
  | 'enemy_developed_resistance'
  | 'enemy_predicted_spell'
  | 'enemy_prediction_succeeded'
  | 'enemy_prediction_failed'
  | 'enemy_prepared_counter'
  | 'punishment_triggered'
  | 'enemy_emotion_changed'
  | 'player_strategy_changed'
  | 'critical_hp_threshold'
  | 'battle_ended';

// ─── Timeline Event ───────────────────────────────────────────────────
export interface BattleTimelineEvent {
  timestamp: number;        // ms elapsed since battle start
  turn: number;
  type: TimelineEventType;
  actor: 'player' | 'enemy' | 'system';
  description: string;
  spellId?: string;
  spellName?: string;
  element?: OffensiveElement | 'defense';
  value?: number;           // damage / heal amount
  metadata?: Record<string, unknown>;
}

// ─── Combat Summary Stats ─────────────────────────────────────────────
export interface CombatSummaryStats {
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalHealingPerformed: number;
  totalLifesteal: number;
  totalManaConsumed: number;
  totalSpellsCast: number;
  successfulAttacks: number;
  blockedOrCounteredAttacks: number;
  criticalHits: number;
  statusEffectsApplied: number;
}

// ─── Spell Usage Stats ────────────────────────────────────────────────
export interface SpellUsageStats {
  spellCastCounts: Record<string, number>;   // spellId → casts
  elementDistribution: Record<OffensiveElement, number>; // element → casts
  mostUsedSpell: { id: string; name: string; count: number } | null;
  mostUsedElement: { element: OffensiveElement; count: number } | null;
  uniqueSpellsUsed: number;
  defensiveActions: number;
}

// ─── Adaptive AI Stats ────────────────────────────────────────────────
export interface AdaptiveAIStats {
  predictionsMade: number;
  correctPredictions: number;
  incorrectPredictions: number;
  predictionAccuracy: number;    // 0–100
  maxResistanceReached: Record<OffensiveElement, number>; // 0–1 scale
  timesEnemyAdapted: number;
  successfulPunishments: number;
  strategyChangesAfterAdaptation: number;
}

// ─── Progression & Rewards ────────────────────────────────────────────
export interface ProgressionRewards {
  xpEarned: number;
  goldEarned: number;
  itemsEarned: string[];
  levelBefore: number;
  levelAfter: number;
  unlocksEarned: string[];
}

// ─── Full Battle Record ───────────────────────────────────────────────
export interface BattleRecord {
  // Identity
  id: string;
  schemaVersion: number;
  createdAt: string;          // ISO 8601

  // Basic info
  gameMode: GameMode;
  opponentName: string;
  opponentId: string;
  bossName?: string;
  bossId?: string;
  bossDifficulty?: number;

  // Duration
  durationMs: number;
  totalTurns: number;
  outcome: BattleOutcome;

  // Stats
  combat: CombatSummaryStats;
  spellUsage: SpellUsageStats;
  adaptiveAI: AdaptiveAIStats;
  progression: ProgressionRewards;

  // Timeline
  timeline: BattleTimelineEvent[];
}
