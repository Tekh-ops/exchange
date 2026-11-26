import { OffensiveElement } from '../spells/types';

export interface OffensiveActionRecord {
  turn: number;
  spellId: string;
  element: OffensiveElement;
  timestamp: number;
}

export interface PredictionRecord {
  turn: number;
  predictedElement: OffensiveElement;
  confidence: number;
  reason: string;
  actualElement?: OffensiveElement;
  wasCorrect?: boolean;
}

export interface EnemyMemoryConfig {
  windowSize?: number;
  bossId?: string;
}

export class EnemyMemory {
  public readonly bossId: string;
  public readonly windowSize: number;

  private actionHistory: OffensiveActionRecord[] = [];
  private predictionHistory: PredictionRecord[] = [];
  private consecutiveSpellCount: number = 0;
  private lastSpellId: string | null = null;
  private consecutiveElementCount: number = 0;
  private lastElement: OffensiveElement | null = null;
  private defensiveActionsCount: number = 0;
  private lastActionWasDefensive: boolean = false;
  // Phase 9 player habit tracking
  private laneHistory: ('left' | 'center' | 'right')[] = [];
  private dodgeHistory: ('quickstep' | 'arcane_blink' | 'perfect_dodge')[] = [];
  private lowHpHealsCount: number = 0;
  private chargedCastCount: number = 0;
  private targetCounts: Record<string, number> = {};

  constructor(config?: EnemyMemoryConfig) {
    this.bossId = config?.bossId ?? 'malakor';
    this.windowSize = config?.windowSize ?? 12;
  }

  /**
   * Records a successful offensive spell cast by the player.
   * Defensive or rejected actions must NOT call this method.
   */
  public recordOffensiveAction(spellId: string, element: OffensiveElement, turn: number): void {
    this.lastActionWasDefensive = false;

    // Track consecutive usage
    if (this.lastSpellId === spellId) {
      this.consecutiveSpellCount += 1;
    } else {
      this.consecutiveSpellCount = 1;
      this.lastSpellId = spellId;
    }

    if (this.lastElement === element) {
      this.consecutiveElementCount += 1;
    } else {
      this.consecutiveElementCount = 1;
      this.lastElement = element;
    }

    // Add to rolling history
    this.actionHistory.push({
      turn,
      spellId,
      element,
      timestamp: Date.now(),
    });

    // Enforce rolling window size
    if (this.actionHistory.length > this.windowSize) {
      this.actionHistory.shift();
    }
  }

  /**
   * Records a defensive player action (e.g. casting Ego Shield).
   * Does NOT increment offensive element counts.
   */
  public recordDefensiveAction(_turn: number): void {
    this.defensiveActionsCount += 1;
    this.lastActionWasDefensive = true;
    // Note: Defensive actions break offensive element streaks
    this.consecutiveSpellCount = 0;
    this.lastSpellId = null;
    this.consecutiveElementCount = 0;
    this.lastElement = null;
  }

  /**
   * Records an enemy prediction for a specific turn.
   */
  public recordPrediction(pred: Omit<PredictionRecord, 'actualElement' | 'wasCorrect'>): void {
    this.predictionHistory.push({ ...pred });
  }

  /**
   * Resolves the latest prediction with the player's actual element choice.
   */
  public resolveLatestPrediction(actualElement: OffensiveElement): boolean | undefined {
    const latest = this.predictionHistory[this.predictionHistory.length - 1];
    if (!latest || latest.actualElement !== undefined) return undefined;

    latest.actualElement = actualElement;
    latest.wasCorrect = latest.predictedElement === actualElement;
    return latest.wasCorrect;
  }

  public getHistory(): OffensiveActionRecord[] {
    return [...this.actionHistory];
  }

  public getPredictionHistory(): PredictionRecord[] {
    return [...this.predictionHistory];
  }

  public getElementCount(element: OffensiveElement): number {
    return this.actionHistory.filter((a) => a.element === element).length;
  }

  /**
   * Calculates the proportion of recent offensive actions belonging to the given element (0.0 to 1.0).
   */
  public getElementFrequency(element: OffensiveElement): number {
    if (this.actionHistory.length === 0) return 0;
    const count = this.getElementCount(element);
    return count / this.actionHistory.length;
  }

  public getAllElementFrequencies(): Record<OffensiveElement, number> {
    const total = this.actionHistory.length;
    const result: Record<OffensiveElement, number> = {
      fire: 0,
      ice: 0,
      lightning: 0,
      arcane: 0,
      poison: 0,
    };

    if (total === 0) return result;

    for (const action of this.actionHistory) {
      result[action.element] = (result[action.element] || 0) + 1;
    }

    for (const key of Object.keys(result) as OffensiveElement[]) {
      result[key] = result[key] / total;
    }

    return result;
  }

  public getSpellCount(spellId: string): number {
    return this.actionHistory.filter((a) => a.spellId === spellId).length;
  }

  public getSpellFrequency(spellId: string): number {
    if (this.actionHistory.length === 0) return 0;
    return this.getSpellCount(spellId) / this.actionHistory.length;
  }

  public getConsecutiveElementCount(): number {
    return this.consecutiveElementCount;
  }

  public getConsecutiveElement(): OffensiveElement | null {
    return this.lastElement;
  }

  public getConsecutiveSpellCount(): number {
    return this.consecutiveSpellCount;
  }

  public getConsecutiveSpell(): string | null {
    return this.lastSpellId;
  }

  public getMostFrequentElement(): { element: OffensiveElement | null; frequency: number } {
    if (this.actionHistory.length === 0) {
      return { element: null, frequency: 0 };
    }

    const freqs = this.getAllElementFrequencies();
    let topElement: OffensiveElement = 'arcane';
    let topFreq = -1;

    for (const [el, freq] of Object.entries(freqs) as [OffensiveElement, number][]) {
      if (freq > topFreq) {
        topFreq = freq;
        topElement = el;
      }
    }

    return { element: topElement, frequency: topFreq };
  }

  public getMostFrequentSpell(): { spellId: string | null; count: number } {
    if (this.actionHistory.length === 0) {
      return { spellId: null, count: 0 };
    }

    const counts: Record<string, number> = {};
    for (const act of this.actionHistory) {
      counts[act.spellId] = (counts[act.spellId] || 0) + 1;
    }

    let topSpell: string | null = null;
    let topCount = 0;

    for (const [id, count] of Object.entries(counts)) {
      if (count > topCount) {
        topCount = count;
        topSpell = id;
      }
    }

    return { spellId: topSpell, count: topCount };
  }

  public getRecentElementSequences(n: number = 2): OffensiveElement[][] {
    if (this.actionHistory.length < n) return [];
    const sequences: OffensiveElement[][] = [];

    for (let i = 0; i <= this.actionHistory.length - n; i++) {
      const seq = this.actionHistory.slice(i, i + n).map((a) => a.element);
      sequences.push(seq);
    }

    return sequences;
  }

  public getPredictionAccuracy(): number {
    const resolved = this.predictionHistory.filter((p) => p.wasCorrect !== undefined);
    if (resolved.length === 0) return 0;
    const correct = resolved.filter((p) => p.wasCorrect).length;
    return correct / resolved.length;
  }

  public getDefensiveActionsCount(): number {
    return this.defensiveActionsCount;
  }

  public wasLastActionDefensive(): boolean {
    return this.lastActionWasDefensive;
  }

  // ─── Phase 9 Behavioral Habit Tracking ────────────────────────────

  public recordPlayerLane(lane: 'left' | 'center' | 'right'): void {
    this.laneHistory.push(lane);
    if (this.laneHistory.length > this.windowSize) this.laneHistory.shift();
  }

  public recordPlayerDodge(dodgeType: 'quickstep' | 'arcane_blink' | 'perfect_dodge'): void {
    this.dodgeHistory.push(dodgeType);
    if (this.dodgeHistory.length > this.windowSize) this.dodgeHistory.shift();
  }

  public recordLowHpHeal(): void {
    this.lowHpHealsCount += 1;
  }

  public recordChargedCast(): void {
    this.chargedCastCount += 1;
  }

  public recordTargetSelection(targetId: string): void {
    this.targetCounts[targetId] = (this.targetCounts[targetId] || 0) + 1;
  }

  public getMostFrequentLane(): 'left' | 'center' | 'right' | null {
    if (this.laneHistory.length < 2) return null;
    const counts: Record<string, number> = {};
    for (const l of this.laneHistory) counts[l] = (counts[l] || 0) + 1;
    let best: 'left' | 'center' | 'right' | null = null;
    let max = 0;
    for (const [k, v] of Object.entries(counts)) {
      if (v > max) {
        max = v;
        best = k as 'left' | 'center' | 'right';
      }
    }
    return best;
  }

  public getConsecutiveDodgeCount(): number {
    return this.dodgeHistory.length;
  }

  public getLowHpHealsCount(): number {
    return this.lowHpHealsCount;
  }

  public getChargedCastCount(): number {
    return this.chargedCastCount;
  }

  public reset(): void {
    this.actionHistory = [];
    this.predictionHistory = [];
    this.consecutiveSpellCount = 0;
    this.lastSpellId = null;
    this.consecutiveElementCount = 0;
    this.lastElement = null;
    this.defensiveActionsCount = 0;
    this.lastActionWasDefensive = false;
    this.laneHistory = [];
    this.dodgeHistory = [];
    this.lowHpHealsCount = 0;
    this.chargedCastCount = 0;
    this.targetCounts = {};
  }
}
