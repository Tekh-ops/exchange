import { OffensiveElement, OFFENSIVE_ELEMENTS } from '../spells/types';
import {
  BattleRecord,
  BattleTimelineEvent,
  BattleOutcome,
  GameMode,
  TimelineEventType,
  CombatSummaryStats,
  SpellUsageStats,
  AdaptiveAIStats,
  ProgressionRewards,
  BATTLE_RECORD_SCHEMA_VERSION,
} from './BattleRecord';

/**
 * Accumulates combat events during a single battle and produces
 * an immutable BattleRecord on finalization.
 */
export class BattleRecorder {
  private battleId: string;
  private startTime: number;
  private finalized = false;

  // Combat accumulators
  private damageDealt = 0;
  private damageReceived = 0;
  private healingPerformed = 0;
  private lifestealTotal = 0;
  private manaConsumed = 0;
  private spellsCast = 0;
  private successfulAttacks = 0;
  private blockedAttacks = 0;
  private criticalHits = 0;
  private statusEffectsApplied = 0;

  // Spell usage
  private spellCastCounts: Record<string, { name: string; count: number }> = {};
  private elementCounts: Record<OffensiveElement, number> = {
    fire: 0, ice: 0, lightning: 0, arcane: 0, poison: 0,
  };
  private defensiveActions = 0;

  // Adaptive AI tracking
  private predictionsMade = 0;
  private correctPredictions = 0;
  private incorrectPredictions = 0;
  private maxResistances: Record<OffensiveElement, number> = {
    fire: 0, ice: 0, lightning: 0, arcane: 0, poison: 0,
  };
  private adaptationEvents = 0;
  private punishmentSuccesses = 0;
  private strategyChanges = 0;

  // Timeline
  private timeline: BattleTimelineEvent[] = [];
  private currentTurn = 1;

  // Battle metadata
  private gameMode: GameMode = 'duel';
  private opponentName = 'Arch-Mage Malakor';
  private opponentId = 'malakor';
  private bossName?: string;
  private bossId?: string;

  constructor(config?: {
    gameMode?: GameMode;
    opponentName?: string;
    opponentId?: string;
    bossName?: string;
    bossId?: string;
  }) {
    this.battleId = `battle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.startTime = Date.now();

    if (config) {
      this.gameMode = config.gameMode ?? 'duel';
      this.opponentName = config.opponentName ?? 'Arch-Mage Malakor';
      this.opponentId = config.opponentId ?? 'malakor';
      this.bossName = config.bossName;
      this.bossId = config.bossId;
    }

    this.addTimelineEvent('battle_started', 'system', 'Battle commenced.');
  }

  public isFinalized(): boolean {
    return this.finalized;
  }

  public getBattleId(): string {
    return this.battleId;
  }

  // ─── Timeline ─────────────────────────────────────────────────────

  public addTimelineEvent(
    type: TimelineEventType,
    actor: 'player' | 'enemy' | 'system',
    description: string,
    extra?: {
      spellId?: string;
      spellName?: string;
      element?: OffensiveElement | 'defense';
      value?: number;
      metadata?: Record<string, unknown>;
    }
  ): void {
    if (this.finalized) return;

    this.timeline.push({
      timestamp: Date.now() - this.startTime,
      turn: this.currentTurn,
      type,
      actor,
      description,
      ...extra,
    });
  }

  // ─── Turn tracking ────────────────────────────────────────────────

  public setTurn(turn: number): void {
    this.currentTurn = turn;
  }

  // ─── Combat Accumulators ──────────────────────────────────────────

  public recordPlayerSpellCast(
    spellId: string,
    spellName: string,
    element: OffensiveElement | 'defense',
    manaCost: number,
    isOffensive: boolean
  ): void {
    if (this.finalized) return;

    this.spellsCast += 1;
    this.manaConsumed += manaCost;

    if (isOffensive && element !== 'defense') {
      const offEl = element as OffensiveElement;
      this.successfulAttacks += 1;
      this.elementCounts[offEl] = (this.elementCounts[offEl] || 0) + 1;

      if (!this.spellCastCounts[spellId]) {
        this.spellCastCounts[spellId] = { name: spellName, count: 0 };
      }
      this.spellCastCounts[spellId].count += 1;
    } else {
      this.defensiveActions += 1;
    }

    this.addTimelineEvent(
      isOffensive ? 'player_cast_spell' : 'shield_applied',
      'player',
      `Cast ${spellName}`,
      { spellId, spellName, element }
    );
  }

  public recordDamageDealt(amount: number, isCritical: boolean, element?: OffensiveElement): void {
    if (this.finalized) return;
    this.damageDealt += amount;
    if (isCritical) this.criticalHits += 1;

    this.addTimelineEvent('damage_dealt', 'player', `Dealt ${amount} damage${isCritical ? ' (CRIT)' : ''}`, {
      value: amount,
      element,
      metadata: { isCritical },
    });
  }

  public recordDamageReceived(amount: number, isCritical: boolean, blocked: boolean): void {
    if (this.finalized) return;
    this.damageReceived += amount;
    if (blocked) this.blockedAttacks += 1;

    this.addTimelineEvent('damage_received', 'player', `Received ${amount} damage${blocked ? ' (blocked)' : ''}`, {
      value: amount,
      metadata: { isCritical, blocked },
    });
  }

  public recordHealing(amount: number, isLifesteal: boolean): void {
    if (this.finalized) return;
    this.healingPerformed += amount;
    if (isLifesteal) this.lifestealTotal += amount;

    this.addTimelineEvent(
      isLifesteal ? 'lifesteal_triggered' : 'player_healed',
      'player',
      `Healed for ${amount} HP${isLifesteal ? ' (lifesteal)' : ''}`,
      { value: amount }
    );
  }

  public recordStatusEffect(effectName: string, target: 'player' | 'enemy'): void {
    if (this.finalized) return;
    this.statusEffectsApplied += 1;

    this.addTimelineEvent('status_effect_applied', target === 'enemy' ? 'player' : 'enemy', `${effectName} applied to ${target}`, {
      metadata: { effectName, target },
    });
  }

  public recordEnemySpellCast(spellName: string): void {
    if (this.finalized) return;
    this.addTimelineEvent('enemy_cast_spell', 'enemy', `Malakor cast ${spellName}`, {
      spellName,
    });
  }

  // ─── Adaptive AI Accumulators ─────────────────────────────────────

  public recordPrediction(predictedElement: OffensiveElement, confidence: number): void {
    if (this.finalized) return;
    this.predictionsMade += 1;

    this.addTimelineEvent('enemy_predicted_spell', 'enemy', `Predicted ${predictedElement.toUpperCase()} (${confidence}% confidence)`, {
      element: predictedElement,
      metadata: { confidence },
    });
  }

  public recordPredictionOutcome(wasCorrect: boolean, element: OffensiveElement): void {
    if (this.finalized) return;
    if (wasCorrect) {
      this.correctPredictions += 1;
      this.addTimelineEvent('enemy_prediction_succeeded', 'enemy', `Correctly predicted ${element.toUpperCase()}!`, { element });
    } else {
      this.incorrectPredictions += 1;
      this.addTimelineEvent('enemy_prediction_failed', 'enemy', `Prediction missed — expected different element`, { element });
    }
  }

  public recordResistanceUpdate(resistances: Record<OffensiveElement, number>): void {
    if (this.finalized) return;
    let anyIncrease = false;
    for (const el of OFFENSIVE_ELEMENTS) {
      if (resistances[el] > this.maxResistances[el]) {
        this.maxResistances[el] = resistances[el];
        anyIncrease = true;
      }
    }
    if (anyIncrease) {
      this.adaptationEvents += 1;
      const topEl = OFFENSIVE_ELEMENTS.reduce((a, b) => resistances[a] > resistances[b] ? a : b);
      this.addTimelineEvent('enemy_developed_resistance', 'enemy',
        `Resistance shifted — ${topEl.toUpperCase()} now ${Math.round(resistances[topEl] * 100)}%`,
        { element: topEl, metadata: { resistances: { ...resistances } } }
      );
    }
  }

  public recordPunishment(description: string): void {
    if (this.finalized) return;
    this.punishmentSuccesses += 1;
    this.addTimelineEvent('punishment_triggered', 'enemy', description);
  }

  public recordStrategyChange(): void {
    if (this.finalized) return;
    this.strategyChanges += 1;
    this.addTimelineEvent('player_strategy_changed', 'player', 'Changed elemental strategy after adaptation');
  }

  public recordEmotionChange(emotion: string, reason: string): void {
    if (this.finalized) return;
    this.addTimelineEvent('enemy_emotion_changed', 'enemy', `Emotion: ${emotion} — ${reason}`, {
      metadata: { emotion },
    });
  }

  public recordCriticalHpThreshold(actor: 'player' | 'enemy', hpPercent: number): void {
    if (this.finalized) return;
    this.addTimelineEvent('critical_hp_threshold', actor,
      `${actor === 'player' ? 'Player' : 'Enemy'} reached ${Math.round(hpPercent * 100)}% HP`,
      { value: Math.round(hpPercent * 100) }
    );
  }

  // ─── Finalization ─────────────────────────────────────────────────

  public finalize(
    outcome: BattleOutcome,
    totalTurns: number,
    rewards: ProgressionRewards
  ): BattleRecord | null {
    if (this.finalized) return null;
    this.finalized = true;

    const durationMs = Date.now() - this.startTime;

    this.addTimelineEvent('battle_ended', 'system', `Battle ended: ${outcome}`, {
      metadata: { outcome },
    });

    // Compute spell usage stats
    const spellUsage = this.buildSpellUsageStats();
    const adaptiveAI = this.buildAdaptiveAIStats();
    const combat = this.buildCombatStats();

    return {
      id: this.battleId,
      schemaVersion: BATTLE_RECORD_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      gameMode: this.gameMode,
      opponentName: this.opponentName,
      opponentId: this.opponentId,
      bossName: this.bossName,
      bossId: this.bossId,
      durationMs,
      totalTurns,
      outcome,
      combat,
      spellUsage,
      adaptiveAI,
      progression: rewards,
      timeline: [...this.timeline],
    };
  }

  // ─── Internal builders ────────────────────────────────────────────

  private buildCombatStats(): CombatSummaryStats {
    return {
      totalDamageDealt: this.damageDealt,
      totalDamageReceived: this.damageReceived,
      totalHealingPerformed: this.healingPerformed,
      totalLifesteal: this.lifestealTotal,
      totalManaConsumed: this.manaConsumed,
      totalSpellsCast: this.spellsCast,
      successfulAttacks: this.successfulAttacks,
      blockedOrCounteredAttacks: this.blockedAttacks,
      criticalHits: this.criticalHits,
      statusEffectsApplied: this.statusEffectsApplied,
    };
  }

  private buildSpellUsageStats(): SpellUsageStats {
    const spellCastCounts: Record<string, number> = {};
    let mostUsedSpell: SpellUsageStats['mostUsedSpell'] = null;

    for (const [id, data] of Object.entries(this.spellCastCounts)) {
      spellCastCounts[id] = data.count;
      if (!mostUsedSpell || data.count > mostUsedSpell.count) {
        mostUsedSpell = { id, name: data.name, count: data.count };
      }
    }

    let mostUsedElement: SpellUsageStats['mostUsedElement'] = null;
    for (const el of OFFENSIVE_ELEMENTS) {
      if (this.elementCounts[el] > 0 && (!mostUsedElement || this.elementCounts[el] > mostUsedElement.count)) {
        mostUsedElement = { element: el, count: this.elementCounts[el] };
      }
    }

    return {
      spellCastCounts,
      elementDistribution: { ...this.elementCounts },
      mostUsedSpell,
      mostUsedElement,
      uniqueSpellsUsed: Object.keys(this.spellCastCounts).length,
      defensiveActions: this.defensiveActions,
    };
  }

  private buildAdaptiveAIStats(): AdaptiveAIStats {
    const accuracy = this.predictionsMade > 0
      ? Math.round((this.correctPredictions / this.predictionsMade) * 100)
      : 0;

    return {
      predictionsMade: this.predictionsMade,
      correctPredictions: this.correctPredictions,
      incorrectPredictions: this.incorrectPredictions,
      predictionAccuracy: accuracy,
      maxResistanceReached: { ...this.maxResistances },
      timesEnemyAdapted: this.adaptationEvents,
      successfulPunishments: this.punishmentSuccesses,
      strategyChangesAfterAdaptation: this.strategyChanges,
    };
  }
}
