import { CombatEntity } from '../combat/combatTypes';
import { EnemyMemory } from './EnemyMemory';

export type EnemyEmotion = 
  | 'neutral'
  | 'amused'
  | 'confident'
  | 'surprised'
  | 'frustrated'
  | 'angry'
  | 'desperate'
  | 'fearful'
  | 'triumphant'
  | 'defeated';

export interface EmotionTriggerEvent {
  type: 
    | 'player_repeat_spell'
    | 'player_change_strategy'
    | 'enemy_correct_prediction'
    | 'enemy_wrong_prediction'
    | 'enemy_substantial_damage'
    | 'enemy_hp_low'
    | 'enemy_hp_critical'
    | 'enemy_defeated'
    | 'player_defeated'
    | 'turn_passed';
  damageTaken?: number;
  isCritical?: boolean;
}

export interface EmotionState {
  currentEmotion: EnemyEmotion;
  turnsInCurrentEmotion: number;
  reason: string;
}

// Priority rank (higher number = higher priority, overrides lower emotions)
const EMOTION_PRIORITIES: Record<EnemyEmotion, number> = {
  neutral: 0,
  amused: 1,
  confident: 2,
  surprised: 3,
  frustrated: 4,
  angry: 5,
  desperate: 6,
  fearful: 7,
  triumphant: 8,
  defeated: 8,
};

export class EnemyEmotionSystem {
  private currentEmotion: EnemyEmotion = 'neutral';
  private turnsInCurrentEmotion: number = 0;
  private latestReason: string = 'Arch-Mage Malakor observes your combat stance impassively.';

  /**
   * Evaluates an in-game combat event and transitions the enemy's emotional state.
   */
  public evaluateEvent(
    event: EmotionTriggerEvent,
    enemy: CombatEntity,
    _player: CombatEntity,
    memory: EnemyMemory
  ): EmotionState {
    let candidateEmotion: EnemyEmotion | null = null;
    let candidateReason = '';

    // 1. Terminal Battle Conditions (Absolute Priority)
    if (event.type === 'enemy_defeated' || enemy.hp <= 0) {
      this.currentEmotion = 'defeated';
      this.latestReason = 'Arch-Mage Malakor is stunned and defeated by minor arcana!';
      return this.getState();
    }

    if (event.type === 'player_defeated') {
      this.currentEmotion = 'triumphant';
      this.latestReason = 'Arch-Mage Malakor revels in crushing your petty insurrection!';
      return this.getState();
    }

    // 2. Health Thresholds
    const hpRatio = enemy.hp / enemy.maxHp;
    if (hpRatio <= 0.18) {
      candidateEmotion = 'fearful';
      candidateReason = 'Near death: Malakor realizes his defeat is genuinely possible!';
    } else if (hpRatio <= 0.38) {
      candidateEmotion = 'desperate';
      candidateReason = 'Severely wounded: Malakor is scrambling for survival!';
    }

    // 3. Gameplay Dynamic Events
    if (!candidateEmotion) {
      switch (event.type) {
        case 'enemy_substantial_damage':
          if (event.isCritical || (event.damageTaken && event.damageTaken >= 28)) {
            candidateEmotion = 'angry';
            candidateReason = `Enraged by a painful blow (-${event.damageTaken} HP)!`;
          } else {
            candidateEmotion = 'frustrated';
            candidateReason = `Grimacing from significant damage (-${event.damageTaken} HP).`;
          }
          break;

        case 'player_change_strategy':
          candidateEmotion = 'surprised';
          candidateReason = 'Startled by your sudden change of elemental tactics!';
          break;

        case 'enemy_correct_prediction':
          candidateEmotion = 'confident';
          candidateReason = 'Pleased with his foresight in predicting your magic!';
          break;

        case 'player_repeat_spell': {
          const count = memory.getConsecutiveElementCount();
          if (count >= 2) {
            candidateEmotion = 'amused';
            candidateReason = `Smirking at your predictable repetition (${count} times in a row).`;
          }
          break;
        }

        case 'turn_passed':
          // Decays temporary emotions back to neutral after 2 turns
          this.turnsInCurrentEmotion += 1;
          if (this.turnsInCurrentEmotion >= 2 && !['desperate', 'fearful', 'triumphant', 'defeated'].includes(this.currentEmotion)) {
            this.currentEmotion = 'neutral';
            this.latestReason = 'Composed and calculating his next move.';
          }
          return this.getState();
      }
    }

    // Apply priority comparison
    if (candidateEmotion) {
      const currentPriority = EMOTION_PRIORITIES[this.currentEmotion];
      const candidatePriority = EMOTION_PRIORITIES[candidateEmotion];

      // Transition if candidate has higher or equal priority, or if current emotion ran for at least 1 turn
      if (candidatePriority >= currentPriority || this.turnsInCurrentEmotion >= 1) {
        this.currentEmotion = candidateEmotion;
        this.turnsInCurrentEmotion = 0;
        this.latestReason = candidateReason;
      }
    }

    return this.getState();
  }

  public getEmotion(): EnemyEmotion {
    return this.currentEmotion;
  }

  public getState(): EmotionState {
    return {
      currentEmotion: this.currentEmotion,
      turnsInCurrentEmotion: this.turnsInCurrentEmotion,
      reason: this.latestReason,
    };
  }

  public reset(): void {
    this.currentEmotion = 'neutral';
    this.turnsInCurrentEmotion = 0;
    this.latestReason = 'Arch-Mage Malakor observes your combat stance impassively.';
  }
}
