import { OffensiveElement, OFFENSIVE_ELEMENTS } from '../spells/types';
import { EnemyMemory } from './EnemyMemory';

export interface BossAdaptationProfile {
  bossId: string;
  maxResistance: number; // Max 0.45 (45%)
  frequencyThreshold: number; // Default 0.2 (20%)
  scalingDivisor: number; // Default 0.8
  growthMultiplier: number; // Default 1.0
}

export const DEFAULT_ADAPTATION_PROFILE: BossAdaptationProfile = {
  bossId: 'malakor',
  maxResistance: 0.45,
  frequencyThreshold: 0.2,
  scalingDivisor: 0.8,
  growthMultiplier: 1.0,
};

export class AdaptationEngine {
  private profile: BossAdaptationProfile;

  constructor(profile?: Partial<BossAdaptationProfile>) {
    this.profile = {
      ...DEFAULT_ADAPTATION_PROFILE,
      ...profile,
      // Enforce no permanent immunity rule
      maxResistance: Math.min(0.45, profile?.maxResistance ?? DEFAULT_ADAPTATION_PROFILE.maxResistance),
    };
  }

  /**
   * Calculates elemental resistance for a specific element based on rolling player memory.
   * Formula: resistance = min(0.45, 0.45 * max(0, frequency - 0.2) / 0.8)
   */
  public calculateResistance(element: OffensiveElement, memory: EnemyMemory): number {
    const frequency = memory.getElementFrequency(element);
    const { maxResistance, frequencyThreshold, scalingDivisor, growthMultiplier } = this.profile;

    if (frequency <= frequencyThreshold) {
      return 0;
    }

    const excess = frequency - frequencyThreshold;
    const rawResistance = (maxResistance * excess * growthMultiplier) / scalingDivisor;
    return Math.min(maxResistance, Math.max(0, rawResistance));
  }

  /**
   * Returns resistance percentages (0.0 to 0.45) for all 5 offensive elements.
   */
  public getAllResistances(memory: EnemyMemory): Record<OffensiveElement, number> {
    const result = {} as Record<OffensiveElement, number>;
    for (const el of OFFENSIVE_ELEMENTS) {
      result[el] = this.calculateResistance(el, memory);
    }
    return result;
  }

  /**
   * Calculates actual damage reduction resulting from developed elemental resistance.
   */
  public applyResistance(
    damage: number,
    element: OffensiveElement,
    memory: EnemyMemory
  ): {
    resistedDamage: number;
    reducedDamage: number;
    resistancePercentage: number;
  } {
    const resistance = this.calculateResistance(element, memory);
    const resistedDamage = Math.round(damage * (1 - resistance));
    const reducedDamage = damage - resistedDamage;

    return {
      resistedDamage,
      reducedDamage,
      resistancePercentage: Math.round(resistance * 100),
    };
  }

  /**
   * Provides human-readable explanation of why adaptation has or hasn't occurred.
   */
  public getExplanation(element: OffensiveElement, memory: EnemyMemory): string {
    const frequency = memory.getElementFrequency(element);
    const resistance = this.calculateResistance(element, memory);
    const percent = Math.round(resistance * 100);
    const freqPercent = Math.round(frequency * 100);

    if (resistance === 0) {
      return `${element.toUpperCase()} frequency is low (${freqPercent}%). No resistance developed.`;
    }

    return `Malakor has noticed high ${element.toUpperCase()} magic frequency (${freqPercent}%). Developing ${percent}% damage resistance!`;
  }

  public getProfile(): BossAdaptationProfile {
    return { ...this.profile };
  }

  public setProfile(profile: Partial<BossAdaptationProfile>): void {
    this.profile = {
      ...this.profile,
      ...profile,
      maxResistance: Math.min(0.45, profile.maxResistance ?? this.profile.maxResistance),
    };
  }
}
