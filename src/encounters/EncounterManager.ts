import { CombatEntity, EnemyIntent } from '../combat/combatTypes';
import { EnemyMemory } from '../ai/EnemyMemory';
import { AdaptationEngine } from '../ai/AdaptationEngine';
import { PredictionEngine, PredictionResult } from '../ai/PredictionEngine';
import { PredictabilitySystem, PredictabilityStage } from '../ai/PredictabilitySystem';
import { EnemyEmotionSystem, EnemyEmotion } from '../ai/EnemyEmotionSystem';
import { EnemyTemplate, ENCOUNTERS, EncounterDefinition } from './EncounterDefinition';
import { OffensiveElement } from '../spells/types';

export interface EnemyInstance {
  entity: CombatEntity;
  template: EnemyTemplate;
  memory: EnemyMemory;
  adaptation: AdaptationEngine;
  predictionEngine: PredictionEngine;
  predictability: PredictabilitySystem;
  emotionSystem: EnemyEmotionSystem;
  currentIntent: EnemyIntent | null;
  currentEmotion: EnemyEmotion;
  currentEmotionReason: string;
  currentPrediction: PredictionResult | null;
  elementResistances: Record<OffensiveElement, number>;
  predictabilityScore: number;
  predictabilityStage: PredictabilityStage;
  lastPunishmentDescription: string | null;
}

export class EncounterManager {
  public static getEncounter(encounterId: string): EncounterDefinition {
    return ENCOUNTERS[encounterId] || ENCOUNTERS.solo_malakor;
  }

  public static createEnemyInstances(encounter: EncounterDefinition): EnemyInstance[] {
    return encounter.enemies.map((tpl, index) => {
      const uniqueId = encounter.enemies.length === 1 && tpl.id === 'malakor'
        ? 'enemy'
        : `${tpl.id}_${index}`;

      const memoryKey = tpl.bossId || tpl.id;
      const memory = new EnemyMemory({ bossId: memoryKey, windowSize: 12 });
      const adaptation = new AdaptationEngine({
        bossId: memoryKey,
        maxResistance: tpl.maxResistanceCap ?? 0.45,
        growthMultiplier: tpl.resistanceGrowthRate ?? 1.0,
      });
      const predictionEngine = new PredictionEngine();
      const predictability = new PredictabilitySystem();
      const emotionSystem = new EnemyEmotionSystem();

      const entity: CombatEntity = {
        id: uniqueId,
        name: tpl.name,
        title: tpl.title,
        hp: tpl.maxHp,
        maxHp: tpl.maxHp,
        mana: tpl.maxMana,
        maxMana: tpl.maxMana,
        shield: 0,
        spellPower: tpl.spellPower,
        critRate: tpl.critRate,
        statusEffects: [],
        lane: tpl.lane,
        posture: 0,
        maxPosture: tpl.maxPosture,
        isStaggered: false,
        role: tpl.role,
        isBoss: tpl.isBoss,
        bossId: tpl.bossId,
        bossStage: tpl.isBoss ? 1 : undefined,
      };

      const baseResistances = adaptation.getAllResistances(memory);
      if (tpl.baseResistanceProfile) {
        for (const [el, val] of Object.entries(tpl.baseResistanceProfile)) {
          if (val !== undefined) {
            baseResistances[el as OffensiveElement] = Math.min(
              0.45,
              (baseResistances[el as OffensiveElement] || 0) + val
            );
          }
        }
      }

      return {
        entity,
        template: tpl,
        memory,
        adaptation,
        predictionEngine,
        predictability,
        emotionSystem,
        currentIntent: null,
        currentEmotion: 'neutral',
        currentEmotionReason: `${tpl.name} observes your stance.`,
        currentPrediction: null,
        elementResistances: baseResistances,
        predictabilityScore: 0,
        predictabilityStage: 'unpredictable',
        lastPunishmentDescription: null,
      };
    });
  }
}
