import { CombatEntity } from '../combat/combatTypes';

export interface BossStageConfig {
  stage: number;
  hpThresholdRatio: number; // triggers when hp / maxHp <= threshold
  title: string;
  spellPowerBonus: number;
  unlockedSpells: string[];
  transitionDialogue: string;
  auraColor: number;
  summonTemplateId?: string;
  phaseShieldBonus?: number;
  cleansesDebuffs?: boolean;
  shiftsLane?: boolean;
}

export const BOSS_STAGES: Record<string, BossStageConfig[]> = {
  malakor: [
    {
      stage: 1,
      hpThresholdRatio: 1.0,
      title: 'Stage 1: Arrogant Scholar',
      spellPowerBonus: 0,
      unlockedSpells: ['void_bolt', 'nether_ward', 'dread_hex'],
      transitionDialogue: 'Let us see what petty parlor tricks you brought today.',
      auraColor: 0x10b981,
    },
    {
      stage: 2,
      hpThresholdRatio: 0.65,
      title: 'Stage 2: Irritated Master',
      spellPowerBonus: 4,
      unlockedSpells: ['void_bolt', 'nether_ward', 'dread_hex', 'leech_vitality', 'flank_volley'],
      transitionDialogue: 'Enough insolence! Witness true Nethermancy!',
      auraColor: 0xf59e0b,
      phaseShieldBonus: 23,
      cleansesDebuffs: true,
    },
    {
      stage: 3,
      hpThresholdRatio: 0.32,
      title: 'Stage 3: Unrestrained Sorcerer',
      spellPowerBonus: 8,
      unlockedSpells: ['void_bolt', 'cataclysm_blast', 'leech_vitality', 'flank_volley'],
      transitionDialogue: 'I SHALL REDUCE YOUR DISSERTATION AND YOUR ROBES TO ASH!',
      auraColor: 0xef4444,
      phaseShieldBonus: 35,
      cleansesDebuffs: true,
      shiftsLane: true,
    },
  ],
  crystal_archon: [
    {
      stage: 1,
      hpThresholdRatio: 1.0,
      title: 'Stage 1: Prismatic Resonance',
      spellPowerBonus: 0,
      unlockedSpells: ['prism_lance', 'nether_ward'],
      transitionDialogue: 'Every hue of your magic shall be refracted back upon you.',
      auraColor: 0x38bdf8,
    },
    {
      stage: 2,
      hpThresholdRatio: 0.6,
      title: 'Stage 2: Harmonic Lattice',
      spellPowerBonus: 4,
      unlockedSpells: ['prism_lance', 'lane_beam', 'nether_ward'],
      transitionDialogue: 'The lattice tightens. Choose your lane wisely.',
      auraColor: 0x818cf8,
      phaseShieldBonus: 30,
      cleansesDebuffs: true,
    },
    {
      stage: 3,
      hpThresholdRatio: 0.3,
      title: 'Stage 3: Shattered Zenith',
      spellPowerBonus: 7,
      unlockedSpells: ['prism_lance', 'lane_beam', 'crystalline_burst'],
      transitionDialogue: 'FRACTURE THE REALM! NO LANE SHALL SHELTER YOU!',
      auraColor: 0xf43f5e,
      phaseShieldBonus: 45,
      cleansesDebuffs: true,
      shiftsLane: true,
    },
  ],
  shadow_conjurer: [
    {
      stage: 1,
      hpThresholdRatio: 1.0,
      title: 'Stage 1: Umbral Stalker',
      spellPowerBonus: 0,
      unlockedSpells: ['shadow_ambush', 'dread_hex'],
      transitionDialogue: 'You swing at shadows, petty scholar.',
      auraColor: 0x9333ea,
    },
    {
      stage: 2,
      hpThresholdRatio: 0.6,
      title: 'Stage 2: Lane Phantom',
      spellPowerBonus: 5,
      unlockedSpells: ['shadow_ambush', 'flank_volley', 'dread_hex'],
      transitionDialogue: 'Step left, step right—my blades wait in both!',
      auraColor: 0xc026d3,
      phaseShieldBonus: 20,
      shiftsLane: true,
    },
    {
      stage: 3,
      hpThresholdRatio: 0.3,
      title: 'Stage 3: Eclipse Unleashed',
      spellPowerBonus: 9,
      unlockedSpells: ['shadow_ambush', 'flank_volley', 'leech_vitality', 'cataclysm_blast'],
      transitionDialogue: 'DARKNESS CONSUMES ALL LANES!',
      auraColor: 0xbe123c,
      phaseShieldBonus: 33,
      cleansesDebuffs: true,
      shiftsLane: true,
    },
  ],
  vorath: [
    {
      stage: 1,
      hpThresholdRatio: 1.0,
      title: 'Phase 1: The Eternal Scholar',
      spellPowerBonus: 0,
      unlockedSpells: ['eternal_bolt', 'arcane_ward_vorath', 'void_bolt'],
      transitionDialogue: 'A fledgling apprentice dares step into my sanctum? Show me your elementary tricks.',
      auraColor: 0x7c3aed,
    },
    {
      stage: 2,
      hpThresholdRatio: 0.7,
      title: 'Phase 2: The Forbidden Master',
      spellPowerBonus: 6,
      unlockedSpells: ['eternal_bolt', 'abyssal_lance', 'chronal_snare', 'arcane_ward_vorath'],
      transitionDialogue: 'Impressive persistence, child. Let us see how you fare against the Forbidden Lattice!',
      auraColor: 0xd4af37,
      summonTemplateId: 'void_wisp',
      phaseShieldBonus: 125,
      cleansesDebuffs: true,
    },
    {
      stage: 3,
      hpThresholdRatio: 0.35,
      title: 'Phase 3: The End of Ages',
      spellPowerBonus: 12,
      unlockedSpells: ['abyssal_lance', 'chronal_snare', 'apocalypse_singularity'],
      transitionDialogue: 'ENOUGH! I HAVE OUTLIVED EMPIRES—WITNESS THE END OF AGES!',
      auraColor: 0xef4444,
      summonTemplateId: 'eternal_construct',
      phaseShieldBonus: 250,
      cleansesDebuffs: true,
    },
  ],
};

export interface StageTransitionResult {
  transitioned: boolean;
  newStage: number;
  config?: BossStageConfig;
  updatedEntity: CombatEntity;
}

export class BossPhaseManager {
  public static evaluateStageTransition(entity: CombatEntity): StageTransitionResult {
    if (!entity.isBoss || !entity.bossId || entity.hp <= 0) {
      return { transitioned: false, newStage: entity.bossStage ?? 1, updatedEntity: entity };
    }

    const stages = BOSS_STAGES[entity.bossId];
    if (!stages) {
      return { transitioned: false, newStage: entity.bossStage ?? 1, updatedEntity: entity };
    }

    const hpRatio = entity.hp / entity.maxHp;
    const currentStage = entity.bossStage ?? 1;

    // Find highest stage whose threshold is met
    let targetConfig = stages[0];
    for (const st of stages) {
      if (hpRatio <= st.hpThresholdRatio && st.stage > targetConfig.stage) {
        targetConfig = st;
      }
    }

    if (targetConfig.stage > currentStage) {
      const prevConfig = stages.find((s) => s.stage === currentStage);
      const powerDelta = targetConfig.spellPowerBonus - (prevConfig?.spellPowerBonus ?? 0);

      const filteredStatuses = targetConfig.cleansesDebuffs
        ? entity.statusEffects.filter((s) => s.type === 'strengthen')
        : entity.statusEffects;

      return {
        transitioned: true,
        newStage: targetConfig.stage,
        config: targetConfig,
        updatedEntity: {
          ...entity,
          bossStage: targetConfig.stage,
          spellPower: entity.spellPower + powerDelta,
          shield: entity.shield + (targetConfig.phaseShieldBonus ?? 0),
          statusEffects: filteredStatuses,
        },
      };
    }

    return { transitioned: false, newStage: currentStage, updatedEntity: entity };
  }

  public static getAllowedSpellsForStage(bossId: string | undefined, stage: number): string[] | undefined {
    if (!bossId || !BOSS_STAGES[bossId]) return undefined;
    return BOSS_STAGES[bossId].find((s) => s.stage === stage)?.unlockedSpells;
  }
}
